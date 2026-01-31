"use client";

import { useEffect, useRef } from "react";
import api from "../lib/axios";
import { useGlobalLoading } from "../contexts/pos/GlobalLoadingContext";
import { getCsrfTokenCached } from "../utils/pos/csrf";
import {
  LOADING_DELAY_MS,
  shouldAttachCsrf,
  shouldTrackRequest,
} from "../utils/network";

const resolveAxiosUrl = (url?: string, baseURL?: string) => {
  if (!url && !baseURL) return "";
  if (url && /^https?:\/\//i.test(url)) return url;
  if (baseURL && /^https?:\/\//i.test(baseURL)) {
    return new URL(url || "", baseURL).toString();
  }
  const base = baseURL ? baseURL.replace(/\/$/, "") : "";
  const path = url ? url.replace(/^\//, "") : "";
  if (!base && !path) return "";
  if (!base) return `/${path}`;
  if (!path) return base;
  return `${base}/${path}`;
};

export const useNetworkInterceptors = () => {
  const { showLoading, hideLoading, loadingMessage } = useGlobalLoading();
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingMessageRef = useRef<string | undefined>(loadingMessage);

  useEffect(() => {
    loadingMessageRef.current = loadingMessage;
  }, [loadingMessage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const start = () => {
      pendingRef.current += 1;
      if (pendingRef.current === 1) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          if (pendingRef.current > 0) {
            showLoading(loadingMessageRef.current ? undefined : "กำลังโหลดข้อมูล...", "network");
          }
        }, LOADING_DELAY_MS);
      }
    };

    const stop = () => {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      if (pendingRef.current === 0) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        hideLoading("network");
      }
    };

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : null;
      const url = typeof input === "string" ? input : request?.url || "";
      const method = (init?.method || request?.method || "GET").toUpperCase();
      const track = shouldTrackRequest(url, init);

      if (track) start();

      try {
        let finalInit = init;
        if (shouldAttachCsrf(url, method, init)) {
          const headers = new Headers(init?.headers || request?.headers || {});
          const csrfToken = await getCsrfTokenCached();
          if (csrfToken) {
            headers.set("X-CSRF-Token", csrfToken);
          }
          finalInit = { ...init, headers };
        }
        return await originalFetch(input, finalInit);
      } finally {
        if (track) stop();
      }
    };

    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        const url = resolveAxiosUrl(config.url, config.baseURL);
        const track = url ? shouldTrackRequest(url, { headers: config.headers }) : false;
        (config as { _trackLoading?: boolean })._trackLoading = track;
        if (track) start();
        return config;
      },
      (error) => {
        const cfg = (error?.config || {}) as { _trackLoading?: boolean };
        if (cfg._trackLoading) stop();
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        const cfg = (response.config || {}) as { _trackLoading?: boolean };
        if (cfg._trackLoading) stop();
        return response;
      },
      (error) => {
        const cfg = (error?.config || {}) as { _trackLoading?: boolean };
        if (cfg._trackLoading) stop();
        return Promise.reject(error);
      }
    );

    return () => {
      window.fetch = originalFetch;
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showLoading, hideLoading]);
};
