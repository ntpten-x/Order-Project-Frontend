"use client";

import React from 'react';
import { Layout } from "antd";
import { CartProvider } from '../../../contexts/pos/CartContext';
import { ShiftProvider } from '../../../contexts/pos/ShiftContext';
import POSBottomNavigation from '../../../components/pos/POSBottomNavigation';
import { SyncManager } from '../../../components/shared/SyncManager';
import OpenShiftModal from '../../../components/pos/shifts/OpenShiftModal';

import { useOrderSocketEvents } from '../../../hooks/pos/useOrderSocketEvents';
import { usePOSPrefetching } from '../../../hooks/pos/usePrefetching';

export default function POSLayout({ children }: { children: React.ReactNode }) {
    usePOSPrefetching();
    useOrderSocketEvents();

    return (
        <ShiftProvider>
            <SyncManager />
            <OpenShiftModal />
            <CartProvider>
                <Layout
                    style={{
                        minHeight: "100dvh",
                        background:
                            "radial-gradient(circle at top, rgba(14,165,233,0.08), transparent 32%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
                    }}
                >
                    <Layout.Content style={{ background: "transparent", paddingBottom: 96 }}>
                        <div style={{ minHeight: "100%", background: "transparent" }}>{children}</div>
                    </Layout.Content>
                    <POSBottomNavigation />
                </Layout>
            </CartProvider>
        </ShiftProvider>
    );
}
