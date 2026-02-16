import { useCallback } from "react";
import { Modal } from "antd";

import { useGlobalLoading } from "../contexts/pos/GlobalLoadingContext";

type ApiErrorLike = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

/**
 * Hook to wrap async actions with the global loading overlay.
 */
export const useAsyncAction = () => {
  const { showLoading, hideLoading } = useGlobalLoading();

  const execute = useCallback(
    async <T>(
      action: () => Promise<T>,
      loadingMessage: string = "กำลังดำเนินการ...",
      _successMessage?: string,
      errorMessage: string = "เกิดข้อผิดพลาด",
    ): Promise<T> => {
      try {
        showLoading(loadingMessage, "async");
        const result = await action();

        return result;
      } catch (error: unknown) {
        console.error("Async action error:", error);

        let displayMessage = errorMessage;

        if (typeof error === "string") {
          displayMessage = error;
        } else if (error instanceof Error) {
          displayMessage = error.message;
        } else if (typeof error === "object" && error !== null) {
          const err = error as ApiErrorLike;
          displayMessage =
            err.response?.data?.message ?? err.message ??
            (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ (Unknown Error)";
              }
            })();
        }

        Modal.error({
          title: "ข้อผิดพลาด",
          content: displayMessage,
        });

        throw error;
      } finally {
        hideLoading("async");
      }
    },
    [showLoading, hideLoading],
  );

  return { execute };
};
