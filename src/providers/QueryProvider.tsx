"use client";

import { 
  QueryClient, 
  QueryClientProvider, 
  useIsFetching, 
  useIsMutating,
  QueryCache,
  MutationCache
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useGlobalLoading } from "../contexts/pos/GlobalLoadingContext";
import { message } from "antd";

const BRANCH_CONTEXT_ERROR_PATTERNS = [
  "invalid branch context",
  "selected branch is invalid",
  "assigned branch is invalid",
];

let branchRecoveryInFlight = false;

function isBranchContextErrorMessage(text: string): boolean {
  const normalized = text.toLowerCase();
  return BRANCH_CONTEXT_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

async function recoverInvalidBranchContext(messageText: string): Promise<void> {
  if (typeof window === "undefined" || branchRecoveryInFlight) return;
  if (!isBranchContextErrorMessage(messageText)) return;

  branchRecoveryInFlight = true;
  try {
    await fetch("/api/auth/active-branch", {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    }).catch(() => undefined);
    window.dispatchEvent(new CustomEvent("active-branch-changed", { detail: { activeBranchId: null } }));
    if (!window.location.pathname.startsWith("/branch")) {
      window.location.assign("/branch");
    }
  } finally {
    window.setTimeout(() => {
      branchRecoveryInFlight = false;
    }, 1500);
  }
}

/**
 * Query Loading Tracker Component
 * Following: client-swr-dedup - provides automatic request deduplication via React Query
 */
const QueryLoadingTracker = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const { showLoading, hideLoading } = useGlobalLoading();
  const wasBusy = useRef(false);
  const isBusy = isFetching + isMutating > 0;

  useEffect(() => {
    if (isBusy && !wasBusy.current) {
      wasBusy.current = true;
      showLoading("กำลังโหลดข้อมูล...", "query");
      return;
    }
    if (!isBusy && wasBusy.current) {
      wasBusy.current = false;
      hideLoading("query");
    }
  }, [isBusy, showLoading, hideLoading]);

  return null;
};

/**
 * Extract user-friendly error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle axios errors with response data
    const axiosError = error as Error & { response?: { data?: { message?: string } } };
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}

/**
 * Create QueryClient with optimized configuration
 * Following vercel-react-best-practices:
 * - client-swr-dedup: Request deduplication
 * - server-cache-lru: Cross-request caching via gcTime
 * - rerender-lazy-state-init: Lazy initialization
 */
function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only show error toast for queries that have already been successfully fetched
        // This prevents showing errors during initial load
        if (query.state.data !== undefined) {
          const msg = getErrorMessage(error);
          message.error(msg);
          void recoverInvalidBranchContext(msg);
        }
        // Log for debugging in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[Query Error]', query.queryKey, error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Show error for mutations by default (they're user-initiated)
        // Can be opted out via mutation meta
        if (mutation.meta?.skipErrorToast !== true) {
          const msg = getErrorMessage(error);
          message.error(msg);
          void recoverInvalidBranchContext(msg);
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('[Mutation Error]', mutation.options.mutationKey, error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Deduplication: same queries within staleTime won't refetch
        staleTime: 60 * 1000, // 1 minute
        // Garbage collection time - how long to keep unused data in cache
        gcTime: 5 * 60 * 1000, // 5 minutes
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          const status = (error as Error & { response?: { status?: number } })?.response?.status;
          if (status && status >= 400 && status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Disable automatic refetch on window focus (can be noisy)
        refetchOnWindowFocus: false,
        // Refetch on reconnect for offline-first experience
        refetchOnReconnect: 'always',
        // Network mode for offline support
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Retry mutations once on network errors
        retry: 1,
        retryDelay: 1000,
        networkMode: 'offlineFirst',
      },
    },
  });
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Following: rerender-lazy-state-init - pass function to useState for expensive initialization
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    const handler = () => {
      // Branch switching changes the backend RLS context via an httpOnly cookie.
      // Clear React Query caches so the UI does not keep showing data from the previous branch.
      queryClient.clear();

      // Also clear localStorage caches used by some POS list pages/hooks.
      // (These are simple "pos:*" keys maintained by utils/pos/cache.ts.)
      try {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith("pos:")) {
            window.localStorage.removeItem(key);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("active-branch-changed", handler as EventListener);
    return () => {
      window.removeEventListener("active-branch-changed", handler as EventListener);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <QueryLoadingTracker />
      {children}
    </QueryClientProvider>
  );
}

// Type augmentation for mutation meta
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      skipErrorToast?: boolean;
    };
  }
}
