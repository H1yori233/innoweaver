import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaTimes } from 'react-icons/fa';
import { readFileContent } from './FileUtils';

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
        setError('Failed to read file content. The file might be corrupted or too large.');
      } finally {
        setLoading(false);
      }
    };

    loadFileContent();
  }, [file]);

  if (!file) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header with file info and close button */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700/30">
        <div className="flex items-center">
          <FaFileAlt className="mr-3 text-gray-400 text-xl" />
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{file.name}</h2>
            <div className="text-sm text-gray-400">
              {(file.size / 1024).toFixed(2)} KB • Plain Text
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

      {/* File content area */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse text-gray-400">Loading file content...</div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <pre className="font-mono text-sm whitespace-pre-wrap break-words text-text-primary">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};

export default FileContent; 