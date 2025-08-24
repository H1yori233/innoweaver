"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { fetchQuerySolution, fetchQueryLikedSolutions, fetchLikeSolution, fetchSolutionLikeCount } from "@/lib/actions";
import { FaHeart, FaChevronDown, FaComments, FaArrowLeft, FaCamera } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from '@/lib/hooks/auth-store';
import { logger } from '@/lib/logger';
import Image from 'next/image';

// --- Dynamic Imports for Non-Critical Components ---
const ChatPopup = dynamic(() => import('@/components/inspiration/ChatPopup'), {
    ssr: false
});

const RecommendedInspirations = dynamic(() => import('@/components/inspiration/RecommendedInspirations'), {
    loading: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl h-64 animate-pulse"></div>
            ))}
        </div>
    ),
    ssr: false,
});


// --- Reusable & Robust Components ---

// Section Error Boundary (Robustness)
interface SectionErrorBoundaryState {
    hasError: boolean;
}
interface SectionErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    sectionName?: string;
}
class SectionErrorBoundary extends React.Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
    constructor(props: SectionErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any): SectionErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        logger.error(`Error in ${this.props.sectionName || 'section'}:`, {
            error: error.message,
            stack: error.stack,
            errorInfo,
        });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                    <h3 className="text-sm font-medium text-red-800">
                        Unable to load {this.props.sectionName || 'this section'}.
                    </h3>
                </div>
            );
        }
        return this.props.children;
    }
}

const SafeComponent = ({ children, fallback = null, sectionName }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    sectionName?: string;
}) => (
    <SectionErrorBoundary sectionName={sectionName} fallback={fallback}>
        {children}
    </SectionErrorBoundary>
);

// Reusable Section Header (Redundancy Reduction)
const SectionHeader = memo(({ title, barGradient }: { title: string; barGradient: string; }) => (
    <div className="flex items-center gap-4">
        <div className={`w-3 h-10 ${barGradient} rounded-full`}></div>
        <h2 className="text-3xl font-bold text-text-primary">{title}</h2>
    </div>
));
SectionHeader.displayName = 'SectionHeader';


