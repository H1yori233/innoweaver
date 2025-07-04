import { useState, useEffect, useRef } from "react";
import { FaMinusCircle, FaTimes, FaPaperPlane } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { fetchInspirationChat, fetchInspirationChatStream } from "@/lib/actions/taskActions";
import useAuthStore from "@/lib/hooks/auth-store";
import { logger } from "@/lib/logger";

interface ChatPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize: () => void;
    inspirationId: string;
    solution: any;
}

const ChatPopup = ({ isOpen, onClose, onMinimize, inspirationId, solution }: ChatPopupProps) => {
    const [messages, setMessages] = useState<Array<{
        type: 'user' | 'bot';
        content: string;
        timestamp: number;
        status?: 'sending' | 'sent' | 'error';
    }>>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { apiKey } = useAuthStore();

    // 滚动到最新消息
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent]);

    // 初始化欢迎消息
    useEffect(() => {
        if (solution && messages.length === 0) {
            setMessages([{
                type: 'bot',
                content: `Hi! I'm here to help you understand more about "${solution.solution?.Title}". What would you like to know?`,
                timestamp: Date.now()
            }]);
        }
    }, [solution, messages.length]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;
        
        if (!apiKey) {
            toast({
                title: "Error",
                description: "No API key found. Please set your API key in your profile settings."
            });
            return;
        }

        const userMessage = {
            type: 'user' as const,
            content: inputMessage,
            timestamp: Date.now(),
            status: 'sending' as const
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setStreamingContent("");

        try {
            // 创建消息历史记录
            const messageHistory = messages.map(msg => ({
                role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content
            }));
            logger.info("Start");

            // 获取流式响应
            const response = await fetchInspirationChatStream(
                inspirationId, 
                inputMessage, 
                messageHistory
            );
            
            // 更新发送状态
            setMessages(prev => 
                prev.map(msg => 
                    msg === userMessage ? { ...msg, status: 'sent' as const } : msg
                )
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            // 处理流式响应
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonData = JSON.parse(line.substring(6));
                            if (jsonData.content) {
                                setStreamingContent(jsonData.content);
                            }
                        } catch (e) {
                            console.error("解析SSE数据出错:", e);
                        }
                    }
                }
            }

            // 流结束后，添加完整消息
            if (streamingContent) {
                setMessages(prev => [
                    ...prev,
                    {
                        type: 'bot',
                        content: streamingContent,
                        timestamp: Date.now()
                    }
                ]);
                setStreamingContent("");
            }

            logger.info("End");
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to send message. Please try again."
            });
            setMessages(prev => 
                prev.map(msg => 
                    msg === userMessage ? { ...msg, status: 'error' as const } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric'
        }).format(new Date(timestamp));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className={`fixed right-12 bottom-24 w-[450px] bg-secondary rounded-lg shadow-lg
                        z-50 overflow-hidden`}
                    style={{
                        height: isMinimized ? '60px' : '500px'
                    }}
                >
                    {/* 头部 */}
                    <div className="flex justify-between items-center p-4 bg-primary">
                        <div className="flex items-center gap-2">
                            <h3 className="text-text-primary font-semibold">Chat with AI</h3>
                            {isLoading && (
                                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={onClose}
                                className="text-text-secondary hover:text-text-primary transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* 消息列表 */}
                            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-primary">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className="flex flex-col max-w-[80%] gap-1">
                                            <div
                                                className={`p-3 rounded-lg shadow-sm ${
                                                    message.type === 'user'
                                                        ? 'bg-primary text-text-primary border border-border-secondary'
                                                        : 'bg-secondary text-text-primary'
                                                } ${
                                                    message.status === 'error' ? 'opacity-50' : ''
                                                }`}
                                            >
                                                {message.content}
                                            </div>
                                            <div className={`text-xs text-text-secondary ${
                                                message.type === 'user' ? 'text-right' : 'text-left'
                                            }`}>
                                                {formatTimestamp(message.timestamp)}
                                                {message.status === 'error' && (
                                                    <span className="text-destructive ml-1">
                                                        Error sending message
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* 显示流式输出中的内容 */}
                                {streamingContent && (
                                    <div className="flex justify-start">
                                        <div className="flex flex-col max-w-[80%] gap-1">
                                            <div className="p-3 rounded-lg shadow-sm bg-secondary text-text-primary">
                                                {streamingContent}
                                            </div>
                                            <div className="text-xs text-text-secondary text-left">
                                                {formatTimestamp(Date.now())}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {/* 输入区域 */}
                            <div className="p-4 border-t border-border bg-secondary">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        disabled={isLoading}
                                        className="flex-1 p-2 rounded-lg bg-primary text-text-primary 
                                            border border-border focus:outline-none focus:ring-2 focus:ring-ring
                                            disabled:opacity-50 placeholder:text-text-secondary"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="p-2 bg-primary text-text-primary rounded-lg 
                                            hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        disabled={!inputMessage.trim() || isLoading}
                                    >
                                        <FaPaperPlane />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatPopup; 