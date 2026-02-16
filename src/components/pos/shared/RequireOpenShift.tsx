"use client";

import React, { useEffect, useState } from "react";
import { Button, Modal, Spin, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { useShift } from "../../../contexts/pos/ShiftContext";
import OpenShiftModal from "../shifts/OpenShiftModal";
import { clearShiftPromptSuppressed, setShiftPromptSuppressed } from "../../../utils/pos/shiftPrompt";

const { Text } = Typography;

type RequireOpenShiftProps = {
    children: React.ReactNode;
};

export default function RequireOpenShift({ children }: RequireOpenShiftProps) {
    const router = useRouter();
    const { currentShift, loading: shiftLoading } = useShift();
    const { can, loading: permissionLoading } = useEffectivePermissions();

    const canCreateShift = can("shifts.page", "create");
    const [promptOpen, setPromptOpen] = useState(false);

    useEffect(() => {
        if (shiftLoading || permissionLoading) return;

        if (currentShift) {
            clearShiftPromptSuppressed();
            setPromptOpen(false);
            return;
        }

        // User intentionally entered a guarded page again, so enforce open-shift prompt.
        clearShiftPromptSuppressed();
        setPromptOpen(true);
    }, [currentShift, permissionLoading, shiftLoading]);

    const dismissPrompt = () => {
        setShiftPromptSuppressed();
        setPromptOpen(false);
        router.replace("/pos");
    };

    if (shiftLoading || permissionLoading) {
        return (
            <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin />
            </div>
        );
    }

    if (currentShift) return <>{children}</>;

    if (canCreateShift) {
        return <OpenShiftModal open={promptOpen} onCancel={dismissPrompt} />;
    }

    return (
        <Modal
            open={promptOpen}
            title="ยังไม่เปิดกะ"
            centered
            closable
            maskClosable
            onCancel={dismissPrompt}
            footer={[
                <Button key="close" onClick={dismissPrompt}>
                    ปิดหน้าต่าง
                </Button>,
                <Button key="go" type="primary" onClick={() => router.push("/pos/shift")}>
                    ไปหน้ากะการทำงาน
                </Button>,
            ]}
        >
            <Text type="secondary">
                คุณยังไม่สามารถใช้งานหน้านี้ได้จนกว่าจะเปิดกะ และบัญชีของคุณไม่มีสิทธิ์เปิดกะเอง
            </Text>
        </Modal>
    );
}
