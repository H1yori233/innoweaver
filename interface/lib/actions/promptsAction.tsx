import { customFetch } from '@/lib/actions/customFetch';

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
