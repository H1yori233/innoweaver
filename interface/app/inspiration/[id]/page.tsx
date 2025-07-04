"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchQuerySolution, fetchQueryLikedSolutions, fetchLikeSolution, fetchComplete, fetchSolutionLikeCount } from "@/lib/actions";
import { FaHeart, FaChevronDown, FaComments, FaTimes, FaMinusCircle, FaPaperPlane, FaArrowLeft, FaCamera } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from '@/lib/hooks/auth-store';
import { useToast } from "@/components/ui/toast";
import ChatPopup from "@/components/inspiration/ChatPopup";
import RecommendedInspirations from "@/components/inspiration/RecommendedInspirations";
import { logger } from '@/lib/logger';
import { getLargeEmojiForTitle } from '@/lib/emoji-utils';
import Image from 'next/image';

// Enhanced IterationSection with better visual design
const IterationSection = memo(({
    title,
    method,
    performance,
    userExperience,
    isExpanded,
    onToggle,
    index
}: any) => (
    <div className="mb-4 rounded-2xl shadow-lg border border-blue-500/20 overflow-hidden 
        transition-all duration-300 hover:shadow-xl hover:border-blue-500/40 bg-white/10 backdrop-blur-sm">
        <motion.button
            className="flex justify-between items-center w-full px-6 py-5 text-left 
                bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 
                transition-all duration-200"
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                    Method {index + 1}
                </h3>
            </div>
            <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-blue-500"
            >
                <FaChevronDown />
            </motion.div>
        </motion.button>
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="px-6 py-6 space-y-6 text-text-secondary bg-white/5 backdrop-blur-sm">
                        {method && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                                    <strong className="font-semibold text-text-primary">Method</strong>
                                </div>
                                <p className="leading-relaxed pl-3 text-text-secondary">{method}</p>
                            </div>
                        )}
                        {performance && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                                    <strong className="font-semibold text-text-primary">Performance</strong>
                                </div>
                                <p className="leading-relaxed pl-3 text-text-secondary">{performance}</p>
                            </div>
                        )}
                        {userExperience && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                                    <strong className="font-semibold text-text-primary">User Experience</strong>
                                </div>
                                <p className="leading-relaxed pl-3 text-text-secondary">{userExperience}</p>
                            </div>
                        )}
                        {!method && !performance && !userExperience && (
                            <p className="text-sm italic text-text-placeholder pl-3">Details not available.</p>
                        )}
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
        if (solution && !dataFetchedRef.current) return;

        try {
            setLoading(true);
            const result = await fetchQuerySolution(id);
            logger.log(result);
            if (!result) {
                throw new Error("No solution data returned");
            }

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

            setSolution(parsedResult);
            dataFetchedRef.current = true;
            setError(null);
        } catch (err) {
            console.error("Error fetching solution:", err);
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, 1000);
            } else {
                setError("Error loading solution data");
            }
        } finally {
            setLoading(false);
        }
    }, [id, retryCount, solution]);

    useEffect(() => {
        dataFetchedRef.current = false;
        fetchSolutionData();

        return () => {
            dataFetchedRef.current = false;
        };
    }, [id, fetchSolutionData]);

    return { solution, loading, error, refetch: fetchSolutionData };
};

