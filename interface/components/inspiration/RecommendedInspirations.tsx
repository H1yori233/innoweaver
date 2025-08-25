"use client";

import { useState, useEffect, useMemo } from 'react';
import { MeiliSearch } from 'meilisearch';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import useAuthStore from '@/lib/hooks/auth-store';
import { fetchQueryLikedSolutions, fetchLikeSolution } from '@/lib/actions';
import MiniCard from '@/components/inspiration/MiniCard';
import { logger } from '@/lib/logger';

interface RecommendedInspirationsProps {
    currentSolution: any;
    currentId: string;
}

// Organic skeleton card that matches our design system
const SkeletonCard = ({ index }: { index: number }) => {
    const variants = [
        'from-organic-clay/8 to-organic-sand/4',
        'from-organic-sage/8 to-organic-moss/4',
        'from-organic-storm/8 to-stone/4',
        'from-surface-secondary to-surface-tertiary',
    ];

    const variant = variants[index % variants.length];

    return (
        <div className={`relative w-64 h-96 bg-gradient-to-br ${variant} overflow-hidden rounded-2xl`}
            style={{ borderRadius: '20px' }}>

            {/* Subtle shimmer */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface-elevated/10 to-transparent" />

            {/* Content skeleton */}
            <div className="flex flex-col justify-center p-6 h-full space-y-4">
                {/* Title lines */}
                <div className="space-y-3">
                    <div className="h-4 bg-surface-elevated/20 rounded-lg w-4/5 animate-pulse"
                        style={{ animationDelay: `${index * 0.1}s` }} />
                    <div className="h-4 bg-surface-elevated/20 rounded-lg w-3/5 animate-pulse"
                        style={{ animationDelay: `${index * 0.1 + 0.2}s` }} />
                </div>

                {/* Description lines */}
                <div className="space-y-2 opacity-60">
                    <div className="h-3 bg-surface-elevated/15 rounded w-5/6 animate-pulse"
                        style={{ animationDelay: `${index * 0.1 + 0.4}s` }} />
                    <div className="h-3 bg-surface-elevated/15 rounded w-4/6 animate-pulse"
                        style={{ animationDelay: `${index * 0.1 + 0.6}s` }} />
                </div>

                {/* Heritage accent line */}
                <div className="absolute bottom-6 left-6 w-6 h-0.5 bg-surface-elevated/15 rounded-full animate-pulse"
                    style={{ animationDelay: `${index * 0.1 + 0.8}s` }} />
            </div>

            {/* Like button skeleton */}
            <div className="absolute top-3 right-3 w-12 h-12 bg-surface-elevated/15 rounded-full animate-pulse"
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }} />
        </div>
    );
};

// Loading state with proper spacing
const LoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-center">
                <SkeletonCard index={i} />
            </div>
        ))}
    </div>
);

// Empty state with organic design
const EmptyState = () => (
    <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 text-organic-sage/30">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 17H9.154a3.374 3.374 0 00-1.145-.553L7.46 16z" />
            </svg>
        </div>
        <h3 className="heading-secondary text-text-primary mb-3">No related solutions found</h3>
        <p className="body-regular text-text-secondary">
            We couldn't find similar solutions at the moment.
        </p>
    </div>
);

const RecommendedInspirations = ({ currentSolution, currentId }: RecommendedInspirationsProps) => {
    const router = useRouter();
    const authStore = useAuthStore();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [likedSolutions, setLikedSolutions] = useState<{ [key: string]: boolean }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const client = useMemo(() => new MeiliSearch({
        host: '120.55.193.195:7700/'
    }), []);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!currentSolution?.solution) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Create more targeted search query
                const title = currentSolution.solution.Title || '';
                const func = currentSolution.solution.Function || '';
                const searchQuery = `${title} ${func}`.trim();

                logger.log('Fetching recommendations with query:', searchQuery);

                const index = client.index('solution_id');
                const searchResults = await index.search(searchQuery, {
                    limit: 12, // Reduced for better quality
                });

                logger.log('Search results:', searchResults);

                if (searchResults.hits.length > 0) {
                    // Take only the most relevant results, excluding current solution
                    const filteredResults = searchResults.hits
                        .filter(hit => hit._id !== currentId)
                        .slice(0, 8); // Max 8 recommendations for cleaner layout

                    const modifiedResults = filteredResults.map((hit) => ({
                        ...hit,
                        id: hit._id,
                        _id: undefined,
                    }));

                    logger.log('Modified results:', modifiedResults);
                    setRecommendations(modifiedResults);

                    // Fetch like statuses
                    if (authStore.email && modifiedResults.length > 0) {
                        try {
                            const likedStatuses = await fetchQueryLikedSolutions(
                                modifiedResults.map(solution => solution.id)
                            );
                            const newLikedStates = likedStatuses.reduce((acc, { solution_id, isLiked }) => {
                                acc[solution_id] = isLiked;
                                return acc;
                            }, {} as { [key: string]: boolean });
                            setLikedSolutions(newLikedStates);
                        } catch (likeError) {
                            console.error('Failed to fetch like statuses:', likeError);
                            // Set default like states
                            const defaultLikedStates = modifiedResults.reduce((acc, solution) => {
                                acc[solution.id] = false;
                                return acc;
                            }, {} as { [key: string]: boolean });
                            setLikedSolutions(defaultLikedStates);
                        }
                    }
                } else {
                    setRecommendations([]);
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error);
                setError('Unable to load recommendations');
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [currentSolution, currentId, client, authStore.email]);

    const handleLiked = async (solutionId: string) => {
        if (!authStore.email) {
            router.push('/user/login');
            return;
        }

        // Optimistic update
        const previousState = likedSolutions[solutionId] || false;
        setLikedSolutions(prev => ({
            ...prev,
            [solutionId]: !previousState
        }));

        try {
            await fetchLikeSolution(solutionId);
        } catch (error) {
            console.error("Failed to update like status", error);
            // Revert on error
            setLikedSolutions(prev => ({
                ...prev,
                [solutionId]: previousState
            }));
        }
    };

    // Loading state
    if (loading) {
        return <LoadingState />;
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-6 text-error/60">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="heading-secondary text-text-primary mb-3">Unable to load recommendations</h3>
                <p className="body-regular text-text-secondary">{error}</p>
            </div>
        );
    }

    // No current solution
    if (!currentSolution?.solution) {
        return null;
    }

    // No recommendations found
    if (recommendations.length === 0) {
        return <EmptyState />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full"
        >
            {/* Grid with proper spacing and max 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendations.map((solution, index) => (
                    <motion.div
                        key={solution.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex justify-center"
                    >
                        <MiniCard
                            content={solution}
                            index={index}
                            isLiked={likedSolutions[solution.id] || false}
                        />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default RecommendedInspirations;
