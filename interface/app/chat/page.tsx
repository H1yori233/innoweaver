"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { FaArrowCircleUp, FaPaperclip, FaRedo, FaFileAlt, FaCloudUploadAlt, FaFilePdf, FaFileWord, FaFileCode } from 'react-icons/fa';
import Textarea from 'react-textarea-autosize';
import { useQuerySSE } from '@/lib/hooks/useQuerySSE';
import ResearchDisplay from '@/app/chat/ResearchDisplay';
import { useResearchSSE } from '@/lib/hooks/useResearchSSE';

import CircularProgress from '@mui/material/CircularProgress';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { useRouter, usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';
import useAuthStore from '@/lib/hooks/auth-store';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from 'react-resizable-panels';

import {
  readFileContent,
  extractErrorMessage,
  validateFile,
  handleFileUpload,
  MAX_FILE_SIZE,
  SUPPORTED_FILE_TYPES
} from './FileUtils';
import ChatMessages from './ChatMessages';
import SolutionSearch from './SolutionSearch';
import FileContent from './FileContent';

// Research state interface
interface ResearchState {
  isLoading: boolean;
  progress: number;
  statusMessage: string;
  elapsedTime: number;
  streamingContent: string;
  results: {
    domainKnowledge?: any;
    initSolution?: any;
    iteratedSolution?: any;
    finalSolution?: any;
  };
}

const GenerateSolution = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { userType } = useAuthStore();
  const isDeveloper = userType === 'developer';

  // Basic state
  const [selectedMode, setSelectedMode] = useState('chat');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | null>(null);

  // Messages and analysis
  const [messages, setMessages] = useState<{
    type: 'user' | 'system' | 'analysis' | 'loading' | 'file' | 'streaming',
    content: string, data?: any, fileData?: File, streamingContent?: string
  }[]
  >([]);
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [streamingAnalysisContent, setStreamingAnalysisContent] = useState('');

  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Research workflow state
  const [researchState, setResearchState] = useState<ResearchState>({
    isLoading: false,
    progress: 0,
    statusMessage: "Ready to start research",
    elapsedTime: 0,
    streamingContent: '',
    results: {}
  });

  const { toast } = useToast();
  const [id, setId] = useState('');

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.API_URL;

  // Initialize SSE hooks
  const { connectionState: sseConnectionState, connect: connectSSE, disconnect: disconnectSSE } = useResearchSSE({
    url: `${apiUrl}/api/research`,
    maxReconnectAttempts: 5,
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    heartbeatInterval: 30000,
    connectionTimeout: 10000,
    messageTimeout: 60000,
  });

  const { connectionState: querySSEConnectionState, connect: connectQuerySSE, disconnect: disconnectQuerySSE } = useQuerySSE({
    url: `${apiUrl}/api/query`,
  });

  useEffect(() => {
    const storedId = localStorage.getItem("id");
    if (storedId) {
      setId(storedId);
    }
  }, []);

  // URL parameter handling
  useEffect(() => {
    const url = new URL(window.location.href);
    const mode = url.searchParams.get('mode');
    const ids = url.searchParams.get('ids');

    if (mode) {
      setSelectedMode(mode);
    }
    if (ids) {
      setSelectedIds(ids.split(','));
    }
  }, []);

  // Drag and drop handlers for chat area
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => prev + 1);
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragActive(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => prev - 1);
      if (dragCounter <= 1) {
        setIsDragActive(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      setDragCounter(0);

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        files.forEach(file => {
          const validation = validateFile(file);
          if (validation.valid) {
            handleFileUploadAsMessage(file);
          } else {
            toast({
              title: "Upload Error",
              description: validation.errorMessage || "Failed to upload file",
            });
          }
        });
      }
    };

    const chatArea = chatAreaRef.current;
    if (chatArea) {
      chatArea.addEventListener('dragenter', handleDragEnter);
      chatArea.addEventListener('dragleave', handleDragLeave);
      chatArea.addEventListener('dragover', handleDragOver);
      chatArea.addEventListener('drop', handleDrop);

      return () => {
        chatArea.removeEventListener('dragenter', handleDragEnter);
        chatArea.removeEventListener('dragleave', handleDragLeave);
        chatArea.removeEventListener('dragover', handleDragOver);
        chatArea.removeEventListener('drop', handleDrop);
      };
    }
  }, [dragCounter]);

  const updateURL = (mode: string, ids: string[] = []) => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    if (ids.length > 0) {
      url.searchParams.set('ids', ids.join(','));
    } else {
      url.searchParams.delete('ids');
    }
    router.push(url.pathname + url.search);
  };

  const handleModeChange = (event) => {
    const mode = event.target.value;
    setSelectedMode(mode);
    setSelectedIds([]);
    updateURL(mode);
  };

  const handleIDSelection = (ids) => {
    setSelectedIds(ids);
    updateURL(selectedMode, ids);
  };

  const toggleDrawMode = () => {
    setDrawMode(!drawMode);
  };

  // Message handling
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = { type: 'user' as const, content: inputText };
    setMessages([...messages, newMessage]);
    setInputText('');

    setMessages(prev => [...prev, { type: 'loading' as const, content: 'Analyzing...' }]);
    handleQueryAnalysis();
  };

  // File upload handling - support multiple files
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(file => {
        const validation = validateFile(file);
        if (validation.valid) {
          handleFileUploadAsMessage(file);
        } else {
          toast({
            title: "Upload Error",
            description: validation.errorMessage || "Failed to upload file",
          });
        }
      });
    },
    accept: SUPPORTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    noClick: true, // Disable click to avoid conflicts with chat area
    noKeyboard: true,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(rejection => {
        if (rejection.errors.some(e => e.code === 'file-too-large')) {
          toast({
            title: "File Too Large",
            description: `${rejection.file.name} exceeds the ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB limit.`,
          });
        } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          toast({
            title: "Invalid File Type",
            description: `${rejection.file.name} is not a supported format. Please upload PDF, Word, TXT, or Markdown files.`,
          });
        } else {
          toast({
            title: "Upload Failed",
            description: `Could not upload ${rejection.file.name}. Please try again.`,
          });
        }
      });
    }
  });

  // Query analysis SSE event handler
  const handleQuerySSEEvent = (eventType: string, data: any) => {
    switch (eventType) {
      case 'chunk':
        if (data?.text) {
          setStreamingAnalysisContent(prev => prev + data.text);
        }
        break;
      
      case 'result':
        // Final result received, process and display
        setIsAnalysisLoading(false);
        setAnalysisResult(data);
        
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => msg.type !== 'loading' && msg.type !== 'streaming');
          return [...filteredMessages, {
            type: 'analysis' as const,
            content: 'Query Analysis',
            data: data
          }];
        });
        
        setStreamingAnalysisContent('');
        break;
      
      case 'error':
        setIsAnalysisLoading(false);
        const errorMsg = typeof data === 'string' ? data : JSON.stringify(data);
        
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => msg.type !== 'loading' && msg.type !== 'streaming');
          return [...filteredMessages, {
            type: 'system' as const,
            content: `Analysis failed: ${errorMsg}`
          }];
        });
        
        setStreamingAnalysisContent('');
        
        toast({
          title: "Error",
          description: `Analysis failed: ${errorMsg}`,
        });
        break;
      
      case 'end':
        setIsAnalysisLoading(false);
        setStreamingAnalysisContent('');
        disconnectQuerySSE();
        break;
    }
  };

  // Combine all file contents for analysis
  const getCombinedFileContent = async (): Promise<string> => {
    if (files.length === 0) return "";
    
    try {
      const fileContents = await Promise.all(
        files.map(async (file) => {
          try {
            const content = await readFileContent(file);
            return `=== File: ${file.name} ===\n${content}\n\n`;
          } catch (error) {
            console.error(`Error reading ${file.name}:`, error);
            return `=== File: ${file.name} ===\n[Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}]\n\n`;
          }
        })
      );
      
      return fileContents.join('');
    } catch (error) {
      console.error('Error combining file contents:', error);
      return "";
    }
  };

  // Query analysis - using streaming generation
  const handleQueryAnalysis = async () => {
    setIsAnalysisLoading(true);
    setStreamingAnalysisContent('');

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const queryText = lastMessage && lastMessage.type === 'user' ? lastMessage.content : inputText;

    // Add streaming message placeholder
    setMessages(prev => {
      const filteredMessages = prev.filter(msg => msg.type !== 'loading');
      return [...filteredMessages, {
        type: 'streaming' as const,
        content: 'Query Analysis',
        streamingContent: ''
      }];
    });

    try {
      const design_doc = await getCombinedFileContent();
      const payload = {
        query: queryText,
        design_doc: design_doc
      };

      await connectQuerySSE(payload, handleQuerySSEEvent);
    } catch (error: any) {
      setIsAnalysisLoading(false);
      const errorMsg = extractErrorMessage(error);
      
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.type !== 'loading' && msg.type !== 'streaming');
        return [...filteredMessages, {
          type: 'system' as const,
          content: `Analysis failed: ${errorMsg}`
        }];
      });
      
      setStreamingAnalysisContent('');
      
      toast({
        title: "Error",
        description: `Analysis failed: ${errorMsg}`,
      });
    }
  };

  // SSE event handler
  const handleSSEEvent = (eventType: string, data: any) => {
    switch (eventType) {
      case 'chunk': {
        const text = data?.text ? String(data.text) : String(data);
        setResearchState(prev => ({
          ...prev,
          streamingContent: prev.streamingContent + text
        }));
        break;
      }
      case 'progress': {
        const progressValue = typeof data === 'number' ? data : data?.progress ?? 0;
        setResearchState(prev => ({
          ...prev,
          progress: progressValue
        }));
        break;
      }
      case 'status': {
        const statusMsg = typeof data === 'string' ? data : data?.status ?? '';
        setResearchState(prev => ({
          ...prev,
          statusMessage: statusMsg
        }));
        break;
      }
      case 'node_complete': {
        if (data?.node && data?.result) {
          setResearchState(prev => {
            const newResults = { ...prev.results };
            switch (data.node) {
              case 'rag':
              case 'paper':
              case 'example':
                newResults.domainKnowledge = data.result;
                break;
              case 'domain_expert':
                newResults.initSolution = data.result;
                break;
              case 'interdisciplinary':
                newResults.iteratedSolution = data.result;
                break;
              case 'evaluation':
              case 'persistence':
                newResults.finalSolution = data.result;
                break;
            }
            return { ...prev, results: newResults };
          });
        }
        break;
      }
      case 'error': {
        const errorMsg = typeof data === 'string' ? data : JSON.stringify(data);
        setMessages(prev => [...prev, {
          type: 'system' as const,
          content: `Research Error: ${errorMsg}`
        }]);
        setResearchState(prev => ({ ...prev, isLoading: false }));
        break;
      }
      case 'end': {
        setResearchState(prev => ({
          ...prev,
          progress: 100,
          statusMessage: 'Research Complete',
          isLoading: false
        }));

        setMessages(prev => [...prev, {
          type: 'system' as const,
          content: 'Research workflow completed successfully!'
        }]);

        // Clear streaming content after delay
        setTimeout(() => {
          setResearchState(prev => ({ ...prev, streamingContent: '' }));
        }, 3000);
        break;
      }
    }
  };

  // Start research
  const handleGenerate = async () => {
    if (!analysisResult) {
      toast({
        title: "No Analysis Result",
        description: "Please analyze a query first before generating research results.",
      });
      return;
    }

    if (researchState.isLoading) {
      toast({
        title: "Warning",
        description: "A research task is already in progress",
      });
      return;
    }

    // Reset state
    setResearchState({
      isLoading: true,
      progress: 0,
      statusMessage: "Initializing Research Workflow...",
      elapsedTime: 0,
      streamingContent: '',
      results: {}
    });

    // Start timer
    timerRef.current = setInterval(() => {
      setResearchState(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }));
    }, 1000);

    const payload = {
      query: analysisResult.Query || "Research query",
      query_analysis_result: analysisResult,
      with_paper: selectedMode === "paper",
      with_example: selectedMode === "inspiration",
      is_drawing: drawMode
    };

    try {
      await connectSSE(payload, handleSSEEvent);
    } catch (error: any) {
      console.error('Research generation error:', error);

      if (sseConnectionState.error) {
        setMessages(prev => [...prev, {
          type: 'system' as const,
          content: `Research failed: ${sseConnectionState.error}`
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'system' as const,
          content: `Research failed: ${error.message || 'Unknown error occurred'}`
        }]);
      }

      setResearchState(prev => ({ ...prev, isLoading: false }));

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Stop research
  const stopResearch = () => {
    disconnectSSE();
    setResearchState(prev => ({
      ...prev,
      isLoading: false,
      statusMessage: 'Research Stopped'
    }));
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setMessages(prev => [...prev, {
      type: 'system' as const,
      content: 'Research workflow stopped by user'
    }]);
  };

  // File handling functions
  const handleFileUploadAsMessage = (uploadedFile: File) => {
    const validation = validateFile(uploadedFile);
    if (!validation.valid && validation.errorMessage) {
      toast({
        title: "Error",
        description: validation.errorMessage,
      });
      return;
    }

    // Add file to files array
    setFiles(prev => [...prev, uploadedFile]);

    // Add file message
    const newMessage = {
      type: 'file' as const,
      content: `Uploaded file: ${uploadedFile.name}`,
      fileData: uploadedFile
    };
    setMessages([...messages, newMessage]);
    setViewingFile(uploadedFile);

    setMessages(prev => [...prev, {
      type: 'system' as const,
      content: `File "${uploadedFile.name}" has been uploaded and added to the analysis.`
    }]);
  };

  const handleFileClick = (clickedFile: File) => {
    setViewingFile(clickedFile);
  };

  const handleCloseFileViewer = () => {
    setViewingFile(null);
  };

  const handleDeleteFileMessage = (index: number) => {
    const fileMessage = messages[index];

    if (fileMessage.fileData) {
      // Remove from files array
      setFiles(prev => prev.filter(f => 
        !(f.name === fileMessage.fileData!.name && f.size === fileMessage.fileData!.size)
      ));

      // Close file viewer if it's the deleted file
      if (viewingFile && 
          viewingFile.name === fileMessage.fileData.name &&
          viewingFile.size === fileMessage.fileData.size) {
        setViewingFile(null);
      }
    }

    // Remove message
    const newMessages = [...messages];
    newMessages.splice(index, 1);
    setMessages(newMessages);

    toast({
      title: "File Removed",
      description: "The file has been removed from the conversation.",
    });
  };

  const handleFileButtonClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.docx,.doc,.txt,.md';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        Array.from(target.files).forEach(file => {
          handleFileUploadAsMessage(file);
        });
      }
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  // Regenerate click handling - using streaming generation
  const handleRegenerateClick = async (messageIndex, userMessageIndex) => {
    const lastUserMessage = messages[userMessageIndex];

    const newUserMessage = {
      type: 'user' as const,
      content: lastUserMessage.content
    };

    setMessages([
      ...messages,
      newUserMessage,
      { type: 'streaming' as const, content: 'Query Analysis', streamingContent: '' }
    ]);

    setIsAnalysisLoading(true);
    setStreamingAnalysisContent('');

    try {
      const design_doc = await getCombinedFileContent();
      const payload = {
        query: lastUserMessage.content,
        design_doc: design_doc
      };

      await connectQuerySSE(payload, handleQuerySSEEvent);
    } catch (error: any) {
      setIsAnalysisLoading(false);
      const errorMsg = extractErrorMessage(error);
      
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.type !== 'loading' && msg.type !== 'streaming');
        return [...filteredMessages, {
          type: 'system' as const,
          content: `Analysis failed: ${errorMsg}`
        }];
      });
      
      setStreamingAnalysisContent('');
      
      toast({
        title: "Error",
        description: `Analysis failed: ${errorMsg}`,
      });
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      disconnectSSE();
      disconnectQuerySSE();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [disconnectSSE, disconnectQuerySSE]);

  return (
    <div className='flex justify-center bg-primary text-text-primary min-h-full transition-colors duration-300'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='flex w-full min-h-screen flex-col items-center justify-center'
      >
        <div className='w-full h-screen bg-secondary rounded-2xl'>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={40} minSize={30}>
              <div className='relative ml-8 h-full rounded-xl bg-primary shadow-lg overflow-hidden flex flex-col'>
                {/* Header */}
                <div className='flex justify-between items-center p-4 border-b border-gray-700/30'>
                  <div className='text-text-secondary text-xl font-semibold my-2'>
                    Chat {files.length > 0 && (
                      <span className="text-sm text-blue-400">({files.length} file{files.length > 1 ? 's' : ''})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* SSE Connection Status */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-colors ${sseConnectionState.isConnected
                          ? 'bg-green-500'
                          : sseConnectionState.isConnecting
                            ? 'bg-yellow-500 animate-pulse'
                            : sseConnectionState.error
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                        }`} />
                      <span className="text-xs text-text-secondary">
                        {sseConnectionState.isConnected
                          ? 'Connected'
                          : sseConnectionState.isConnecting
                            ? 'Connecting...'
                            : sseConnectionState.error
                              ? `Error (${sseConnectionState.reconnectAttempts}/5)`
                              : 'Disconnected'
                        }
                      </span>
                    </div>

                    <select
                      className='px-3 py-1.5 rounded-lg bg-secondary text-text-secondary font-medium
                        transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                      value={selectedMode}
                      onChange={handleModeChange}
                    >
                      <option value="chat">Chat</option>
                      <option value="inspiration">Inspiration</option>
                    </select>
                  </div>
                </div>

                {/* Messages with drag and drop */}
                <div 
                  ref={chatAreaRef}
                  className={`flex-1 overflow-y-auto custom-scrollbar relative transition-all duration-300 ${
                    isDragActive ? 'bg-blue-500/5' : ''
                  }`}
                  {...getRootProps()}
                >
                  {/* Drag overlay */}
                  {isDragActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-4 z-50 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ 
                            y: [0, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <FaCloudUploadAlt className="mx-auto text-6xl text-blue-500 mb-4" />
                        </motion.div>
                        <div className="text-xl font-semibold text-blue-400 mb-2">Drop your files here</div>
                        <div className="text-sm text-blue-300 mb-4">
                          PDF, Word, TXT, Markdown files (max 10MB each)
                        </div>
                        <div className="flex justify-center space-x-4 text-xs text-blue-400">
                          <div className="flex items-center">
                            <FaFilePdf className="mr-1" />
                            PDF
                          </div>
                          <div className="flex items-center">
                            <FaFileWord className="mr-1" />
                            Word
                          </div>
                          <div className="flex items-center">
                            <FaFileAlt className="mr-1" />
                            TXT
                          </div>
                          <div className="flex items-center">
                            <FaFileCode className="mr-1" />
                            Markdown
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="p-4">
                    <ChatMessages
                      messages={messages}
                      onRegenerateClick={handleRegenerateClick}
                      onGenerateClick={handleGenerate}
                      onFileClick={handleFileClick}
                      activeFile={viewingFile}
                      onDeleteFileMessage={handleDeleteFileMessage}
                      streamingAnalysisContent={streamingAnalysisContent}
                    />
                  </div>

                  {isAnalysisLoading && !messages.some(msg => msg.type === 'loading') && (
                    <div className="flex justify-center items-center py-4">
                      <CircularProgress size={30} />
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className='p-4 border-t border-gray-700/10'>
                  <div className="relative">
                    <div className="rounded-xl border border-gray-700/30 bg-secondary/20 shadow-sm overflow-hidden">
                      <Textarea
                        className="w-full bg-transparent text-text-primary placeholder:text-gray-400/60 px-4 py-3
                          focus:ring-0 focus:outline-none resize-none transition-all text-sm min-h-[150px] max-h-[350px] overflow-auto"
                        placeholder="Ask me anything... (or drag and drop files here)"
                        minRows={5}
                        maxRows={12}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleFileButtonClick}
                        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-200/10"
                        title="Upload files (PDF, Word, TXT, Markdown - max 10MB each)"
                      >
                        <FaPaperclip className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-xs text-gray-500">
                        PDF, Word, TXT, Markdown files (max 10MB each)
                      </div>

                      {isDeveloper && (
                        <button
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors duration-200 ${drawMode
                              ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                              : 'bg-gray-200/10 text-gray-400 hover:bg-gray-200/20'
                            }`}
                          onClick={toggleDrawMode}
                        >
                          Draw: {drawMode ? 'ON' : 'OFF'}
                        </button>
                      )}

                      <button
                        type="button"
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${inputText.trim()
                            ? 'text-white bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-300/20 text-gray-400 hover:bg-gray-300/30'
                          }`}
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="w-5 h-5" strokeWidth="2">
                          <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="flex items-center justify-center w-2 mx-3 hover:mx-1 hover:w-6 transition-all duration-300 cursor-col-resize">
              <div className="h-full w-[3px] bg-gray-600/30 hover:bg-blue-500 rounded-full transition-colors duration-200"></div>
            </PanelResizeHandle>

            {/* Right Panel */}
            <Panel defaultSize={60} minSize={40}>
              <div className='relative h-full mr-8 rounded-lg bg-primary overflow-hidden'>
                <div className="flex w-full h-full">
                  {viewingFile ? (
                    <FileContent file={viewingFile} onClose={handleCloseFileViewer} />
                  ) : (researchState.isLoading || researchState.progress > 0 || Object.keys(researchState.results).length > 0) ? (
                    <ResearchDisplay
                      researchState={researchState}
                      sseConnectionState={sseConnectionState}
                      onStop={stopResearch}
                      onRegenerate={handleGenerate}
                    />
                  ) : (
                    <div className="flex w-full h-full justify-center items-center">
                      {selectedMode === 'inspiration' && (
                        <SolutionSearch onSelectionChange={handleIDSelection} />
                      )}

                      {(selectedMode !== 'inspiration' && selectedMode !== 'paper') && (
                        <p className='font-bold text-3xl text-gray-400'>No result available yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </motion.div>
    </div>
  );
};

export default GenerateSolution;
