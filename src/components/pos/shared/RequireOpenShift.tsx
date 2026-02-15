"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Modal, Spin, Typography } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { useShift } from "../../../contexts/pos/ShiftContext";
import OpenShiftModal from "../shifts/OpenShiftModal";

const { Text } = Typography;

type RequireOpenShiftProps = {
    children: React.ReactNode;
};

export default function RequireOpenShift({ children }: RequireOpenShiftProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { currentShift, loading: shiftLoading } = useShift();
    const { can, loading: permissionLoading } = useEffectivePermissions();

    const canCreateShift = can("shifts.page", "create");
    const [promptOpen, setPromptOpen] = useState(false);
    const dismissedPathRef = useRef<string | null>(null);

    useEffect(() => {
        if (shiftLoading || permissionLoading) return;

        if (currentShift) {
            dismissedPathRef.current = null;
            setPromptOpen(false);
            return;
        }

        if (dismissedPathRef.current === pathname) {
            setPromptOpen(false);
            return;
        }

        setPromptOpen(true);
    }, [currentShift, pathname, permissionLoading, shiftLoading]);

    const dismissPrompt = () => {
        dismissedPathRef.current = pathname;
        setPromptOpen(false);
    };

    if (shiftLoading || permissionLoading) {
        return (
            <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin />
            </div>
        );
    }

    if (currentShift) return <>{children}</>;

    // If user can open a shift: prompt to open shift, but allow dismissing (avoid "lock screen" loop).
    if (canCreateShift) {
        return (
            <>
                <OpenShiftModal open={promptOpen} onCancel={dismissPrompt} />
                {!promptOpen ? (
                    <div style={{ padding: 16 }}>
                        <Text type="secondary">You must open a shift to use this page.</Text>
                    </div>
                ) : null}
            </>
        );
    }

    // If user cannot open a shift, show a dismissible warning (avoid locking the screen).
    return (
        <>
            <Modal
            open={promptOpen}
            title="ยังไม่เปิดกะ"
            centered
            closable
            maskClosable
            onCancel={dismissPrompt}
            footer={[
                <Button key="close" onClick={dismissPrompt}>
                    Close
                </Button>,
                <Button key="go" type="primary" onClick={() => router.push("/pos/shift")}>
                    ไปหน้ากะการทำงาน
                </Button>,
            ]}
        >
            <Text type="secondary">
                คุณยังไม่สามารถใช้งานหน้านี้ได้จนกว่าจะเปิดกะ และบัญชีของคุณไม่มีสิทธิ์เปิดกะ
            </Text>
            </Modal>
            {!promptOpen ? (
                <div style={{ padding: 16 }}>
                    <Text type="secondary">
                        You must open a shift to use this page, and your account cannot open a shift.
                    </Text>
                    <div style={{ marginTop: 12 }}>
                        <Button type="primary" onClick={() => router.push("/pos/shift")}>
                            Go to shifts
                        </Button>
                    </div>
                </div>
            ) : null}
        </>
    );
}
