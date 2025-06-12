"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MeiliSearch } from 'meilisearch';
import MasonryGallery from '../components/MasonryGallery';
import SearchBar from '../components/SearchBar';
import { fetchQueryLikedSolutions } from '../../../lib/actions'; // 根据实际路径调整

const Gallery: React.FC = () => {
    const apiUrl = process.env.API_URL?.replace(':5000', ':7700/') || ''; // 确保 apiUrl 有默认值
    const [loading, setLoading] = useState<boolean>(true);
    const [solutions, setSolutions] = useState<any[]>([]);
    const [likedSolutions, setLikedSolutions] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);
    const fetchSolutions = useCallback(async (searchQuery = '', pageNumber = 1) => {
        setLoading(true);
        try {
            const index = client.index('solution_id');
            const searchResults = await index.search(searchQuery, {
                limit: 10,
                offset: (pageNumber - 1) * 10,
                sort: ['timestamp:desc'],
            });
            if (searchResults.hits.length > 0) {
                const modifiedResults = searchResults.hits.map((hit) => ({
                    ...hit,
                    id: hit._id,
                }));
    
                setSolutions((prevPapers) => (pageNumber === 1 ? modifiedResults : [...prevPapers, ...modifiedResults]));
    
                const solutionIds = modifiedResults.map(solution => solution.id);
                const likedStatuses = await fetchQueryLikedSolutions(solutionIds);
    
                const newLikedStates = likedStatuses.reduce((acc, { solution_id, isLiked }) => {
                    acc[solution_id] = isLiked;
                    return acc;
                }, {});
    
                setLikedSolutions(prevLiked => ({
                    ...prevLiked,
                    ...newLikedStates,
                }));
    
                setHasMore(true);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            setError('Error fetching papers');
        } finally {
            setLoading(false);
        }
    }, [client]);

    useEffect(() => {
        fetchSolutions(query, page);
    }, [query, page, fetchSolutions]);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                if (scrollTop + clientHeight >= scrollHeight - 50 && !loading && hasMore) {
                    setPage((prevPage) => prevPage + 1);
                }
            }
        };

        const container = scrollContainerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [loading, hasMore]);

    return (
        <div
            ref={scrollContainerRef}
            style={{ height: '100vh', overflowY: 'auto', marginLeft: '15rem' }}
        >
            <div className="flex justify-center mt-8">
                <header className="mb-6 text-center w-full">
                    <SearchBar
                        query={query}
                        setQuery={setQuery}
                        onSearch={() => {
                            setPage(1);
                            setSolutions([]);
                            fetchSolutions(query, 1);
                        }}
                    />
                </header>
            </div>

            {loading && page === 1 ? (
                <div style={{ fontSize: '24px', marginTop: '100px', textAlign: 'center' }}>
                    Loading...
                </div>
            ) : error ? (
                <div style={{ color: 'red', textAlign: 'center', marginTop: '100px' }}>
                    {error}
                </div>
            ) : (
                <div>
                    <MasonryGallery solutions={solutions} likedSolutions={likedSolutions} />
                    {loading && page > 1 && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            Loading more...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Gallery;