'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an analytics reporting service if needed
        console.error('Unhandled application error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Result
                status="500"
                title="เกิดข้อผิดพลาดบางอย่าง"
                subTitle={
                    <div className="flex flex-col gap-2">
                        <p>ขออภัย เราไม่สามารถดำเนินการตามคำขอของคุณได้ในขณะนี้</p>
                        <p className="text-gray-400 text-sm font-mono bg-gray-100 p-2 rounded">
                            {error.message || "Unknown error"}
                        </p>
                    </div>
                }
                extra={[
                    <Button
                        key="console"
                        onClick={() => router.push('/')}
                        size="large"
                    >
                        กลับสู่หน้าหลัก
                    </Button>,
                    <Button
                        key="retry"
                        type="primary"
                        onClick={reset}
                        size="large"
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        ลองใหม่อีกครั้ง
                    </Button>,
                ]}
            />
        </div>
    );
}
