"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FaFilePdf } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";

interface UploadedFile {
  id: string;
  file: File;
}

const UploadArea = ({
  onDrop,
  errorMessage,
}: {
  onDrop: (files: File[]) => void;
  errorMessage: string | null;
}) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    maxFiles: 1, // 限制上传一个文件
  });

  return (
    <div
      {...getRootProps({
        className: "flex flex-col items-center justify-center w-full max-w-4xl border border-dashed border-gray-400 p-8 rounded-lg cursor-pointer hover:border-blue-500 transition ease-in-out duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      })}
      aria-label="Drag and drop a PDF file or click to upload"
    >
      <input {...getInputProps()} aria-label="File Input" />
      <FaFilePdf className="text-blue-500 text-5xl mb-3 animate-bounce" />
      <p className="font-semibold text-lg text-text-primary">
        Drag and drop a PDF file here, or click to select
      </p>
      <p className="text-sm text-text-secondary">Only one PDF file is allowed</p>
      {errorMessage && (
        <p className="text-red-500 font-medium mt-4 animate-pulse">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

const FileItem = ({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: (id: string) => void;
}) => {
  return (
    <div className="flex items-center justify-between border border-gray-300 rounded-lg p-3 mb-2 bg-secondary w-full">
      <div className="flex items-center space-x-3">
        <FaFilePdf className="text-blue-500 text-2xl" />
        <span className="text-sm text-text-secondary">{file.file.name}</span>
      </div>
      <button
        onClick={() => onRemove(file.id)}
        className="text-red-500 hover:text-red-700 transition"
        aria-label={`Remove ${file.file.name}`}
      >
        <AiOutlineClose className="text-lg" />
      </button>
    </div>
  );
};

const PaperUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (files.length > 0) {
      setErrorMessage("Only one file can be uploaded at a time.");
      return;
    }

    const newFiles = acceptedFiles
      .filter((file) => file.type === "application/pdf")
      .map((file) => ({ id: crypto.randomUUID(), file }));

    if (newFiles.length < acceptedFiles.length) {
      setErrorMessage("Some files were not PDFs and were skipped.");
    } else {
      setErrorMessage(null);
    }

    setFiles(newFiles);
  }, [files]);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleExtract = async () => {
    if (files.length === 0) {
      setErrorMessage("Please upload a file before extracting.");
      return;
    }

    setIsExtracting(true);
    setTaskStatus("Uploading file...");

    const formData = new FormData();
    formData.append("file", files[0].file);

    try {
      // Step 1: Send the file to the knowledge extraction endpoint
      const response = await fetch("http://120.55.193.195:3050/api/knowledge_extraction", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Failed to upload the file.");
        setIsExtracting(false);
        return;
      }

      const { task_id } = await response.json();
      setTaskStatus("File uploaded. Waiting for extraction...");

      // Step 2: Poll for task status
      const pollInterval = 3000; // 3 seconds
      const checkTaskStatus = async () => {
        const statusResponse = await fetch(
          `http://120.55.193.195:3050/api/task_status/${task_id}`
        );
        const statusData = await statusResponse.json();

        if (statusResponse.status === 200 && statusData.state === "SUCCESS") {
          setTaskStatus("Extraction completed successfully!");
          setIsExtracting(false);
          clearInterval(polling);
        } else if (statusData.state === "FAILURE") {
          setTaskStatus(`Extraction failed: ${statusData.error}`);
          setIsExtracting(false);
          clearInterval(polling);
        } else {
          setTaskStatus(statusData.status || "Pending...");
        }
      };

      const polling = setInterval(checkTaskStatus, pollInterval);
    } catch (error) {
      setErrorMessage("An error occurred during extraction.");
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-primary min-h-screen p-6">
      {/* 上传区域 */}
      <UploadArea onDrop={onDrop} errorMessage={errorMessage} />

      {/* 文件列表 */}
      <div className="mt-6 w-full max-w-4xl border border-gray-300 
        rounded-lg p-4 bg-secondary shadow-md">
        {files.length === 0 ? (
          <p className="text-text-secondary text-center">No file uploaded</p>
        ) : (
          <div>
            {files.map((file) => (
              <FileItem key={file.id} file={file} onRemove={handleRemoveFile} />
            ))}
          </div>
        )}
      </div>

      {/* 提取按钮 */}
      {files.length > 0 && (
        <button
          onClick={handleExtract}
          disabled={isExtracting}
          className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isExtracting ? "Extracting..." : "Extract"}
        </button>
      )}

      {/* 状态消息 */}
      {taskStatus && (
        <p className="mt-4 text-text-primary font-medium">{taskStatus}</p>
      )}
    </div>
  );
};

export default PaperUpload;
