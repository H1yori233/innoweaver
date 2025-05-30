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

const RecommendedInspirations = ({ currentSolution, currentId }: RecommendedInspirationsProps) => {
    const router = useRouter();
    const authStore = useAuthStore();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [likedSolutions, setLikedSolutions] = useState<{ [key: string]: boolean }>({});
    const [loading, setLoading] = useState(true);

    const client = useMemo(() => new MeiliSearch({
        host: '120.55.193.195:7700/'
    }), []);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!currentSolution?.solution) return;

            try {
                setLoading(true);
                const searchQuery = `${currentSolution.solution.Title} ${currentSolution.solution.Function}`;
                logger.log('Fetching recommendations with query:', searchQuery);

                const index = client.index('solution_id');
                const searchResults = await index.search(searchQuery, {
                    limit: 16
                });

                logger.log('Search results:', searchResults);

                if (searchResults.hits.length > 0) {
                    const filteredResults = searchResults.hits
                        .filter(hit => hit._id !== currentId)
                        .slice(0, 20);

                    const modifiedResults = filteredResults.map((hit) => ({
                        ...hit,
                        id: hit._id,
                        _id: undefined,
                    }));

                    logger.log('Modified results:', modifiedResults);
                    setRecommendations(modifiedResults);

                    // 获取点赞状态
                    if (authStore.email && modifiedResults.length > 0) {
                        const likedStatuses = await fetchQueryLikedSolutions(
                            modifiedResults.map(solution => solution.id)
                        );
                        const newLikedStates = likedStatuses.reduce((acc, { solution_id, isLiked }) => {
                            acc[solution_id] = isLiked;
                            return acc;
                        }, {});
                        setLikedSolutions(newLikedStates);
                    }
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentSolution?.solution) {
            logger.log('Current solution:', currentSolution);
            fetchRecommendations();
        }
    }, [currentSolution, currentId, client, authStore.email]);

    const handleLiked = async (solutionId: string) => {
        if (!authStore.email) {
            router.push('/user/login');
            return;
        }

        try {
            setLikedSolutions(prev => ({
                ...prev,
                [solutionId]: !prev[solutionId]
            }));
            await fetchLikeSolution(solutionId);
        } catch (error) {
            console.error("Failed to update like status", error);
            setLikedSolutions(prev => ({
                ...prev,
                [solutionId]: !prev[solutionId]
            }));
        }
    };

    if (loading) {
        return (
            <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-secondary/20 rounded-xl shadow-sm overflow-hidden h-64 animate-pulse">
                            <div className="h-full bg-gradient-to-b from-gray-300/30 to-gray-400/20 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!currentSolution?.solution) {
        logger.log('No current solution data');
        return null;
    }

    if (recommendations.length === 0) {
        logger.log('No recommendations found');
        return null;
    }

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 
                lg:grid-cols-3 
                xl:grid-cols-4 
                2xl:grid-cols-5 gap-4">
                {recommendations.map((solution, index) => (
                    <MiniCard
                        key={solution.id}
                        content={solution}
                        index={index}
                        isLiked={likedSolutions[solution.id] || false}
                    />
                ))}
            </div>
        </motion.div>
    );
};

export default RecommendedInspirations; 