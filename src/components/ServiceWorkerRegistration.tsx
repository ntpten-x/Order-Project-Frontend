"use client";

import { useEffect } from 'react';
import { register } from '../utils/serviceWorker';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            register({
                onSuccess: (registration) => {
                    console.log('[SW] Service worker registered successfully');
                },
                onUpdate: (registration) => {
                    console.log('[SW] New service worker available');
                    // Optionally show a notification to the user
                },
            });
        }
    }, []);

    return null;
}
