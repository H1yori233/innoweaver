import { FaFileAlt, FaFileWord, FaFileExcel, FaFilePdf, FaFileCode } from 'react-icons/fa';
import { processFileContent } from '@/lib/hooks/file-process';

// 文件大小限制 (1MB)
export const MAX_FILE_SIZE = 1048576; 

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.markdown'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export const getFileExtension = (fileName: string) => {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
};

export const renderFileIcon = (file: File) => {
  const extension = getFileExtension(file.name);
  
  switch (extension) {
    case 'doc':
    case 'docx':
      return <FaFileWord className="text-blue-500 text-2xl" />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FaFileExcel className="text-green-500 text-2xl" />;
    case 'pdf':
      return <FaFilePdf className="text-red-500 text-2xl" />;
    case 'md':
    case 'markdown':
      return <FaFileCode className="text-purple-500 text-2xl" />;
    default:
      return <FaFileAlt className="text-gray-500 text-2xl" />;
  }
};

export const validateFile = (file: File): { valid: boolean; errorMessage?: string } => {
  // 检查文件类型
  const extension = getFileExtension(file.name);
  const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES).flat();
  
  if (!supportedExtensions.includes(`.${extension}`)) {
    return { 
      valid: false, 
      errorMessage: `不支持的文件类型。支持的文件格式：${supportedExtensions.join(', ')}` 
    };
  }
  
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      errorMessage: "文件过大。文件大小不能超过 1MB。" 
    };
  }
  
  return { valid: true };
};

export const readFileContent = async (file: File): Promise<string> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errorMessage);
  }

  try {
    // 使用现有的文件处理功能
    return await processFileContent(file);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("文件处理错误:", error);
      throw new Error(`文件处理失败：${error.message}`);
    } else {
      console.error("文件处理错误:", error);
      throw new Error("文件处理失败：未知错误");
    }
  }
};

export const handleFileUpload = (
  file: File, 
  setFile: (file: File | null) => void,
  showToast: (title: string, description: string) => void
): void => {
  const validation = validateFile(file);
  
  if (!validation.valid && validation.errorMessage) {
    showToast("错误", validation.errorMessage);
    return;
  }
  
  setFile(file);
};

export const extractErrorMessage = (error: any) => {
  if (!error) return 'Unknown error occurred';
  
  // 如果错误是字符串，直接返回
  if (typeof error === 'string') return error;
  
  // 如果错误是对象
  if (typeof error === 'object') {
    // 如果有message属性
    if (error.message) {
      try {
        // 尝试解析message是否为JSON字符串
        if (typeof error.message === 'string' && 
            (error.message.startsWith('{') || error.message.startsWith('['))) {
          const parsed = JSON.parse(error.message);
          if (parsed.detail) return parsed.detail;
          if (parsed.message) return parsed.message;
          return JSON.stringify(parsed, null, 2);
        }
        return error.message;
      } catch (e) {
        // 如果解析失败，返回原始message
        return error.message;
      }
    }
    
    // 如果有detail属性
    if (error.detail) return error.detail;
    
    // 如果有response属性
    if (error.response) {
      if (error.response.data && error.response.data.message) {
        return error.response.data.message;
      }
      if (error.response.statusText) {
        return `${error.response.status}: ${error.response.statusText}`;
      }
    }
    
    // 尝试将整个对象转为字符串
    try {
      return JSON.stringify(error, null, 2);
    } catch (e) {
      return 'Error object could not be stringified';
    }
  }
  
  // 其他类型的错误
  return 'An unexpected error occurred';
}; 