"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "pos.serving-board.sound-settings";

export type ToneResult = "played" | "disabled" | "blocked" | "unsupported";
export type ServingBoardTone = "chime" | "service-bell" | "alert";
export type ServingBoardNotifyMode = "new-batches" | "event-stream";

type SoundSettings = {
    soundEnabled: boolean;
    toastEnabled: boolean;
    notifyMode: ServingBoardNotifyMode;
    tone: ServingBoardTone;
    volume: number;
};

type WebAudioWindow = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
};

const DEFAULT_SETTINGS: SoundSettings = {
    soundEnabled: true,
    toastEnabled: true,
    notifyMode: "new-batches",
    tone: "chime",
    volume: 68,
};

const TONE_PATTERNS: Record<ServingBoardTone, Array<{ frequency: number; startOffset: number; duration: number; peak: number; type?: OscillatorType }>> = {
    chime: [
        { frequency: 880, startOffset: 0, duration: 0.12, peak: 0.06, type: "sine" },
        { frequency: 1318.51, startOffset: 0.14, duration: 0.16, peak: 0.05, type: "sine" },
    ],
    "service-bell": [
        { frequency: 1046.5, startOffset: 0, duration: 0.08, peak: 0.055, type: "triangle" },
        { frequency: 1567.98, startOffset: 0.06, duration: 0.18, peak: 0.035, type: "sine" },
    ],
    alert: [
        { frequency: 740, startOffset: 0, duration: 0.1, peak: 0.05, type: "square" },
        { frequency: 988, startOffset: 0.12, duration: 0.1, peak: 0.05, type: "square" },
        { frequency: 740, startOffset: 0.24, duration: 0.1, peak: 0.04, type: "square" },
    ],
};

function getAudioContextCtor(): typeof AudioContext | null {
    if (typeof window === "undefined") return null;
    const audioWindow = window as WebAudioWindow;
    return audioWindow.AudioContext || audioWindow.webkitAudioContext || null;
}

function clampVolume(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_SETTINGS.volume;
    return Math.min(100, Math.max(0, Math.round(value)));
}

function scheduleTone(
    context: AudioContext,
    frequency: number,
    startOffset: number,
    duration: number,
    peak: number,
    type: OscillatorType
) {
    const startAt = context.currentTime + startOffset;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.03);
    oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
    };
}

function readStoredSettings(): SoundSettings {
    if (typeof window === "undefined") {
        return DEFAULT_SETTINGS;
    }

    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
        return DEFAULT_SETTINGS;
    }

    try {
        const parsed = JSON.parse(rawValue) as Partial<SoundSettings>;
        const legacyEnabled = typeof (parsed as { enabled?: boolean }).enabled === "boolean"
            ? (parsed as { enabled?: boolean }).enabled
            : undefined;
        return {
            soundEnabled: parsed.soundEnabled ?? legacyEnabled ?? DEFAULT_SETTINGS.soundEnabled,
            toastEnabled: parsed.toastEnabled ?? DEFAULT_SETTINGS.toastEnabled,
            notifyMode: parsed.notifyMode === "event-stream" ? "event-stream" : DEFAULT_SETTINGS.notifyMode,
            tone:
                parsed.tone === "service-bell" || parsed.tone === "alert" || parsed.tone === "chime"
                    ? parsed.tone
                    : DEFAULT_SETTINGS.tone,
            volume: clampVolume(parsed.volume ?? DEFAULT_SETTINGS.volume),
        };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function useServingBoardSound() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
    const [soundBlocked, setSoundBlocked] = useState(false);

    useEffect(() => {
        setSettings(readStoredSettings());
    }, []);

    useEffect(() => {
        return () => {
            const context = audioContextRef.current;
            if (context && context.state !== "closed") {
                void context.close().catch(() => undefined);
            }
        };
    }, []);

    const ensureAudioContext = useCallback(() => {
        if (audioContextRef.current) {
            return audioContextRef.current;
        }

        const AudioContextCtor = getAudioContextCtor();
        if (!AudioContextCtor) {
            return null;
        }

        const context = new AudioContextCtor();
        audioContextRef.current = context;
        return context;
    }, []);

    const persistSettings = useCallback((updater: (current: SoundSettings) => SoundSettings) => {
        setSettings((current) => {
            const next = updater(current);
            if (typeof window !== "undefined") {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const playNotificationSound = useCallback(async (): Promise<ToneResult> => {
        if (!settings.soundEnabled || settings.volume <= 0) {
            return "disabled";
        }

        const context = ensureAudioContext();
        if (!context) {
            return "unsupported";
        }

        try {
            if (context.state === "suspended") {
                await context.resume();
            }

            const volumeScale = clampVolume(settings.volume) / 100;
            TONE_PATTERNS[settings.tone].forEach((tone) => {
                scheduleTone(
                    context,
                    tone.frequency,
                    tone.startOffset,
                    tone.duration,
                    tone.peak * volumeScale,
                    tone.type || "sine"
                );
            });
            setSoundBlocked(false);
            return "played";
        } catch {
            setSoundBlocked(true);
            return "blocked";
        }
    }, [ensureAudioContext, settings.soundEnabled, settings.tone, settings.volume]);

    const toggleSound = useCallback(async (): Promise<ToneResult> => {
        const nextEnabled = !settings.soundEnabled;
        persistSettings((current) => ({ ...current, soundEnabled: nextEnabled }));

        if (!nextEnabled) {
            setSoundBlocked(false);
            return "disabled";
        }

        const context = ensureAudioContext();
        if (!context) {
            return "unsupported";
        }

        try {
            if (context.state === "suspended") {
                await context.resume();
            }
            setSoundBlocked(false);
            return "played";
        } catch {
            setSoundBlocked(true);
            return "blocked";
        }
    }, [ensureAudioContext, persistSettings, settings.soundEnabled]);

    const toggleToast = useCallback(() => {
        persistSettings((current) => ({ ...current, toastEnabled: !current.toastEnabled }));
    }, [persistSettings]);

    const setTone = useCallback((tone: ServingBoardTone) => {
        persistSettings((current) => ({ ...current, tone }));
    }, [persistSettings]);

    const setVolume = useCallback((volume: number) => {
        persistSettings((current) => ({ ...current, volume: clampVolume(volume) }));
    }, [persistSettings]);

    const setNotifyMode = useCallback((notifyMode: ServingBoardNotifyMode) => {
        persistSettings((current) => ({ ...current, notifyMode }));
    }, [persistSettings]);

    return {
        notifyMode: settings.notifyMode,
        setNotifyMode,
        setTone,
        setVolume,
        soundBlocked,
        soundEnabled: settings.soundEnabled,
        soundTone: settings.tone,
        soundVolume: settings.volume,
        toastEnabled: settings.toastEnabled,
        playNotificationSound,
        playTestSound: playNotificationSound,
        toggleSound,
        toggleToast,
    };
}
