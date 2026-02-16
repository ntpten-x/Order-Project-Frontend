"use client";

import { useEffect, useRef } from "react";
import { message } from "antd";
import api from "../lib/axios";
import { useGlobalLoading } from "../contexts/pos/GlobalLoadingContext";
import { getCsrfTokenCached } from "../utils/pos/csrf";
import {
  LOADING_DELAY_MS,
  isMutatingMethod,
  isApiRequest,
  shouldAttachCsrf,
  shouldTrackRequest,
} from "../utils/network";
import { t } from "../utils/i18n";

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
  const offlineNoticeRef = useRef(0);

  useEffect(() => {
    loadingMessageRef.current = loadingMessage;
  }, [loadingMessage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const notifyOffline = () => {
      const now = Date.now();
      if (now - offlineNoticeRef.current < 5000) return;
      offlineNoticeRef.current = now;
      message.warning(t("network.offline"));
    };

    const start = () => {
      pendingRef.current += 1;
      if (pendingRef.current === 1) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          if (pendingRef.current > 0) {
            showLoading(loadingMessageRef.current ? undefined : t("network.loading"), "network");
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

    const isCsrfErrorResponse = async (response: Response) => {
      if (response.status !== 403) return false;
      const contentType = response.headers.get("content-type") || "";
      const text = contentType.includes("application/json")
        ? JSON.stringify(await response.clone().json().catch(() => ({})))
        : await response.clone().text().catch(() => "");
      return /csrf/i.test(text);
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : null;
      const url = typeof input === "string" ? input : request?.url || "";
      const method = (init?.method || request?.method || "GET").toUpperCase();
      const track = shouldTrackRequest(url, init);
      const retryInput = input instanceof Request ? input.clone() : input;

      if (track) start();

      try {
        let finalInit = init;
        if (shouldAttachCsrf(url, method, init)) {
          const headers = new Headers(init?.headers || request?.headers || {});
          const csrfToken = await getCsrfTokenCached();
          if (csrfToken) {
            headers.set("X-CSRF-Token", csrfToken);
          } else {
            console.warn("[CSRF] Failed to get CSRF token for request:", method, url);
          }
          finalInit = { ...init, headers };
        }
        let response = await originalFetch(input, finalInit);

        if (
          isApiRequest(url) &&
          isMutatingMethod(method) &&
          await isCsrfErrorResponse(response)
        ) {
          const refreshedToken = await getCsrfTokenCached(true);
          if (refreshedToken) {
            const retryHeaders = new Headers(finalInit?.headers || request?.headers || {});
            retryHeaders.set("X-CSRF-Token", refreshedToken);
            response = await originalFetch(retryInput, { ...finalInit, headers: retryHeaders });
          }
        }

        return response;
      } catch (err) {
        notifyOffline();
        throw err;
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
        notifyOffline();
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
        notifyOffline();
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
