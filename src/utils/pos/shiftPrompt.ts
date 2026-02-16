const SHIFT_PROMPT_SUPPRESSED_KEY = "pos:shift:prompt:suppressed";

function hasWindow() {
    return typeof window !== "undefined";
}

export function isShiftPromptSuppressed(): boolean {
    if (!hasWindow()) return false;
    return window.sessionStorage.getItem(SHIFT_PROMPT_SUPPRESSED_KEY) === "1";
}

export function setShiftPromptSuppressed(): void {
    if (!hasWindow()) return;
    window.sessionStorage.setItem(SHIFT_PROMPT_SUPPRESSED_KEY, "1");
}

export function clearShiftPromptSuppressed(): void {
    if (!hasWindow()) return;
    window.sessionStorage.removeItem(SHIFT_PROMPT_SUPPRESSED_KEY);
}

