import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { FaRedo, FaTimes } from 'react-icons/fa';
import { renderFileIcon } from './FileUtils';

// 消息类型
type MessageType = 'user' | 'system' | 'analysis' | 'loading' | 'file';

// 消息数据接口
interface MessageData {
  type: MessageType;
  content: string;
  data?: any;
  fileData?: File;
}

// 组件属性接口
interface ChatMessagesProps {
  messages: MessageData[];
  onRegenerateClick: (index: number, userMessageIndex: number) => void;
  onGenerateClick: () => void;
  onFileClick?: (file: File) => void;
  activeFile?: File | null;
  onDeleteFileMessage?: (index: number) => void;
}

/**
 * 聊天消息气泡组件
 * 负责渲染不同类型的消息气泡：用户消息、系统消息、分析结果、文件和加载状态
 */
const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  onRegenerateClick, 
  onGenerateClick,
  onFileClick,
  activeFile,
  onDeleteFileMessage
}) => {
  // 检查文件是否是当前活动文件
  const isActiveFile = (file: File) => {
    if (!activeFile) return false;
    return file.name === activeFile.name && file.size === activeFile.size;
  };

  return (
    <div className="flex flex-col space-y-3">
      {messages.map((message, index) => (
        <div key={index}>
          {/* 用户消息 */}
          {message.type === 'user' && (
            <div className="p-3 rounded-lg max-w-[85%] bg-blue-500/20 text-text-primary ml-auto shadow-sm">
              {message.content}
            </div>
          )}
          
          {/* 系统消息 */}
          {message.type === 'system' && (
            <div className="p-3 rounded-lg max-w-[85%] bg-secondary/50 text-text-secondary mr-auto shadow-sm">
              {message.content}
            </div>
          )}
          
          {/* 加载中状态 */}
          {message.type === 'loading' && (
            <div className="p-3 rounded-lg max-w-[85%] bg-secondary/50 text-text-secondary mr-auto shadow-sm flex items-center">
              <CircularProgress size={20} className="mr-2" />
              <span>Analyzing your request...</span>
            </div>
          )}
          
          {/* 文件消息 */}
          {message.type === 'file' && message.fileData && (
            <div className="relative ml-auto max-w-[85%]">
              <div 
                className={`p-3 rounded-lg bg-blue-500/20 text-text-primary shadow-sm flex items-center cursor-pointer hover:bg-blue-500/30 transition-colors
                  ${!isActiveFile(message.fileData) ? 'opacity-60' : ''}`}
                onClick={() => onFileClick && onFileClick(message.fileData)}
                title="Click to view file content"
              >
                {renderFileIcon(message.fileData)}
                <span className="truncate">{message.fileData.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  ({Math.round(message.fileData.size / 1024)} KB)
                </span>
                
                {!isActiveFile(message.fileData) && onDeleteFileMessage && (
                  <button 
                    className="ml-2 p-1 rounded-full hover:bg-gray-600/30 text-gray-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFileMessage(index);
                    }}
                    title="Remove this file"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
              
              {isActiveFile(message.fileData) && (
                <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border border-primary"></div>
              )}
            </div>
          )}
          
          {/* 分析结果 */}
          {message.type === 'analysis' && message.data && (
            <div className="p-4 rounded-lg w-full bg-secondary/50 text-text-secondary mr-auto shadow-sm">
              <div className="space-y-2.5">
                <div>
                  <span className="text-text-secondary font-bold text-sm">TARGET USER:</span>
                  <span className="ml-2 text-sm"> {message.data['Targeted User'] || 'N/A'} </span>
                </div>
                
                <div>
                  <span className="text-text-secondary font-bold text-sm">USAGE SCENARIO:</span>
                  <span className="ml-2 text-sm"> {message.data['Usage Scenario'] || 'N/A'} </span>
                </div>
                
                <div>
                  <span className="text-text-secondary font-bold text-sm">REQUIREMENTS:</span>
                  <span className="ml-2 text-sm">
                    {Array.isArray(message.data['Requirement'])
                      ? message.data['Requirement'].join(', ')
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="mt-8 flex justify-center space-x-3">
                  <button
                    className='bg-secondary hover:bg-gray-600 text-text-secondary 
                      font-medium py-1.5 px-4 rounded-lg transition-colors duration-200 shadow-sm 
                      flex items-center text-sm'
                    onClick={() => {
                      // 查找触发此分析的用户消息
                      const userMsgIndex = messages.findIndex((msg, idx) => 
                        idx < index && msg.type === 'user'
                      );
                      
                      if (userMsgIndex >= 0) {
                        onRegenerateClick(index, userMsgIndex);
                      }
                    }}
                  >
                    <FaRedo className="mr-1.5 text-sm" /> Regenerate
                  </button>
                  <button
                    className='bg-secondary hover:bg-blue-600 text-text-secondary
                      font-semibold py-1.5 px-4 rounded-lg transition-colors duration-200 shadow-sm 
                      flex items-center'
                    onClick={onGenerateClick}
                  >
                    Generate!
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