"use client";

import React, { useState, useEffect } from 'react';
import MiniCard from '@/components/inspiration/MiniCard';
import Masonry from 'react-masonry-css';

interface MasonryGalleryProps {
    solutions: any[];
    likedSolutions: { [key: string]: boolean };
}

// 新增：批量获取 like 数量
async function fetchLikeCounts(ids: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    await Promise.all(ids.map(async (id) => {
        try {
            // 直接请求 FastAPI 后端
            const res = await fetch(`http://localhost:8000/api/solution/${id}/like_count`);
            if (!res.ok) return;
            const data = await res.json();
            results[id] = data.like_count ?? 0;
        } catch {
            results[id] = 0;
        }
    }));
    return results;
}

const SkeletonCard: React.FC = () => {
    return (
        <div className="relative w-64 h-96 rounded-3xl shadow-lg bg-gray-200 dark:bg-gray-700 animate-pulse m-2">
            <div className="absolute inset-0 bg-gray-300 dark:bg-gray-600"></div>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-500"></div>
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
    const [likes, setLikes] = useState(likedSolutions);
    useEffect(() => {
        setLikes(likedSolutions);
    }, [likedSolutions]);

    // 新增：like 数量
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
    useEffect(() => {
        if (solutions.length === 0) return;
        const ids = solutions.map(s => s.id);
        fetchLikeCounts(ids).then(setLikeCounts);
    }, [solutions]);

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
                            likeCount={likeCounts[solution.id]}
                        />
                    ))}
            </Masonry>
        </div>
    );
};

export default MasonryGallery;