// --- Memoized Child Components (from original file, unchanged) ---
const IterationSection = memo(({ title, method, performance, userExperience, isExpanded, onToggle, index }: {
    title?: string;
    method?: string;
    performance?: string;
    userExperience?: string;
    isExpanded: boolean;
    onToggle: () => void;
    index: number;
}) => {
    const safeTitle = title || `Method ${index + 1}`;
    const hasContent = method || performance || userExperience;

    return (
        <SafeComponent sectionName={`method ${index + 1}`}>
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
                        <h3 className="text-lg font-semibold text-text-primary">{safeTitle}</h3>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-blue-500">
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
                                {!hasContent && (
                                    <p className="text-sm italic text-text-placeholder pl-3">Details not available.</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SafeComponent>
    );
});
IterationSection.displayName = 'IterationSection';

const FunctionSection = memo(({ func, isLiked, likeCount, onLike, onScreenshot }: {
    func: string;
    isLiked: boolean;
    likeCount: number;
    onLike: () => void;
    onScreenshot: () => void;
}) => (
    <SafeComponent sectionName="function section">
        <div className="flex flex-col lg:flex-row gap-6 w-full">
            <div className="flex-1">
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 
                     rounded-2xl p-8 border border-blue-500/20 shadow-xl backdrop-blur-sm h-full">
                    <p className="text-xl text-text-primary leading-relaxed font-medium">{func}</p>
                </div>
            </div>
            <div className="flex lg:flex-col flex-row gap-3 lg:justify-start justify-center lg:w-auto w-full">
                <motion.button
                    className="p-3 text-blue-500 hover:text-blue-400 transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onScreenshot}
                    title="Take Screenshot"
                >
                    <FaCamera className="text-xl" />
                </motion.button>
                <div className="flex flex-col items-center gap-1">
                    <motion.button
                        className={`p-3 transition-colors duration-200 ${isLiked
                            ? "text-red-500 hover:text-red-400"
                            : "text-text-secondary hover:text-red-500"
                            }`}
                        onClick={onLike}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={isLiked ? "Unlike" : "Like"}
                    >
                        <FaHeart className="text-xl" />
                    </motion.button>
                    {likeCount > 0 && (
                        <span className="text-sm text-text-secondary font-medium">{likeCount}</span>
                    )}
                </div>
            </div>
        </div>
    </SafeComponent>
));
FunctionSection.displayName = 'FunctionSection';

const QueryAnalysis = memo(({ analysis }: { analysis: any }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-3">
                <h3 className="font-semibold text-lg text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Target User
                </h3>
                <p className="text-text-secondary leading-relaxed pl-4">
                    {analysis?.['Targeted User'] || 'Not specified'}
                </p>
            </div>
            <div className="space-y-3">
                <h3 className="font-semibold text-lg text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Usage Scenario
                </h3>
                <p className="text-text-secondary leading-relaxed pl-4">
                    {analysis?.['Usage Scenario'] || 'Not specified'}
                </p>
            </div>
        </div>
        <div className="space-y-3">
            <h3 className="font-semibold text-lg text-text-primary flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Requirements
            </h3>
            <p className="text-text-secondary leading-relaxed pl-4">
                {Array.isArray(analysis?.Requirement)
                    ? analysis.Requirement.join(', ')
                    : analysis?.Requirement || 'Not specified'}
            </p>
        </div>
    </div>
));
QueryAnalysis.displayName = 'QueryAnalysis';

const QuerySection = memo(({ hasQueryAnalysis, analysis, query, imageUrl, title }: {
    hasQueryAnalysis: boolean;
    analysis?: any;
    query?: string;
    imageUrl?: string;
    title: string;
}) => (
    <SafeComponent sectionName="query section">
        <div className={`grid grid-cols-1 ${imageUrl ? 'lg:grid-cols-5' : 'lg:grid-cols-1'} gap-8`}>
            <div className={`${imageUrl ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-6`}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-text-primary">Query</h2>
                    </div>
                    {hasQueryAnalysis ? (
                        <QueryAnalysis analysis={analysis} />
                    ) : (
                        <p className="text-text-primary leading-relaxed text-lg">{query}</p>
                    )}
                </div>
            </div>
            {imageUrl && (
                <div className="lg:col-span-2">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-blue-500/20 h-full">
                        <div className="relative w-full h-80 rounded-xl overflow-hidden">
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 40vw"
                                className="object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    </SafeComponent>
));
QuerySection.displayName = 'QuerySection';

const UseCaseItem = memo(({ title, content }: { title: string; content: any }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-emerald-500/20">
        <h3 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-3">
            <span className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></span>
            {title}
        </h3>
        {typeof content === 'object' && content !== null ? (
            <div className="space-y-5">
                {Object.entries(content as Record<string, any>).map(([subKey, subValue]) => (
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
                                            <span className="leading-relaxed">{String(item)}</span>
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
            <p className="text-text-secondary leading-relaxed">{String(content)}</p>
        )}
    </div>
));
UseCaseItem.displayName = 'UseCaseItem';

// --- Custom Hooks (from original file, unchanged) ---
const useSolutionData = (id: string) => {
    const [solution, setSolution] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fetchAttempted = useRef(false);

    const fetchSolutionData = useCallback(async () => {
        if (!id || fetchAttempted.current) return;

        try {
            setLoading(true);
            setError(null);
            fetchAttempted.current = true;

            const result = await fetchQuerySolution(id);
            if (!result) throw new Error("No solution data returned");

            const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
            setSolution(parsedResult);
        } catch (err: any) {
            console.error("Error fetching solution:", err);
            setError(err.message || "Failed to load solution data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if(id) {
            fetchAttempted.current = false;
            fetchSolutionData();
        }
    }, [id, fetchSolutionData]);

    const refetch = useCallback(() => {
        fetchAttempted.current = false;
        fetchSolutionData();
    }, [fetchSolutionData]);

    return { solution, loading, error, refetch };
};

const useLikeStatus = (id: string, email: string) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        const initializeLikeStatus = async () => {
            if (!email || !id) return;
            try {
                const [likedStatuses, count] = await Promise.all([
                    fetchQueryLikedSolutions([id]),
                    fetchSolutionLikeCount(id)
                ]);

                if (Array.isArray(likedStatuses)) {
                    const likedStatus = likedStatuses.find(item => item.solution_id === id);
                    setIsLiked(likedStatus?.isLiked || false);
                }
                setLikeCount(count?.like_count ?? 0);
            } catch (error) {
                console.error("Failed to fetch like status:", error);
            }
        };
        initializeLikeStatus();
    }, [id, email]);

    return { isLiked, setIsLiked, likeCount, setLikeCount };
};

// --- Main Page Component ---
const Inspiration = () => {
    const { id } = useParams();
    const router = useRouter();
    const authStore = useAuthStore();
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const { solution, loading, error, refetch } = useSolutionData(id as string);
    const { isLiked, setIsLiked, likeCount, setLikeCount } = useLikeStatus(id as string, authStore.email);

    // Initialize expanded sections once solution data is available
    useEffect(() => {
        if (solution && expandedSections.length === 0) {
            try {
                const defaultExpanded = ["Original"];
                const iterations = solution?.solution?.["Technical Method"]?.Iteration;
                if (Array.isArray(iterations)) {
                    iterations.forEach((_, index) => defaultExpanded.push(`Iteration${index}`));
                }
                setExpandedSections(defaultExpanded);
            } catch (err) {
                logger.error("Error initializing expanded sections:", err);
                setExpandedSections(["Original"]);
            }
        }
    }, [solution, expandedSections.length]);

    const handleLiked = useCallback(async () => {
        if (!authStore.email) {
            router.push('/user/login');
            return;
        }

        const previousState = isLiked;
        const previousCount = likeCount;

        setIsLiked(!previousState);
        setLikeCount(prev => previousState ? Math.max(0, prev - 1) : prev + 1);

        try {
            await fetchLikeSolution(id as string);
        } catch (error) {
            logger.error("Failed to update like status:", error);
            setIsLiked(previousState);
            setLikeCount(previousCount);
        }
    }, [id, authStore.email, router, isLiked, likeCount, setIsLiked, setLikeCount]);

    const toggleSection = useCallback((section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    }, []);

    const handleScreenshot = useCallback(async () => {
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(document.body, { useCORS: true, scale: 1 });
            const link = document.createElement('a');
            link.download = `${solution?.solution?.Title || 'inspiration'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            logger.error('Screenshot failed:', error);
        }
    }, [solution?.solution?.Title]);

    const technicalMethodsSection = useMemo(() => {
        try {
            const techMethod = solution?.solution?.["Technical Method"];
            if (!techMethod) return null;

            const originalMethod = techMethod.Original;
            const originalResults = solution.solution["Possible Results"]?.Original;
            const iterations = techMethod.Iteration || [];
            const iterationResults = solution.solution["Possible Results"]?.Iteration || [];

            return (
                <div className="space-y-4">
                    {originalMethod && (
                        <IterationSection
                            title="Original Method"
                            method={originalMethod}
                            performance={originalResults?.Performance}
                            userExperience={originalResults?.["User Experience"]}
                            isExpanded={expandedSections.includes("Original")}
                            onToggle={() => toggleSection("Original")}
                            index={-1} // Special index for original
                        />
                    )}
                    {Array.isArray(iterations) && iterations.map((iteration: string, index: number) => {
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
                                index={index}
                            />
                        );
                    })}
                </div>
            );
        } catch (err) {
            logger.error("Error rendering technical methods:", err);
            return <p className="text-red-500">Could not display technical methods.</p>;
        }
    }, [solution, expandedSections, toggleSection]);
    
    // Memoized safe data accessors
    const { title, functionText, imageUrl, useCase, queryAnalysis, queryText } = useMemo(() => ({
        title: solution?.solution?.Title || "Untitled Inspiration",
        functionText: solution?.solution?.Function,
        imageUrl: solution?.solution?.image_url,
        useCase: solution?.solution?.["Use Case"],
        queryAnalysis: solution?.["query_analysis_result"],
        queryText: solution?.query
    }), [solution]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary via-secondary/30 to-primary">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading inspiration...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-secondary/30 to-primary">
                <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm shadow-xl border border-red-500/20">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Unable to Load Content</h2>
                    <p className="text-text-secondary mb-6">{error}</p>
                    <button
                        onClick={refetch}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-medium shadow-xl"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-primary via-secondary/30 to-primary relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    className="space-y-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="space-y-8">
                        <motion.button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-200 group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
                            <span className="font-medium">Back</span>
                        </motion.button>

                        <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight text-center">
                            {title}
                        </h1>

                        {functionText && (
                            <FunctionSection
                                func={functionText}
                                isLiked={isLiked}
                                likeCount={likeCount}
                                onLike={handleLiked}
                                onScreenshot={handleScreenshot}
                            />
                        )}
                    </div>

                    {/* Query Section */}
                    {(queryAnalysis || queryText) && (
                        <QuerySection
                            hasQueryAnalysis={!!queryAnalysis}
                            analysis={queryAnalysis}
                            query={queryText}
                            imageUrl={imageUrl}
                            title={title}
                        />
                    )}

                    {/* Technical Methods */}
                    {technicalMethodsSection && (
                        <SafeComponent sectionName="technical methods">
                            <div className="space-y-8">
                                <SectionHeader title="Technical Methods" barGradient="bg-gradient-to-b from-blue-500 to-purple-500" />
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-xl border border-blue-500/20">
                                    {technicalMethodsSection}
                                </div>
                            </div>
                        </SafeComponent>
                    )}

                    {/* Use Case */}
                    {useCase && (
                        <SafeComponent sectionName="use case section">
                            <div className="space-y-8">
                                <SectionHeader title="Use Case" barGradient="bg-gradient-to-b from-green-500 to-blue-500" />
                                {typeof useCase === 'string' ? (
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-green-500/20">
                                        <p className="text-lg text-text-secondary leading-relaxed">{useCase}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        {Object.entries(useCase).map(([key, value]) => (
                                            <UseCaseItem key={key} title={key} content={value} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </SafeComponent>
                    )}
                </motion.div>
            </div>

            {/* Recommendations */}
            <SafeComponent sectionName="recommendations">
                <motion.div
                    className="max-w-7xl mx-auto mb-4 scale-95"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="mb-8">
                        <SectionHeader title="You May Also Like" barGradient="bg-gradient-to-b from-orange-500 to-pink-500" />
                    </div>
                    <RecommendedInspirations currentSolution={solution} currentId={id as string} />
                </motion.div>
            </SafeComponent>

            {/* Chat UI */}
            <motion.button
                className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                     text-white p-4 rounded-2xl shadow-2xl transition-all duration-300 z-50 hover:scale-110 active:scale-95"
                onClick={() => setIsChatOpen(true)}
                title="Chat with AI"
            >
                <FaComments className="text-xl" />
            </motion.button>
            
            <SafeComponent sectionName="chat">
                 {isChatOpen && (
                    <ChatPopup
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                        onMinimize={() => { }}
                        inspirationId={id as string}
                        solution={solution}
                    />
                 )}
            </SafeComponent>
        </motion.div>
    );
};

export default Inspiration;
