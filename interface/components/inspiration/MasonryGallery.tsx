"use client";

import React, { useState, useEffect } from 'react';
import MiniCard from '@/components/inspiration/MiniCard';
import Masonry from 'react-masonry-css';

interface MasonryGalleryProps {
    solutions: any[];
    likedSolutions: { [key: string]: boolean };
}

const SkeletonCard: React.FC = () => {
    // Generate organic-looking skeleton with subtle animation
    const generateSkeletonVariant = () => {
        const variants = [
            'from-organic-clay/10 to-organic-sand/5',
            'from-organic-sage/10 to-organic-moss/5',
            'from-organic-storm/10 to-stone/5',
            'from-surface-secondary to-surface-tertiary',
        ];
        return variants[Math.floor(Math.random() * variants.length)];
    };

    const [variant] = useState(generateSkeletonVariant());

    return (
        <div className={`relative w-64 h-96 bg-gradient-to-br ${variant} overflow-hidden mb-6 transition-all duration-300`}
            style={{ borderRadius: '20px' }}>

            {/* Organic shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface-elevated/20 to-transparent" />

            {/* Content area simulation */}
            <div className="flex flex-col justify-center p-6 h-full">
                {/* Title skeleton - organic widths */}
                <div className="space-y-3 mb-4">
                    <div className="h-5 bg-surface-elevated/30 rounded-lg w-4/5 animate-pulse"
                        style={{ animationDelay: '0.1s', animationDuration: '1.5s' }} />
                    <div className="h-5 bg-surface-elevated/30 rounded-lg w-3/5 animate-pulse"
                        style={{ animationDelay: '0.3s', animationDuration: '1.5s' }} />
                    <div className="h-5 bg-surface-elevated/30 rounded-lg w-2/3 animate-pulse"
                        style={{ animationDelay: '0.5s', animationDuration: '1.5s' }} />
                </div>

                {/* Function/description skeleton */}
                <div className="space-y-2 opacity-60">
                    <div className="h-3 bg-surface-elevated/20 rounded w-5/6 animate-pulse"
                        style={{ animationDelay: '0.7s', animationDuration: '1.5s' }} />
                    <div className="h-3 bg-surface-elevated/20 rounded w-4/6 animate-pulse"
                        style={{ animationDelay: '0.9s', animationDuration: '1.5s' }} />
                    <div className="h-3 bg-surface-elevated/20 rounded w-3/6 animate-pulse"
                        style={{ animationDelay: '1.1s', animationDuration: '1.5s' }} />
                </div>

                {/* Heritage accent line simulation */}
                <div className="absolute bottom-6 left-6 w-8 h-0.5 bg-surface-elevated/20 rounded-full animate-pulse"
                    style={{ animationDelay: '1.3s', animationDuration: '1.5s' }} />
            </div>

            {/* Like button skeleton */}
            <div className="absolute top-3 right-3 w-12 h-12 bg-surface-elevated/20 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s', animationDuration: '1.5s' }} />
        </div>
    );
};

const MasonryGallery: React.FC<MasonryGalleryProps> = ({ solutions, likedSolutions }) => {
    const [likes, setLikes] = useState({});

    useEffect(() => {
        setLikes(likedSolutions);
    }, [likedSolutions]);

    // Refined column calculation - prioritizing breathing room over density
    const getBreakpointColumns = () => {
        const solutionCount = solutions.length;
        return {
            default: Math.min(4, Math.max(1, solutionCount)),  // Max 4 columns for better card presence
            1400: Math.min(3, Math.max(1, solutionCount)),     // 3 columns for medium-large screens
            1000: Math.min(2, Math.max(1, solutionCount)),     // 2 columns for tablets
            640: 1,                                            // Single column for mobile
        };
    };

    const isLoading = solutions.length === 0;

    return (
        <div className="w-full">
            {/* Gallery container with organic spacing */}
            <div className="gallery-container">
                <div className="gallery-grid px-6 md:px-8 lg:px-12 max-w-7xl mx-auto">
                    <Masonry
                        breakpointCols={getBreakpointColumns()}
                        className="flex w-full -ml-4"
                        columnClassName="masonry-grid_column flex flex-col pl-4"
                    >
                        {isLoading ? (
                            // Organic skeleton loading pattern
                            Array.from({ length: 20 }).map((_, index) => (
                                <SkeletonCard key={`skeleton-${index}`} />
                            ))
                        ) : (
                            // Actual solutions
                            solutions.map((solution, index) => (
                                <MiniCard
                                    key={solution.id || index}
                                    content={solution}
                                    index={index}
                                    isLiked={likes[solution.id] || false}
                                />
                            ))
                        )}
                    </Masonry>
                </div>

                {/* Empty state with organic design */}
                {!isLoading && solutions.length === 0 && (
                    <div className="col-span-full py-20">
                        <div className="text-center space-y-4 max-w-md mx-auto">
                            {/* Organic empty state icon */}
                            <div className="w-20 h-20 mx-auto mb-6 relative">
                                <svg
                                    className="w-full h-full text-organic-sage/30"
                                    fill="none"
                                    viewBox="0 0 100 100"
                                >
                                    <path
                                        d="M20,30 Q50,10 80,30 Q90,50 80,70 Q50,90 20,70 Q10,50 20,30 Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="currentColor"
                                        fillOpacity="0.1"
                                    />
                                    <circle cx="35" cy="40" r="2.5" fill="currentColor" opacity="0.4" />
                                    <circle cx="65" cy="40" r="2.5" fill="currentColor" opacity="0.4" />
                                    <path
                                        d="M35,60 Q50,70 65,60"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        fill="none"
                                        opacity="0.4"
                                    />
                                </svg>
                            </div>

                            <h3 className="heading-secondary text-text-primary">No solutions found</h3>
                            <p className="body-regular text-text-secondary">
                                Try adjusting your search terms or explore our collection without filters.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MasonryGallery;
