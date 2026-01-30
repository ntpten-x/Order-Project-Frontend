"use client";

import { QueryClient, QueryClientProvider, useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useGlobalLoading } from "../contexts/pos/GlobalLoadingContext";

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

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <QueryLoadingTracker />
      {children}
    </QueryClientProvider>
  );
}
