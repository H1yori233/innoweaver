import { customFetch } from '@/lib/actions/customFetch';

// Request that doesn't require authentication
export async function fetchQuerySolution(solution_id: string) {
    return customFetch(`/api/query_solution?id=${solution_id}`, { 
        method: "GET",
        requireAuth: false  // Explicitly doesn't require authentication
    });
}

// Request that requires authentication
export async function fetchQueryLikedSolutions(solution_ids: string[]) {
    return customFetch(`/api/user/query_liked_solutions`, {
        method: "POST",
        body: JSON.stringify({
            solution_ids: solution_ids
        }),
        requireAuth: true  // Explicitly requires authentication
    });
}

// Request that doesn't require authentication - get single solution's like count
export async function fetchSolutionLikeCount(solution_id: string) {
    return customFetch(`/api/solution/${solution_id}/like_count`, {
        method: "GET",
        requireAuth: false  // Explicitly doesn't require authentication
    });
}