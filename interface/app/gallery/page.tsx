"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MeiliSearch } from 'meilisearch';
import { fetchQueryLikedSolutions } from '@/lib/actions';
import useAuthStore from '@/lib/hooks/auth-store';
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MasonryGallery from '@/components/inspiration/MasonryGallery';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';
import { URLQueryManager, QueryParams } from '@/lib/hooks/url-query';

const Gallery = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const authStore = useAuthStore();
    const { toast } = useToast();

    // Use URL query manager
    const urlManager = useMemo(() => new URLQueryManager(router, '/gallery'), [router]);
    const currentParams = useMemo(() => URLQueryManager.parseSearchParams(searchParams), [searchParams]);
    
    const { page: pageNumber, query } = currentParams;
    const [queryState, setQuery] = useState(query);

    const [loading, setLoading] = useState(true);
    const [solutions, setSolutions] = useState([]);
    const [likedSolutions, setLikedSolutions] = useState({});
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(0);

    const apiUrl = '120.55.193.195:7700/';
    const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);

    const fetchSolutionCount = useCallback(async (searchQuery = '') => {
        try {
            const index = client.index('solution_id');
            const searchResults = await index.search(searchQuery, {
                limit: 0,
            });
            logger.log(searchResults.estimatedTotalHits);
            return searchResults.estimatedTotalHits;
        } catch (error) {
            setError('Error fetching solution count');
            return 0;
        }
    }, [client]);

    const fetchSolutions = useCallback(async (searchQuery = '', pageNumber = 1) => {
        setLoading(true);
        try {
            const totalCount = await fetchSolutionCount(searchQuery) - 1;
            setTotalPages(Math.ceil(totalCount / 20));

            const index = client.index('solution_id');
            const searchResults = await index.search(searchQuery, {
                limit: 20,
                offset: Math.min((pageNumber - 1) * 20, totalCount - 1),
                sort: ['timestamp:desc'],
            });

            if (searchResults.hits.length > 0) {
                const modifiedResults = searchResults.hits.map((hit) => ({
                    ...hit,
                    id: hit._id,
                    _id: undefined,
                }));

                setSolutions((prevSolutions) =>
                    pageNumber === 1 ? modifiedResults : [...prevSolutions, ...modifiedResults]
                );

                if (authStore.email) {
                    try {
                        const likedStatuses = await fetchQueryLikedSolutions(modifiedResults.map(solution => solution.id));
                        const newLikedStates = likedStatuses.reduce((acc, { solution_id, isLiked }) => {
                            acc[solution_id] = isLiked;
                            return acc;
                        }, {});
                        setLikedSolutions(prevLiked => ({
                            ...prevLiked,
                            ...newLikedStates,
                        }));
                    } catch (likeError) {
                        console.error('Failed to fetch like status:', likeError);
                        const defaultLikedStates = modifiedResults.reduce((acc, solution) => {
                            acc[solution.id] = false;
                            return acc;
                        }, {});
                        setLikedSolutions(defaultLikedStates);
                    }
                } else {
                    const defaultLikedStates = modifiedResults.reduce((acc, solution) => {
                        acc[solution.id] = false;
                        return acc;
                    }, {});
                    setLikedSolutions(defaultLikedStates);
                }

                setHasMore(true);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            setError('Error fetching solutions');
            toast({
                title: "Error",
                description: "Failed to load solutions. Please try again later.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    }, [client, fetchSolutionCount, authStore.email, toast]);

    // Sync URL parameter changes to local state
    useEffect(() => {
        setQuery(query);
    }, [query]);

    // Re-fetch data when URL parameters change
    useEffect(() => {
        setSolutions([]);
        setLikedSolutions({});
        setHasMore(true);
        setLoading(true);
        fetchSolutions(query, pageNumber);
    }, [query, pageNumber, fetchSolutions]);

    const handleSearch = (e) => {
        e.preventDefault();
        urlManager.updateSingleParam('query', queryState.trim(), currentParams);
    };

    const handlePageChange = (newPage) => {
        if (newPage <= totalPages && newPage > 0) {
            urlManager.updateQuery({ ...currentParams, page: newPage });
        }
    };

    const handlePageInputChange = (e) => {
        const newPage = parseInt(e.target.value, 10);
        if (!isNaN(newPage)) {
            const validPage = Math.max(1, Math.min(newPage, totalPages));
            urlManager.updateQuery({ ...currentParams, page: validPage });
        }
    };

    const renderPagination = () => {
        const pagesToShow = [];
        const range = window.innerWidth < 768 ? 1 : 2; // Smaller range on mobile
        let startPage = Math.max(1, pageNumber - range);
        let endPage = Math.min(totalPages, pageNumber + range);

        if (startPage > 1) {
            pagesToShow.push(1);
            if (startPage > 2) pagesToShow.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pagesToShow.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pagesToShow.push('...');
            pagesToShow.push(totalPages);
        }

        return pagesToShow.map((page, index) => (
            <React.Fragment key={index}>
                {page === '...' ? (
                    <span className="px-2 py-2 text-gray-500 dark:text-gray-400 text-sm">...</span>
                ) : (
                    <button
                        onClick={() => handlePageChange(page)}
                        className={`px-2 md:px-3 py-2 rounded-md transition-colors duration-200 text-sm md:text-base touch-target ${
                            page === pageNumber
                                ? 'bg-blue-500 text-white'
                                : 'bg-primary text-text-secondary hover:bg-secondary'
                        }`}
                    >
                        {page}
                    </button>
                )}
            </React.Fragment>
        ));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-screen overflow-y-auto bg-primary text-text-primary transition-colors duration-300">
            <div className="flex justify-center mt-4 mobile-padding pt-16 md:pt-4">
                <header className="text-center w-full">
                    <form onSubmit={handleSearch} className="flex justify-center">
                        <div className="relative w-full max-w-3xl">
                            <span className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-text-placeholder">
                                <FaSearch className="text-sm md:text-base" />
                            </span>
                            <input
                                type="text"
                                value={queryState}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search Inspirations"
                                className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-base md:text-lg border border-secondary rounded-lg bg-primary text-text-primary outline-none shadow 
                                focus:ring focus:ring-secondary focus:border-neutral-500 focus:bg-secondary transition-all duration-300"
                            />
                        </div>
                    </form>
                </header>
            </div>

            {loading && pageNumber === 1 ? (
                <MasonryGallery solutions={[]} likedSolutions={{}} />
            ) : error ? (
                <div className="text-center mt-12 md:mt-24 text-red-500 mobile-padding">
                    {error}
                </div>
            ) : (
                <div>
                    <MasonryGallery solutions={solutions} likedSolutions={likedSolutions} />
                    {loading && pageNumber > 1 && (
                        <MasonryGallery solutions={[]} likedSolutions={{}} />
                    )}

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-center items-center mt-2 mb-6 space-y-2 sm:space-y-0 sm:space-x-2 mobile-padding">
                        <button
                            onClick={() => handlePageChange(pageNumber - 1)}
                            disabled={pageNumber === 1}
                            className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-md bg-primary text-text-primary 
                                disabled:opacity-50 hover:bg-secondary touch-target
                                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm md:text-base"
                        >
                            <FaChevronLeft className="inline mr-1 md:mr-2" />
                            Previous
                        </button>
                        
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                            {renderPagination()}
                        </div>

                        <button
                            onClick={() => handlePageChange(pageNumber + 1)}
                            disabled={pageNumber === totalPages}
                            className="w-full sm:w-auto px-3 md:px-4 py-2 rounded-md bg-primary text-text-primary 
                                disabled:opacity-50 hover:bg-secondary touch-target
                                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm md:text-base"
                        >
                            Next
                            <FaChevronRight className="inline ml-1 md:ml-2" />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const GalleryPage = () => (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen mobile-padding">
            <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-text-link border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-text-secondary mobile-text">Loading gallery...</p>
            </div>
        </div>
    }>
        <Gallery />
    </Suspense>
);

export default GalleryPage;
