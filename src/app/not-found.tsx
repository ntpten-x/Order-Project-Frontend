"use client";

import React from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="404"
        title="404"
        subTitle="ขออภัย ไม่พบหน้าที่คุณต้องการ"
        extra={
          <Button type="primary" onClick={() => router.push('/')}>
            กลับสู่หน้าหลัก
          </Button>
        }
      />
    </div>
  );
}
