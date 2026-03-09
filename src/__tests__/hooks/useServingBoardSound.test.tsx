import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useServingBoardSound } from "../../hooks/pos/useServingBoardSound";

const STORAGE_KEY = "pos.serving-board.sound-settings";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class MockOscillator {
    type: OscillatorType = "sine";
    frequency = { setValueAtTime: jest.fn() };
    onended: (() => void) | null = null;
    connect = jest.fn();
    disconnect = jest.fn();
    start = jest.fn();
    stop = jest.fn(() => {
        this.onended?.();
    });
}

class MockGain {
    gain = {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
    };
    connect = jest.fn();
    disconnect = jest.fn();
}

class MockAudioContext {
    state: AudioContextState = "running";
    currentTime = 0;
    destination = {};
    resume = jest.fn(async () => undefined);
    close = jest.fn(async () => undefined);
    createOscillator = jest.fn(() => new MockOscillator());
    createGain = jest.fn(() => new MockGain());
}

type HookValue = ReturnType<typeof useServingBoardSound>;

async function renderServingBoardSoundHook() {
    let current: HookValue | undefined;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);

    function TestComponent() {
        current = useServingBoardSound();
        return null;
    }

    await act(async () => {
        root.render(<TestComponent />);
    });

    await act(async () => {
        await Promise.resolve();
    });

    return {
        getCurrent: () => {
            if (!current) {
                throw new Error("Hook value is not available");
            }
            return current;
        },
        unmount: async () => {
            await act(async () => {
                root.unmount();
            });
            container.remove();
        },
    };
}

describe("useServingBoardSound", () => {
    beforeEach(() => {
        window.localStorage.clear();
        Object.defineProperty(window, "AudioContext", {
            configurable: true,
            writable: true,
            value: MockAudioContext,
        });
    });

    it("migrates legacy enabled setting and preserves defaults", async () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ enabled: false, tone: "alert", volume: 45 }),
        );

        const hook = await renderServingBoardSoundHook();
        const current = hook.getCurrent();

        expect(current.soundEnabled).toBe(false);
        expect(current.toastEnabled).toBe(true);
        expect(current.soundTone).toBe("alert");
        expect(current.soundVolume).toBe(45);

        await hook.unmount();
    });

    it("toggles toast setting and persists it", async () => {
        const hook = await renderServingBoardSoundHook();

        act(() => {
            hook.getCurrent().toggleToast();
        });

        expect(hook.getCurrent().toastEnabled).toBe(false);
        expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}")).toMatchObject({
            toastEnabled: false,
        });

        await hook.unmount();
    });

    it("plays test sound when audio context is available", async () => {
        const hook = await renderServingBoardSoundHook();

        let outcome: string | undefined;
        await act(async () => {
            outcome = await hook.getCurrent().playTestSound();
        });

        expect(outcome).toBe("played");
        expect(hook.getCurrent().soundBlocked).toBe(false);

        await hook.unmount();
    });
});
