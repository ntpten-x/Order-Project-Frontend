"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { ShoppingOutlined } from "@ant-design/icons";
import { ordersService } from "../../services/pos/orders.service";
import { createOrderPayload } from "../../utils/orders";
import { getPostCreateOrderNavigationPath } from "../../utils/channels";
import { CreateSalesOrderDTO, OrderType } from "../../types/api/pos/salesOrder";
import { useGlobalLoading } from "../../contexts/pos/GlobalLoadingContext";
import POSPageLayout from "./shared/POSPageLayout";
import { POSHeaderBadge } from "./shared/style";
import { useCartStore } from "../../store/useCartStore";
import { getCsrfTokenCached } from "../../utils/pos/csrf";

interface POSTakeAwayProps {
    queueNumber?: string;
}

export default function POSTakeAway({ queueNumber }: POSTakeAwayProps) {
    const { showLoading, hideLoading } = useGlobalLoading();
    const [csrfToken, setCsrfToken] = useState<string>("");
    const router = useRouter();
    const clearCart = useCartStore((state) => state.clearCart);
    const setOrderMode = useCartStore((state) => state.setOrderMode);
    const setReferenceId = useCartStore((state) => state.setReferenceId);
    const setReferenceCode = useCartStore((state) => state.setReferenceCode);

    useEffect(() => {
        const init = async () => {
            showLoading();
            try {
                const token = await getCsrfTokenCached();
                if (token) setCsrfToken(token);
            } catch {
                message.error("ไม่สามารถเตรียมความปลอดภัยการทำรายการได้");
            } finally {
                hideLoading();
            }
        };

        void init();
    }, [showLoading, hideLoading]);

    useEffect(() => {
        setOrderMode("TAKEAWAY");
        setReferenceId(null);
        setReferenceCode(queueNumber || null);
    }, [queueNumber, setOrderMode, setReferenceId, setReferenceCode]);

    const handleCreateOrder = async () => {
        showLoading();
        try {
            const { cartItems, selectedDiscount, getSubtotal, getDiscountAmount, getFinalPrice } = useCartStore.getState();
            const orderPayload = createOrderPayload(
                cartItems,
                OrderType.TakeAway,
                {
                    subTotal: getSubtotal(),
                    discountAmount: getDiscountAmount(),
                    totalAmount: getFinalPrice(),
                },
                {
                    discountId: selectedDiscount?.id,
                    queueNumber,
                }
            );

            await ordersService.create(orderPayload as unknown as CreateSalesOrderDTO, undefined, csrfToken);
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
            title="หน้าร้าน"
            subtitle={
                <POSHeaderBadge>
                    *สั่งกลับบ้าน {queueNumber ? `- คิว ${queueNumber}` : ""}
                </POSHeaderBadge>
            }
            icon={<ShoppingOutlined style={{ fontSize: 28 }} />}
            onConfirmOrder={handleCreateOrder}
            subtitlePosition="aside"
        />
    );
}
