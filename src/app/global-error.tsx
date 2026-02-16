'use client';

import { Button, ConfigProvider, Result } from 'antd';
import th_TH from 'antd/locale/th_TH';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body>
        <ConfigProvider locale={th_TH}>
          <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Result
              status="500"
              title="เกิดข้อผิดพลาดร้ายแรง"
              subTitle={
                <div className="flex flex-col gap-2">
                  <p>ระบบไม่สามารถโหลดหน้าเว็บได้ กรุณาลองใหม่อีกครั้ง</p>
                  {error.digest && <p className="text-xs text-gray-400">Digest: {error.digest}</p>}
                </div>
              }
              extra={
                <Button
                  type="primary"
                  onClick={reset}
                  size="large"
                  className="bg-emerald-500"
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
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
