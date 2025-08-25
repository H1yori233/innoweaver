"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MeiliSearch } from 'meilisearch';
import { fetchQueryLikedSolutions } from '@/lib/actions';
import useAuthStore from '@/lib/hooks/auth-store';
import { Search, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import MasonryGallery from '@/components/inspiration/MasonryGallery';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [totalResults, setTotalResults] = useState(0);
    const [jumpToPage, setJumpToPage] = useState('');

    const apiUrl = '120.55.193.195:7700/';
    const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);

    const fetchSolutionCount = useCallback(async (searchQuery = '') => {
        try {
            const index = client.index('solution_id');
            const searchResults = await index.search(searchQuery, { limit: 0 });
            logger.log(searchResults.estimatedTotalHits);
            return searchResults.estimatedTotalHits;
        } catch (error) {
            setError('Error fetching solution count');
            return 0;
        }
    }, [client]);

    const fetchSolutions = useCallback(async (searchQuery = '', pageNumber = 1) => {
        setLoading(true);
        setError(null);

        try {
            const totalCount = await fetchSolutionCount(searchQuery) - 1;
            setTotalResults(totalCount);
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

                setSolutions(modifiedResults);

                if (authStore.email) {
                    try {
                        const likedStatuses = await fetchQueryLikedSolutions(modifiedResults.map(solution => solution.id));
                        const newLikedStates = likedStatuses.reduce((acc, { solution_id, isLiked }) => {
                            acc[solution_id] = isLiked;
                            return acc;
                        }, {});
                        setLikedSolutions(newLikedStates);
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
                setSolutions([]);
                setHasMore(false);
            }
        } catch (error) {
            setError('Unable to load solutions. Please try again.');
            toast({
                title: "Connection Error",
                description: "Failed to load solutions. Please check your connection and try again.",
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
        fetchSolutions(query, pageNumber);
    }, [query, pageNumber, fetchSolutions]);

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmedQuery = queryState.trim();
        urlManager.updateSingleParam('query', trimmedQuery, currentParams);
    };

    const handlePageChange = (newPage) => {
        if (newPage <= totalPages && newPage > 0) {
            urlManager.updateQuery({ ...currentParams, page: newPage });
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePageJump = (e) => {
        e.preventDefault();
        const page = parseInt(jumpToPage, 10);
        if (page && page >= 1 && page <= totalPages) {
            handlePageChange(page);
            setJumpToPage('');
        }
    };

    const clearSearch = () => {
        setQuery('');
        urlManager.updateSingleParam('query', '', currentParams);
    };

    // Enhanced pagination with better logic
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const range = isMobile ? 1 : 2;
        const pagesToShow = [];

        let startPage = Math.max(1, pageNumber - range);
        let endPage = Math.min(totalPages, pageNumber + range);

        // Always show first page
        if (startPage > 1) {
            pagesToShow.push(1);
            if (startPage > 2) pagesToShow.push('...');
        }

        // Show pages in range
        for (let i = startPage; i <= endPage; i++) {
            pagesToShow.push(i);
        }

        // Always show last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pagesToShow.push('...');
            pagesToShow.push(totalPages);
        }

        return (
            <div className="flex items-center justify-center gap-4">
                {/* Main pagination - more compact */}
                <div className="flex items-center space-x-1">
                    {/* Previous button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePageChange(pageNumber - 1)}
                        disabled={pageNumber === 1}
                        className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium
                                 bg-surface-secondary text-text-secondary rounded-lg
                                 hover:bg-surface-tertiary hover:text-text-primary
                                 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                                 transition-all duration-200"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Previous</span>
                    </motion.button>

                    {/* Page numbers - more compact */}
                    <div className="flex items-center space-x-0.5">
                        {pagesToShow.map((page, index) => (
                            <React.Fragment key={index}>
                                {page === '...' ? (
                                    <span className="px-1.5 py-2 text-text-tertiary">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </span>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePageChange(page)}
                                        className={`
                                            relative px-2.5 py-1.5 text-sm font-medium rounded-lg
                                            transition-all duration-200 min-w-[32px]
                                            ${page === pageNumber
                                                ? 'bg-accent-primary text-text-inverse'
                                                : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                                            }
                                        `}
                                    >
                                        {page}
                                    </motion.button>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Next button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePageChange(pageNumber + 1)}
                        disabled={pageNumber === totalPages}
                        className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium
                                 bg-surface-secondary text-text-secondary rounded-lg
                                 hover:bg-surface-tertiary hover:text-text-primary
                                 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                                 transition-all duration-200"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>

                {/* Compact jump to page */}
                {totalPages > 10 && (
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="text-text-tertiary">Jump to</span>
                        <form onSubmit={handlePageJump} className="flex items-center space-x-1">
                            <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={jumpToPage}
                                onChange={(e) => setJumpToPage(e.target.value)}
                                placeholder="Page"
                                className="w-16 px-2 py-1 text-xs text-center 
                                         bg-surface-secondary border border-border-subtle rounded-md
                                         text-text-primary placeholder:text-text-placeholder
                                         focus:bg-surface-elevated focus:border-accent-primary
                                         transition-all duration-200"
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="px-2 py-1 text-xs font-medium bg-accent-primary text-text-inverse rounded-md
                                         hover:bg-accent-primary/90 transition-colors duration-200"
                            >
                                Go
                            </motion.button>
                        </form>
                    </div>
                )}
            </div>
        );
    };



    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-canvas"
        >
            {/* Compact Header */}
            <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur-md border-b border-border-subtle/50">
                <div className="w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-4">
                    {/* Page Title */}
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold text-text-primary">Gallery</h1>
                    </div>

                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                        <div className="relative">
                            {/* Search Icon */}
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-tertiary">
                                <Search className="w-4 h-4" />
                            </div>

                            {/* Compact Input */}
                            <input
                                type="text"
                                value={queryState}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search solutions..."
                                className="w-full pl-11 pr-10 py-3 text-sm
                                         bg-surface-secondary border border-border-subtle rounded-xl
                                         text-text-primary placeholder:text-text-placeholder
                                         focus:bg-surface-elevated focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20
                                         transition-all duration-200"
                            />

                            {/* Clear Button */}
                            <AnimatePresence>
                                {queryState && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        type="button"
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                                 p-1 rounded-md hover:bg-surface-tertiary
                                                 text-text-tertiary hover:text-text-primary transition-all duration-200"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results count - removed as it's not meaningful for gallery view */}

            {/* Error State */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center py-16 px-4"
                    >
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-6 text-error opacity-60">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="heading-secondary text-text-primary mb-3">Unable to load solutions</h3>
                            <p className="body-regular text-text-secondary mb-6">{error}</p>
                            <button
                                onClick={() => fetchSolutions(query, pageNumber)}
                                className="btn-primary"
                            >
                                Try Again
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gallery Content */}
            {!error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <MasonryGallery solutions={solutions} likedSolutions={likedSolutions} />
                </motion.div>
            )}

            {/* Pagination - more compact */}
            {!loading && !error && totalPages > 1 && (
                <div className="py-8 px-6 md:px-8 lg:px-12">
                    {renderPagination()}
                </div>
            )}

            {/* Bottom spacing */}
            <div className="h-8" />
        </motion.div>
    );
};

const GalleryPage = () => (
    <Suspense fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto">
                    <svg className="animate-spin w-full h-full text-accent-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
                <p className="body-regular text-text-secondary">Loading gallery...</p>
            </div>
        </div>
    }>
        <Gallery />
    </Suspense>
);

export default GalleryPage;
