import { customFetch } from '@/lib/actions/customFetch';
import useAuthStore from "../hooks/auth-store";

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
