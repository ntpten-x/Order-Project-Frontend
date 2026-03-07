export function triggerDownloadFromUrl(url: string, filename?: string): void {
    const link = document.createElement("a");
    link.href = url;
    if (filename) {
        link.download = filename;
    }
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    requestAnimationFrame(() => {
        link.remove();
    });
}

export function downloadBlob(blob: Blob, filename: string, revokeDelayMs = 1000): void {
    const objectUrl = URL.createObjectURL(blob);
    triggerDownloadFromUrl(objectUrl, filename);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), revokeDelayMs);
}
