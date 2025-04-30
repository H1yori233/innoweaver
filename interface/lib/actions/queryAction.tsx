import { customFetch } from '@/lib/actions/customFetch';

// 不需要认证的请求
export async function fetchQuerySolution(solution_id: string) {
    return customFetch(`/api/query_solution?id=${solution_id}`, { 
        method: "GET",
        requireAuth: false  // 明确不需要认证
    });
}

// 不需要认证的请求
export async function fetchQueryPaper(paper_id: string) {
    return customFetch(`/api/query_paper?id=${paper_id}`, { 
        method: "GET",
        requireAuth: false  // 明确不需要认证
    });
}

// 需要认证的请求
export async function fetchQueryLikedSolutions(solution_ids: string[]) {
    return customFetch(`/api/user/query_liked_solutions`, {
        method: "POST",
        body: JSON.stringify({
            solution_ids: solution_ids
        }),
        requireAuth: true  // 明确需要认证
    });
}