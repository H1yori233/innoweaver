import { extractErrorMessage } from './FileUtils';
import { logger } from '@/lib/logger';

export const callQueryAnalysis = async (
  inputText: string,
  files: File[],
  setAnalysisResult: React.Dispatch<React.SetStateAction<any>>,
  setIsAnalysisLoading: React.Dispatch<React.SetStateAction<boolean>>,
  readFileContent: (file: File) => Promise<string>,
  fetchQueryAnalysis: (input: string, fileContent: string) => Promise<any>,
  toast: any
) => {
  try {
    setIsAnalysisLoading(true);
    let fileContent = '';
    if (files && files.length > 0) {
      const file = files[0];
      fileContent = await readFileContent(file);
      logger.log('File content:', fileContent);
    }

    // 确保输入是有效的JSON格式
    let queryInput = inputText;
    try {
      // 如果输入是JSON对象字符串，解析它以确保格式正确
      if (inputText.trim().startsWith('{') && inputText.trim().endsWith('}')) {
        const parsedInput = JSON.parse(inputText);
        queryInput = JSON.stringify(parsedInput); // 重新序列化以确保格式正确
      }
    } catch (parseError) {
      logger.warn('Input is not valid JSON, using as plain text:', parseError);
      // 如果解析失败，使用原始输入文本
    }

    logger.log('Sending query:', queryInput);
    const response = await fetchQueryAnalysis(queryInput, fileContent);
    logger.log('Raw response from API:', response);
    
    // 安全地处理响应数据
    let result;
    if (typeof response === 'string') {
      try {
        // 如果是字符串，尝试解析为JSON
        result = JSON.parse(response);
      } catch (parseError) {
        logger.error('Error parsing response as JSON:', parseError);
        // 如果解析失败，使用原始字符串
        result = { rawResponse: response };
      }
    } else if (response && typeof response === 'object') {
      // 如果已经是对象，直接使用
      result = response;
    } else {
      // 其他情况，创建一个包含原始响应的对象
      result = { rawResponse: response || 'No response data' };
    }
    
    logger.log('Processed analysis result:', result);
    toast({
      title: "Analysis step completed",
      description: "Analysis step completed",
    });

    setAnalysisResult(result);
  } catch (error) {
    logger.error('Error fetching analysis:', error);
    toast({
      title: "Error",
      description: extractErrorMessage(error),
      type: "error"
    });
  } finally {
    setIsAnalysisLoading(false);
  }
};

export const callStepApi = async (
  url: string,
  data: any,
  setProgress: (progress: number) => void,
  setStatusMessage: (statusMessage: string) => void,
  setIntermediateData: (data: any) => void,
  setStageEmoji: (emoji: string) => void,
  setStageDescription: (description: string) => void,
  setCompleteResult: (result: any) => void,
  setIsCompleteLoading: (isLoading: boolean) => void,
  toast: any
) => {
  const apiUrl = process.env.API_URL;
  const token = localStorage.getItem("token");
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    };
    const body = JSON.stringify(data);
    const response = await fetch(`${apiUrl}${url}`, { method: 'POST', headers: headers, body: body });
    const result = await response.json();

    logger.log(result);
    setProgress(result.progress);
    setStatusMessage(result.status);
    
    // 更新中间态数据
    if (result.solution || (result.progress && result.status)) {
      setIntermediateData({...result}); // 使用展开运算符创建新对象，避免引用问题
    }

    // 根据进度设置当前阶段的emoji和描述
    if (result.progress <= 20) {
      setStageEmoji("🚀");
      setStageDescription("Initializing research process");
    } else if (result.progress < 30) {
      setStageEmoji("🔍");
      setStageDescription("Searching knowledge base for relevant information");
    } else if (result.progress < 40) {
      setStageEmoji("📚");
      setStageDescription("Analyzing research papers for inspiration");
    } else if (result.progress < 50) {
      setStageEmoji("💡");
      setStageDescription("Gathering inspiration from existing solutions");
    } else if (result.progress < 60) {
      setStageEmoji("🧠");
      setStageDescription("Domain Expert is processing materials");
    } else if (result.progress < 70) {
      setStageEmoji("🔄");
      setStageDescription("Interdisciplinary Expert is combining insights from different fields");
    } else if (result.progress < 80) {
      setStageEmoji("⚖️");
      setStageDescription("Evaluation Expert is assessing solution quality");
    } else if (result.progress < 90) {
      setStageEmoji("🎨");
      setStageDescription("Visualization Expert is creating conceptual illustrations");
    } else {
      setStageEmoji("✨");
      setStageDescription("Finalizing your research solutions");
    }

    // 检查是否为最终结果
    if (url.includes('/api/complete/final') && result.title && result.solutions) {
      setCompleteResult(result);
      setIsCompleteLoading(false);
    }

    // 显示进度和状态更新
    toast({
      title: "Status Update",
      description: result.status,
    });

    return result;
  } catch (error) {
    logger.error(`Error in ${url}:`, error);
    toast({
      title: "Error",
      description: extractErrorMessage(error),
    });
    throw error;
  }
}; 