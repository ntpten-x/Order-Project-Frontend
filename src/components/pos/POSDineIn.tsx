"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import { tablesService } from "../../services/pos/tables.service";
import { ordersService } from "../../services/pos/orders.service";
import { useAuth } from "../../contexts/AuthContext";
import POSPageLayout from "./shared/POSPageLayout";
import { useNetwork } from "../../hooks/useNetwork";
import { POSHeaderBadge } from "./shared/style";
import { CreateSalesOrderDTO, OrderStatus, OrderType } from "../../types/api/pos/salesOrder";
import { offlineQueueService } from "../../services/pos/offline.queue.service";
import { useCartStore } from "../../store/useCartStore";
import { getPostCreateOrderNavigationPath } from "../../utils/channels";
import { useGlobalLoading } from "../../contexts/pos/GlobalLoadingContext";
import { getCsrfTokenCached } from "../../utils/pos/csrf";

interface POSDineInProps {
    tableId: string;
}

export default function POSDineIn({ tableId }: POSDineInProps) {
    const { showLoading, hideLoading } = useGlobalLoading();
    const [csrfToken, setCsrfToken] = useState<string>("");
    const [tableName, setTableName] = useState<string>("");
    const router = useRouter();
    const { user } = useAuth();
    const isOnline = useNetwork();
    const clearCart = useCartStore((state) => state.clearCart);
    const setOrderMode = useCartStore((state) => state.setOrderMode);
    const setReferenceId = useCartStore((state) => state.setReferenceId);
    const setReferenceCode = useCartStore((state) => state.setReferenceCode);

    useEffect(() => {
        const initData = async () => {
            showLoading("กำลังโหลดข้อมูล...");
            try {
                const [token, tableResponse] = await Promise.all([
                    getCsrfTokenCached(),
                    tableId ? tablesService.getById(tableId) : Promise.resolve(null),
                ]);

                if (token) setCsrfToken(token);

                if (tableResponse?.table_name) {
                    setTableName(tableResponse.table_name);
                } else if (tableId) {
                    setTableName(`โต๊ะ ${tableId.substring(0, 8)}...`);
                }
            } catch {
                if (tableId) {
                    setTableName(`โต๊ะ ${tableId.substring(0, 8)}...`);
                }
                message.error("ไม่สามารถโหลดข้อมูลโต๊ะได้");
            } finally {
                hideLoading();
            }
        };

        void initData();
    }, [tableId, showLoading, hideLoading]);

    useEffect(() => {
        setOrderMode("DINE_IN");
        setReferenceId(tableId);
        setReferenceCode(null);
    }, [tableId, setOrderMode, setReferenceId, setReferenceCode]);

    const handleCreateOrder = async () => {
        showLoading("กำลังสร้างออเดอร์...");
        try {
            const { cartItems, selectedDiscount, getSubtotal, getDiscountAmount, getFinalPrice } = useCartStore.getState();

            const orderPayload: CreateSalesOrderDTO = {
                order_no: `ORD-${Date.now()}`,
                order_type: OrderType.DineIn,
                sub_total: getSubtotal(),
                discount_amount: getDiscountAmount(),
                vat: 0,
                total_amount: getFinalPrice(),
                received_amount: 0,
                change_amount: 0,
                status: OrderStatus.Pending,
                discount_id: selectedDiscount?.id || null,
                payment_method_id: null,
                table_id: tableId,
                delivery_id: null,
                delivery_code: null,
                created_by_id: user?.id || null,
                items: cartItems.map((item) => {
                    const productPrice = Number(item.product.price);
                    const detailsPrice = (item.details || []).reduce((sum, detail) => sum + Number(detail.extra_price), 0);
                    const totalPrice = (productPrice + detailsPrice) * item.quantity;

                    return {
                        product_id: item.product.id,
                        quantity: item.quantity,
                        price: productPrice,
                        total_price: totalPrice,
                        discount_amount: 0,
                        notes: item.notes || "",
                        status: OrderStatus.Pending,
                        details: item.details || [],
                    };
                }),
            };

            if (!isOnline) {
                offlineQueueService.addToQueue("CREATE_ORDER", orderPayload);
                message.warning("บันทึกออเดอร์แบบ Offline แล้ว (จะซิงค์เมื่อมีเน็ต)");
                clearCart();
                router.push(getPostCreateOrderNavigationPath(OrderType.DineIn));
                return;
            }

            await ordersService.create(orderPayload, undefined, csrfToken);
            message.success("สร้างออเดอร์เรียบร้อยแล้ว");
            clearCart();
            router.push(getPostCreateOrderNavigationPath(OrderType.DineIn));
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
                    *โต๊ะ {tableName || tableId.substring(0, 8)}
                </POSHeaderBadge>
            }
            icon={<ShopOutlined style={{ fontSize: 28 }} />}
            onConfirmOrder={handleCreateOrder}
            subtitlePosition="aside"
        />
    );
}
