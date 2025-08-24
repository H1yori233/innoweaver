import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import JSON5 from 'json5';

interface SSEConfig {
    url: string;
    maxReconnectAttempts: number;
    reconnectInterval: number;
    maxReconnectInterval: number;
    heartbeatInterval: number;
    connectionTimeout: number;
    messageTimeout: number;
}

interface SSEState {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
    lastActivity: number;
    error: string | null;
}

type SSEEventHandler = (eventType: string, data: any) => void;

const DEFAULT_CONFIG: SSEConfig = {
    url: '',
    maxReconnectAttempts: 5,
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    heartbeatInterval: 30000,
    connectionTimeout: 10000,
    messageTimeout: 60000,
};

export const useResearchSSE = (config: Partial<SSEConfig> = {}) => {
    const sseConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

    // State management
    const [connectionState, setConnectionState] = useState<SSEState>({
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0,
        lastActivity: Date.now(),
        error: null,
    });

    // Refs for cleanup and connection management
    const abortControllerRef = useRef<AbortController | null>(null);
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Current payload and handler for reconnection
    const currentPayloadRef = useRef<any>(null);
    const eventHandlerRef = useRef<SSEEventHandler | null>(null);

    const cleanup = useCallback(() => {
        // Clear all timers
        [reconnectTimerRef, heartbeatTimerRef, connectionTimeoutRef, messageTimeoutRef].forEach(timer => {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }
        });

        // Abort connection
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Reset connection state
        setConnectionState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false
        }));
    }, []);

    const calculateReconnectDelay = useCallback((attempt: number) => {
        const delay = Math.min(
            sseConfig.reconnectInterval * Math.pow(2, attempt),
            sseConfig.maxReconnectInterval
        );
        return delay + Math.random() * 1000;
    }, [sseConfig.reconnectInterval, sseConfig.maxReconnectInterval]);

    const updateActivity = useCallback(() => {
        setConnectionState(prev => ({
            ...prev,
            lastActivity: Date.now()
        }));
    }, []);

    // Reconnect function
    const reconnect = useCallback(() => {
        setConnectionState(currentState => {
            if (currentState.reconnectAttempts >= sseConfig.maxReconnectAttempts) {
                console.error('SSE: Max reconnection attempts reached');
                return {
                    ...currentState,
                    error: 'Connection failed after multiple attempts',
                    isConnected: false,
                    isConnecting: false
                };
            }

            if (currentState.isConnecting) {
                return currentState; // Already attempting to reconnect
            }

            const delay = calculateReconnectDelay(currentState.reconnectAttempts);
            console.log(`SSE: Reconnecting in ${delay}ms (attempt ${currentState.reconnectAttempts + 1})`);

            return {
                ...currentState,
                isConnecting: true,
                reconnectAttempts: currentState.reconnectAttempts + 1
            };
        });
    }, [sseConfig.maxReconnectAttempts, calculateReconnectDelay]);

    // Setup heartbeat monitoring
    const setupHeartbeat = useCallback(() => {
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
        }

        heartbeatTimerRef.current = setInterval(() => {
            const now = Date.now();
            setConnectionState(currentState => {
                const timeSinceLastActivity = now - currentState.lastActivity;

                if (timeSinceLastActivity > sseConfig.heartbeatInterval && currentState.isConnected) {
                    console.warn('SSE: Heartbeat timeout, checking connection');
                    if (timeSinceLastActivity > sseConfig.messageTimeout) {
                        // Trigger reconnection through state update
                        return {
                            ...currentState,
                            isConnecting: true,
                            isConnected: false,
                            reconnectAttempts: currentState.reconnectAttempts + 1,
                            error: 'Heartbeat timeout'
                        };
                    }
                }
                return currentState;
            });
        }, sseConfig.heartbeatInterval);
    }, [sseConfig.heartbeatInterval, sseConfig.messageTimeout]);

    // Setup message timeout monitoring
    const setupMessageTimeout = useCallback(() => {
        if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
        }

        messageTimeoutRef.current = setTimeout(() => {
            setConnectionState(currentState => {
                if (currentState.isConnected) {
                    console.warn('SSE: No message received within timeout, attempting reconnect');
                    // Trigger reconnection through state update
                    return {
                        ...currentState,
                        isConnecting: true,
                        isConnected: false,
                        reconnectAttempts: currentState.reconnectAttempts + 1,
                        error: 'Message timeout'
                    };
                }
                return currentState;
            });
        }, sseConfig.messageTimeout);
    }, [sseConfig.messageTimeout]);


    const connectSSERef = useRef<((payload: any, onEvent: SSEEventHandler) => Promise<void>) | null>(null);

    // Effect to handle reconnection scheduling
    useEffect(() => {
        if (connectionState.isConnecting && connectionState.reconnectAttempts > 0 &&
            currentPayloadRef.current && eventHandlerRef.current && connectSSERef.current) {

            const delay = calculateReconnectDelay(connectionState.reconnectAttempts - 1);

            reconnectTimerRef.current = setTimeout(() => {
                if (currentPayloadRef.current && eventHandlerRef.current && connectSSERef.current) {
                    connectSSERef.current(currentPayloadRef.current, eventHandlerRef.current);
                }
            }, delay);
        }
    }, [connectionState.isConnecting, connectionState.reconnectAttempts, calculateReconnectDelay]);

    // Main connection function
    const connectSSE = useCallback(async (payload: any, onEvent: SSEEventHandler) => {
        cleanup();

        currentPayloadRef.current = payload;
        eventHandlerRef.current = onEvent;

        setConnectionState(prev => ({
            ...prev,
            isConnecting: true,
            error: null,
            isConnected: false
        }));

        // Setup connection timeout
        connectionTimeoutRef.current = setTimeout(() => {
            setConnectionState(currentState => {
                if (!currentState.isConnected) {
                    console.error('SSE: Connection timeout');
                    abortControllerRef.current?.abort();
                    // Trigger reconnection by updating state
                    return {
                        ...currentState,
                        error: 'Connection timeout',
                        isConnecting: true,
                        reconnectAttempts: currentState.reconnectAttempts + 1
                    };
                }
                return currentState;
            });
        }, sseConfig.connectionTimeout);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

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
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }

                    if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
                        const errorText = await response.text().catch(() => 'Unknown error');
                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                    }

                    console.log('SSE: Connection established');
                    setConnectionState(prev => ({
                        ...prev,
                        isConnected: true,
                        isConnecting: false,
                        reconnectAttempts: 0,
                        error: null,
                        lastActivity: Date.now()
                    }));

                    setupHeartbeat();
                    setupMessageTimeout();
                },

                onmessage: (msg) => {
                    updateActivity();
                    setupMessageTimeout(); // Reset message timeout on each message

                    const eventType = msg.event || 'chunk';
                    let eventData: any = msg.data;

                    // Safe JSON parsing
                    if (typeof eventData === 'string' && eventData.trim()) {
                        try {
                            eventData = JSON5.parse(eventData);
                        } catch (parseError) {
                            console.warn('SSE: JSON parse error, using raw data:', parseError);
                        }
                    }

                    try {
                        onEvent(eventType, eventData);
                    } catch (handlerError) {
                        console.error('SSE: Event handler error:', handlerError);
                    }
                },

                onerror: (err) => {
                    console.error('SSE: Connection error:', err);

                    if (!abortController.signal.aborted) {
                        setConnectionState(prev => ({
                            ...prev,
                            isConnected: false,
                            isConnecting: true,
                            error: err instanceof Error ? err.message : 'Connection error',
                            reconnectAttempts: prev.reconnectAttempts + 1
                        }));
                    }

                    throw err;
                },

                onclose: () => {
                    console.log('SSE: Connection closed');
                    setConnectionState(prev => ({
                        ...prev,
                        isConnected: false,
                        isConnecting: false
                    }));
                },

                openWhenHidden: true,
                fetch: fetch,
            });

        } catch (error: any) {
            console.error('SSE: Fatal error:', error);

            if (error.name !== 'AbortError' && !abortController.signal.aborted) {
                setConnectionState(prev => ({
                    ...prev,
                    error: error.message || 'Unknown connection error',
                    isConnected: false,
                    isConnecting: false
                }));
            }
        }
    }, [sseConfig, cleanup, updateActivity, setupHeartbeat, setupMessageTimeout]);

    // Assign connectSSE to ref to break circular dependency
    useEffect(() => {
        connectSSERef.current = connectSSE;
    }, [connectSSE]);

    // Disconnect function
    const disconnect = useCallback(() => {
        console.log('SSE: Manual disconnect');
        cleanup();
        currentPayloadRef.current = null;
        eventHandlerRef.current = null;

        setConnectionState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
            error: null,
            reconnectAttempts: 0
        }));
    }, [cleanup]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Return the connection state and control functions
    return useMemo(() => ({
        connectionState,
        connect: connectSSE,
        disconnect
    }), [connectionState, connectSSE, disconnect]);
};
