import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import JSON5 from 'json5';
import { logger } from '@/lib/logger';

/**
 * @interface SSEConfig
 * Configuration for the SSE connection.
 */
interface SSEConfig {
    url: string;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    connectionTimeout?: number;
}

/**
 * @interface SSEState
 * Represents the current state of the SSE connection.
 */
interface SSEState {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

/**
 * @type SSEEventHandler
 * A callback function to handle events received from the server.
 */
type SSEEventHandler = (eventType: string, data: any) => void;

// Default configuration settings
const DEFAULT_CONFIG: Required<SSEConfig> = {
    url: '/api/inspiration/chat', // Default chat API endpoint
    maxReconnectAttempts: 3,
    reconnectInterval: 2000,
    connectionTimeout: 10000,
};

/**
 * A custom hook to manage a Server-Sent Events (SSE) connection for chat functionalities.
 */
export const useChatSSE = (config: SSEConfig) => {
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
        setConnectionState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
        }));
    }, []);

    const connect = useCallback(async (payload: any, onEvent: SSEEventHandler) => {
        cleanup();

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setConnectionState({
            isConnected: false,
            isConnecting: true,
            error: null,
        });

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
                    logger.info('Chat SSE: Connection established.');
                    setConnectionState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }));
                },

                // CORRECTED onmessage HANDLER
                onmessage: (msg) => {
                    // Get the event type directly from the SSE message's 'event' field.
                    const eventType = msg.event;
                    let eventData: any = msg.data;

                    // The data can be a JSON string or plain text.
                    // We try to parse it, but if it fails, we use the raw string.
                    // This is crucial for handling both data objects and simple
                    // string messages like "complete" or raw error strings.
                    try {
                        // Only attempt to parse if it looks like an object or array.
                        if (typeof eventData === 'string' && (eventData.startsWith('{') || eventData.startsWith('['))) {
                            eventData = JSON5.parse(eventData);
                        }
                    } catch (e) {
                        // This is not a critical error; it just means the data was not JSON.
                        logger.warn(`Chat SSE: Message data was not a JSON object, using raw text. Data: "${eventData}"`);
                    }

                    try {
                        // Pass the correctly parsed event type and data to the component's handler.
                        onEvent(eventType, eventData);
                    } catch (handlerError) {
                        logger.error('Chat SSE: Error in the component event handler.', handlerError);
                    }
                },

                onerror: (err) => {
                    logger.error('Chat SSE: Connection error.', err);
                    setConnectionState(prev => ({
                        ...prev,
                        isConnected: false,
                        isConnecting: false,
                        error: err.message || 'An unknown error occurred',
                    }));
                    throw err;
                },

                onclose: () => {
                    logger.info('Chat SSE: Connection closed.');
                    setConnectionState(prev => ({ ...prev, isConnecting: false, isConnected: false }));
                },
            });

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                logger.error('Chat SSE: Fatal error.', error);
                setConnectionState(prev => ({
                    ...prev,
                    isConnected: false,
                    isConnecting: false,
                    error: error.message || 'A fatal connection error occurred.',
                }));
            }
        }
    }, [sseConfig, cleanup]);

    const disconnect = useCallback(() => {
        logger.info('Chat SSE: Manual disconnect.');
        cleanup();
    }, [cleanup]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return useMemo(() => ({
        connectionState,
        connect,
        disconnect
    }), [connectionState, connect, disconnect]);
};