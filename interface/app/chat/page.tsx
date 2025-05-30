"use client";

import { useState, useEffect, Suspense } from 'react';
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

import IntermediateResult from './IntermediateResult';
import ProgressDisplay from './ProgressDisplay';
import CompleteResult from './CompleteResult';
import { 
  readFileContent, 
  extractErrorMessage, 
  validateFile, 
  handleFileUpload, 
  MAX_FILE_SIZE 
} from './FileUtils';
import { callQueryAnalysis, callStepApi } from './ApiService';
import ChatMessages from './ChatMessages';
import FileContent from './FileContent';

const testIntermediateData = {
  "title": "Summary of HCI Solutions for Enhanced Navigation and Content Access",
  "desc": "This summary provides a comprehensive evaluation of three distinct solutions designed to improve user navigation performance and reduce frustration in accessing visual content. Each solution incorporates advanced technical methods, including augmented reality, haptic feedback, and immersive XR environments.",
  "solution": [
    {
      "Title": "AR Navigation for Visual Content Access",
      "Function": "Improving user navigation performance and reducing frustration through augmented reality visualizations.",
      "Technical Method": {
        "Original": [
          "Context-aware AR visualizations that adapt to user location and movement.",
          "Gesture-based interactions for accessing data visualizations."
        ],
        "Iteration": [
          "Integration of AI-driven context prediction with AR visualizations to provide anticipatory guidance.",
          "Utilization of multi-modal feedback (haptic and auditory) alongside AR visuals for enhanced accessibility."
        ]
      },
      "Possible Results": {
        "Original": {
          "Performance": "Real-time updates of relevant information based on the user's physical surroundings can significantly improve task efficiency and accuracy in outdoor settings.",
          "User Experience": "Participants reported increased engagement with AR visualizations, indicating a positive impact on both usability and satisfaction. The immersive experience enhances the perception of environmental details without requiring constant visual attention."
        },
        "Iteration": [
          {
            "Performance": "AI-driven predictive context awareness reduces decision-making time by up to 20%, enhancing overall task performance.",
            "User Experience": "Users report a more intuitive and seamless interaction experience due to anticipatory guidance provided by the system."
          },
          {
            "Performance": "Multi-modal feedback ensures accessibility and usability for users with varying sensory capabilities, improving inclusivity.",
            "User Experience": "Feedback indicates higher satisfaction among users who benefit from haptic and auditory cues, leading to reduced cognitive load during navigation."
          }
        ]
      }
    },
    {
      "Title": "Haptic Feedback for Spatial Guidance",
      "Function": "Providing haptic feedback to enhance spatial awareness and reduce cognitive load during navigation.",
      "Technical Method": {
        "Original": [
          "Shape-changing haptic interface that pivots, extends, and retracts to convey directional cues and distances.",
          "Tactile notches for users to identify the device's orientation."
        ],
        "Iteration": [
          "Incorporation of temperature-based feedback to signal proximity to destinations or obstacles.",
          "Dynamic adjustment of haptic intensity based on user speed and environmental complexity."
        ]
      },
      "Possible Results": {
        "Original": {
          "Performance": "Users demonstrated comparable motion efficiency with haptic devices compared to visual methods, though navigation times were slightly longer. However, head elevations were higher, indicating improved environmental awareness.",
          "User Experience": "Subjective feedback indicated trust and preference for immersion over visual-only methods. Users appreciated the tactile feedback, which allowed them to maintain focus on their surroundings rather than a screen."
        },
        "Iteration": [
          {
            "Performance": "Temperature-based feedback improves reaction times by providing additional sensory input, reducing errors in complex environments.",
            "User Experience": "Users find the combination of shape-changing and temperature-based feedback more engaging and less intrusive, enhancing overall satisfaction."
          },
          {
            "Performance": "Adaptive haptic intensity reduces fatigue and maintains optimal feedback levels across different scenarios, improving long-term usability.",
            "User Experience": "Dynamic adjustments lead to a more personalized experience, with users reporting greater comfort and effectiveness in prolonged use."
          }
        ]
      }
    },
    {
      "Title": "Interactive XR Systems for Immersive Navigation",
      "Function": "Enhancing navigation and decision-making using immersive XR environments with adaptive guidance.",
      "Technical Method": {
        "Original": [
          "Adaptive guidance mechanisms within XR systems to facilitate transitions through learning stages.",
          "Integration of high-precision LiDAR mapping with traditional XR simulation."
        ],
        "Iteration": [
          "Implementation of real-time collaborative features allowing multiple users to interact in shared XR spaces.",
          "Use of biofeedback sensors to adjust the level of immersion dynamically based on user stress levels."
        ]
      },
      "Possible Results": {
        "Original": {
          "Performance": "Significant reduction in the time required for learners to master tasks through personalized guidance in XR, with improved learner engagement metrics.",
          "User Experience": "Users rated the personalized guidance feature highly, reporting feeling more in control of their learning process. In on-road simulators, participants perceived greater immersion despite discomfort due to XR headsets."
        },
        "Iteration": [
          {
            "Performance": "Collaborative features enable faster problem-solving and knowledge sharing, reducing individual learning curves by up to 30%.",
            "User Experience": "Shared immersive experiences foster a sense of community and support, increasing motivation and engagement among users."
          },
          {
            "Performance": "Biofeedback-driven adjustments optimize immersion levels, reducing simulator sickness and improving overall comfort by 40%.",
            "User Experience": "Users appreciate the adaptive nature of the system, leading to prolonged and more enjoyable sessions in XR environments."
          }
        ]
      }
    }
  ],
  "status": "in_progress",
  "task_id": "task_test_1234",
  "progress": 60
};

