"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchQuerySolution, fetchQueryLikedSolutions, fetchLikeSolution, fetchComplete } from "@/lib/actions";
import { FaHeart, FaChevronDown, FaComments, FaTimes, FaMinusCircle, FaPaperPlane } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from '@/lib/hooks/auth-store';
import { useToast } from "@/components/ui/toast";
import ChatPopup from "@/components/inspiration/ChatPopup";
import RecommendedInspirations from "@/components/inspiration/RecommendedInspirations";
import { logger } from '@/lib/logger';
import { getLargeEmojiForTitle } from '@/lib/emoji-utils';
import Image from 'next/image';

// Define IterationSection component here, before Inspiration
const IterationSection = memo(({
    title,
    method,
    performance,
    userExperience,
    isExpanded,
    onToggle,
    index // index is now 0 for Original, 1+ for Iterations
}: any) => (
    <div className="mb-4 rounded-lg shadow-md border border-border-primary overflow-hidden"> {/* Added border */}
        <motion.button
            className="flex justify-between items-center w-full px-5 py-3 text-left bg-secondary hover:bg-secondary/80 transition-colors duration-150" // Increased padding
            onClick={onToggle}
        >
            <h3 className="text-lg font-semibold text-text-primary"> {/* Increased font size */}
                {index === 0 ? 'Original Approach' : `Iteration ${index}`}{/* Clearer Title */}
            </h3>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <FaChevronDown className="text-text-secondary" />
            </motion.div>
        </motion.button>
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden bg-primary" // Matched background
                >
                    <div className="px-5 py-4 space-y-3 text-text-secondary border-t border-border-secondary"> {/* Added border-t */}
                        {method && <p><strong className="font-medium text-text-primary">Method: </strong>{method}</p>}
                        {performance && <p><strong className="font-medium text-text-primary">Performance: </strong>{performance}</p>}
                        {userExperience && <p><strong className="font-medium text-text-primary">User Experience: </strong>{userExperience}</p>}
                        {/* Add a message if details are missing */}
                        {!method && !performance && !userExperience && <p className="text-sm italic">Details not available.</p>}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
));
IterationSection.displayName = 'IterationSection';

// 自定义 Hook 获取解决方案数据
const useSolutionData = (id: string) => {
    const [solution, setSolution] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;
    const dataFetchedRef = useRef(false);

    const fetchSolutionData = useCallback(async () => {
        // 避免重复获取数据
        if (solution && !dataFetchedRef.current) return;

        try {
            setLoading(true);
            const result = await fetchQuerySolution(id);
            logger.log(result);
            if (!result) {
                throw new Error("No solution data returned");
            }

            // 安全地解析JSON，避免重复解析
            let parsedResult;
            try {
                parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
            } catch (parseError) {
                console.error("JSON parsing error:", parseError);
                throw new Error("Failed to parse solution data");
            }

            if (!parsedResult) {
                throw new Error("Failed to parse solution data");
            }

            // 使用函数式更新，避免依赖过期数据
            setSolution(parsedResult);
            dataFetchedRef.current = true;
            setError(null);
        } catch (err) {
            console.error("Error fetching solution:", err);
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, 1000); // 1秒后重试
            } else {
                setError("Error loading solution data");
            }
        } finally {
            setLoading(false);
        }
    }, [id, retryCount, solution]);

    // 只在组件挂载和id变化时获取数据
    useEffect(() => {
        dataFetchedRef.current = false;
        fetchSolutionData();

        // 清理函数
        return () => {
            dataFetchedRef.current = false;
        };
    }, [id, fetchSolutionData]); // 添加fetchSolutionData作为依赖

    return { solution, loading, error, refetch: fetchSolutionData };
};

// 新增：获取 like 数量的函数
async function fetchLikeCount(id: string): Promise<number> {
    try {
        const res = await fetch(`/api/solution/${id}/like_count`);
        if (!res.ok) return 0;
        const data = await res.json();
        return data.like_count ?? 0;
    } catch {
        return 0;
    }
}

