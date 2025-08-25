"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchLoadLikedSolutions, fetchQueryLikedSolutions } from '@/lib/actions';
import useAuthStore from '@/lib/hooks/auth-store';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import MasonryGallery from '@/components/inspiration/MasonryGallery';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';
import { URLQueryManager, QueryParams } from '@/lib/hooks/url-query';

const FavList = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const authStore = useAuthStore();
    const { toast } = useToast();

    // Use URL query manager
    const urlManager = useMemo(() => new URLQueryManager(router, '/user/favorites'), [router]);
    const currentParams = useMemo(() => URLQueryManager.parseSearchParams(searchParams), [searchParams]);

    const { page: pageNumber } = currentParams;

    const [loading, setLoading] = useState(true);
    const [solutions, setSolutions] = useState([]);
    const [likedSolutions, setLikedSolutions] = useState({});
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [totalResults, setTotalResults] = useState(0);
    const [jumpToPage, setJumpToPage] = useState('');

    const fetchSolutions = useCallback(async (pageNumber = 1) => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchLoadLikedSolutions(pageNumber);

            if (Array.isArray(result) && result.length > 0) {
                // For favorites, we assume 20 items per page
                const itemsPerPage = 20;
                setTotalResults(result.length);
                setTotalPages(Math.ceil(result.length / itemsPerPage));

                setSolutions(result);

                if (authStore.email) {
                    try {
                        const likedStatuses = await fetchQueryLikedSolutions(result.map(solution => solution.id));
                        const newLikedStates = likedStatuses.reduce((acc, { solution_id, isLiked }) => {
                            acc[solution_id] = isLiked;
                            return acc;
                        }, {});
                        setLikedSolutions(newLikedStates);
                    } catch (likeError) {
                        console.error('Failed to fetch like status:', likeError);
                        const defaultLikedStates = result.reduce((acc, solution) => {
                            acc[solution.id] = true; // Default to liked for favorites
                            return acc;
                        }, {});
                        setLikedSolutions(defaultLikedStates);
                    }
                } else {
                    const defaultLikedStates = result.reduce((acc, solution) => {
                        acc[solution.id] = true;
                        return acc;
                    }, {});
                    setLikedSolutions(defaultLikedStates);
                }
                setHasMore(true);
            } else {
                setSolutions([]);
                setHasMore(false);
                setTotalPages(0);
                setTotalResults(0);
            }
        } catch (error) {
            setError('Unable to load favorite solutions. Please try again.');
            toast({
                title: "Connection Error",
                description: "Failed to load favorite solutions. Please check your connection and try again.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    }, [authStore.email, toast]);

    // Re-fetch data when page changes
    useEffect(() => {
        setSolutions([]);
        setLikedSolutions({});
        setHasMore(true);
        fetchSolutions(pageNumber);
    }, [pageNumber, fetchSolutions]);

    const handlePageChange = (newPage) => {
        if (newPage <= totalPages && newPage > 0) {
            urlManager.updateQuery({ ...currentParams, page: newPage });
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
                <div className="w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-6">
                    {/* Page Title */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-text-primary">My Favorites</h1>
                    </div>
                </div>
            </div>

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
                            <h3 className="heading-secondary text-text-primary mb-3">Unable to load favorites</h3>
                            <p className="body-regular text-text-secondary mb-6">{error}</p>
                            <button
                                onClick={() => fetchSolutions(pageNumber)}
                                className="btn-primary"
                            >
                                Try Again
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!loading && !error && solutions.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-24 px-4"
                >
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 text-text-tertiary opacity-60">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h3 className="heading-secondary text-text-primary mb-3">No favorites yet</h3>
                        <p className="body-regular text-text-secondary mb-6">
                            Start exploring solutions and like the ones you want to save here.
                        </p>
                        <button
                            onClick={() => router.push('/gallery')}
                            className="btn-primary"
                        >
                            Explore Solutions
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Gallery Content */}
            {!error && solutions.length > 0 && (
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

const FavListPage = () => (
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
                <p className="body-regular text-text-secondary">Loading favorites...</p>
            </div>
        </div>
    }>
        <FavList />
    </Suspense>
);

export default FavListPage;
