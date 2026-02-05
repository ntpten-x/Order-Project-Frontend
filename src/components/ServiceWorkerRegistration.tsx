"use client";

import { useEffect } from 'react';
import { Button, message } from 'antd';
import { register } from '../utils/serviceWorker';
import { t } from '../utils/i18n';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            register({
                onSuccess: () => {
                    console.log('[SW] Service worker registered successfully');
                },
                onUpdate: (registration) => {
                    const key = 'sw-update';
                    message.info({
                        key,
                        content: (
                            <span>{t("network.newVersion")}</span>
                        ),
                        duration: 0,
                        btn: (
                            <Button type="primary" size="small" onClick={() => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }) || window.location.reload()}>
                                Reload
                            </Button>
                        )
                    });
                },
            });
        }
    }, []);

    return null;
}
