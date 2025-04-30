"use client";

import { useState, useEffect, Suspense } from 'react';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { FaArrowCircleUp } from 'react-icons/fa';
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

import AnalysisResult from './AnalysisResult';
import IntermediateResult from './IntermediateResult';
import ProgressDisplay from './ProgressDisplay';
import CompleteResult from './CompleteResult';
import { readFileContent, extractErrorMessage } from './FileUtils';
import { callQueryAnalysis, callStepApi } from './ApiService';

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

  const [id, setId] = useState('');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedId = localStorage.getItem("id");
    if (storedId) {
      setId(storedId);
    }
  }, []);

  const handleSendMessage = () => {
    logger.log(inputText);
    setMessages('');
    if (inputText.trim()) {
      setMessages(inputText);
      handleQueryAnalysis();
    }
  };

  // Handle file drop
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFiles([acceptedFiles[0]]);
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
    },
  });

  // 分析结果相关状态
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const handleQueryAnalysis = () => {
    callQueryAnalysis(
      inputText,
      files,
      setAnalysisResult,
      setIsAnalysisLoading,
      readFileContent,
      fetchQueryAnalysis,
      toast
    );
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
            <Panel defaultSize={30} minSize={20}>
              <div className='relative ml-8 h-full rounded-xl bg-primary shadow-lg overflow-hidden flex flex-col'>
                {/* Header section with title and mode selector */}
                <div className='flex justify-between items-center mt-1 p-4 border-b border-gray-700/30'>
                  <div className='text-text-secondary text-2xl font-semibold'>Input</div>

                  <select
                    className='px-3 py-2 rounded-lg bg-secondary text-text-secondary font-semibold 
                      transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                    value={selectedMode}
                    onChange={handleModeChange}
                  >
                    <option value="chat" className='font-semibold'>Chat</option>
                    <option value="inspiration" className='font-semibold'>Inspiration</option>
                  </select>
                </div>

                {/* Main content area */}
                <div className='flex flex-col p-4 space-y-4 flex-grow'>
                  {/* Text input area */}
                  <div className="w-full rounded-lg bg-secondary/80 backdrop-blur-sm shadow-inner">
                    <Textarea
                      className="w-full h-full bg-transparent text-text-primary placeholder:text-gray-400/70 p-3 
                        focus:ring-1 focus:ring-blue-500/50 focus:outline-none rounded-lg resize-none transition-all"
                      placeholder="Please type your question here..."
                      minRows={6}
                      maxRows={6}
                      spellCheck={false}
                      autoComplete="off"
                      autoCorrect="off"
                      aria-label="Type your question here"
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className='w-full flex justify-end items-center px-3 pb-3'>
                      <button
                        className='text-text-primary hover:text-blue-400 transition-colors duration-200 flex items-center justify-center'
                        onClick={handleSendMessage}
                        aria-label="Send message"
                      >
                        <FaArrowCircleUp className='text-3xl' />
                      </button>
                    </div>
                  </div>

                  {/* Analysis result area */}
                  <div className="flex-1 w-full rounded-lg overflow-y-auto flex flex-col custom-scrollbar">
                    {isAnalysisLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <CircularProgress />
                      </div>
                    ) : analysisResult ? (
                      <AnalysisResult
                        analysisResult={analysisResult}
                        handleQueryAnalysis={handleQueryAnalysis}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400/70">
                        {/* <p>Your analysis will appear here</p> */}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with generate button */}
                <div className='p-4 border-t border-gray-700/30 flex justify-between items-center'>
                  {isDeveloper && (
                    <div className="flex items-center space-x-4">
                      <button
                        className={`px-4 py-2 rounded-lg text-text-secondary font-semibold 
                              transition-colors duration-200 shadow-sm 
                              ${drawMode ? 'bg-primary hover:bg-primary/70' : 'bg-secondary hover:bg-secondary/70'}`}
                        onClick={toggleDrawMode}
                      >
                        {drawMode ? 'Draw: ON' : 'Draw: OFF'}
                      </button>
                    </div>
                  )}
                  {analysisResult ? (
                    <button
                      className='bg-secondary hover:bg-blue-600 text-text-secondary text-lg 
                        font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm 
                        flex items-center'
                      onClick={handleGenerate}
                    >
                      Generate!
                    </button>
                  ) : (
                    <div className='h-8'></div>
                  )}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 mx-2 hover:bg-blue-500 hover:w-1.5 transition-all duration-300 rounded-full cursor-col-resize" />

            <Panel defaultSize={70} minSize={40}>
              <div className='relative h-full mr-8 rounded-lg bg-primary overflow-auto custom-scrollbar'>
                <div className="flex w-full h-full">
                  {isCompleteLoading ? (
                    <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar">
                      {/* 固定高度的进度显示区域 - 改为占据更多空间 */}
                      <div className="mt-12">
                        <ProgressDisplay
                          progress={progress}
                          stageEmoji={stageEmoji}
                          stageDescription={stageDescription}
                          statusMessage={statusMessage}
                        />
                      </div>

                      {/* 可滚动的中间态数据区域 - 移至下半部分 */}
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
                        <p className='font-bold text-4xl'>No result available yet.</p>
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
  )
};

export default GenerateSolution;
