import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import JSON5 from 'json5';
import { logger } from '@/lib/logger';

interface SSEConfig {
    url: string;
}

interface SSEState {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

type SSEEventHandler = (eventType: string, data: any) => void;

const DEFAULT_CONFIG: Required<SSEConfig> = {
    url: '/api/query', // The default URL for query analysis
};

/**
 * A custom hook to manage a Server-Sent Events (SSE) connection for query analysis.
 */
export const useQuerySSE = (config: SSEConfig) => {
    const sseConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

    const [connectionState, setConnectionState] = useState<SSEState>({
        isConnected: false,
        isConnecting: false,
        error: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setConnectionState({ isConnected: false, isConnecting: false, error: null });
    }, []);

    const connect = useCallback(async (payload: any, onEvent: SSEEventHandler) => {
        cleanup();

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setConnectionState({ isConnected: false, isConnecting: true, error: null });

        try {
            const { fetchEventSource } = await import('@microsoft/fetch-event-source');

            await fetchEventSource(sseConfig.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                    Accept: 'text/event-stream',
                },
                body: JSON.stringify(payload),
                signal: abortController.signal,

                onopen: async (response) => {
                    if (!response.ok) {
                        const errorText = await response.text().catch(() => 'Unknown server error');
                        throw new Error(`Failed to connect: ${response.status} ${errorText}`);
                    }
                    logger.info('Query SSE: Connection established.');
                    setConnectionState({ isConnected: true, isConnecting: false, error: null });
                },

                onmessage: (msg) => {
                    const eventType = msg.event;
                    let eventData: any = msg.data;
                    try {
                        if (typeof eventData === 'string' && (eventData.startsWith('{') || eventData.startsWith('['))) {
                            eventData = JSON5.parse(eventData);
                        }
                    } catch (e) {
                        logger.warn(`Query SSE: Message data was not a JSON object, using raw text. Data: "${eventData}"`);
                    }
                    onEvent(eventType, eventData);
                },

                onerror: (err) => {
                    logger.error('Query SSE: Connection error.', err);
                    setConnectionState({ isConnected: false, isConnecting: false, error: err.message || 'An unknown error occurred' });
                    throw err;
                },

                onclose: () => {
                    logger.info('Query SSE: Connection closed.');
                    setConnectionState({ isConnected: false, isConnecting: false, error: null });
                },
            });

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                logger.error('Query SSE: Fatal error.', error);
                setConnectionState({ isConnected: false, isConnecting: false, error: error.message || 'A fatal connection error occurred' });
            }
        }
    }, [sseConfig, cleanup]);

    const disconnect = useCallback(() => {
        logger.info('Query SSE: Manual disconnect.');
        cleanup();
    }, [cleanup]);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return useMemo(() => ({
        connectionState,
        connect,
        disconnect
    }), [connectionState, connect, disconnect]);
};