"use client";

import { useEffect, useRef } from "react";

type BarcodeScannerOptions = {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  maxLength?: number;
  maxInterKeyDelayMs?: number;
  ignoreWhenInputFocused?: boolean;
  preventDefaultOnScan?: boolean;
};

const INPUT_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 10,
  maxLength = 13,
  maxInterKeyDelayMs = 50,
  ignoreWhenInputFocused = false,
  preventDefaultOnScan = true,
}: BarcodeScannerOptions) {
  const onScanRef = useRef(onScan);
  const bufferRef = useRef("");
  const lastKeystrokeAtRef = useRef<number | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = "";
      lastKeystrokeAtRef.current = null;
      return;
    }

    const resetBuffer = () => {
      bufferRef.current = "";
      lastKeystrokeAtRef.current = null;
    };

    const startBuffer = (key: string, now: number) => {
      bufferRef.current = key;
      lastKeystrokeAtRef.current = now;
    };

    const isInputFocused = () => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (!activeElement) return false;

      return (
        INPUT_TAG_NAMES.has(activeElement.tagName) ||
        activeElement.isContentEditable ||
        activeElement.getAttribute("role") === "textbox"
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (ignoreWhenInputFocused && isInputFocused()) {
        resetBuffer();
        return;
      }

      const now = performance.now();
      const isDigit = /^\d$/.test(event.key);

      if (event.key === "Enter") {
        const barcode = bufferRef.current;
        const hasValidLength = barcode.length >= minLength && barcode.length <= maxLength;
        const isBurstComplete =
          lastKeystrokeAtRef.current !== null &&
          now - lastKeystrokeAtRef.current <= maxInterKeyDelayMs;

        if (hasValidLength && isBurstComplete) {
          if (preventDefaultOnScan) {
            event.preventDefault();
          }

          onScanRef.current(barcode);
        }

        resetBuffer();
        return;
      }

      if (!isDigit) {
        resetBuffer();
        return;
      }

      // Barcode scanners emit keys in a tight burst. If the gap is too large, start a fresh capture.
      if (
        lastKeystrokeAtRef.current !== null &&
        now - lastKeystrokeAtRef.current > maxInterKeyDelayMs
      ) {
        startBuffer(event.key, now);
        return;
      }

      if (!bufferRef.current) {
        startBuffer(event.key, now);
        return;
      }

      const nextBuffer = `${bufferRef.current}${event.key}`;

      if (nextBuffer.length > maxLength) {
        // Overflow usually means this is not a valid scanner payload for the configured barcode length.
        startBuffer(event.key, now);
        return;
      }

      bufferRef.current = nextBuffer;
      lastKeystrokeAtRef.current = now;
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      resetBuffer();
    };
  }, [
    enabled,
    ignoreWhenInputFocused,
    maxInterKeyDelayMs,
    maxLength,
    minLength,
    preventDefaultOnScan,
  ]);
}