async function fetchLikeCount(id: string): Promise<number> {
    try {
        const data = await fetchSolutionLikeCount(id);
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
    const [likeCount, setLikeCount] = useState<number>(0);

    // 初始化喜欢状态
    useEffect(() => {
        const initializeLikeStatus = async () => {
            if (!authStore.email) {
                console.log("No user email, skipping like status initialization");
                return;
            }

            try {
                console.log("Fetching like status for solution:", id);
                const likedStatuses = await fetchQueryLikedSolutions([id as string]);
                console.log("Like status response:", likedStatuses);

                if (likedStatuses && Array.isArray(likedStatuses)) {
                    const newLikedStates = likedStatuses.reduce((acc: any, { solution_id, isLiked }) => {
                        acc[solution_id] = isLiked;
                        return acc;
                    }, {});
                    const finalLikeStatus = newLikedStates[id as string] || false;
                    console.log("Setting initial like status to:", finalLikeStatus);
                    setIsLiked(finalLikeStatus);
                }
            } catch (error) {
                console.error("Failed to fetch liked status", error);
            }
        };
        initializeLikeStatus();
    }, [id, authStore.email]);

    useEffect(() => {
        if (id) {
            fetchLikeCount(id as string).then(setLikeCount);
        }
    }, [id]);

    
    // 初始化展开状态
    useEffect(() => {
        if (solution && !expandedSections.length) {
            const defaultExpanded = [
                "Original",
                ...(solution?.solution?.["Technical Method"]?.Iteration?.map((_: any, index: number) => `Iteration${index}`) || [])
            ];
            setExpandedSections(defaultExpanded);
        }
    }, [solution, expandedSections.length]);

    // 切换喜欢状态
    const handleLiked = useCallback(async () => {
        if (!authStore.email) {
            console.log("No user email, redirecting to login");
            router.push('/user/login');
            return;
        }

        const previousState = isLiked;
        const previousCount = likeCount;
        console.log("Toggling like status from", previousState, "to", !previousState);

        try {
            // 先更新UI状态
            setIsLiked(prev => !prev);
            // 更新点赞数量
            setLikeCount(prev => previousState ? prev - 1 : prev + 1);
            // 调用API
            const result = await fetchLikeSolution(id as string);
            console.log("Like API response:", result);
        } catch (error) {
            console.error("Failed to update like status", error);
            // 如果失败，恢复到之前的状态
            setIsLiked(previousState);
            setLikeCount(previousCount);
        }
    }, [id, authStore.email, router, isLiked, likeCount]);

    // 切换展开/收缩
    const toggleSection = useCallback((section: string) => {
        setExpandedSections((prevSections) =>
            prevSections.includes(section)
                ? prevSections.filter((s) => s !== section)
                : [...prevSections, section]
        );
    }, []);

    // 动画配置
    const fadeInUp = useMemo(() => ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    }), []);

    const handleChatToggle = () => {
        setIsChatOpen(prev => !prev);
        setIsChatMinimized(false);
    };

    const handleChatMinimize = () => {
        setIsChatMinimized(prev => !prev);
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleScreenshot = async () => {
        try {
            // 使用 html2canvas 生成截图
            const html2canvas = (await import('html2canvas')).default;
            const element = document.body;
            const canvas = await html2canvas(element, {
                height: window.innerHeight,
                width: window.innerWidth,
                useCORS: true,
                scale: 1,
            });

            // 创建下载链接
            const link = document.createElement('a');
            link.download = `${solution?.solution?.Title || 'inspiration'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('Screenshot failed:', error);
        }
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
                {originalMethod && (
                    <IterationSection
                        title="Original"
                        method={originalMethod}
                        performance={originalResults?.Performance}
                        userExperience={originalResults?.["User Experience"]}
                        isExpanded={expandedSections.includes("Original")}
                        onToggle={() => toggleSection("Original")}
                        index={0}
                    />
                )}
                {iterations.map((iteration: string, index: number) => {
                    const result = iterationResults[index];
                    const sectionId = `Iteration${index}`;
                    return (
                        <IterationSection
                            key={sectionId}
                            title={`Iteration ${index + 1}`}
                            method={iteration}
                            performance={result?.Performance}
                            userExperience={result?.["User Experience"]}
                            isExpanded={expandedSections.includes(sectionId)}
                            onToggle={() => toggleSection(sectionId)}
                            index={index + 1}
                        />
                    );
                })}
            </motion.div>
        );
    }, [solution, expandedSections, toggleSection, fadeInUp]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-secondary/30 to-primary">
                <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm shadow-xl border border-red-500/20">
                    <p className="text-text-secondary mb-6 text-lg">{error}</p>
                    <button
                        onClick={() => refetch()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl 
                            hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-xl"
                    >
                        Retry
                    </button>
                </div>
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
            className="min-h-screen bg-gradient-to-br from-primary via-secondary/30 to-primary relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-text-secondary">Loading inspiration...</p>
                        </div>
                    </div>
                ) : (
                    <motion.div className="space-y-12" {...fadeInUp}>
                        {/* Hero Section */}
                        <div className="space-y-8">
                            {/* Back Button */}
                            <motion.button
                                onClick={handleGoBack}
                                className="flex items-center gap-2 text-text-secondary hover:text-text-primary 
                                     transition-colors duration-200 group"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
                                <span className="font-medium">Back</span>
                            </motion.button>

                            {/* Title */}
                            <motion.h1
                                className="text-4xl md:text-5xl font-bold text-text-primary leading-tight text-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                {solution?.solution?.Title || "No Title"}
                            </motion.h1>

                            {/* Function Section with Action Buttons */}
                            {hasFunction && (
                                <motion.div
                                    className="w-full"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="flex flex-col lg:flex-row gap-6 w-full">
                                        <div className="flex-1">
                                            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 
                                                 rounded-2xl p-8 border border-blue-500/20 shadow-xl backdrop-blur-sm h-full">
                                                <p className="text-xl text-text-primary leading-relaxed font-medium">
                                                    {solution.solution.Function}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex lg:flex-col flex-row gap-3 lg:justify-start justify-center lg:w-auto w-full">
                                            <motion.button
                                                className="p-3 text-blue-500 hover:text-blue-400 transition-colors duration-200"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={handleScreenshot}
                                                title="Screenshot"
                                            >
                                                <FaCamera className="text-xl" />
                                            </motion.button>

                                            <div className="flex flex-col items-center gap-1">
                                                <motion.button
                                                    className={`p-3 transition-colors duration-200 ${isLiked
                                                            ? "text-red-500 hover:text-red-400"
                                                            : "text-text-secondary hover:text-red-500"
                                                        }`}
                                                    onClick={handleLiked}
                                                    disabled={loading}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    title={isLiked ? "Unlike" : "Like"}
                                                >
                                                    <FaHeart className="text-xl" />
                                                </motion.button>
                                                {likeCount > 0 && (
                                                    <span className="text-sm text-text-secondary font-medium">
                                                        {likeCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Query and Image Section */}
                        {hasQuery && (
                            <motion.div
                                className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {/* Query Section */}
                                <div className={`${hasImage ? 'lg:col-span-3' : 'lg:col-span-5'} space-y-6`}>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-purple-500/20">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
                                            <h2 className="text-2xl font-bold text-text-primary">Query</h2>
                                        </div>

                                        {isAnalysisQuery ? (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <h3 className="font-semibold text-lg text-text-primary flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                            Target User
                                                        </h3>
                                                        <p className="text-text-secondary leading-relaxed pl-4">
                                                            {solution["query_analysis_result"]['Targeted User'] || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h3 className="font-semibold text-lg text-text-primary flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                                            Usage Scenario
                                                        </h3>
                                                        <p className="text-text-secondary leading-relaxed pl-4">
                                                            {solution["query_analysis_result"]['Usage Scenario'] || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <h3 className="font-semibold text-lg text-text-primary flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        Requirements
                                                    </h3>
                                                    <p className="text-text-secondary leading-relaxed pl-4">
                                                        {Array.isArray(solution["query_analysis_result"].Requirement)
                                                            ? solution["query_analysis_result"].Requirement.join(', ')
                                                            : solution["query_analysis_result"].Requirement || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-text-primary leading-relaxed text-lg">
                                                {solution.query}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Image Section */}
                                {hasImage && (
                                    <div className="lg:col-span-2">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-blue-500/20 h-full">
                                            <div className="relative w-full h-80 rounded-xl overflow-hidden">
                                                <Image
                                                    src={solution.solution.image_url}
                                                    alt={solution.solution.Title || "Solution image"}
                                                    fill
                                                    sizes="(max-width: 1024px) 100vw, 40vw"
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Technical Methods Section */}
                        <motion.div
                            className="space-y-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-10 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                                <h2 className="text-3xl font-bold text-text-primary">Technical Methods</h2>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-xl border border-blue-500/20">
                                {technicalMethodsSection}
                            </div>
                        </motion.div>

                        {/* Use Case Section */}
                        {hasUseCase && (
                            <motion.div
                                className="space-y-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-10 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                                    <h2 className="text-3xl font-bold text-text-primary">Use Case</h2>
                                </div>

                                {typeof solution.solution["Use Case"] === 'string' ? (
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-green-500/20">
                                        <p className="text-lg text-text-secondary leading-relaxed">
                                            {solution.solution["Use Case"]}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        {Object.entries(solution.solution["Use Case"]).map(([key, value]) => (
                                            <div key={key} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-emerald-500/20">
                                                <h3 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-3">
                                                    <span className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></span>
                                                    {key}
                                                </h3>
                                                {typeof value === 'object' && value !== null ? (
                                                    <div className="space-y-5">
                                                        {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                                                            <div key={subKey} className="space-y-2">
                                                                <h4 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                                                    <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                                                                    {subKey}
                                                                </h4>
                                                                <div className="text-text-secondary pl-4">
                                                                    {Array.isArray(subValue) ? (
                                                                        <ul className="space-y-2">
                                                                            {subValue.map((item, i) => (
                                                                                <li key={i} className="flex items-start gap-2">
                                                                                    <span className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                                                                                    <span className="leading-relaxed">{item}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <p className="leading-relaxed">{String(subValue)}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-text-secondary leading-relaxed">{String(value)}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Recommended Inspirations Section */}
            <motion.div
                className="max-w-7xl mx-auto mb-4 scale-95"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-3 h-10 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full"></div>
                    <h2 className="text-3xl font-bold text-text-primary">You may interest</h2>
                </div>
                <RecommendedInspirations currentSolution={solution} currentId={id as string} />
            </motion.div>

            {/* Floating Chat Button */}
            <motion.button
                className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                     text-white p-4 rounded-2xl shadow-2xl transition-all duration-300 z-50
                     hover:scale-110 active:scale-95"
                onClick={handleChatToggle}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                title="Chat with AI"
            >
                <FaComments className="text-xl" />
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
