"use client";

import React from 'react';
import { CartProvider } from '../../../contexts/pos/CartContext';
import { ShiftProvider } from '../../../contexts/pos/ShiftContext';
import POSBottomNavigation from '../../../components/pos/POSBottomNavigation';
import { SyncManager } from '../../../components/shared/SyncManager';
import OpenShiftModal from '../../../components/pos/shifts/OpenShiftModal';

export default function POSLayout({ children }: { children: React.ReactNode }) {
    return (
        <ShiftProvider>
            <SyncManager />
            <OpenShiftModal />
            <CartProvider>
                {children}
                <POSBottomNavigation />
            </CartProvider>
        </ShiftProvider>
    );
}
