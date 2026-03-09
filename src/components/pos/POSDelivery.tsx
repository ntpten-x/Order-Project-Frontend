"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { ordersService } from "../../services/pos/orders.service";
import { createOrderPayload } from "../../utils/orders";
import { getPostCreateOrderNavigationPath } from "../../utils/channels";
import { CreateSalesOrderDTO, OrderType } from "../../types/api/pos/salesOrder";
import { useGlobalLoading } from "../../contexts/pos/GlobalLoadingContext";
import POSPageLayout from "./shared/POSPageLayout";
import { POSHeaderBadge } from "./shared/style";
import { getCsrfTokenCached } from "../../utils/pos/csrf";
import { deliveryService } from "../../services/pos/delivery.service";
import { useCartStore } from "../../store/useCartStore";

interface POSDeliveryProps {
    providerId: string;
    deliveryCode: string;
}

export default function POSDelivery({ providerId, deliveryCode }: POSDeliveryProps) {
    const { showLoading, hideLoading } = useGlobalLoading();
    const [csrfToken, setCsrfToken] = useState<string>("");
    const [providerName, setProviderName] = useState<string>("");
    const router = useRouter();
    const clearCart = useCartStore((state) => state.clearCart);
    const setOrderMode = useCartStore((state) => state.setOrderMode);
    const setReferenceId = useCartStore((state) => state.setReferenceId);
    const setReferenceCode = useCartStore((state) => state.setReferenceCode);

    useEffect(() => {
        const init = async () => {
            showLoading();
            try {
                const [token, provider] = await Promise.all([
                    getCsrfTokenCached(),
                    deliveryService.getById(providerId),
                ]);
                if (token) setCsrfToken(token);
                if (provider) setProviderName(provider.delivery_name);
            } catch {
                message.error("ไม่สามารถเตรียมข้อมูลผู้ให้บริการได้");
            } finally {
                hideLoading();
            }
        };

        void init();
    }, [providerId, showLoading, hideLoading]);

    useEffect(() => {
        setOrderMode("DELIVERY");
        setReferenceId(providerId);
        setReferenceCode(deliveryCode);
    }, [providerId, deliveryCode, setOrderMode, setReferenceId, setReferenceCode]);

    const handleCreateOrder = async () => {
        showLoading();
        try {
            const { cartItems, selectedDiscount, getSubtotal, getDiscountAmount, getFinalPrice } = useCartStore.getState();
            const orderPayload = createOrderPayload(
                cartItems,
                OrderType.Delivery,
                {
                    subTotal: getSubtotal(),
                    discountAmount: getDiscountAmount(),
                    totalAmount: getFinalPrice(),
                },
                {
                    discountId: selectedDiscount?.id,
                    deliveryId: providerId,
                    deliveryCode,
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
            title="เดลิเวอรี่"
            subtitle={
                <POSHeaderBadge>
                    {providerName && (
                        <span style={{ fontWeight: 400, fontSize: "0.85em", opacity: 0.8, marginRight: 8 }}>
                            ({providerName})
                        </span>
                    )}
                    *{deliveryCode}
                </POSHeaderBadge>
            }
            icon={<RocketOutlined style={{ fontSize: 28 }} />}
            onConfirmOrder={handleCreateOrder}
            subtitlePosition="aside"
        />
    );
}
