"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { ShoppingOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/pos/CartContext";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/pos/orders.service";
import POSPageLayout from "./shared/POSPageLayout";

interface POSTakeAwayProps {
    queueNumber?: string;
}

export default function POSTakeAway({ queueNumber }: POSTakeAwayProps) {
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
        setOrderMode('TAKEAWAY');
        setReferenceId(null);
        setReferenceCode(queueNumber || null);
    }, [queueNumber, setOrderMode, setReferenceId, setReferenceCode]);

    const handleCreateOrder = async () => {
        try {
            const orderPayload = {
                order_no: `ORD-${Date.now()}`,
                order_type: 'TakeAway',
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
                delivery_id: null,
                delivery_code: null,
                
                items: cartItems.map(item => {
                    const productPrice = Number(item.product.price);
                    const detailsPrice = (item.details || []).reduce((sum, d) => sum + Number(d.extra_price), 0);
                    const totalPrice = (productPrice + detailsPrice) * item.quantity;

                    return {
                        product_id: item.product.id,
                        quantity: item.quantity,
                        price: productPrice,
                        total_price: totalPrice,
                        discount_amount: 0, 
                        notes: item.notes || "",
                        details: item.details || []
                    };
                })
            };
            
            
            await ordersService.create(orderPayload as any, undefined, csrfToken);

            message.success("สร้างออเดอร์เรียบร้อยแล้ว");
            
            clearCart();
            router.push('/pos/orders');
            
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : "ไม่สามารถทำรายการได้");
            throw error;
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
