import { FaFileAlt } from 'react-icons/fa';

// 文件大小限制 (1MB)
export const MAX_FILE_SIZE = 1048576; 

export const getFileExtension = (fileName: string) => {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
};

export const renderFileIcon = (file: File) => {
  return <FaFileAlt className="text-gray-500 text-2xl" />;
};

export const validateFile = (file: File): { valid: boolean; errorMessage?: string } => {
  // 检查文件类型
  const extension = getFileExtension(file.name);
  if (extension !== 'txt') {
    return { 
      valid: false, 
      errorMessage: "Invalid File Type. Only .txt files are supported." 
    };
  }
  
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      errorMessage: "File Too Large. File size exceeds the 1MB limit." 
    };
  }
  
  return { valid: true };
};

export const readFileContent = async (file: File): Promise<string> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errorMessage);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('File content is not a string.'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
};

export const handleFileUpload = (
  file: File, 
  setFile: (file: File | null) => void,
  showToast: (title: string, description: string) => void
): void => {
  const validation = validateFile(file);
  
  if (!validation.valid && validation.errorMessage) {
    showToast("Error", validation.errorMessage);
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