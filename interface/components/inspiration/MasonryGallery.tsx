"use client";

import React, { useState, useEffect } from 'react';
import MiniCard from '@/components/inspiration/MiniCard';
import Masonry from 'react-masonry-css';

interface MasonryGalleryProps {
    solutions: any[];
    likedSolutions: { [key: string]: boolean };
}

const SkeletonCard: React.FC = () => {
    return (
        <div className="relative w-64 h-96 rounded-2xl overflow-hidden mb-4 bg-gray-200 dark:bg-gray-700 animate-pulse">
            {/* Simulate title area */}
            <div className="absolute inset-0 flex flex-col justify-center items-center p-6">
                <div className="w-3/4 h-6 bg-gray-300 dark:bg-gray-600 rounded-lg mb-3"></div>
                <div className="w-1/2 h-4 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            </div>
            
            {/* Simulate like button */}
            <div className="absolute top-4 right-4 w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
    );
};


const MasonryGallery: React.FC<MasonryGalleryProps> = ({ solutions, likedSolutions }) => {
    const columns = solutions.length > 0 ? Math.min(5, solutions.length) : 5;
    const breakpointColumnsObj = {
        default: columns,
        1600: Math.min(4, solutions.length || 4),
        1200: Math.min(3, solutions.length || 3),
        800: Math.min(2, solutions.length || 2),
        640: 1,
    };

    const isLoading = solutions.length === 0;
    const [likes, setLikes] = useState({});
    useEffect(() => {
        setLikes(likedSolutions);
    }, [likedSolutions]);

    return (
        <div className="flex justify-center p-4 w-full">
            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex"
                columnClassName="masonry-grid_column flex flex-col"
            >
                {isLoading
                    ?
                    Array.from({ length: 20 }).map((_, index) => <SkeletonCard key={index} />)
                    :
                    solutions.map((solution, index) => (
                        <MiniCard
                            key={index}
                            content={solution}
                            index={index}
                            isLiked={likes[solution.id]}
                        />
                    ))}
            </Masonry>
        </div>
    );
};

export default MasonryGallery;