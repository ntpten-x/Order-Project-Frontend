/**
 * Service Worker Registration Utility
 */

type Config = {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

const isBrowser = (): boolean => typeof window !== "undefined";

const isLocalhostHost = (hostname: string): boolean =>
    hostname === "localhost" ||
    hostname === "[::1]" ||
    Boolean(hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));

const logDevInfo = (message: string) => {
    if (process.env.NODE_ENV !== "production") {
        console.log(message);
    }
};

const logDevWarn = (message: string) => {
    if (process.env.NODE_ENV !== "production") {
        console.warn(message);
    }
};

export function register(config?: Config) {
    if (isBrowser() && "serviceWorker" in navigator) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API;
        if (backendUrl) {
            try {
                const backendOrigin = new URL(backendUrl, window.location.origin).origin;
                if (backendOrigin !== window.location.origin) {
                    logDevWarn("[SW] Backend and frontend are on different origins. Service worker must be served from the frontend origin.");
                }
            } catch {
                logDevWarn("[SW] Invalid NEXT_PUBLIC_BACKEND_API value. Service worker will use the frontend origin.");
            }
        }

        const onLoad = () => {
            const swUrl = new URL("/sw.js", window.location.origin).toString();
            const localhost = isLocalhostHost(window.location.hostname);

            if (localhost) {
                checkValidServiceWorker(swUrl, config);
                navigator.serviceWorker.ready.then(() => {
                    logDevInfo("[SW] Service worker ready");
                });
            } else {
                registerValidSW(swUrl, config);
            }
        };

        window.addEventListener("load", onLoad);
    }
}

function registerValidSW(swUrl: string, config?: Config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) {
                    return;
                }
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === "installed") {
                        if (navigator.serviceWorker.controller) {
                            logDevInfo("[SW] New content available; please refresh.");
                            if (config && config.onUpdate) {
                                config.onUpdate(registration);
                            }
                        } else {
                            logDevInfo("[SW] Content cached for offline use.");
                            if (config && config.onSuccess) {
                                config.onSuccess(registration);
                            }
                        }
                    }
                };
            };
        })
        .catch((error) => {
            console.error('[SW] Error during service worker registration:', error);
        });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
    fetch(swUrl, {
        headers: { 'Service-Worker': 'script' },
    })
        .then((response) => {
            const contentType = response.headers.get('content-type');
            if (
                response.status === 404 ||
                (contentType != null && contentType.indexOf('javascript') === -1)
            ) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister().then(() => {
                        window.location.reload();
                    });
                });
            } else {
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            logDevInfo("[SW] No internet connection found. App is running in offline mode.");
        });
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}
