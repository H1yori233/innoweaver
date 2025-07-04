import { customFetch } from './customFetch';

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