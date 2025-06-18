import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import MasonryGallery from '@/components/inspiration/MasonryGallery';

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

interface ResearchDisplayProps {
  researchState: ResearchState;
  onStop: () => void;
  onRegenerate?: () => void;
}

const ResearchDisplay: React.FC<ResearchDisplayProps> = ({
  researchState,
  onStop,
  onRegenerate
}) => {
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(new Set());
  const streamingRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (streamingRef.current && researchState.streamingContent) {
      streamingRef.current.scrollTop = streamingRef.current.scrollHeight;
    }
  }, [researchState.streamingContent]);

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const toggleSolution = (stageId: string, solutionIndex: number) => {
    const key = `${stageId}-${solutionIndex}`;
    setExpandedSolutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Define research stages
  const getStages = () => {
    const stages = [];
    
    if (researchState.results.domainKnowledge) {
      stages.push({
        id: 'rag',
        title: 'Knowledge Retrieval',
        emoji: '🔍',
        status: 'completed',
        data: researchState.results.domainKnowledge
      });
    }
    
    if (researchState.results.initSolution) {
      stages.push({
        id: 'domain',
        title: 'Domain Expert Analysis',
        emoji: '🧠',
        status: 'completed',
        data: researchState.results.initSolution
      });
    }
    
    if (researchState.results.iteratedSolution) {
      stages.push({
        id: 'interdisciplinary',
        title: 'Interdisciplinary Enhancement',
        emoji: '🔬',
        status: 'completed',
        data: researchState.results.iteratedSolution
      });
    }
    
    if (researchState.results.finalSolution) {
      stages.push({
        id: 'evaluation',
        title: 'Solution Evaluation',
        emoji: '⚖️',
        status: 'completed',
        data: researchState.results.finalSolution
      });
    }
    
    return stages;
  };

  const renderKnowledgeRetrieval = (data: any) => {
    if (!data?.hits || !Array.isArray(data.hits)) {
      return (
        <div className="p-4">
          <pre className="text-xs text-text-primary bg-secondary/10 p-3 rounded-lg overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary font-medium">
            Retrieved {data.hits.length} knowledge items
          </span>
          <span className="text-xs text-text-secondary bg-secondary/20 px-2 py-1 rounded">
            RAG Results
          </span>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {data.hits.slice(0, 5).map((hit: any, index: number) => (
            <div key={index} className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-blue-400 font-medium">Item {index + 1}</span>
                {hit._id && (
                  <span className="text-xs text-text-secondary font-mono">
                    {hit._id.slice(0, 8)}...
                  </span>
                )}
              </div>
              
              {hit["Target Definition"] && (
                <div className="mb-2">
                  <span className="text-xs text-text-secondary">Target: </span>
                  <span className="text-sm text-text-primary">
                    {hit["Target Definition"]["Target User Group"] || hit["Target Definition"]}
                  </span>
                </div>
              )}
              
              {hit.title && (
                <div className="mb-1">
                  <span className="text-sm font-medium text-text-primary">{hit.title}</span>
                </div>
              )}
              
              {hit.content && (
                <div className="text-sm text-text-primary">
                  {typeof hit.content === 'string' 
                    ? hit.content.slice(0, 150) + (hit.content.length > 150 ? '...' : '')
                    : JSON.stringify(hit.content).slice(0, 150) + '...'
                  }
                </div>
              )}
            </div>
          ))}
          
          {data.hits.length > 5 && (
            <div className="p-3 bg-secondary/5 rounded-lg text-center">
              <p className="text-text-secondary text-sm">
                ... and {data.hits.length - 5} more items
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderIntermediateResult = (data: any, stageId: string) => {
    const renderSolutionData = (solutionData: any) => {
      if (!solutionData) return null;

      // Handle text data
      if (typeof solutionData === 'string') {
        return (
          <div className="p-3 bg-secondary/10 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-text-primary">{solutionData}</pre>
          </div>
        );
      }

      // Handle array of solutions
      if (Array.isArray(solutionData)) {
        return (
          <div className="space-y-4">
            {solutionData.map((sol, index) => {
              const solutionKey = `${stageId}-${index}`;
              const isExpanded = expandedSolutions.has(solutionKey);

              return (
                <motion.div 
                  key={index} 
                  className="bg-secondary/30 rounded-xl overflow-hidden shadow-md border border-secondary/40"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <button 
                    onClick={() => toggleSolution(stageId, index)}
                    className="w-full p-3 flex justify-between items-center hover:bg-secondary/50 transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-500/20 text-blue-500 p-2 rounded-full mr-3">
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>
                      <span className="text-text-secondary font-semibold text-base">
                        {sol.Title || sol.title || `Solution ${index + 1}`}
                      </span>
                    </div>
                    <motion.div 
                      className="bg-secondary/30 h-6 w-6 rounded-full flex items-center justify-center text-text-secondary"
                      animate={{ 
                        rotate: isExpanded ? 180 : 0,
                        backgroundColor: isExpanded ? 'rgba(79, 70, 229, 0.3)' : 'rgba(100, 100, 100, 0.3)' 
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 border-t border-secondary/30 bg-secondary/5">
                          {sol.Function && (
                            <div className="p-3 bg-secondary/20 rounded-lg mb-3">
                              <p className="text-text-secondary font-bold mb-1">Function:</p>
                              <p className="text-text-primary">{sol.Function}</p>
                            </div>
                          )}
                          
                          {sol["Technical Method"] && (
                            <div className="p-3 bg-secondary/20 rounded-lg mb-3">
                              <p className="text-text-secondary font-bold mb-2">Technical Method:</p>
                              {Array.isArray(sol["Technical Method"]) ? (
                                <ul className="list-disc pl-5 space-y-1">
                                  {sol["Technical Method"].map((method, i) => (
                                    <li key={i} className="text-text-primary">{method}</li>
                                  ))}
                                </ul>
                              ) : sol["Technical Method"] && typeof sol["Technical Method"] === 'object' ? (
                                <div className="space-y-3">
                                  <div className="pl-3 border-l-2 border-blue-400">
                                    <p className="text-blue-400 font-medium">Original:</p>
                                    {Array.isArray(sol["Technical Method"].Original) ? (
                                      <ul className="list-disc pl-5 space-y-1 mt-1">
                                        {sol["Technical Method"].Original.map((method, i) => (
                                          <li key={i} className="text-text-primary">{method}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-text-primary">{sol["Technical Method"].Original}</p>
                                    )}
                                  </div>
                                  
                                  {sol["Technical Method"].Iteration && (
                                    <div className="pl-3 border-l-2 border-purple-400">
                                      <p className="text-purple-400 font-medium">Iteration:</p>
                                      <ul className="list-disc pl-5 space-y-1 mt-1">
                                        {sol["Technical Method"].Iteration.map((iter, i) => (
                                          <li key={i} className="text-text-primary">{iter}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="pl-2 text-text-primary">{JSON.stringify(sol["Technical Method"])}</p>
                              )}
                            </div>
                          )}
                          
                          {sol["Possible Results"] && (
                            <div className="p-3 bg-secondary/20 rounded-lg">
                              <p className="text-text-secondary font-bold mb-2">Possible Results:</p>
                              {sol["Possible Results"] && typeof sol["Possible Results"] === 'object' ? (
                                <div className="space-y-3">
                                  {sol["Possible Results"].Original ? (
                                    <div className="pl-3 border-l-2 border-blue-400">
                                      <p className="text-blue-400 font-medium">Original:</p>
                                      <div className="mt-2 space-y-2">
                                        <div className="bg-blue-400/10 p-2 rounded">
                                          <p className="font-medium text-blue-300">Performance:</p>
                                          <p className="text-text-primary">{sol["Possible Results"].Original.Performance}</p>
                                        </div>
                                        <div className="bg-blue-400/10 p-2 rounded">
                                          <p className="font-medium text-blue-300">User Experience:</p>
                                          <p className="text-text-primary">{sol["Possible Results"].Original["User Experience"]}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      {sol["Possible Results"].Performance && (
                                        <p className="text-text-primary">Performance: {sol["Possible Results"].Performance}</p>
                                      )}
                                      {sol["Possible Results"]["User Experience"] && (
                                        <p className="text-text-primary">User Experience: {sol["Possible Results"]["User Experience"]}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {sol["Possible Results"].Iteration && (
                                    <div className="pl-3 border-l-2 border-purple-400">
                                      <p className="text-purple-400 font-medium">Iteration:</p>
                                      <div className="space-y-3 mt-2">
                                        {sol["Possible Results"].Iteration.map((iter, i) => (
                                          <div key={i} className="space-y-2">
                                            <div className="bg-purple-400/10 p-2 rounded">
                                              <p className="font-medium text-purple-300">Performance:</p>
                                              <p className="text-text-primary">{iter.Performance}</p>
                                            </div>
                                            <div className="bg-purple-400/10 p-2 rounded">
                                              <p className="font-medium text-purple-300">User Experience:</p>
                                              <p className="text-text-primary">{iter["User Experience"]}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="pl-2 text-text-primary">{JSON.stringify(sol["Possible Results"])}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        );
      }

      // Handle data.solution array
      if (solutionData.solution && Array.isArray(solutionData.solution)) {
        return renderSolutionData(solutionData.solution);
      }

      // Handle object with solutions property
      if (solutionData.solutions && Array.isArray(solutionData.solutions)) {
        return renderSolutionData(solutionData.solutions);
      }

      // Handle other structured data
      return (
        <div className="p-3 bg-secondary/10 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm text-text-primary overflow-x-auto max-h-60 overflow-y-auto">
            {JSON.stringify(solutionData, null, 2)}
          </pre>
        </div>
      );
    };

    return (
      <div className="p-4">
        {renderSolutionData(data)}
      </div>
    );
  };

  const renderCompleteResult = (completeResult: any) => {
    return (
      <motion.div 
        className="flex flex-col h-full overflow-y-auto custom-scrollbar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header Section */}
        <div className="sticky top-0 bg-primary/95 backdrop-blur-sm border-b border-secondary/20 z-10">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 text-green-500 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Research Complete</h1>
                  <p className="text-sm text-green-400">Generated {completeResult['solutions']?.length || 0} solutions</p>
                </div>
              </div>
              
              <motion.button
                className="flex items-center gap-2 px-4 py-2 bg-secondary/30 hover:bg-secondary/50 
                         text-text-secondary hover:text-text-primary rounded-lg transition-all duration-200
                         border border-secondary/30 hover:border-secondary/50"
                onClick={onRegenerate || (() => {})}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 9 9m-9 9a9 9 0 0 1-9-9"/>
                  <path d="m12 7 3 3-3 3"/>
                </svg>
                <span className="text-sm font-medium">Regenerate</span>
              </motion.button>
            </div>

            {/* Title and Description */}
            <motion.div 
              className="bg-secondary/10 backdrop-blur-sm rounded-xl p-6 border border-secondary/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-text-primary mb-3 leading-tight">
                {completeResult['title'] || 'Research Results'}
              </h2>
              <p className="text-base text-text-secondary leading-relaxed">
                {completeResult['desc'] || 'Here are the generated solutions based on your research query.'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Solutions Section */}
        <div className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Generated Solutions</h3>
              <p className="text-sm text-text-secondary">
                Explore the research-backed solutions tailored to your requirements
              </p>
            </div>

            {completeResult['solutions']?.length ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <MasonryGallery 
                  solutions={completeResult['solutions'].map((solution, index) => ({
                    ...solution,
                    id: solution.id || `solution-${index}`
                  }))}
                  likedSolutions={completeResult['solutions'].reduce((acc, solution, index) => {
                    acc[solution.id || `solution-${index}`] = false;
                    return acc;
                  }, {})}
                />
              </motion.div>
            ) : (
              <motion.div 
                className="flex flex-col items-center justify-center py-16 px-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="text-6xl mb-4 opacity-50">🔍</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Solutions Generated</h3>
                <p className="text-text-secondary mb-6 max-w-md">
                  It looks like no solutions were generated from this research. Try regenerating or refining your query.
                </p>
                <motion.button
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                           font-medium transition-colors duration-200"
                  onClick={onRegenerate || (() => {})}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer Stats */}
        {completeResult['solutions']?.length > 0 && (
          <motion.div 
            className="sticky bottom-0 bg-primary/95 backdrop-blur-sm border-t border-secondary/20 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="flex items-center justify-center gap-6 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{completeResult['solutions'].length} Solutions Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Research Complete</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderProgressDisplay = () => {
    return (
      <div className="p-4 bg-primary border-b border-secondary/30 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-text-primary">Research Progress</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm font-mono bg-secondary/20 px-3 py-1 rounded">
              {formatTime(researchState.elapsedTime)}
            </div>
            {researchState.isLoading && (
              <button
                onClick={onStop}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-text-secondary">{researchState.statusMessage}</span>
            <span className="text-sm text-text-secondary">{researchState.progress}%</span>
          </div>
          <div className="w-full bg-secondary/30 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${researchState.progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStageContent = (stage: any) => {
    if (stage.id === 'rag') {
      return renderKnowledgeRetrieval(stage.data);
    }
    
    // For other stages, use IntermediateResult logic
    return renderIntermediateResult(stage.data, stage.id);
  };

  const stages = getStages();
  const isStreaming = researchState.isLoading && researchState.streamingContent;

  // Check if research is complete and we have final solutions
  const isComplete = !researchState.isLoading && 
                    researchState.progress === 100 && 
                    researchState.results.finalSolution?.solutions;

  // If research is complete, show CompleteResult
  if (isComplete) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        {renderCompleteResult(researchState.results.finalSolution)}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Progress display */}
      {renderProgressDisplay()}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {/* Display completed stages */}
        {stages.map((stage) => (
          <motion.div
            key={stage.id}
            className="border-b border-secondary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stage header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-500/20 text-green-500 p-2 rounded-full mr-3">
                  <span className="text-lg">{stage.emoji}</span>
                </div>
                <div className="text-left">
                  <span className="text-text-primary font-semibold">{stage.title}</span>
                  <div className="text-xs text-green-400">Completed</div>
                </div>
              </div>
              
              <button
                onClick={() => toggleStageCollapse(stage.id)}
                className="p-1 hover:bg-secondary/20 rounded transition-colors"
              >
                <motion.div
                  animate={{ rotate: collapsedStages.has(stage.id) ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                </motion.div>
              </button>
            </div>

            {/* Stage content */}
            <AnimatePresence>
              {!collapsedStages.has(stage.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {renderStageContent(stage)}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Streaming output display */}
        {isStreaming && (
          <div className="p-4 border-b border-secondary/20">
            <div className="flex items-center mb-3">
              <div className="bg-blue-500/20 text-blue-500 p-2 rounded-full mr-3 animate-pulse">
                <span className="text-lg">⚡</span>
              </div>
              <div className="text-left">
                <span className="text-text-primary font-semibold">Processing...</span>
                <div className="text-xs text-blue-400">Generating solutions</div>
              </div>
            </div>
            
            <div
              ref={streamingRef}
              className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-48 overflow-y-auto whitespace-pre-wrap"
            >
              {researchState.streamingContent}
              <span className="animate-pulse">▋</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!researchState.isLoading && researchState.progress === 0 && stages.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Ready to Research</h3>
            <p className="text-text-secondary">
              Start a research workflow to see real-time progress and results here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchDisplay; 