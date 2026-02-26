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
                <Layout style={{ minHeight: "100%", background: "transparent" }}>
                    <Layout.Content style={{ background: "transparent" }}>
                        {children}
                    </Layout.Content>
                    <POSBottomNavigation />
                </Layout>
            </CartProvider>
        </ShiftProvider>
    );
}
