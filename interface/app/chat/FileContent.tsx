import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { readFileContent, renderFileIcon, getFileTypeLabel } from './FileUtils';

interface FileContentProps {
  file: File | null;
  onClose: () => void;
}

const FileContent: React.FC<FileContentProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    const loadFileContent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fileContent = await readFileContent(file);
        setContent(fileContent);
      } catch (err) {
        console.error('Error reading file:', err);
        setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadFileContent();
  }, [file]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getContentDisplay = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div className="text-gray-400">Loading file content...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
          <div className="font-medium mb-2">Error Reading File</div>
          <div className="text-sm">{error}</div>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-gray-400">No content available</div>
        </div>
      );
    }

    // Determine display style based on file type
    const fileTypeLabel = file ? getFileTypeLabel(file) : '';
    const isMarkdownFile = fileTypeLabel.includes('Markdown');
    const shouldUseMonospace = isMarkdownFile;
    
    return (
      <div className="space-y-4">
        {/* Content info */}
        <div className="bg-blue-500/10 text-blue-400 p-3 rounded-lg text-sm">
          <div className="font-medium">File Content</div>
          <div className="text-xs mt-1 opacity-80">
            {content.length.toLocaleString()} characters • {fileTypeLabel}
          </div>
        </div>

        {/* File content */}
        <div className={`${shouldUseMonospace ? 'font-mono' : 'font-sans'} text-sm whitespace-pre-wrap break-words text-text-primary bg-secondary/20 p-4 rounded-lg border border-gray-700/20 max-h-[70vh] overflow-auto`}>
          {content}
        </div>
      </div>
    );
  };

  if (!file) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700/30">
        <div className="flex items-center">
          <div className="mr-3">
            {renderFileIcon(file)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary truncate max-w-md" title={file.name}>
              {file.name}
            </h2>
            <div className="text-sm text-gray-400 flex items-center space-x-2">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{getFileTypeLabel(file)}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200/10 transition-colors text-gray-400 hover:text-text-primary"
          aria-label="Close file viewer"
        >
          <FaTimes />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {getContentDisplay()}
      </div>
    </div>
  );
};

export default FileContent; 