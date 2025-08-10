import { customFetch } from '@/lib/actions/customFetch';
import useAuthStore from '@/lib/hooks/auth-store';
import Dialog from '@/components/ui/dialog';
import { logger } from '@/lib/logger';

// --------------------------------------------------------------------

export async function fetchLogin(email: string, password: string) {
    try {
        const result = await customFetch(`/api/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
            requireAuth: false
        });

        const { setUserData } = useAuthStore.getState();
        setUserData({
            email,
            name: result.user.name,
            password,
            userType: result.user.user_type,
            token: result.token,
            id: result.user._id,
            apiKey: result.user.api_key,
            apiUrl: result.user.api_url,
            modelName: result.user.model_name,
        });

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function fetchRegister(email: string, name: string, password: string, user_type: string) {
    try {
        const result = await customFetch(`/api/register`, {
            method: "POST",
            body: JSON.stringify({ email, name, password, user_type }),
            requireAuth: false
        });

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// --------------------------------------------------------------------

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

// --------------------------------------------------------------------
