'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MeiliSearch } from 'meilisearch';
import useAuthStore from '@/lib/hooks/auth-store';
import { History } from 'lucide-react';

const apiUrl = 'http://120.55.193.195:7700';
const meiliSearchClient = new MeiliSearch({ host: apiUrl });

const UserHistory: React.FC = () => {
    const [history, setHistory] = useState([]);
    const [error, setError] = useState<string | null>(null);
    const { email } = useAuthStore();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!email) {
                setHistory([]);
                return;
            }

            try {
                const id = localStorage.getItem('id');
                if (!id) {
                    setHistory([]);
                    return;
                }

                const index = meiliSearchClient.index('solution_id');
                const searchResults = await index.search('', {
                    limit: 6,
                    sort: ['timestamp:desc'],
                    filter: [`user_id="${id}"`],
                });
                const results = searchResults.hits.map((item: any) => ({
                    id: item._id,
                    title: item.solution.Title || 'Untitled Inspiration',
                }));

                setHistory(results);
            } catch (err) {
                setError('Error fetching history data');
            }
        };

        fetchHistory();
    }, [email]);

    if (!email) {
        return null;
    }

    return (
        <div className='space-y-1'>
            <div className="space-y-2 pl-1 border-l border-blue-500/20">
                {error ? (
                    <p className="text-red-500 text-xs">{error}</p>
                ) : history.length > 0 ? (
                    history.map((item) => (
                        <Link
                            key={item.id}
                            href={`/inspiration/${item.id}`}
                            className="block py-1.5 pr-2 ml-2 text-xs text-text-secondary rounded-r-lg
                            hover:bg-secondary hover:text-text-primary transition-all duration-200"
                        >
                            <p className="truncate">{item.title}</p>
                        </Link>
                    ))
                ) : (
                    <p className="text-xs text-text-secondary opacity-70 py-1">No recent history</p>
                )}
            </div>
        </div>
    );
}

export default UserHistory;
