import { useCallback } from "react";
import { useGlobalLoading } from "../contexts/pos/GlobalLoadingContext";
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
            showLoading(loadingMessage, "async");
            const result = await action();

            // Wait a bit to ensure the loading state is perceived (optional, sometimes good for UX)
            // await new Promise(resolve => setTimeout(resolve, 300));

            if (successMessage) {
                // Ideally use Antd message or notification, but for now we just return
                // The caller might want to show success message
                // Or we can integrate message.success here if we import it
            }
            return result;
        } catch (error: unknown) {
            console.error("Async action error:", error);
            let displayMessage = errorMessage;

            if (typeof error === 'string') {
                displayMessage = error;
            } else if (error instanceof Error) {
                displayMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                // Check for common API error formats
                const anyError = error as any;
                if (anyError.response?.data?.message) {
                    displayMessage = anyError.response.data.message;
                } else if (anyError.message) {
                    displayMessage = anyError.message;
                } else {
                    // Fallback to JSON if possible, or generic message to avoid [object Object]
                    try {
                        displayMessage = JSON.stringify(error);
                    } catch (e) {
                        displayMessage = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ (Unknown Error)";
                    }
                }
            }

            Modal.error({
                title: 'ข้อผิดพลาด',
                content: displayMessage,
            });
            return undefined;
        } finally {
            hideLoading("async");
        }
    }, [showLoading, hideLoading]);

    return { execute };
};
