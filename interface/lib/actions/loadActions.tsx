import { customFetch } from '@/lib/actions/customFetch';

// 加载用户的解决方案，需要认证
export async function fetchLoadSolutions(page = 1) {
    return customFetch(`/api/user/load_solutions?page=${page}`, { 
        method: "GET",
        requireAuth: true  // 明确需要认证
    });
}

// 加载用户点赞的解决方案，需要认证
export async function fetchLoadLikedSolutions(page = 1) {
    return customFetch(`/api/user/load_liked_solutions?page=${page}`, { 
        method: "GET",
        requireAuth: true  // 明确需要认证
    });
}

// --------------------------------------------------------------------

export interface LogEntry {
    timestamp: string;
    level: string;
    name: string;
    message: string;
}

export interface LogStats {
    total_logs: number;
    error_count: number;
    warn_count: number;
    info_count: number;
    debug_count: number;
}

// 获取日志列表，需要认证
export async function fetchLogs(): Promise<LogEntry[]> {
    const response = await customFetch(`/api/logs`, { 
        method: "GET",
        requireAuth: true  // 明确需要认证
    });
    return response;
}

// 获取日志统计信息，需要认证
export async function fetchLogStats(): Promise<LogStats> {
    const response = await customFetch(`/api/logs/stats`, { 
        method: "GET",
        requireAuth: true  // 明确需要认证
    });
    return response;
} 

// --------------------------------------------------------------------

// 查看提示词，需要认证
export async function fetchViewPrompts() {
    return customFetch(`/api/prompts`, { 
        method: "GET",
        requireAuth: true  // 明确需要认证
    });
}

// 修改提示词，需要认证
export async function fetchModifyPrompt(promptName: string, newContent: string) {
    return customFetch(`/api/prompts`, {
        method: "PUT",
        body: JSON.stringify({
            prompt_name: promptName,
            new_content: newContent,
        }),
        requireAuth: true  // 明确需要认证
    });
}

// --------------------------------------------------------------------