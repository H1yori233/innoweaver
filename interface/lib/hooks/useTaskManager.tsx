import { useState } from "react";
import { logger } from '@/lib/logger';

const useTaskManager = (analysisResult) => {
    const [isCompleteLoading, setIsCompleteLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completeResult, setCompleteResult] = useState(null);

    async function callStepApi(url, data) {
        const apiUrl = process.env.API_URL;
        // const apiUrl = "http://120.55.193.195:5001";
        const token = localStorage.getItem("token");
        try {
            const headers = {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` }),
            };
            const body = JSON.stringify(data);
            const response = await fetch(`${apiUrl}${url}`, { method: 'POST', headers: headers, body: body, });
            const result = await response.json();

            logger.log(result);
            // setProgress(result.progress);
            // setStatusMessage(result.status);
            return result
        } catch (error) {
            console.error(`Error in ${url}:`, error);
            throw error;
        }
    }

    const handleGenerate = async () => {
        setIsCompleteLoading(true);
        setProgress(0);

        try {
            const initResponse = await callStepApi("/api/complete/initialize", { data: analysisResult });
            const taskId = initResponse.task_id;

            await callStepApi("/api/complete/rag", { task_id: taskId });
            await callStepApi("/api/complete/domain", { task_id: taskId });

            const result = await callStepApi("/api/complete/final", { task_id: taskId });
            setCompleteResult(result);
        } catch (error) {
            console.error("Error during task generation:", error);
        } finally {
            setIsCompleteLoading(false);
        }
    };

    const handleRegenerate = async () => {
        if (!completeResult) return;
        handleGenerate();
    };

    return {
        isCompleteLoading,
        progress,
        completeResult,
        handleGenerate,
        handleRegenerate,
    };
};

export default useTaskManager;
