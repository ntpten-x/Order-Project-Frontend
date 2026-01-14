"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/pos/CartContext";
import { ordersService } from "../../services/pos/orders.service";
import { tablesService } from "../../services/pos/tables.service";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../contexts/AuthContext";
import POSPageLayout from "./shared/POSPageLayout";

interface POSDineInProps {
    tableId: string;
}

export default function POSDineIn({ tableId }: POSDineInProps) {
    const [csrfToken, setCsrfToken] = useState<string>("");
    const [tableName, setTableName] = useState<string>("");
    const router = useRouter(); 
    const { user } = useAuth();

    useEffect(() => {
        const init = async () => {
             const token = await authService.getCsrfToken();
             if (token) setCsrfToken(token);
        };
        
        const fetchTableDetails = async () => {
            try {
                const table = await tablesService.getById(tableId);
                if (table) {
                    setTableName(table.table_name);
                }
            } catch (error) {
                console.error("Error fetching table details:", error);
                // Fallback to ID if fetch fails, or keep empty/default
            }
        };

        init();
        if (tableId) {
            fetchTableDetails();
        }
    }, [tableId]);

    // Context State
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

    // Initialize Context
    useEffect(() => {
        setOrderMode('DINE_IN');
        setReferenceId(tableId);
        setReferenceCode(null);
    }, [tableId, setOrderMode, setReferenceId, setReferenceCode]);

    const handleCreateOrder = async () => {
        try {
            const orderPayload = {
                order_no: `ORD-${Date.now()}`,
                order_type: 'DineIn',
                sub_total: getSubtotal(),
                discount_amount: getDiscountAmount(),
                vat: 0,
                total_amount: getFinalPrice(),
                received_amount: 0, 
                change_amount: 0,
                
                status: 'Pending',
                
                discount_id: selectedDiscount?.id || null,
                
                payment_method_id: null,
                table_id: tableId,
                delivery_id: null,
                delivery_code: null,
                created_by_id: user?.id || null, // Add this line
                
                items: cartItems.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    price: Number(item.product.price),
                    total_price: Number(item.product.price) * item.quantity,
                    discount_amount: 0, 
                    notes: item.notes || ""
                }))
            };
            
            await ordersService.create(orderPayload as any, undefined, csrfToken);
            
            message.success("สร้างออเดอร์เรียบร้อยแล้ว");
            
            clearCart();
            router.push('/pos/orders');
            
        } catch (error: any) {
            console.error(error);
            message.error(error.message || "ไม่สามารถทำรายการได้");
            throw error; // Re-throw to let Layout know it failed
        }
    };

    return (
        <POSPageLayout 
            title="ระบบขายหน้าร้าน (Dine In)"
            subtitle={`ทานที่ร้าน - โต๊ะ ${tableName || tableId}`}
            icon={<ShopOutlined style={{ fontSize: 28 }} />}
            onConfirmOrder={handleCreateOrder}
        />
    );
}
