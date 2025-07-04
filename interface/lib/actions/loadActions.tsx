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

// 加载画廊，不需要认证
export async function fetchGallery(page = 1) {
    return customFetch(`/api/gallery?page=${page}`, { 
        method: "GET",
        requireAuth: false  // 明确不需要认证
    });
}
