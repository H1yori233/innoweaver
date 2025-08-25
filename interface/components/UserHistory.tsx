'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MeiliSearch } from 'meilisearch';
import useAuthStore from '@/lib/hooks/auth-store';
import { Clock, AlertCircle } from 'lucide-react';

// 配置 MeiliSearch
const MEILI_SEARCH_API_URL = process.env.NEXT_PUBLIC_MEILI_SEARCH_API_URL || 'http://120.55.193.195:7700';
const meiliSearchClient = new MeiliSearch({ host: MEILI_SEARCH_API_URL });

interface HistoryItem {
    id: string;
    title: string;
    timestamp?: string;
    category?: string;
}

const UserHistory: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { email } = useAuthStore();

    useEffect(() => {
        if (!email) {
            setHistory([]);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const id = localStorage.getItem('id');
                if (!id) {
                    setHistory([]);
                    return;
                }

                const index = meiliSearchClient.index('solution_id');
                const searchResults = await index.search<any>('', {
                    limit: 6,
                    sort: ['timestamp:desc'],
                    filter: [`user_id="${id}"`],
                });
                
                const results: HistoryItem[] = searchResults.hits.map((item: any) => ({
                    id: item._id,
                    title: item.solution?.Title || 'Untitled Inspiration',
                    timestamp: item.timestamp,
                    category: item.solution?.Category || 'General',
                }));

                setHistory(results);
            } catch (err) {
                console.error("Error fetching history data:", err);
                setError('Failed to load history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [email]);

    // 如果用户未登录，不显示历史记录
    if (!email) {
        return null;
    }

    // 加载状态
    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-3 bg-surface-secondary rounded ml-4 mb-2" style={{ width: `${60 + i * 20}%` }} />
                        <div className="h-2 bg-surface-tertiary rounded ml-6" style={{ width: `${40 + i * 10}%` }} />
                    </div>
                ))}
            </div>
        );
    }

    // 错误状态
    if (error) {
        return (
            <div className="ml-4 p-3 rounded-lg bg-error/5 border border-error/20">
                <div className="flex items-center text-error mb-1">
                    <AlertCircle className="w-3 h-3 mr-2" />
                    <span className="body-small font-medium">Error</span>
                </div>
                <p className="body-small text-error/80">{error}</p>
            </div>
        );
    }

    // 空状态
    if (history.length === 0) {
        return (
            <div className="ml-4 p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle">
                <div className="text-center">
                    <Clock className="w-6 h-6 mx-auto text-text-placeholder mb-2" />
                    <p className="body-small text-text-placeholder font-medium mb-1">No Recent Activity</p>
                    <p className="body-small text-text-tertiary">Your inspiration history will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-1 pl-3 border-l border-accent-primary/20">
            {history.map((item) => (
                <Link
                    key={item.id}
                    href={`/inspiration/${item.id}`}
                    className="block py-2 px-2 text-sm text-text-secondary rounded-lg
                             hover:bg-surface-secondary hover:text-text-primary 
                             transition-all duration-200"
                >
                    <p className="truncate" title={item.title}>{item.title}</p>
                </Link>
            ))}
        </div>
    );
}

export default React.memo(UserHistory);
