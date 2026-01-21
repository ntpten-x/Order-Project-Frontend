"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/pos/CartContext";
import { ordersService } from "../../services/pos/orders.service";
import { authService } from "../../services/auth.service";
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
            const orderPayload = {
                order_no: `ORD-${Date.now()}`,
                order_type: 'Delivery',
                sub_total: getSubtotal(),
                discount_amount: getDiscountAmount(),
                vat: 0,
                total_amount: getFinalPrice(),
                received_amount: 0, 
                change_amount: 0,
                
                status: 'Pending',
                
                discount_id: selectedDiscount?.id || null,
                
                payment_method_id: null,
                table_id: null,
                delivery_id: providerId,
                delivery_code: deliveryCode,
                
                items: cartItems.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    price: Number(item.product.price),
                    total_price: Number(item.product.price) * item.quantity,
                    discount_amount: 0, 
                    notes: item.notes || ""
                }))
            };
            
            const response = await fetch('/api/pos/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || "Failed to create order");
            }
            
            message.success("สร้างออเดอร์เรียบร้อยแล้ว");
            
            clearCart();
            router.push('/pos/orders');
            
        } catch (error: any) {
            console.error(error);
            message.error(error.message || "ไม่สามารถทำรายการได้");
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
