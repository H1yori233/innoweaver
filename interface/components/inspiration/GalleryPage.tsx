import { useState, useEffect, useCallback, useRef } from 'react';
import MiniCard from "@/components/inspiration/MiniCard";
import { fetchQueryLikedSolutions } from '@/lib/actions';
import Masonry from 'react-masonry-css';
import { logger } from '@/lib/logger';


interface MasonryGalleryProps {
    solutions: any[];
    likedSolutions: { [key: string]: boolean };
}

const MasonryGallery: React.FC<MasonryGalleryProps> = ({ solutions, likedSolutions }) => {
    const columns = Math.min(5, solutions.length);
    const breakpointColumnsObj = {
        default: columns,
        1600: Math.min(4, solutions.length),
        1200: Math.min(3, solutions.length),
        800: Math.min(2, solutions.length),
        640: 1,
    };

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
                {solutions.map((solution, index) => (
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

const GalleryPage = ({ title, fetchData }) => {
    const [page, setPage] = useState(1);
    const [isFetching, setIsFetching] = useState(false);
    const [solutions, setSolutions] = useState([]);
    const [likedSolutions, setLikedSolutions] = useState({});
    const [hasMore, setHasMore] = useState(true);
    const initialLoadDone = useRef(false);

    // Solution loading logic
    const handleLoadSolution = useCallback(async () => {
        if (isFetching || !hasMore) return;

        setIsFetching(true);  // Set loading state
        try {
            const result = await fetchData(page);
            logger.log("Loaded data:", result);

            if (Array.isArray(result) && result.length > 0) {
                setPage(prevPage => prevPage + 1);
                setSolutions(prevSolutions => [...prevSolutions, ...result]);

                const solutionIds = result.map(solution => solution.id);
                const likedStatuses = await fetchQueryLikedSolutions(solutionIds);
                logger.log(likedStatuses);

                const newLikedStates = likedStatuses.reduce((acc, { solution_id, isLiked }) => {
                    acc[solution_id] = isLiked;
                    return acc;
                }, {} as { [key: string]: boolean });
                setLikedSolutions(prevLiked => ({
                    ...prevLiked,
                    ...newLikedStates,
                }));
            } else {
                setHasMore(false);
            }
        } catch (error) {
            logger.error('Failed to load solutions:', error);
            // if (error.message.includes('401')) {
            //     window.location.href = '/user/login';
            // } else {
            //     console.error('Failed to load solutions:', error);
            // }
        } finally {
            setIsFetching(false);
        }
    }, [isFetching, page, hasMore, fetchData]);

    useEffect(() => {
        let mounted = true; // Prevent useEffect from executing twice in development mode
        if (!initialLoadDone.current && solutions.length === 0 && mounted) {
            initialLoadDone.current = true;
            handleLoadSolution();
        }
        return () => { mounted = false; }; // Ensure only executed once
    }, [handleLoadSolution, solutions.length]);

    // Scroll loading handling
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10 && !isFetching && hasMore) {
                handleLoadSolution();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleLoadSolution, isFetching, hasMore]);

    return (
        <div className='user_history_content_container h-full'>
            <h1 style={{
                fontSize: '1.5rem', fontWeight: 'bold', marginTop: '2rem',
                alignSelf: 'flex-start',
                textAlign: 'left'
            }}>
                {title}
            </h1>
            {
                solutions.length === 0 ? (
                    <div className="empty-container">
                        <div className="text-3xl" style={{ fontWeight: "bold" }}> No solutions explored yet. </div>
                        <div className="text-2xl mt-10">
                            Click on "Explore Solutions!" to see
                            generated content.
                        </div>
                    </div>
                ) : (
                    <MasonryGallery solutions={solutions} likedSolutions={likedSolutions} />
                )
            }
        </div>
    );
};

export default GalleryPage;
