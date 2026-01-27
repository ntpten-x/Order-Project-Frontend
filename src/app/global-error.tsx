'use client';

import { Button, Result, ConfigProvider } from 'antd';
import th_TH from 'antd/locale/th_TH';
import { Inter, Kanit } from "next/font/google"; // Assuming these fonts are used in layout
import "./globals.css"; // Ensure Tailwind is available if possible, though global-error replaces layout

// Re-defining basic font styles in case layout is broken
const kanit = Kanit({ subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700"] });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="th">
            <body className={kanit.className}>
                <ConfigProvider locale={th_TH}>
                    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                        <Result
                            status="500"
                            title="เกิดข้อผิดพลาดร้ายแรง"
                            subTitle={
                                <div className="flex flex-col gap-2">
                                    <p>ระบบไม่สามารถโหลดหน้าเว็บได้ กรุณาลองใหม่อีกครั้ง</p>
                                    {error.digest && (
                                        <p className="text-xs text-gray-400">Digest: {error.digest}</p>
                                    )}
                                </div>
                            }
                            extra={
                                <Button
                                    type="primary"
                                    onClick={() => reset()}
                                    size="large"
                                    className="bg-emerald-500" // Fallback style if tailwind loads
                                    style={{ backgroundColor: '#10b981', borderColor: '#10b981' }} // Inline style backup
                                >
                                    รีโหลดหน้าเว็บ
                                </Button>
                            }
                        />
                    </div>
                </ConfigProvider>
            </body>
        </html>
    );
}
