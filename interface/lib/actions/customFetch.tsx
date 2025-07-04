import { logger } from '@/lib/logger';

interface FetchOptions extends RequestInit {
    requireAuth?: boolean;
}

function handleUnauthorizedError() {
    localStorage.removeItem("token");
    alert("Your session has expired. Please log in again.");
    window.location.href = '/user/login';
}

export async function customFetch(url: string, options: FetchOptions = {}) {
    const apiUrl = process.env.API_URL;
    const { requireAuth = true, ...restOptions } = options;  // 默认需要 token
    
    let headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    // 只有在需要认证时才添加 token
    if (requireAuth) {
        const token = localStorage.getItem("token");
        if (token) {
            headers = {
                ...headers,
                "Authorization": `Bearer ${token}`,
            };
        }
    }

    logger.log(`${apiUrl}${url}`);
    logger.log(options);
    
    const response = await fetch(`${apiUrl}${url}`, {
        ...restOptions,
        headers: {
            ...headers,
            ...restOptions.headers, // 保留可能传入的其他 headers
        },
    });

    if (requireAuth && response.status === 401) {
        handleUnauthorizedError();
        throw new Error('Unauthorized: Token has expired or is invalid.');
    }

    if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`);
    }

    return response.json();
}
