import mammoth from 'mammoth';
import {
  FaFileImage,
  FaFileWord,
  FaFileExcel,
  FaFileCode,
  FaFileAlt,
} from 'react-icons/fa';

export const getFileExtension = (fileName: string) => {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
};

export const renderFileIcon = (file: File) => {
  const extension = getFileExtension(file.name);

  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return <FaFileImage className="text-blue-500 text-2xl" />;
    case 'doc':
    case 'docx':
      return <FaFileWord className="text-blue-700 text-2xl" />;
    case 'xls':
    case 'xlsx':
      return <FaFileExcel className="text-green-500 text-2xl" />;
    case 'md':
      return <FaFileCode className="text-purple-500 text-2xl" />;
    case 'txt':
      return <FaFileAlt className="text-gray-500 text-2xl" />;
    default:
      return <FaFileAlt className="text-gray-500 text-2xl" />;
  }
};

export const readFileContent = async (file: File): Promise<string> => {
  const extension = getFileExtension(file.name);

  if (extension === 'txt' || extension === 'md') {
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
  } else if (extension === 'docx' || extension === 'doc') {
    return await extractTextFromDocx(file);
  } else {
    throw new Error('Unsupported file type.');
  }
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Could not read file as ArrayBuffer.'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
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