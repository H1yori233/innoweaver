import { FaFileAlt, FaFileWord, FaFilePdf, FaFileCode, FaTimes } from 'react-icons/fa';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { extractRawText } from 'mammoth';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  
  // Alternative worker sources as fallbacks
  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
}

// File size limit (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported file types - only txt, word, markdown, and pdf
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

// Get file extension from filename
export const getFileExtension = (fileName: string): string => {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
};

// Determine file type based on extension and MIME type
export const getFileType = (file: File): string => {
  const extension = getFileExtension(file.name);
  
  // Check by MIME type first
  if (file.type && Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
    return file.type;
  }
  
  // Check by extension
  for (const [mimeType, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (extensions.includes(`.${extension}`)) {
      return mimeType;
    }
  }
  
  return 'unknown';
};

// Render appropriate icon for file type
export const renderFileIcon = (file: File) => {
  const fileType = getFileType(file);
  
  switch (fileType) {
    case 'application/pdf':
      return <FaFilePdf className="text-red-500 text-2xl" />;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return <FaFileWord className="text-blue-500 text-2xl" />;
    case 'text/markdown':
      return <FaFileCode className="text-purple-500 text-2xl" />;
    default:
      return <FaFileAlt className="text-gray-500 text-2xl" />;
  }
};

// Get human-readable file type label
export const getFileTypeLabel = (file: File): string => {
  const fileType = getFileType(file);
  
  switch (fileType) {
    case 'application/pdf':
      return 'PDF Document';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Word Document (DOCX)';
    case 'application/msword':
      return 'Word Document (DOC)';
    case 'text/plain':
      return 'Plain Text';
    case 'text/markdown':
      return 'Markdown Document';
    default:
      return 'Unknown File';
  }
};

// Validate file type and size
export const validateFile = (file: File): { valid: boolean; errorMessage?: string } => {
  // Check file type
  const fileType = getFileType(file);
  if (fileType === 'unknown') {
    return { 
      valid: false, 
      errorMessage: 'Unsupported file type. Please upload PDF, Word, TXT, or Markdown files.' 
    };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      errorMessage: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.` 
    };
  }
  
  // Check if file is empty
  if (file.size === 0) {
    return { 
      valid: false, 
      errorMessage: 'File is empty. Please select a valid file.' 
    };
  }
  
  return { valid: true };
};

// Extract text from PDF files with comprehensive error handling
const extractPDFText = async (file: File): Promise<string> => {
  try {
    console.log('Starting PDF extraction for:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    console.log('PDF ArrayBuffer size:', arrayBuffer.byteLength);
    
    // Configure PDF.js for this specific extraction
    const loadingTask = getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    
    console.log('PDF loading task created');
    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        console.log(`Processing page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        if (pageText) {
          fullText += `Page ${i}:\n${pageText}\n\n`;
        }
        console.log(`Page ${i} processed, text length:`, pageText.length);
      } catch (pageError) {
        console.error(`Error reading page ${i}:`, pageError);
        fullText += `Page ${i}: [Error extracting text from this page]\n\n`;
      }
    }
    
    const result = fullText || 'No text content found in PDF';
    console.log('PDF extraction completed, total text length:', result.length);
    return result;
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('workerSrc')) {
        throw new Error('PDF worker not configured properly. Please refresh the page and try again.');
      } else if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid or corrupted PDF file. Please try a different file.');
      } else if (error.message.includes('password')) {
        throw new Error('Password-protected PDFs are not supported.');
      } else {
        throw new Error(`PDF reading failed: ${error.message}`);
      }
    }
    
    throw new Error('PDF reading failed: Unknown error occurred');
  }
};

// Extract text from Word documents
const extractWordText = async (file: File): Promise<string> => {
  try {
    console.log('Starting Word extraction for:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    const result = await extractRawText({ arrayBuffer });
    const text = result.value || 'No text content found in Word document';
    console.log('Word extraction completed, text length:', text.length);
    return text;
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error(`Word document reading failed: ${error instanceof Error ? error.message : 'Unknown Word error'}`);
  }
};

// Extract text from plain text files (txt, md)
const extractPlainText = async (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    console.log('Starting plain text extraction for:', file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const text = result || 'File appears to be empty';
        console.log('Plain text extraction completed, text length:', text.length);
        resolve(text);
      } else {
        reject(new Error('Failed to read file as text.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file.'));
    reader.readAsText(file, 'UTF-8');
  });
};

// Main function to read file content based on type
export const readFileContent = async (file: File): Promise<string> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errorMessage);
  }

  const fileType = getFileType(file);
  console.log(`Reading file: ${file.name}, type: ${fileType}, size: ${file.size}`);
  
  try {
    switch (fileType) {
      case 'application/pdf':
        return await extractPDFText(file);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return await extractWordText(file);
      
      case 'text/plain':
      case 'text/markdown':
        return await extractPlainText(file);
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Handle file upload with validation
export const handleFileUpload = (
  file: File, 
  setFile: (file: File | null) => void,
  showToast: (title: string, description: string) => void
): void => {
  const validation = validateFile(file);
  
  if (!validation.valid && validation.errorMessage) {
    showToast("Upload Error", validation.errorMessage);
    return;
  }
  
  setFile(file);
  showToast("File Uploaded", `Successfully uploaded ${file.name}`);
};

// Extract error message from various error types
export const extractErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object') {
    if (error.message) return error.message;
    if (error.detail) return error.detail;
    
    if (error.response) {
      if (error.response.data && error.response.data.message) {
        return error.response.data.message;
      }
      if (error.response.statusText) {
        return `${error.response.status}: ${error.response.statusText}`;
      }
    }
    
    try {
      return JSON.stringify(error, null, 2);
    } catch (e) {
      return 'Error object could not be processed';
    }
  }
  
  return 'An unexpected error occurred';
}; 