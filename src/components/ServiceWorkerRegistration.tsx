"use client";

import { useEffect } from 'react';
import { register } from '../utils/serviceWorker';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            register({
                onSuccess: () => {
                    console.log('[SW] Service worker registered successfully');
                },
                onUpdate: () => {
                    console.log('[SW] New service worker available');
                    // Optionally show a notification to the user
                },
            });
        }
    }, []);

    return null;
}
