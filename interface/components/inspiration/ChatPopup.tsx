import { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane, FaStop } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import useAuthStore from "@/lib/hooks/auth-store";
import { logger } from "@/lib/logger";
import { useChatSSE } from "@/lib/hooks/useChatSSE";

// Define a clear type for messages
interface Message {
    type: 'user' | 'bot';
    content: string;
    timestamp: number;
    status?: 'sending' | 'sent' | 'error';
}

interface ChatPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize: () => void;
    inspirationId: string;
    solution: any;
}

const ChatPopup = ({ isOpen, onClose, onMinimize, inspirationId, solution }: ChatPopupProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { apiKey } = useAuthStore();

    // Instantiate the SSE hook
    const { connect, disconnect, connectionState } = useChatSSE({
        url: `${process.env.NEXT_PUBLIC_API_URL}/api/inspiration/chat`,
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, streamingContent]);

    // Effect to set the initial welcome message
    useEffect(() => {
        if (solution && messages.length === 0) {
            setMessages([{
                type: 'bot',
                content: `Hi! I'm here to help you understand more about "${solution.solution?.Title}". What would you like to know?`,
                timestamp: Date.now(),
            }]);
        }
    }, [solution, messages.length]);

    // Define the event handler for SSE messages
    const handleSSEEvent = (eventType: string, data: any) => {
        switch (eventType) {
            case 'chunk':
                if (data.content) {
                    setStreamingContent(data.content);
                }
                break;

            case 'result':
                if (data.content) {
                    setMessages(prev => [
                        ...prev,
                        { type: 'bot', content: data.content, timestamp: Date.now() }
                    ]);
                }
                setStreamingContent("");
                setIsLoading(false);
                break;

            case 'error':
                toast({
                    title: "Streaming Error",
                    description: String(data),
                });
                setStreamingContent("");
                setIsLoading(false);
                break;

            case 'end':
                // This 'end' event is sent by the backend when the stream naturally finishes.
                // If there's still streaming content (e.g., if a 'result' event wasn't sent),
                // we add it as the final message.
                if (streamingContent) {
                    setMessages(prev => [
                        ...prev,
                        { type: 'bot', content: streamingContent, timestamp: Date.now() }
                    ]);
                }
                setStreamingContent("");
                setIsLoading(false);
                disconnect();
                break;
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        if (!apiKey) {
            toast({
                title: "API Key Missing",
                description: "Please set your API key in your profile settings.",
            });
            return;
        }

        const userMessage: Message = {
            type: 'user',
            content: inputMessage,
            timestamp: Date.now(),
            status: 'sent',
        };

        const messageHistory = messages.map(msg => ({
            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
        }));

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputMessage;
        setInputMessage('');
        setIsLoading(true);
        setStreamingContent("");

        const payload = {
            inspiration_id: inspirationId,
            new_message: currentInput,
            chat_history: messageHistory,
        };

        await connect(payload, handleSSEEvent);
    };

    /**
     * New function to handle stopping the SSE stream.
     */
    const handleStopStreaming = () => {
        logger.info("User is stopping the stream.");
        disconnect(); // This aborts the fetch request via the AbortController in the hook.
        setIsLoading(false);

        // Add a message to the chat to indicate the user stopped the generation.
        // We use the last known streaming content as the partial result.
        const finalContent = streamingContent ? streamingContent : "Generation stopped by user.";
        setMessages(prev => [
            ...prev,
            { type: 'bot', content: finalContent, timestamp: Date.now() }
        ]);
        setStreamingContent(""); // Clear the temporary streaming display
    };

    // Effect to watch for connection errors from the hook
    useEffect(() => {
        if (connectionState.error) {
            toast({
                title: "Connection Failed",
                description: connectionState.error,
            });
            setIsLoading(false);
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.type === 'user') {
                    return [...prev.slice(0, -1), { ...lastMsg, status: 'error' }];
                }
                return prev;
            });
        }
    }, [connectionState.error, toast]);

    const formatTimestamp = (timestamp: number) => {
        return new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
        }).format(new Date(timestamp));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className={`fixed right-12 bottom-24 w-[450px] bg-secondary rounded-lg shadow-lg z-50 overflow-hidden`}
                    style={{ height: '500px' }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 bg-primary">
                        <div className="flex items-center gap-2">
                            <h3 className="text-text-primary font-semibold">Chat with AI</h3>
                            {isLoading && (
                                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-primary">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className="flex flex-col max-w-[80%] gap-1">
                                    <div className={`p-3 rounded-lg shadow-sm ${message.type === 'user' ? 'bg-primary text-text-primary border border-border-secondary' : 'bg-secondary text-text-primary'} ${message.status === 'error' ? 'opacity-50' : ''}`}>
                                        {message.content}
                                    </div>
                                    <div className={`text-xs text-text-secondary ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                                        {formatTimestamp(message.timestamp)}
                                        {message.status === 'error' && <span className="text-destructive ml-1">Send failed</span>}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {streamingContent && (
                            <div className="flex justify-start">
                                <div className="flex flex-col max-w-[80%] gap-1">
                                    <div className="p-3 rounded-lg shadow-sm bg-secondary text-text-primary">
                                        {streamingContent}
                                    </div>
                                    <div className="text-xs text-text-secondary text-left">
                                        Just now
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-border bg-secondary">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                                placeholder="Type your message..."
                                disabled={isLoading}
                                className="flex-1 p-2 rounded-lg bg-primary text-text-primary border border-border focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 placeholder:text-text-secondary"
                            />

                            {/* --- MODIFIED BUTTON --- */}
                            {/* This block now conditionally renders the Send or Stop button */}
                            {isLoading ? (
                                <button
                                    onClick={handleStopStreaming}
                                    className="p-3 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                                    title="Stop generation"
                                >
                                    <FaStop className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSendMessage}
                                    className="p-3 bg-primary text-text-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!inputMessage.trim()}
                                    title="Send message"
                                >
                                    <FaPaperPlane className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatPopup;