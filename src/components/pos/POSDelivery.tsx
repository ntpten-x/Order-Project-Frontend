"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/pos/CartContext";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/pos/orders.service";
import { createOrderPayload } from "../../utils/orders";
import { OrderType } from "../../types/api/pos/salesOrder";
import POSPageLayout from "./shared/POSPageLayout";

interface POSDeliveryProps {
    providerId: string;
    deliveryCode: string;
}

export default function POSDelivery({ providerId, deliveryCode }: POSDeliveryProps) {
    const [csrfToken, setCsrfToken] = useState<string>("");
    const router = useRouter(); 

    useEffect(() => {
        const init = async () => {
             const token = await authService.getCsrfToken();
             if (token) setCsrfToken(token);
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
        setOrderMode('DELIVERY');
        setReferenceId(providerId);
        setReferenceCode(deliveryCode);
    }, [providerId, deliveryCode, setOrderMode, setReferenceId, setReferenceCode]);

    const handleCreateOrder = async () => {
        try {
            const orderPayload = createOrderPayload(
                cartItems,
                OrderType.Delivery,
                {
                    subTotal: getSubtotal(),
                    discountAmount: getDiscountAmount(),
                    totalAmount: getFinalPrice()
                },
                {
                    discountId: selectedDiscount?.id,
                    deliveryId: providerId,
                    deliveryCode: deliveryCode
                }
            );
            
            
            await ordersService.create(orderPayload as any, undefined, csrfToken);

            message.success("สร้างออเดอร์เรียบร้อยแล้ว");
            
            clearCart();
            router.push('/pos/orders');
            
        } catch (error) {
            message.error(error instanceof Error ? error.message : "ไม่สามารถทำรายการได้");
            throw error;
        }
    };

    return (
        <POSPageLayout 
            title="ระบบขายหน้าร้าน (Delivery)"
            subtitle={`เดลิเวอรี่ - ${deliveryCode}`}
            icon={<RocketOutlined style={{ fontSize: 28 }} />}
            onConfirmOrder={handleCreateOrder}
        />
    );
}