const GenerateSolution = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { userType } = useAuthStore();
  const isDeveloper = userType === 'developer';

  const [selectedMode, setSelectedMode] = useState('chat');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | null>(null);

  // 处理URL参数
  useEffect(() => {
    // 这里我们使用URL API来解析当前URL
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

  // 更新 URL 的函数
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

  // 处理模式变更
  const handleModeChange = (event) => {
    const mode = event.target.value;
    setSelectedMode(mode);
    setSelectedIds([]);
    updateURL(mode);
  };

  // 处理 ID 选择
  const handleIDSelection = (ids) => {
    setSelectedIds(ids);
    updateURL(selectedMode, ids);
  };

  // 处理 Draw 模式切换
  const toggleDrawMode = () => {
    setDrawMode(!drawMode);
  };

  const [messages, setMessages] = useState<{
    type: 'user' | 'system' | 'analysis' | 'loading' | 'file', 
    content: string, data?: any, fileData?: File}[]
  >([]);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [id, setId] = useState('');

  useEffect(() => {
    const storedId = localStorage.getItem("id");
    if (storedId) {
      setId(storedId);
    }
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage = { type: 'user' as const, content: inputText };
    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Add loading indicator as a message
    setMessages(prev => [...prev, { type: 'loading' as const, content: 'Analyzing...' }]);
    
    handleQueryAnalysis();
  };

  // Handle file drop
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

  // 分析结果相关状态
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const handleQueryAnalysis = () => {
    setIsAnalysisLoading(true);
    
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const queryText = lastMessage && lastMessage.type === 'user' ? lastMessage.content : inputText;
    
    const processAnalysisResult = (result) => {
      setIsAnalysisLoading(false);
      
      // Remove loading message and add analysis result
      setMessages(prev => {
        // Filter out the loading message
        const filteredMessages = prev.filter(msg => msg.type !== 'loading');
        
        // Add the analysis message
        return [...filteredMessages, {
          type: 'analysis' as const,
          content: 'Query Analysis',
          data: result
        }];
      });
      
      setAnalysisResult(result);
    };
    
    if (file) {
      readFileContent(file).then((fileContent) => {
        fetchQueryAnalysis(queryText, fileContent)
          .then(processAnalysisResult)
          .catch((error) => {
            setIsAnalysisLoading(false);
            const errorMsg = extractErrorMessage(error);
            
            // Remove loading message and add error message
            setMessages(prev => {
              // Filter out the loading message
              const filteredMessages = prev.filter(msg => msg.type !== 'loading');
              
              // Add error message
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
      });
    } else {
      fetchQueryAnalysis(queryText, "")
        .then(processAnalysisResult)
        .catch((error) => {
          setIsAnalysisLoading(false);
          const errorMsg = extractErrorMessage(error);
          
          // Remove loading message and add error message
          setMessages(prev => {
            // Filter out the loading message
            const filteredMessages = prev.filter(msg => msg.type !== 'loading');
            
            // Add error message
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
    }
  };

  // 生成过程相关状态
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [isCompleteLoading, setIsCompleteLoading] = useState(false);
  const [completeResult, setCompleteResult] = useState(null);
  const [intermediateData, setIntermediateData] = useState(null);
  const [stageEmoji, setStageEmoji] = useState("🚀");
  const [stageDescription, setStageDescription] = useState("Starting the generation process");

  async function handleStepApi(url, data) {
    return callStepApi(
      url,
      data,
      setProgress,
      setStatusMessage,
      setIntermediateData,
      setStageEmoji,
      setStageDescription,
      setCompleteResult,
      setIsCompleteLoading,
      toast
    );
  }

  const handleGenerate = async () => {
    // Add a generate button click message
    setMessages(prev => [...prev, {
      type: 'system' as const,
      content: 'Starting generation process...'
    }]);
    
    if (isCompleteLoading) {
      toast({
        title: "Warning",
        description: "A generation task is already in progress",
      });
      return;
    }

    setIsCompleteLoading(true);
    setStatusMessage("Starting task...");

    try {
      const initResponse = await handleStepApi('/api/complete/initialize', { data: JSON.stringify(analysisResult) });
      setTaskId(initResponse.task_id);
      logger.log("init:", initResponse);

      const mode = selectedMode;
      if (mode === "inspiration") {
        await handleStepApi('/api/complete/rag', { task_id: initResponse.task_id });
        await handleStepApi('/api/complete/example', { task_id: initResponse.task_id, data: JSON.stringify(selectedIds) });
      } else if (mode === "paper") {
        await handleStepApi('/api/complete/paper', { task_id: initResponse.task_id, data: JSON.stringify(selectedIds) });
      } else {
        await handleStepApi('/api/complete/rag', { task_id: initResponse.task_id });
      }

      await handleStepApi('/api/complete/domain', { task_id: initResponse.task_id });
      await handleStepApi('/api/complete/interdisciplinary', { task_id: initResponse.task_id });
      await handleStepApi('/api/complete/evaluation', { task_id: initResponse.task_id });

      if (drawMode) {
        await handleStepApi('/api/complete/drawing', { task_id: initResponse.task_id });
      }

      const result = await handleStepApi('/api/complete/final', { task_id: initResponse.task_id });
      logger.log('Complete result:', result);
      setCompleteResult(result);
    } catch (error) {
      logger.error("Error during task generation:", error);
      toast({
        title: "Error",
        description: `Generation failed: ${error.message}`,
      });
      setTaskId('');
      setIsCompleteLoading(false);
    } finally {
      setTaskId('');
      setProgress(0);
      setIsCompleteLoading(false);
      
      // 添加生成完成的消息
      setMessages(prev => [...prev, {
        type: 'system' as const,
        content: 'Generation process completed'
      }]);
    }
  };

  const handleRegenerate = async () => {
    if (isCompleteLoading) {
      toast({
        title: "Warning",
        description: "A generation task is already in progress",
      });
      return;
    }

    setIsCompleteLoading(true);
    setStatusMessage("Starting task...");

    try {
      const solution_ids = JSON.stringify(
        completeResult['solutions'].map((solution) => solution.id)
      );
      logger.log(solution_ids);

      const initResponse = await handleStepApi('/api/complete/initialize', { data: JSON.stringify(analysisResult) });
      setTaskId(initResponse.task_id);
      logger.log("init:", initResponse);

      await handleStepApi('/api/complete/example', { task_id: initResponse.task_id, data: solution_ids });
      await handleStepApi('/api/complete/interdisciplinary', { task_id: initResponse.task_id });
      await handleStepApi('/api/complete/evaluation', { task_id: initResponse.task_id });

      if (drawMode) {
        await handleStepApi('/api/complete/drawing', { task_id: initResponse.task_id });
      }

      const result = await handleStepApi('/api/complete/final', { task_id: initResponse.task_id });
      logger.log('Complete result:', result);
      setCompleteResult(result);

      toast({
        title: "Success",
        description: "Regeneration completed successfully!",
      });
    } catch (error) {
      logger.error("Error during task generation:", error);
      toast({
        title: "Error",
        description: `Regeneration failed: ${error.message}`,
      });
      setTaskId('');
      setIsCompleteLoading(false);
    } finally {
      setTaskId('');
      setProgress(0);
      setIsCompleteLoading(false);
      
      // 添加重新生成完成的消息
      setMessages(prev => [...prev, {
        type: 'system' as const,
        content: 'Regeneration process completed'
      }]);
    }
  };

  // 添加测试中间态的函数
  const testIntermediateRendering = () => {
    setIntermediateData(testIntermediateData);
    setIsCompleteLoading(true);
    setProgress(60);
    setStageEmoji("🧠");
    setStageDescription("Domain Expert is Processing Materials");
    setStatusMessage("Analyzing domain-specific concepts...");
  };

  // 处理 Regenerate 按钮点击的回调
  const handleRegenerateClick = (messageIndex, userMessageIndex) => {
    // 获取用户消息内容
    const lastUserMessage = messages[userMessageIndex];
    
    // 添加新消息
    const newUserMessage = { 
      type: 'user' as const, 
      content: lastUserMessage.content 
    };
    
    // 更新消息状态
    setMessages([
      ...messages, 
      newUserMessage, 
      { type: 'loading' as const, content: 'Analyzing...' }
    ]);
    
    // 设置加载状态并触发分析
    setIsAnalysisLoading(true);
    
    // 延迟执行以确保状态更新
    setTimeout(() => {
      fetchQueryAnalysis(lastUserMessage.content, "")
        .then((result) => {
          setIsAnalysisLoading(false);
          setAnalysisResult(result);
          
          // 移除加载消息并添加分析结果
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
          
          // 移除加载消息并添加错误消息
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

  // 处理文件上传作为消息
  const handleFileUploadAsMessage = (uploadedFile: File) => {
    // 验证文件
    const validation = validateFile(uploadedFile);
    if (!validation.valid && validation.errorMessage) {
      toast({
        title: "Error",
        description: validation.errorMessage,
      });
      return;
    }

    // 添加文件消息
    const newMessage = { 
      type: 'file' as const, 
      content: `Uploaded file: ${uploadedFile.name}`, 
      fileData: uploadedFile 
    };
    setMessages([...messages, newMessage]);

    // 设置当前活动文件
    setFile(uploadedFile);
    
    // 自动显示文件内容在右侧面板
    setViewingFile(uploadedFile);

    // 添加系统提示消息
    setMessages(prev => [...prev, { 
      type: 'system' as const, 
      content: `File "${uploadedFile.name}" has been uploaded. You can now analyze its content.` 
    }]);
  };

  // 处理文件点击
  const handleFileClick = (clickedFile: File) => {
    setViewingFile(clickedFile);
    setFile(clickedFile); // 设置为当前活动文件
  };

  // 关闭文件查看器
  const handleCloseFileViewer = () => {
    setViewingFile(null);
  };

  // 删除文件消息
  const handleDeleteFileMessage = (index: number) => {
    // 获取要删除的消息
    const fileMessage = messages[index];
    
    // 如果是当前活动文件，则清除活动文件
    if (file && fileMessage.fileData && 
        file.name === fileMessage.fileData.name && 
        file.size === fileMessage.fileData.size) {
      setFile(null);
      
      // 如果正在查看该文件，也关闭查看器
      if (viewingFile) {
        setViewingFile(null);
      }
    }
    
    // 从消息列表中删除该消息
    const newMessages = [...messages];
    newMessages.splice(index, 1);
    setMessages(newMessages);
    
    // 显示通知
    toast({
      title: "File Removed",
      description: "The file has been removed from the conversation.",
    });
  };

  // 文件上传按钮的处理函数
  const handleFileButtonClick = () => {
    // 创建一个隐藏的文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.style.display = 'none';

    // 添加文件选择处理函数
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        handleFileUploadAsMessage(target.files[0]);
      }
    };

    // 触发文件选择对话框
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

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
                {/* Header section with title and mode selector */}
                <div className='flex justify-between items-center p-4 border-b border-gray-700/30'>
                  <div className='text-text-secondary text-xl font-semibold my-2'>Chat</div>

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

                {/* Main content area - 使用 ChatMessages 组件 */}
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
                  
                  {/* 保留显示加载指示器 */}
                  {isAnalysisLoading && !messages.some(msg => msg.type === 'loading') && (
                    <div className="flex justify-center items-center py-4">
                      <CircularProgress size={30} />
                    </div>
                  )}
                </div>

                {/* Input area - ChatGPT风格的输入区域 */}
                <div className='p-4 border-t border-gray-700/10'>
                  {/* 主输入区域 */}
                  <div className="relative">
                    <div className="rounded-xl border border-gray-700/30 bg-secondary/20 shadow-sm overflow-hidden">
                      <Textarea
                        className="w-full bg-transparent text-text-primary placeholder:text-gray-400/60 px-4 py-3
                          focus:ring-0 focus:outline-none resize-none transition-all text-sm min-h-[150px] max-h-[350px] overflow-auto"
                        placeholder="Ask me anything..."
                        minRows={5}
                        maxRows={12}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        value={inputText}
                        aria-label="Type your question"
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
                  
                  {/* 底部功能区 */}
                  <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex items-center space-x-2">
                      {/* 文件上传按钮 */}
                      <button 
                        type="button"
                        onClick={handleFileButtonClick}
                        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-200/10"
                        title="Upload .txt file (max 1MB)"
                      >
                        <FaPaperclip className="w-4 h-4" />
                      </button>
                      
                      {/* 其他功能按钮可以在这里添加 */}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* 文件格式提示 */}
                      <div className="text-xs text-gray-500">
                        Only .txt files (max 1MB)
                      </div>
                      
                      {/* Draw模式切换 */}
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
                      
                      {/* 发送按钮 */}
                      <button
                        type="button"
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                          inputText.trim() 
                            ? 'text-white bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-300/20 text-gray-400 hover:bg-gray-300/30'
                        }`}
                        onClick={handleSendMessage}
                        aria-label="Send message"
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

            {/* Right Panel - 保持不变 */}
            <Panel defaultSize={60} minSize={40}>
              <div className='relative h-full mr-8 rounded-lg bg-primary overflow-auto custom-scrollbar'>
                <div className="flex w-full h-full">
                  {viewingFile ? (
                    <FileContent file={viewingFile} onClose={handleCloseFileViewer} />
                  ) : isCompleteLoading ? (
                    <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar">
                      <div className="mt-12">
                        <ProgressDisplay
                          progress={progress}
                          stageEmoji={stageEmoji}
                          stageDescription={stageDescription}
                          statusMessage={statusMessage}
                        />
                      </div>

                      {intermediateData && intermediateData.solution && (
                        <div>
                          <IntermediateResult intermediateData={intermediateData} />
                        </div>
                      )}
                    </div>
                  ) : completeResult ? (
                    <CompleteResult
                      completeResult={completeResult}
                      handleRegenerate={handleRegenerate}
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
