import { customFetch } from '@/lib/actions/customFetch';
import useAuthStore from '@/lib/hooks/auth-store';
import Dialog from '@/components/ui/dialog';
import { logger } from '@/lib/logger';

let knowledgeExtractionController = new AbortController();
let queryAnalysisController = new AbortController();
let completeController = new AbortController();

function getApiKey() {
    const apiKey = localStorage.getItem('api_key');
    if (!apiKey) {
        throw new Error('API_KEY_REQUIRED');
    }
    return apiKey;
}

function handleAbort(controller) {
    if (controller) {
        controller.abort();
    }
    return new AbortController();
}

// 知识提取
export async function fetchKnowledgeExtraction(paper) {
    try {
        const apiKey = getApiKey();
        knowledgeExtractionController = handleAbort(knowledgeExtractionController);
        
        return await customFetch(`/api/knowledge_extraction`, {
            method: "POST",
            body: JSON.stringify({ paper }),
            signal: knowledgeExtractionController.signal,
            requireAuth: true
        });
    } catch (error) {
        if (error.message === 'API_KEY_REQUIRED') {
            return { error: 'API_KEY_REQUIRED' };
        }
        if (error.name === 'AbortError') {
            logger.log("Knowledge extraction request was aborted.");
        }
        throw error;
    }
}

// 查询分析
export async function fetchQueryAnalysis(query, designDoc) {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("请设置 API-KEY。");
        return null;
    }

    queryAnalysisController = handleAbort(queryAnalysisController);

    try {
        return await customFetch(`/api/query`, {
            method: "POST",
            body: JSON.stringify({ query, design_doc: designDoc }),
            signal: queryAnalysisController.signal,
            requireAuth: true
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            logger.log("Query analysis request was aborted.");
        } else {
            throw error;
        }
    }
}

// 完成任务
export async function fetchComplete(queryAnalysisResult) {
    logger.log(queryAnalysisResult);
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("请设置 API-KEY。");
        return null;
    }

    completeController = handleAbort(completeController);

    try {
        return await customFetch(`/api/complete`, {
            method: "POST",
            body: JSON.stringify(queryAnalysisResult),
            signal: completeController.signal,
            requireAuth: true
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            logger.log("Complete request was aborted.");
        } else {
            throw error;
        }
    }
}

// 点赞/取消点赞
export async function fetchLikeSolution(solution_id: string) {
    try {
        return await customFetch(`/api/user/like_solution`, {
            method: "POST",
            body: JSON.stringify({ _id: solution_id }),
            requireAuth: true
        });
    } catch (error) {
        throw new Error(`Failed to fetch like solution: ${error.message}`);
    }
}

// 设置 API-KEY
export async function fetchSetAPIKey(api_key: string, api_url?: string, model_name?: string) {
    try {
        return await customFetch(`/api/user/api_key`, {
            method: "POST",
            body: JSON.stringify({ api_key, api_url, model_name }),
            requireAuth: true
        });
    } catch (error) {
        throw new Error(`Failed to fetch API-Key set: ${error.message}`);
    }
}

// Test API connection
export async function fetchTestAPIConnection(api_key: string, api_url?: string, model_name?: string) {
    try {
        return await customFetch(`/api/user/test_api`, {
            method: "POST",
            body: JSON.stringify({ api_key, api_url, model_name }),
            requireAuth: true
        });
    } catch (error) {
        throw new Error(`Failed to test API connection: ${error.message}`);
    }
}

export const fetchInspirationChat = async (inspirationId: string, newMessage: string, chatHistory: any[] = []) => {
    try {
        const response = await customFetch('/api/inspiration/chat', {
            method: 'POST',
            body: JSON.stringify({
                inspiration_id: inspirationId,
                new_message: newMessage,
                chat_history: chatHistory
            }),
            requireAuth: true
        });
        return response;
    } catch (error) {
        logger.error('Error in fetchInspirationChat:', error);
        throw error;
    }
};

export const fetchInspirationChatStream = async (inspirationId: string, newMessage: string, chatHistory: any[] = []) => {
    try {
        const baseUrl = process.env.API_URL;
        const url = `${baseUrl}/api/inspiration/chat`;
        const token = localStorage.getItem("token");

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                inspiration_id: inspirationId,
                new_message: newMessage,
                chat_history: chatHistory,
                stream: true
            }),
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                alert("Your session has expired. Please log in again.");
                window.location.href = '/user/login';
                throw new Error('Unauthorized: Token has expired or is invalid.');
            }
            const errorDetails = await response.text();
            throw new Error(`Error: ${response.status} ${response.statusText} - ${errorDetails}`);
        }
        
        if (!response.body) {
            throw new Error("No response body received");
        }
        
        return response;
    } catch (error) {
        logger.error('Error in fetchInspirationChatStream:', error);
        throw error;
    }
};

// --------------------------------------------------------------------
