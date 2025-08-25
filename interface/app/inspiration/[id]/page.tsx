"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { fetchQuerySolution, fetchQueryLikedSolutions, fetchLikeSolution, fetchSolutionLikeCount } from "@/lib/actions";
import { Heart, ChevronDown, MessageCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from '@/lib/hooks/auth-store';
import { logger } from '@/lib/logger';
import Image from 'next/image';

// Dynamic imports for performance
const ChatPopup = dynamic(() => import('@/components/inspiration/ChatPopup'), {
    ssr: false
});

const RecommendedInspirations = dynamic(() => import('@/components/inspiration/RecommendedInspirations'), {
    loading: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6 md:px-8 lg:px-12">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-surface-secondary rounded-2xl animate-pulse" />
            ))}
        </div>
    ),
    ssr: false,
});

// Error boundary for robust section handling
interface SectionErrorBoundaryState {
    hasError: boolean;
}

class SectionErrorBoundary extends React.Component<{
    children: React.ReactNode;
    fallback?: React.ReactNode;
    sectionName?: string;
}, SectionErrorBoundaryState> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): SectionErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        logger.error(`Error in ${this.props.sectionName || 'section'}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-6 bg-surface-secondary border border-border-subtle rounded-2xl">
                    <p className="text-sm text-text-tertiary">
                        Unable to load {this.props.sectionName || 'this section'}.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}

// Clean, minimal section header
const SectionHeader = memo(({ title, accent = 'clay' }: {
    title: string;
    accent?: 'clay' | 'sage' | 'rust' | 'storm';
}) => {
    const accentColors = {
        clay: 'bg-organic-clay',
        sage: 'bg-organic-sage',
        rust: 'bg-organic-rust',
        storm: 'bg-organic-storm'
    };

    return (
        <div className="flex items-center gap-4 mb-8">
            <div className={`w-1 h-8 ${accentColors[accent]} rounded-full`} />
            <h2 className="heading-secondary text-text-primary">{title}</h2>
        </div>
    );
});
SectionHeader.displayName = 'SectionHeader';

// Reimagined method section with organic design
const MethodSection = memo(({
    title,
    method,
    performance,
    userExperience,
    isExpanded,
    onToggle,
    index
}: {
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
        <SectionErrorBoundary sectionName={`method ${index + 1}`}>
            <div className="border border-border-subtle rounded-2xl overflow-hidden 
                          bg-surface-elevated hover:border-border-default
                          transition-all duration-300">
                <button
                    className="flex justify-between items-center w-full px-6 py-5 text-left
                             hover:bg-surface-secondary transition-colors duration-200"
                    onClick={onToggle}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-text-inverse ${index === 0 ? 'bg-accent-primary' : 'bg-organic-sage'
                            }`}>
                            {index + 1}
                        </div>
                        <h3 className="font-medium text-text-primary">{safeTitle}</h3>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-text-tertiary"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 py-6 space-y-6 bg-surface-secondary/30">
                                {method && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-0.5 h-4 bg-accent-primary rounded-full" />
                                            <span className="font-medium text-text-primary text-sm">Method</span>
                                        </div>
                                        <p className="body-regular text-text-secondary pl-3">{method}</p>
                                    </div>
                                )}
                                {performance && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-0.5 h-4 bg-organic-sage rounded-full" />
                                            <span className="font-medium text-text-primary text-sm">Performance</span>
                                        </div>
                                        <p className="body-regular text-text-secondary pl-3">{performance}</p>
                                    </div>
                                )}
                                {userExperience && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-0.5 h-4 bg-organic-rust rounded-full" />
                                            <span className="font-medium text-text-primary text-sm">User Experience</span>
                                        </div>
                                        <p className="body-regular text-text-secondary pl-3">{userExperience}</p>
                                    </div>
                                )}
                                {!hasContent && (
                                    <p className="body-small text-text-placeholder pl-3">Details not available.</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SectionErrorBoundary>
    );
});
MethodSection.displayName = 'MethodSection';

