"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/pos/CartContext";
import { ordersService } from "../../services/pos/orders.service";
import { createOrderPayload } from "../../utils/orders";
import { getPostCreateOrderNavigationPath } from "../../utils/channels";
import { OrderType, CreateSalesOrderDTO } from "../../types/api/pos/salesOrder";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
import POSPageLayout from "./shared/POSPageLayout";
import { getCsrfTokenCached } from "@/utils/pos/csrf";

interface POSDeliveryProps {
    providerId: string;
    deliveryCode: string;
}

export default function POSDelivery({ providerId, deliveryCode }: POSDeliveryProps) {
    const { showLoading, hideLoading } = useGlobalLoading();
    const [csrfToken, setCsrfToken] = useState<string>("");
    const router = useRouter(); 

    useEffect(() => {
        const init = async () => {
             showLoading();
             const token = await getCsrfTokenCached();
             if (token) setCsrfToken(token);
             hideLoading();
        };
        init();
    }, [showLoading, hideLoading]);

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
        showLoading();
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
            
            
            await ordersService.create(orderPayload as unknown as CreateSalesOrderDTO, undefined, csrfToken);

            message.success("สร้างออเดอร์เรียบร้อยแล้ว");
            
            clearCart();
            router.push(getPostCreateOrderNavigationPath(OrderType.Delivery));
            
        } catch (error) {
            message.error(error instanceof Error ? error.message : "ไม่สามารถทำรายการได้");
        } finally {
            hideLoading();
        }
    };

    return (
        <POSPageLayout 
            title="เดริเวอรี่ (Delivery)"
            subtitle={`เดลิเวอรี่ ${deliveryCode}`}
            icon={<RocketOutlined style={{ fontSize: 28 }} />}
            onConfirmOrder={handleCreateOrder}
        />
    );
}
