"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { FaArrowCircleUp, FaPaperclip, FaRedo, FaFileAlt } from 'react-icons/fa';
import Textarea from 'react-textarea-autosize';
import {
  fetchQueryAnalysis,
} from "@/lib/actions";
import CircularProgress from '@mui/material/CircularProgress';
import SolutionSearch from '@/components/main/SolutionSearch';
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

import ResearchDisplay from '@/app/chat/ResearchDisplay';

import { 
  readFileContent, 
  extractErrorMessage, 
  validateFile, 
  handleFileUpload, 
  MAX_FILE_SIZE 
} from './FileUtils';
import ChatMessages from './ChatMessages';
import FileContent from './FileContent';
import JSON5 from 'json5';

// 研究状态接口
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

  // 基础状态
  const [selectedMode, setSelectedMode] = useState('chat');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | null>(null);

  // 消息和分析相关
  const [messages, setMessages] = useState<{
    type: 'user' | 'system' | 'analysis' | 'loading' | 'file', 
    content: string, data?: any, fileData?: File}[]
  >([]);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // 研究工作流状态
  const [researchState, setResearchState] = useState<ResearchState>({
    isLoading: false,
    progress: 0,
    statusMessage: "Ready to start research",
    elapsedTime: 0,
    streamingContent: '',
    results: {}
  });

  // 完成结果和其他状态

  const { toast } = useToast();
  const [id, setId] = useState('');

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("id");
    if (storedId) {
      setId(storedId);
    }
  }, []);

  // URL 参数处理
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

  // 消息处理
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage = { type: 'user' as const, content: inputText };
    setMessages([...messages, newMessage]);
    setInputText('');
    
    setMessages(prev => [...prev, { type: 'loading' as const, content: 'Analyzing...' }]);
    handleQueryAnalysis();
  };

  // 文件上传处理
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(
          acceptedFiles[0], 
          setFile, 
          (title, description) => toast({ title, description })
        );
      }
    },
    accept: {
      'text/plain': ['.txt'],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection) {
        if (rejection.errors.some(e => e.code === 'file-too-large')) {
          toast({
            title: "File Too Large",
            description: "File size exceeds the 1MB limit.",
          });
        } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          toast({
            title: "Invalid File Type",
            description: "Only .txt files are supported.",
          });
        } else {
          toast({
            title: "Upload Failed",
            description: "Could not upload the file. Please try again.",
          });
        }
      }
    }
  });

  // 查询分析
  const handleQueryAnalysis = () => {
    setIsAnalysisLoading(true);
    
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const queryText = lastMessage && lastMessage.type === 'user' ? lastMessage.content : inputText;
    
    const processAnalysisResult = (result) => {
      setIsAnalysisLoading(false);
      
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.type !== 'loading');
        return [...filteredMessages, {
          type: 'analysis' as const,
          content: 'Query Analysis',
          data: result
        }];
      });
      
      setAnalysisResult(result);
    };
    
    const handleError = (error) => {
            setIsAnalysisLoading(false);
            const errorMsg = extractErrorMessage(error);
            
            setMessages(prev => {
              const filteredMessages = prev.filter(msg => msg.type !== 'loading');
              return [...filteredMessages, {
                type: 'system' as const,
                content: `Analysis failed: ${errorMsg}`
              }];
            });
            
            toast({
              title: "Error",
              description: `Analysis failed: ${errorMsg}`,
            });
    };
    
    if (file) {
      readFileContent(file).then((fileContent) => {
        fetchQueryAnalysis(queryText, fileContent)
          .then(processAnalysisResult)
          .catch(handleError);
      });
    } else {
      fetchQueryAnalysis(queryText, "")
        .then(processAnalysisResult)
        .catch(handleError);
    }
  };

  // SSE 事件处理
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
        
        // 清理流式内容
        setTimeout(() => {
          setResearchState(prev => ({ ...prev, streamingContent: '' }));
        }, 3000);
        break;
      }
    }
  };

  // 开始研究
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

    // 重置状态
    setResearchState({
      isLoading: true,
      progress: 0,
      statusMessage: "Initializing Research Workflow...",
      elapsedTime: 0,
      streamingContent: '',
      results: {}
    });


    // 开始计时
    timerRef.current = setInterval(() => {
      setResearchState(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }));
    }, 1000);

    // 设置中止控制器
    abortControllerRef.current?.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const payload = {
      query: analysisResult.Query || "Research query",
      query_analysis_result: analysisResult,
      with_paper: selectedMode === "paper",
      with_example: selectedMode === "inspiration",
      is_drawing: drawMode
    };

    try {
      const { fetchEventSource } = await import('@microsoft/fetch-event-source');
      
      await fetchEventSource('http://localhost:5000/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal: ac.signal,

        onopen: async response => {
          if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
            throw new Error(`Failed to open SSE connection: ${response.status} ${response.statusText}`);
          }
        },

        onmessage: (msg) => {
          const eventType = msg.event || 'chunk';
          let eventData: any = msg.data;
          if (typeof eventData === 'string') {
            try {
              eventData = JSON5.parse(eventData);
            } catch {
              // 保留原始字符串
            }
          }
          handleSSEEvent(eventType, eventData);
        },

        onerror: err => {
          console.error('SSE error:', err);
          if (!ac.signal.aborted) {
            setMessages(prev => [...prev, {
              type: 'system' as const,
              content: `Research error: ${err instanceof Error ? err.message : 'Unknown SSE error'}`
            }]);
            setResearchState(prev => ({ ...prev, isLoading: false }));
          }
          throw err;
        },

        onclose: () => {
          setResearchState(prev => ({ ...prev, isLoading: false }));
        },

        openWhenHidden: true,
        fetch: fetch,
      });
    } catch (error: any) {
      if (error.name !== 'AbortError' && !ac.signal.aborted) {
        setMessages(prev => [...prev, {
          type: 'system' as const,
          content: `Research failed: ${error.message || 'Unknown error occurred'}`
        }]);
      } else if (ac.signal.aborted) {
        setMessages(prev => [...prev, {
          type: 'system' as const,
          content: 'Research workflow cancelled'
        }]);
      }
    } finally {
      setResearchState(prev => ({ ...prev, isLoading: false }));
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // 停止研究
  const stopResearch = () => {
    abortControllerRef.current?.abort();
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

  // 文件处理函数
  const handleFileUploadAsMessage = (uploadedFile: File) => {
    const validation = validateFile(uploadedFile);
    if (!validation.valid && validation.errorMessage) {
      toast({
        title: "Error",
        description: validation.errorMessage,
      });
      return;
    }

    const newMessage = { 
      type: 'file' as const, 
      content: `Uploaded file: ${uploadedFile.name}`, 
      fileData: uploadedFile 
    };
    setMessages([...messages, newMessage]);
    setFile(uploadedFile);
    setViewingFile(uploadedFile);

    setMessages(prev => [...prev, { 
      type: 'system' as const, 
      content: `File "${uploadedFile.name}" has been uploaded.` 
    }]);
  };

  const handleFileClick = (clickedFile: File) => {
    setViewingFile(clickedFile);
    setFile(clickedFile);
  };

  const handleCloseFileViewer = () => {
    setViewingFile(null);
  };

  const handleDeleteFileMessage = (index: number) => {
    const fileMessage = messages[index];
    
    if (file && fileMessage.fileData && 
        file.name === fileMessage.fileData.name && 
        file.size === fileMessage.fileData.size) {
      setFile(null);
      if (viewingFile) {
        setViewingFile(null);
      }
      }

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
    fileInput.accept = '.txt';
    fileInput.style.display = 'none';

    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        handleFileUploadAsMessage(target.files[0]);
      }
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  // 重新生成点击处理
  const handleRegenerateClick = (messageIndex, userMessageIndex) => {
    const lastUserMessage = messages[userMessageIndex];
    
    const newUserMessage = { 
      type: 'user' as const, 
      content: lastUserMessage.content 
    };
    
    setMessages([
      ...messages, 
      newUserMessage, 
      { type: 'loading' as const, content: 'Analyzing...' }
    ]);
    
    setIsAnalysisLoading(true);
    
    setTimeout(() => {
      fetchQueryAnalysis(lastUserMessage.content, "")
        .then((result) => {
          setIsAnalysisLoading(false);
          setAnalysisResult(result);
          
          setMessages(prev => {
            const filteredMessages = prev.filter(msg => msg.type !== 'loading');
            return [...filteredMessages, {
              type: 'analysis' as const,
              content: 'Query Analysis',
              data: result
            }];
          });
        })
        .catch((error) => {
          setIsAnalysisLoading(false);
          const errorMsg = extractErrorMessage(error);
          
          setMessages(prev => {
            const filteredMessages = prev.filter(msg => msg.type !== 'loading');
            return [...filteredMessages, {
              type: 'system' as const,
              content: `Analysis failed: ${errorMsg}`
            }];
          });
          
          toast({
            title: "Error",
            description: `Analysis failed: ${errorMsg}`,
          });
        });
    }, 100);
  };

  // 清理函数
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
                  <div className='text-text-secondary text-xl font-semibold my-2'>Chat</div>
                  
                  <div className="flex items-center gap-2">
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

                {/* Messages */}
                <div className='flex-1 overflow-y-auto custom-scrollbar'>
                  <div className="p-4">
                    <ChatMessages 
                      messages={messages}
                      onRegenerateClick={handleRegenerateClick}
                      onGenerateClick={handleGenerate}
                      onFileClick={handleFileClick}
                      activeFile={file}
                      onDeleteFileMessage={handleDeleteFileMessage}
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
                        placeholder="Ask me anything..."
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
                        title="Upload .txt file (max 1MB)"
                      >
                        <FaPaperclip className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-xs text-gray-500">
                        Only .txt files (max 1MB)
                      </div>
                      
                      {isDeveloper && (
                        <button
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors duration-200 ${
                            drawMode 
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
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                          inputText.trim() 
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