// Hero function section with organic design
const FunctionHero = memo(({
    title,
    func,
    isLiked,
    likeCount,
    onLike
}: {
    title: string;
    func: string;
    isLiked: boolean;
    likeCount: number;
    onLike: () => void;
}) => (
    <SectionErrorBoundary sectionName="function hero">
        <div className="space-y-8">
            {/* Title */}
            <div className="text-center">
                <h1 className="heading-display text-text-primary mb-6 text-balance max-w-4xl mx-auto">
                    {title}
                </h1>
            </div>

            {/* Function description with like action */}
            <div className="relative">
                <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-8 md:p-12">
                    <p className="body-large text-text-primary leading-relaxed text-center max-w-4xl mx-auto">
                        {func}
                    </p>
                </div>

                {/* Like button - floating on the right */}
                <div className="absolute top-6 right-6">
                    <div className="flex flex-col items-center gap-1">
                        <button
                            className={`p-3 rounded-xl transition-all duration-200 ${isLiked
                                    ? "text-error hover:text-error/80 hover:bg-surface-secondary"
                                    : "text-text-tertiary hover:text-error hover:bg-surface-secondary"
                                }`}
                            onClick={onLike}
                            title={isLiked ? "Unlike" : "Like"}
                        >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                        {likeCount > 0 && (
                            <span className="body-small text-text-tertiary">{likeCount}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </SectionErrorBoundary>
));
FunctionHero.displayName = 'FunctionHero';

// Query analysis with clean layout
const QueryAnalysis = memo(({ analysis }: { analysis: any }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
            <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-organic-clay rounded-full" />
                Target User
            </h3>
            <p className="body-regular text-text-secondary">
                {analysis?.['Targeted User'] || 'Not specified'}
            </p>
        </div>
        <div>
            <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-organic-sage rounded-full" />
                Usage Scenario
            </h3>
            <p className="body-regular text-text-secondary">
                {analysis?.['Usage Scenario'] || 'Not specified'}
            </p>
        </div>
        <div>
            <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-organic-rust rounded-full" />
                Requirements
            </h3>
            <p className="body-regular text-text-secondary">
                {Array.isArray(analysis?.Requirement)
                    ? analysis.Requirement.join(', ')
                    : analysis?.Requirement || 'Not specified'}
            </p>
        </div>
    </div>
));
QueryAnalysis.displayName = 'QueryAnalysis';

// Query section with image support
const QuerySection = memo(({
    hasQueryAnalysis,
    analysis,
    query,
    imageUrl,
    title
}: {
    hasQueryAnalysis: boolean;
    analysis?: any;
    query?: string;
    imageUrl?: string;
    title: string;
}) => (
    <SectionErrorBoundary sectionName="query section">
        <div className="space-y-8">
            <SectionHeader title="Research Query" accent="sage" />

            <div className={`grid ${imageUrl ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-8`}>
                <div className={`${imageUrl ? 'lg:col-span-2' : ''}`}>
                    <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-8">
                        {hasQueryAnalysis ? (
                            <QueryAnalysis analysis={analysis} />
                        ) : (
                            <p className="body-large text-text-primary">{query}</p>
                        )}
                    </div>
                </div>

                {imageUrl && (
                    <div>
                        <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-6">
                            <div className="relative w-full h-64 rounded-xl overflow-hidden">
                                <Image
                                    src={imageUrl}
                                    alt={title}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 33vw"
                                    className="object-contain"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </SectionErrorBoundary>
));
QuerySection.displayName = 'QuerySection';

// Use case item with clean structure
const UseCaseItem = memo(({ title, content }: { title: string; content: any }) => (
    <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-8">
        <h3 className="font-medium text-text-primary mb-6 flex items-center gap-3">
            <div className="w-1 h-6 bg-organic-moss rounded-full" />
            {title}
        </h3>
        {typeof content === 'object' && content !== null ? (
            <div className="space-y-6">
                {Object.entries(content as Record<string, any>).map(([subKey, subValue]) => (
                    <div key={subKey} className="space-y-3">
                        <h4 className="font-medium text-text-primary text-sm flex items-center gap-2">
                            <div className="w-0.5 h-4 bg-accent-secondary rounded-full" />
                            {subKey}
                        </h4>
                        <div className="text-text-secondary pl-3">
                            {Array.isArray(subValue) ? (
                                <ul className="space-y-2">
                                    {subValue.map((item, i) => (
                                        <li key={i} className="body-regular flex items-start gap-3">
                                            <div className="w-1 h-1 bg-text-tertiary rounded-full mt-2 flex-shrink-0" />
                                            <span>{String(item)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="body-regular">{String(subValue)}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="body-regular text-text-secondary">{String(content)}</p>
        )}
    </div>
));
UseCaseItem.displayName = 'UseCaseItem';

// Custom hooks remain the same
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
        if (id) {
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

// Main component
const Inspiration = () => {
    const { id } = useParams();
    const router = useRouter();
    const authStore = useAuthStore();
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const { solution, loading, error, refetch } = useSolutionData(id as string);
    const { isLiked, setIsLiked, likeCount, setLikeCount } = useLikeStatus(id as string, authStore.email);

    // Initialize expanded sections
    useEffect(() => {
        if (solution && expandedSections.length === 0) {
            try {
                const techMethod = solution?.solution?.["Technical Method"];
                const defaultExpanded = [];

                if (techMethod?.Original) {
                    defaultExpanded.push("Method1");
                }

                const iterations = techMethod?.Iteration;
                if (Array.isArray(iterations)) {
                    iterations.forEach((_, index) => {
                        defaultExpanded.push(`Method${index + 2}`); // Method2, Method3, etc.
                    });
                }

                setExpandedSections(defaultExpanded.length > 0 ? defaultExpanded : ["Method1"]);
            } catch (err) {
                logger.error("Error initializing expanded sections:", err);
                setExpandedSections(["Method1"]);
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

    const technicalMethodsSection = useMemo(() => {
        try {
            const techMethod = solution?.solution?.["Technical Method"];
            if (!techMethod) return null;

            const originalMethod = techMethod.Original;
            const originalResults = solution.solution["Possible Results"]?.Original;
            const iterations = techMethod.Iteration || [];
            const iterationResults = solution.solution["Possible Results"]?.Iteration || [];

            const allMethods = [];
            let methodIndex = 1;

            // Add original method as Method 1
            if (originalMethod) {
                allMethods.push({
                    id: `Method${methodIndex}`,
                    title: `Method ${methodIndex}`,
                    method: originalMethod,
                    performance: originalResults?.Performance,
                    userExperience: originalResults?.["User Experience"],
                    index: methodIndex - 1
                });
                methodIndex++;
            }

            // Add iterations as Method 2, 3, etc.
            if (Array.isArray(iterations)) {
                iterations.forEach((iteration: string, index: number) => {
                    const result = iterationResults[index];
                    allMethods.push({
                        id: `Method${methodIndex}`,
                        title: `Method ${methodIndex}`,
                        method: iteration,
                        performance: result?.Performance,
                        userExperience: result?.["User Experience"],
                        index: methodIndex - 1
                    });
                    methodIndex++;
                });
            }

            return (
                <div className="space-y-4">
                    {allMethods.map((methodData) => (
                        <MethodSection
                            key={methodData.id}
                            title={methodData.title}
                            method={methodData.method}
                            performance={methodData.performance}
                            userExperience={methodData.userExperience}
                            isExpanded={expandedSections.includes(methodData.id)}
                            onToggle={() => toggleSection(methodData.id)}
                            index={methodData.index}
                        />
                    ))}
                </div>
            );
        } catch (err) {
            logger.error("Error rendering technical methods:", err);
            return <p className="text-error">Could not display technical methods.</p>;
        }
    }, [solution, expandedSections, toggleSection]);

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
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 mx-auto">
                        <svg className="animate-spin w-full h-full text-accent-primary" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor"
                                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                    <p className="body-regular text-text-secondary">Loading inspiration...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
                <div className="text-center p-8 rounded-2xl bg-surface-elevated border border-border-subtle max-w-md">
                    <h2 className="heading-secondary text-text-primary mb-4">Unable to Load Content</h2>
                    <p className="body-regular text-text-secondary mb-6">{error}</p>
                    <button
                        onClick={refetch}
                        className="btn-primary"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-canvas">
            <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-8 space-y-16">

                {/* Back navigation */}
                <motion.button
                    onClick={() => router.push('/gallery')}
                    className="flex items-center gap-3 text-text-secondary hover:text-text-primary 
                             transition-colors duration-200 group -mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span className="font-medium">Back to Gallery</span>
                </motion.button>

                {/* Hero section */}
                {functionText && (
                    <FunctionHero
                        title={title}
                        func={functionText}
                        isLiked={isLiked}
                        likeCount={likeCount}
                        onLike={handleLiked}
                    />
                )}

                {/* Query section */}
                {(queryAnalysis || queryText) && (
                    <QuerySection
                        hasQueryAnalysis={!!queryAnalysis}
                        analysis={queryAnalysis}
                        query={queryText}
                        imageUrl={imageUrl}
                        title={title}
                    />
                )}

                {/* Technical methods */}
                {technicalMethodsSection && (
                    <SectionErrorBoundary sectionName="technical methods">
                        <div className="space-y-8">
                            <SectionHeader title="Technical Methods" accent="rust" />
                            <div className="space-y-4">
                                {technicalMethodsSection}
                            </div>
                        </div>
                    </SectionErrorBoundary>
                )}

                {/* Use cases */}
                {useCase && (
                    <SectionErrorBoundary sectionName="use case section">
                        <div className="space-y-8">
                            <SectionHeader title="Use Cases" accent="storm" />
                            {typeof useCase === 'string' ? (
                                <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-8">
                                    <p className="body-large text-text-secondary">{useCase}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {Object.entries(useCase).map(([key, value]) => (
                                        <UseCaseItem key={key} title={key} content={value} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </SectionErrorBoundary>
                )}
            </div>

            {/* Recommendations */}
            <SectionErrorBoundary sectionName="recommendations">
                <div className="bg-surface-secondary/30 py-16">
                    <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
                        <div className="mb-12">
                            <SectionHeader title="Related Solutions" accent="clay" />
                        </div>
                        <RecommendedInspirations currentSolution={solution} currentId={id as string} />
                    </div>
                </div>
            </SectionErrorBoundary>

            {/* Chat button */}
            <button
                className="fixed bottom-8 right-8 bg-accent-primary hover:bg-accent-primary/90 
                         text-text-inverse p-4 rounded-2xl shadow-lg 
                         hover:shadow-xl transition-all duration-200 z-50"
                onClick={() => setIsChatOpen(true)}
                title="Chat about this solution"
            >
                <MessageCircle className="w-5 h-5" />
            </button>

            <SectionErrorBoundary sectionName="chat">
                {isChatOpen && (
                    <ChatPopup
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                        onMinimize={() => { }}
                        inspirationId={id as string}
                        solution={solution}
                    />
                )}
            </SectionErrorBoundary>
        </div>
    );
};

export default Inspiration;