const Inspiration = () => {
    const { id } = useParams();
    const router = useRouter();
    const authStore = useAuthStore();
    const [isLiked, setIsLiked] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const { solution, loading, error, refetch } = useSolutionData(id as string);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isChatMinimized, setIsChatMinimized] = useState(false);
    const [titleEmoji, setTitleEmoji] = useState<string>('📄');
    const [likeCount, setLikeCount] = useState<number>(0);

    // 初始化喜欢状态
    useEffect(() => {
        const initializeLikeStatus = async () => {
            if (!authStore.email) return;

            try {
                const likedStatuses = await fetchQueryLikedSolutions([id as string]);
                if (likedStatuses && Array.isArray(likedStatuses)) {
                    const newLikedStates = likedStatuses.reduce((acc: any, { solution_id, isLiked }) => {
                        acc[solution_id] = isLiked;
                        return acc;
                    }, {});
                    setIsLiked(newLikedStates[id as string] || false);
                }
            } catch (error) {
                console.error("Failed to fetch liked status", error);
            }
        };
        initializeLikeStatus();
    }, [id, authStore.email]);

    // 更新标题表情符号
    useEffect(() => {
        if (solution?.solution?.Title) {
            const title = solution.solution.Title;
            const emoji = getLargeEmojiForTitle(title);
            setTitleEmoji(emoji);
            logger.log(`标题 "${title}" 匹配表情符号: ${emoji}`);
        }
    }, [solution?.solution?.Title]);

    // 初始化展开状态
    useEffect(() => {
        if (solution && !expandedSections.length) {
            const defaultExpanded = [
                "Original", // 默认展开原始技术方法
                ...(solution?.solution?.["Technical Method"]?.Iteration?.map((_: any, index: number) => `Iteration${index}`) || [])
            ];
            setExpandedSections(defaultExpanded);
        }
    }, [solution, expandedSections.length]);

    // 新增：获取 like 数量
    useEffect(() => {
        if (!id) return;
        fetchLikeCount(id as string).then(setLikeCount);
    }, [id]);

    // 点赞后刷新 like 数量
    const handleLiked = useCallback(async () => {
        if (!authStore.email) {
            router.push('/user/login');
            return;
        }
        try {
            setIsLiked(prev => !prev);
            await fetchLikeSolution(id as string);
            // 点赞后刷新 like 数量
            fetchLikeCount(id as string).then(setLikeCount);
        } catch (error) {
            console.error("Failed to update like status", error);
            setIsLiked(prev => !prev); // 如果失败则恢复状态
        }
    }, [id, authStore.email, router]);

    // 切换展开/收缩
    const toggleSection = useCallback((section: string) => {
        setExpandedSections((prevSections) =>
            prevSections.includes(section)
                ? prevSections.filter((s) => s !== section) // 移除已展开的项
                : [...prevSections, section] // 添加未展开的项
        );
    }, []);

    // 动画配置
    const fadeInUp = useMemo(() => ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    }), []);

    // 添加新的处理函数
    const handleChatToggle = () => {
        setIsChatOpen(prev => !prev);
        setIsChatMinimized(false);
    };

    const handleChatMinimize = () => {
        setIsChatMinimized(prev => !prev);
    };

    // 使用useMemo缓存技术方法部分
    const technicalMethodsSection = useMemo(() => {
        if (!solution || !solution.solution || !solution.solution["Technical Method"]) return null;

        const originalMethod = solution.solution["Technical Method"].Original;
        const originalResults = solution.solution["Possible Results"]?.Original;
        const iterations = solution.solution["Technical Method"].Iteration || [];
        const iterationResults = solution.solution["Possible Results"]?.Iteration || [];


        return (
            <motion.div {...fadeInUp}>
                <h2 className="text-xl font-semibold text-text-primary mb-4">Technical Methods</h2>
                {originalMethod && (
                    <IterationSection
                        title="Original"
                        method={originalMethod}
                        performance={originalResults?.Performance}
                        userExperience={originalResults?.["User Experience"]}
                        isExpanded={expandedSections.includes("Original")}
                        onToggle={() => toggleSection("Original")}
                        index={0} // Changed index to 0 for original
                    />
                )}
                 {iterations.map((iteration: string, index: number) => {
                     const result = iterationResults[index];
                     const sectionId = `Iteration${index}`; // Use index directly for ID
                     return (
                        <IterationSection
                            key={sectionId} // Use a stable key
                            title={`Iteration ${index + 1}`}
                            method={iteration}
                            performance={result?.Performance}
                            userExperience={result?.["User Experience"]}
                            isExpanded={expandedSections.includes(sectionId)}
                            onToggle={() => toggleSection(sectionId)}
                            index={index + 1} // Keep index + 1 for display title
                        />
                     );
                 })}
            </motion.div>
        );
    }, [solution, expandedSections, toggleSection, fadeInUp]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-primary">
                <p className="text-text-secondary mb-4">{error}</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-secondary text-text-primary rounded-md hover:bg-border-secondary"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Prepare flags for conditional rendering
    const isAnalysisQuery = solution && solution["query_analysis_result"] && typeof solution["query_analysis_result"] === 'object';
    const hasStringQuery = solution && typeof solution.query === 'string' && solution.query.trim() !== '';
    const hasQuery = isAnalysisQuery || hasStringQuery;
    const hasUseCase = solution?.solution?.["Use Case"];
    const hasFunction = solution?.solution?.Function;
    const hasImage = solution?.solution?.image_url;

    return (
        <motion.div
            className="flex flex-col items-center bg-primary min-h-screen px-4 md:px-8 transition-colors duration-300 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="w-full max-w-7xl rounded-lg overflow-hidden shadow-sm my-6"> {/* Added my-8 for vertical spacing */}
                {/* Header Section */}
                <motion.div
                    className="px-6 border-b border-border-primary bg-secondary/10" // Slightly different bg for header
                    {...fadeInUp}
                >
                    <div className="flex justify-between items-start mb-6"> {/* Increased bottom margin */}
                        <h1 className="text-2xl font-bold text-text-primary flex-1 mr-4"> {/* Increased size */}
                            {loading ? "Loading..." : solution?.solution?.Title || "No Title"}
                        </h1>
                        <div className="flex flex-col items-center">
                            <motion.button
                                className={`text-3xl transition-colors duration-200 ${isLiked ? "text-red-500" : "text-gray-400"}`}
                                onClick={handleLiked}
                                aria-label={isLiked ? "Dislike" : "Like"}
                                disabled={loading}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <FaHeart />
                            </motion.button>
                            {/* 新增：展示 like 数量 */}
                            <span className="text-sm text-text-secondary mt-1">{likeCount} Likes</span>
                        </div>
                    </div>

                    {/* Highlighted Function Section - Two Column Layout */}
                    {!loading && hasFunction && (
                        <div className="mt-4 bg-gradient-to-r from-accent-blue/15 to-transparent p-5 
                            rounded-lg border-l-4 border-accent-blue shadow-sm flex gap-6 items-start"> {/* Use flex, add gap, adjust background/padding */}
                            {/* Left Column: Title */}
                             <div className="w-1/4 pt-1"> {/* Define width for left column, add padding-top */}
                                <h2 className="text-base font-semibold text-text-primary uppercase tracking-wider sticky top-6"> {/* Make title sticky */}
                                    Function
                                </h2>
                            </div>
                            {/* Right Column: Content */}
                             <div className="w-3/4 pr-4"> {/* Define width for right column */}
                                <p className="text-xl text-text-primary leading-relaxed font-medium"> {/* Adjusted size */}
                                    {solution.solution.Function}
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Content Body Section */}
                <motion.div className="p-6 space-y-8" {...fadeInUp}>
                    {loading ? (
                        <div className="text-text-secondary text-center py-10">Loading details...</div>
                    ) : (
                        <>
                            {/* Query and Image Section (if exists) */}
                            {hasQuery && (
                                <motion.div className="space-y-6" {...fadeInUp}>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Query Section */}
                                        <div className="bg-secondary/30 p-6 rounded-xl border-l-4 border-accent-purple shadow-sm flex-1">
                                            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
                                                Query
                                            </h2>
                                            {isAnalysisQuery ? (
                                                <div className="space-y-4 text-text-primary">
                                                    <div>
                                                        <span className="font-semibold">Target User:</span>
                                                        <p className="mt-1 text-text-secondary">{solution["query_analysis_result"]['Targeted User'] || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Usage Scenario:</span>
                                                        <p className="mt-1 text-text-secondary">{solution["query_analysis_result"]['Usage Scenario'] || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Requirements:</span>
                                                        <p className="mt-1 text-text-secondary">
                                                            {Array.isArray(solution["query_analysis_result"].Requirement)
                                                                ? solution["query_analysis_result"].Requirement.join(', ')
                                                                : solution["query_analysis_result"].Requirement || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : ( // hasStringQuery must be true here
                                                <p className="text-text-primary leading-relaxed">
                                                    {solution.query}
                                                </p>
                                            )}
                                        </div>
                                        
                                        {/* Image Section - only show if image exists */}
                                        {hasImage && (
                                            <div className="md:w-2/5 flex items-center justify-center">
                                                <div className="relative w-full h-64 md:h-64 rounded-lg overflow-hidden">
                                                    <Image
                                                        src={solution.solution.image_url}
                                                        alt={solution.solution.Title || "Solution image"}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, 40vw"
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}


                            {/* Render Technical Methods Section */}
                            {technicalMethodsSection}


                            {/* Use Case Section - Display as parsed structure with only 2 levels */}
                            {hasUseCase && (
                                 <motion.div className="mt-8 p-1" {...fadeInUp}> {/* Added mt-8 */}
                                     <h2 className="text-xl font-semibold text-text-primary 
                                        uppercase tracking-wider mb-4">
                                         Use Case
                                     </h2>
                                     <div className="space-y-4">
                                         {Object.entries(solution.solution["Use Case"]).map(([key, value]) => (
                                             <div key={key} className="mb-4">
                                                 <h3 className="text-lg font-semibold mb-2 text-text-primary">{key}</h3>
                                                 {typeof value === 'object' && value !== null ? (
                                                     <div className="pl-4 border-l-2 border-border-secondary">
                                                         {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                                                             <div key={subKey} className="mb-2">
                                                                 <h4 className="text-lg font-medium text-text-primary">{subKey}:</h4>
                                                                 <div className="text-lg text-text-secondary pl-4 mt-1">
                                                                     {Array.isArray(subValue) ? (
                                                                         <ul className="list-disc list-inside">
                                                                             {subValue.map((item, i) => (
                                                                                 <li key={i}>{item}</li>
                                                                             ))}
                                                                         </ul>
                                                                     ) : (
                                                                         <p>{String(subValue)}</p>
                                                                     )}
                                                                 </div>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 ) : (
                                                     <p className="text-lg text-text-secondary">{String(value)}</p>
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                 </motion.div>
                             )}
                        </>
                    )}
                </motion.div>
            </div>

            {/* Recommended Inspirations Section */}
            <div className="w-full justify-center mb-8 scale-95" style={{ maxWidth: '82rem' }}>
                <h2 className="text-2xl font-bold text-text-primary mb-4">You may interest</h2>
                <RecommendedInspirations currentSolution={solution} currentId={id as string} />
            </div>

            {/* Chat Button and Popup */}
            <motion.button
                className="fixed bottom-8 right-12 bg-accent-blue text-text-secondary p-3 rounded-full shadow-lg
                    hover:bg-blue-600 transition-colors duration-200 group"
                onClick={handleChatToggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                title="Chat with AI"
            >
                <FaComments className="text-2xl" />
            </motion.button>
            <ChatPopup
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onMinimize={handleChatMinimize}
                inspirationId={id as string}
                solution={solution}
            />
        </motion.div>
    );
};

export default Inspiration;
