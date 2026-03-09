"use client";

import React from "react";
import { Spin, Typography, ConfigProvider, Button, Space, message as antdMessage } from "antd";
import { LockFilled, LoadingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Text, Title } = Typography;

type AccessGuardProps = {
    message: string;
    tone?: "secondary" | "danger";
};

export const AccessGuardFallback = ({ message, tone = "secondary" }: AccessGuardProps) => {
    const router = useRouter();

    return (
        <div className="access-guard-container">
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#6366f1',
                    },
                }}
            >
                <div className="content-wrapper">
                    {tone === 'danger' ? (
                        <div className="icon-circle danger">
                            <LockFilled style={{ fontSize: 32, color: '#ef4444' }} />
                        </div>
                    ) : (
                        <div className="spinner-wrapper">
                            <Spin size="large" />
                        </div>
                    )}

                    <div className="text-content">
                        {tone === 'danger' ? (
                            <>
                                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                                    Access Denied
                                </Title>
                                <Text type="danger" style={{ fontSize: 16 }}>{message}</Text>
                            </>
                        ) : (
                            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{message}</Text>
                        )}
                    </div>

                    {tone === "danger" ? (
                        <Space size={8} wrap>
                            <Button onClick={() => router.refresh()}>Try again</Button>
                            <Button onClick={() => router.push("/")}>Back to home</Button>
                            <Button
                                type="primary"
                                onClick={async () => {
                                    const path = typeof window !== "undefined" ? window.location.pathname : "";
                                    const requestText = `Request access\nPath: ${path}\nReason: access denied\nTime: ${new Date().toISOString()}`;
                                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                                        try {
                                            await navigator.clipboard.writeText(requestText);
                                            antdMessage.success("Access request copied to clipboard");
                                            return;
                                        } catch {
                                            // Fall through to hint message.
                                        }
                                    }
                                    antdMessage.info("Please contact system administrator for access");
                                }}
                            >
                                Request access
                            </Button>
                        </Space>
                    ) : null}
                </div>
            </ConfigProvider>

            <style jsx>{`
                .access-guard-container {
                    display: flex;
                    height: 100vh;
                    justify-content: center;
                    align-items: center;
                    background: #f8fafc;
                }
                .content-wrapper {
                    background: white;
                    padding: ${tone === 'danger' ? '40px' : '24px'};
                    border-radius: 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: ${tone === 'danger' ? '24px' : '12px'};
                    text-align: center;
                    min-width: ${tone === 'danger' ? '320px' : '240px'};
                    animation: fadeIn 0.5s ease-out;
                }
                .icon-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fff1f2;
                }
                .spinner-wrapper {
                    padding: 20px;
                }
                .text-content {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
