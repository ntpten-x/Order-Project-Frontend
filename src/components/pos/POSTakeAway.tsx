"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { ShoppingOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/pos/CartContext";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/pos/orders.service";
import { createOrderPayload } from "../../utils/orders";
import { getPostCreateOrderNavigationPath } from "../../utils/channels";
import { OrderType } from "../../types/api/pos/salesOrder";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
import POSPageLayout from "./shared/POSPageLayout";

interface POSTakeAwayProps {
    queueNumber?: string;
}

export default function POSTakeAway({ queueNumber }: POSTakeAwayProps) {
    const { showLoading, hideLoading } = useGlobalLoading();
    const [csrfToken, setCsrfToken] = useState<string>("");
    const router = useRouter(); 

    useEffect(() => {
        const init = async () => {
             showLoading();
             const token = await authService.getCsrfToken();
             if (token) setCsrfToken(token);
             hideLoading();
        };
        init();
    }, []);

    const { 
        cartItems, 
        clearCart, 
        getSubtotal,
        getDiscountAmount,
        getFinalPrice,
        selectedDiscount,
        setOrderMode,
        setReferenceId,
        setReferenceCode
    } = useCart();

    useEffect(() => {
        setOrderMode('TAKEAWAY');
        setReferenceId(null);
        setReferenceCode(queueNumber || null);
    }, [queueNumber, setOrderMode, setReferenceId, setReferenceCode]);

    const handleCreateOrder = async () => {
        showLoading();
        try {
            const orderPayload = createOrderPayload(
                cartItems,
                OrderType.TakeAway,
                {
                    subTotal: getSubtotal(),
                    discountAmount: getDiscountAmount(),
                    totalAmount: getFinalPrice()
                },
                {
                    discountId: selectedDiscount?.id,
                    queueNumber: queueNumber
                }
            );
            
            
            await ordersService.create(orderPayload as any, undefined, csrfToken);

            message.success("สร้างออเดอร์เรียบร้อยแล้ว");
            
            clearCart();
            router.push(getPostCreateOrderNavigationPath(OrderType.TakeAway));
            
        } catch (error) {
            message.error(error instanceof Error ? error.message : "ไม่สามารถทำรายการได้");
        } finally {
            hideLoading();
        }
    };

    return (
        <POSPageLayout 
            title="ระบบขายหน้าร้าน (Take Away)"
            subtitle={`สั่งกลับบ้าน ${queueNumber ? `- คิว ${queueNumber}` : ''}`}
            icon={<ShoppingOutlined style={{ fontSize: 28 }} />}
            onConfirmOrder={handleCreateOrder}
        />
    );
}
