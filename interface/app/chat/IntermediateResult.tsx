import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntermediateResultProps {
  intermediateData: any;
}

const IntermediateResult = ({ intermediateData }: IntermediateResultProps) => {
  const [expandedSolutions, setExpandedSolutions] = useState<Set<number>>(new Set());

  const toggleSolution = (index: number) => {
    setExpandedSolutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="p-6 bg-primary rounded-lg text-sm font-normal">
      {intermediateData.solution && (
        <div>
          <div className="space-y-4">
            {Array.isArray(intermediateData.solution) ? (
              intermediateData.solution.map((sol, index) => (
                <motion.div 
                  key={index} 
                  className="bg-secondary/20 rounded-xl overflow-hidden shadow-md border border-secondary/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <button 
                    onClick={() => toggleSolution(index)}
                    className="w-full p-4 flex justify-between items-center hover:bg-secondary/40 transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-500/20 text-blue-500 p-2 rounded-full mr-3">
                        <span className="text-lg">{index + 1}</span>
                      </div>
                      <span className="text-text-secondary font-semibold text-base">{sol.Title}</span>
                    </div>
                    <motion.div 
                      className="bg-secondary/30 h-8 w-8 rounded-full flex items-center justify-center text-text-secondary"
                      animate={{ 
                        rotate: expandedSolutions.has(index) ? 180 : 0,
                        backgroundColor: expandedSolutions.has(index) ? 'rgba(79, 70, 229, 0.3)' : 'rgba(100, 100, 100, 0.3)' 
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
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
                    {expandedSolutions.has(index) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 border-t border-secondary/30 bg-secondary/10">
                          <div className="p-3 bg-secondary/20 rounded-lg mb-3">
                            <p className="text-text-secondary font-bold mb-1">Function:</p>
                            <p className="text-text-primary">{sol.Function}</p>
                          </div>
                          
                          <div className="p-3 bg-secondary/20 rounded-lg mb-3">
                            <p className="text-text-secondary font-bold mb-2">Technical Method:</p>
                            {Array.isArray(sol["Technical Method"]) ? (
                              <ul className="list-disc pl-5 space-y-1">
                                {sol["Technical Method"].map((method, i) => (
                                  <li key={i}>{method}</li>
                                ))}
                              </ul>
                            ) : sol["Technical Method"] && typeof sol["Technical Method"] === 'object' ? (
                              <div className="space-y-3">
                                <div className="pl-3 border-l-2 border-blue-400">
                                  <p className="text-blue-400 font-medium">Original:</p>
                                  {Array.isArray(sol["Technical Method"].Original) ? (
                                    <ul className="list-disc pl-5 space-y-1 mt-1">
                                      {sol["Technical Method"].Original.map((method, i) => (
                                        <li key={i}>{method}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p>{sol["Technical Method"].Original}</p>
                                  )}
                                </div>
                                
                                {sol["Technical Method"].Iteration && (
                                  <div className="pl-3 border-l-2 border-purple-400">
                                    <p className="text-purple-400 font-medium">Iteration:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-1">
                                      {sol["Technical Method"].Iteration.map((iter, i) => (
                                        <li key={i}>{iter}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="pl-2">{JSON.stringify(sol["Technical Method"])}</p>
                            )}
                          </div>
                          
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
                                        <p>{sol["Possible Results"].Original.Performance}</p>
                                      </div>
                                      <div className="bg-blue-400/10 p-2 rounded">
                                        <p className="font-medium text-blue-300">User Experience:</p>
                                        <p>{sol["Possible Results"].Original["User Experience"]}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p>Performance: {sol["Possible Results"].Performance}</p>
                                    <p>User Experience: {sol["Possible Results"]["User Experience"]}</p>
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
                                            <p>{iter.Performance}</p>
                                          </div>
                                          <div className="bg-purple-400/10 p-2 rounded">
                                            <p className="font-medium text-purple-300">User Experience:</p>
                                            <p>{iter["User Experience"]}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="pl-2">{JSON.stringify(sol["Possible Results"])}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <p>{JSON.stringify(intermediateData.solution)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntermediateResult; 