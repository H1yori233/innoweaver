'use client';

import { useState, useEffect, useRef } from 'react';
import {
    PlayCircle,
    StopCircle,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    Zap,
} from 'lucide-react';
import { fetchEventSource, EventSourceMessage } from '@microsoft/fetch-event-source';
import JSON5 from 'json5';

export default function ResearchApiTestPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [streamingContent, setStreamingContent] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    /** Handle a single SSE message from the server */
    const handleSSEEvent = (eventType: string, data: any) => {
        switch (eventType) {
            case 'chunk': {
                let text = '';
                if (data && typeof data.text === 'string') {
                    text = data.text;
                } else {
                    text = String(data);
                }
                setStreamingContent(prev => prev + text);
                break;
            }
            case 'progress': {
                setProgress(typeof data === 'number' ? data : data?.progress ?? 0);
                break;
            }
            case 'status': {
                setStatus(typeof data === 'string' ? data : data?.status ?? '');
                break;
            }
            case 'error': {
                setError(typeof data === 'string' ? data : JSON.stringify(data));
                setStatus('Error');
                setLoading(false);
                break;
            }
            case 'end': {
                setProgress(100);
                setStatus('Complete');
                setLoading(false);
                break;
            }
            default:
                console.warn('Unknown SSE event:', eventType, data);
        }
    };

    /** Start calling the backend /research endpoint */
    const startResearch = async () => {
        setLoading(true);
        setError(null);
        setProgress(0);
        setStatus('Initializing Research Workflow...');
        setStreamingContent('');
        setElapsedTime(0);

        // Start timer
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        abortControllerRef.current?.abort();
        const ac = new AbortController();
        abortControllerRef.current = ac;

        const payload = {
            query:
                'I want to design an AI-based in-car physical interaction system that supports multimodal interaction and can perceive driving status in real time, to meet the needs of young drivers for long-duration driving.',
            query_analysis_result: {
                'Targeted User': 'young drivers',
                'Usage Scenario':
                    "A young driver is on a long highway journey using an AI-powered in-car interaction system that supports multi-modal interactions (voice, gesture, touch) and continuously monitors the driver's state for fatigue or distraction, ensuring safety and comfort.",
                Requirement: [
                    'multi-modal interaction',
                    'real-time driver state perception',
                    'fatigue detection',
                    'safety enhancement',
                    'user engagement',
                ],
                Query:
                    'I want to design an AI-based in-car physical interaction system that supports multimodal interaction and can perceive driving status in real time, to meet the needs of young drivers for long-duration driving.',
            },
        };

        try {
            await fetchEventSource('http://localhost:5000/api/research', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                    Accept: 'text/event-stream',
                },
                body: JSON.stringify(payload),
                signal: ac.signal,

                onopen: async response => {
                    if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
                        throw new Error(`Failed to open SSE connection: ${response.status} ${response.statusText}`);
                    }
                },

                onmessage: (msg: EventSourceMessage) => {
                    const eventType = msg.event || 'chunk';
                    let eventData: any = msg.data;
                    if (typeof eventData === 'string') {
                        try {
                            eventData = JSON5.parse(eventData);
                        } catch {
                            // fallback to raw string
                        }
                    }
                    handleSSEEvent(eventType, eventData);
                },

                onerror: err => {
                    console.error('SSE error:', err);
                    if (!ac.signal.aborted) {
                        setError(err instanceof Error ? err.message : 'Unknown SSE error');
                        setStatus('Error');
                        setLoading(false);
                    }
                    throw err;
                },

                onclose: () => {
                    setLoading(false);
                    if (!error && !ac.signal.aborted && status !== 'Error') {
                        setProgress(100);
                        setStatus('Complete');
                    }
                },

                openWhenHidden: true,
                fetch: fetch,
            });
        } catch (err: any) {
            if (err.name !== 'AbortError' && !ac.signal.aborted) {
                setError(err.message || 'Unknown error occurred');
                setStatus('Error');
            } else if (ac.signal.aborted) {
                setStatus('Cancelled');
            }
        } finally {
            setLoading(false);
        }
    };

    const stopResearch = () => {
        abortControllerRef.current?.abort();
        setLoading(false);
        setStatus('Stopped');
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const resetTest = () => {
        abortControllerRef.current?.abort();
        setError(null);
        setProgress(0);
        setStatus('');
        setStreamingContent('');
        setLoading(false);
        setElapsedTime(0);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight });
    }, [streamingContent]);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Zap className="w-8 h-8 text-indigo-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Research API Test Tool</h1>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Query</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700">
                                "I want to design an AI-based in-car physical interaction system that supports multimodal
                                interaction and can perceive driving status in real time, to meet the needs of young drivers
                                for long-duration driving."
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={startResearch}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="w-4 h-4" />
                                    Start Research
                                </>
                            )}
                        </button>

                        {loading && (
                            <button
                                onClick={stopResearch}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <StopCircle className="w-4 h-4" />
                                Stop
                            </button>
                        )}

                        <button
                            onClick={resetTest}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>

                    {(loading || progress > 0) && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {loading ? (
                                        <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                                    ) : progress === 100 ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">{status}</span>
                                </div>
                                <span className="text-sm text-gray-500">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Real-time Research Output</h2>
                        <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-medium">Error</span>
                            </div>
                            <p className="mt-1 break-all">{error}</p>
                        </div>
                    )}

                    <div
                        ref={contentRef}
                        className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto whitespace-pre-wrap"
                    >
                        {streamingContent || 'Click "Start Research" to begin the workflow...'}
                        {loading && <span className="animate-pulse">▋</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
