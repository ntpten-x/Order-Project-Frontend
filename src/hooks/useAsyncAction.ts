import { useCallback } from "react";
import { useGlobalLoading } from "../contexts/GlobalLoadingContext";
import { Modal } from "antd";

/**
 * Hook to wrap async actions with the global loading overlay.
 */
export const useAsyncAction = () => {
    const { showLoading, hideLoading } = useGlobalLoading();

    const execute = useCallback(async <T>(
        action: () => Promise<T>,
        loadingMessage: string = "กำลังดำเนินการ...",
        successMessage?: string,
        errorMessage: string = "เกิดข้อผิดพลาด"
    ): Promise<T | undefined> => {
        try {
            showLoading(loadingMessage);
            const result = await action();

            // Wait a bit to ensure the loading state is perceived (optional, sometimes good for UX)
            // await new Promise(resolve => setTimeout(resolve, 300));

            if (successMessage) {
                // Ideally use Antd message or notification, but for now we just return
                // The caller might want to show success message
                // Or we can integrate message.success here if we import it
            }
            return result;
        } catch (error) {
            console.error("Async action error:", error);
            Modal.error({
                title: 'ข้อผิดพลาด',
                content: (error as Error).message || errorMessage,
            });
            // throw error; // Optionally re-throw if caller needs to handle it too
            return undefined;
        } finally {
            hideLoading();
        }
    }, [showLoading, hideLoading]);

    return { execute };
};
