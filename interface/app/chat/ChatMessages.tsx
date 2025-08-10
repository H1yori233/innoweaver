import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { FaRedo, FaTimes } from 'react-icons/fa';
import { renderFileIcon, getFileTypeLabel } from './FileUtils';

// Message types
type MessageType = 'user' | 'system' | 'analysis' | 'loading' | 'file' | 'streaming';

// Message structure
interface MessageData {
  type: MessageType;
  content: string;
  data?: any;
  fileData?: File;
  streamingContent?: string;
}

// Component props
interface ChatMessagesProps {
  messages: MessageData[];
  onRegenerateClick: (index: number, userMessageIndex: number) => void;
  onGenerateClick: () => void;
  onFileClick?: (file: File) => void;
  activeFile?: File | null;
  onDeleteFileMessage?: (index: number) => void;
  streamingAnalysisContent?: string;
}

/**
 * Chat messages component with support for multiple file types
 */
const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  onRegenerateClick,
  onGenerateClick,
  onFileClick,
  activeFile,
  onDeleteFileMessage,
  streamingAnalysisContent = ''
}) => {
  // Check if file is currently being viewed
  const isActiveFile = (file: File) => {
    if (!activeFile) return false;
    return file.name === activeFile.name && file.size === activeFile.size;
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col space-y-3">
      {messages.map((message, index) => (
        <div key={index}>
          {/* User Message */}
          {message.type === 'user' && (
            <div className="p-3 rounded-lg max-w-[85%] bg-blue-500/20 text-text-primary ml-auto shadow-sm">
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          )}

          {/* System Message */}
          {message.type === 'system' && (
            <div className="p-3 rounded-lg max-w-[85%] bg-secondary/50 text-text-secondary mr-auto shadow-sm">
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          )}

          {/* Loading Indicator */}
          {message.type === 'loading' && (
            <div className="p-3 rounded-lg max-w-[85%] bg-secondary/50 text-text-secondary mr-auto shadow-sm flex items-center">
              <CircularProgress size={20} className="mr-2" />
              <span>Analyzing your request...</span>
            </div>
          )}

          {/* Streaming Analysis */}
          {message.type === 'streaming' && (
            <div className="p-4 rounded-lg w-full bg-secondary/50 text-text-secondary mr-auto shadow-sm">
              <div className="flex items-center mb-3">
                <CircularProgress size={20} className="mr-2" />
                <span className="font-medium">Analyzing your request...</span>
              </div>
              {streamingAnalysisContent && (
                <div className="bg-primary/30 rounded-lg p-3 mt-2 border border-gray-600/20">
                  <div className="text-sm text-text-primary whitespace-pre-wrap break-words">
                    {streamingAnalysisContent}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Message */}
          {message.type === 'file' && message.fileData && (
            <div className="relative ml-auto max-w-[85%]">
              <div
                className={`p-3 rounded-lg bg-blue-500/20 text-text-primary shadow-sm flex items-center cursor-pointer hover:bg-blue-500/30 transition-colors border-2 
                  ${isActiveFile(message.fileData) ? 'border-green-500/50' : 'border-transparent'}`}
                onClick={() => onFileClick && onFileClick(message.fileData)}
                title="Click to view file content"
              >
                <div className="mr-3">
                  {renderFileIcon(message.fileData)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{message.fileData.name}</div>
                  <div className="text-xs text-blue-300 mt-1">
                    {formatFileSize(message.fileData.size)} • {getFileTypeLabel(message.fileData)}
                  </div>
                </div>

                {/* Remove button */}
                {onDeleteFileMessage && (
                  <button
                    className="ml-2 p-1.5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFileMessage(index);
                    }}
                    title="Remove this file"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>

              {/* Active file indicator */}
              {isActiveFile(message.fileData) && (
                <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-primary animate-pulse"></div>
              )}
            </div>
          )}

          {/* Analysis Result */}
          {message.type === 'analysis' && message.data && (
            <div className="p-4 rounded-lg w-full bg-secondary/50 text-text-secondary mr-auto shadow-sm">
              <div className="space-y-3">
                {/* Analysis details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap">
                    <span className="text-text-secondary font-bold text-sm min-w-fit">TARGET USER:</span>
                    <span className="ml-2 text-sm flex-1">{message.data['Targeted User'] || 'Not specified'}</span>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="text-text-secondary font-bold text-sm min-w-fit">USAGE SCENARIO:</span>
                    <span className="ml-2 text-sm flex-1">{message.data['Usage Scenario'] || 'Not specified'}</span>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="text-text-secondary font-bold text-sm min-w-fit">REQUIREMENTS:</span>
                    <span className="ml-2 text-sm flex-1">
                      {Array.isArray(message.data['Requirement'])
                        ? message.data['Requirement'].join(', ')
                        : message.data['Requirement'] || 'Not specified'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    className="bg-secondary hover:bg-gray-600 text-text-secondary font-medium py-2 px-4 rounded-lg 
                      transition-colors duration-200 shadow-sm flex items-center text-sm"
                    onClick={() => {
                      // Find the user message that triggered this analysis
                      const userMsgIndex = messages.findIndex((msg, idx) =>
                        idx < index && msg.type === 'user'
                      );
                      if (userMsgIndex >= 0) {
                        onRegenerateClick(index, userMsgIndex);
                      }
                    }}
                  >
                    <FaRedo className="mr-2 text-sm" />
                    Regenerate
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg 
                      transition-colors duration-200 shadow-sm flex items-center text-sm"
                    onClick={onGenerateClick}
                  >
                    Generate Research!
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;