import { customFetch } from '@/lib/actions/customFetch';

// Load user's solutions, requires authentication
export async function fetchLoadSolutions(page = 1) {
    return customFetch(`/api/user/load_solutions?page=${page}`, { 
        method: "GET",
        requireAuth: true  // Explicitly requires authentication
    });
}

// Load user's liked solutions, requires authentication
export async function fetchLoadLikedSolutions(page = 1) {
    return customFetch(`/api/user/load_liked_solutions?page=${page}`, { 
        method: "GET",
        requireAuth: true  // Explicitly requires authentication
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

// Get log list, requires authentication
export async function fetchLogs(): Promise<LogEntry[]> {
    const response = await customFetch(`/api/logs`, { 
        method: "GET",
        requireAuth: true  // Explicitly requires authentication
    });
    return response;
}

// Get log statistics, requires authentication
export async function fetchLogStats(): Promise<LogStats> {
    const response = await customFetch(`/api/logs/stats`, { 
        method: "GET",
        requireAuth: true  // Explicitly requires authentication
    });
    return response;
} 

// --------------------------------------------------------------------

// View prompts, requires authentication
export async function fetchViewPrompts() {
    return customFetch(`/api/prompts`, { 
        method: "GET",
        requireAuth: true  // Explicitly requires authentication
    });
}

// Modify prompts, requires authentication
export async function fetchModifyPrompt(promptName: string, newContent: string) {
    return customFetch(`/api/prompts`, {
        method: "PUT",
        body: JSON.stringify({
            prompt_name: promptName,
            new_content: newContent,
        }),
        requireAuth: true  // Explicitly requires authentication
    });
}

// --------------------------------------------------------------------