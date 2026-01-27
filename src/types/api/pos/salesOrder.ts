import { SalesOrderItem } from "./salesOrderItem";
import { Payments } from "./payments";
import { Delivery } from "./delivery";
import { User } from "../auth";
import { Tables } from "./tables";
import { Discounts } from "./discounts";

export enum OrderType {
    DineIn = "DineIn",      // ทานที่ร้าน
    TakeAway = "TakeAway",  // สั่งกลับบ้าน
    Delivery = "Delivery"   // เดลิเวอรี่
}

export enum OrderStatus {
    Pending = "Pending",    // กำลังดำเนินการ (สร้างออเดอร์แล้ว/กำลังทาน) -> Default
    Cooking = "Cooking",    // กำลังปรุงอาหาร
    Served = "Served",      // เสิร์ฟแล้ว
    WaitingForPayment = "WaitingForPayment", // รอชำระเงิน
    Paid = "Paid",          // ชำระเงินแล้ว (สำหรับรายการสินค้า)
    Completed = "Completed", // ออเดอร์สำเร็จ (สำหรับออเดอร์)
    Cancelled = "Cancelled", // ยกเลิกออเดอร์
}

export interface SalesOrder {
    id: string; // รหัสอ้างอิงหลักของออเดอร์
    order_no: string; // เลขที่ออเดอร์
    order_type: OrderType; // ประเภทของออเดอร์
    table_id?: string | null; // รหัสโต๊ะ
    table?: Tables | null; // ข้อมูลโต๊ะ
    delivery_id?: string | null; // รหัสผู้ให้บริการส่งอาหาร
    delivery?: Delivery | null; // ข้อมูลผู้ให้บริการส่งอาหาร
    delivery_code?: string | null; // รหัสออเดอร์จากผู้ให้บริการ
    sub_total: number; // ยอดรวมค่าอาหาร
    discount_id?: string | null; // รหัสส่วนลดที่ใช้
    discount?: Discounts | null; // ข้อมูลส่วนลด
    discount_amount: number; // มูลค่าส่วนลดรวม
    vat: number; // ภาษีมูลค่าเพิ่ม
    total_amount: number; // ยอดสุทธิที่ต้องชำระ
    received_amount: number; // ยอดเงินที่รับจากลูกค้า
    change_amount: number; // เงินทอน
    status: OrderStatus; // สถานะของออเดอร์
    created_by_id?: string | null; // รหัสพนักงานที่สร้างออเดอร์
    created_by?: User | null; // ความสัมพันธ์
    create_date: string; // วันที่สร้าง
    update_date: string; // วันที่แก้ไขล่าสุด
    items?: SalesOrderItem[]; // รายการอาหารในออเดอร์นี้
    payments?: Payments[]; // ประวัติการชำระเงินของออเดอร์นี้
}

// DTOs for Creating/Updating Orders
export interface CreateOrderItemDTO {
    product_id: string;
    quantity: number;
    price: number;
    total_price: number;
    discount_amount: number;
    notes?: string;
    status?: OrderStatus;
    details?: {
        detail_name: string;
        extra_price: number;
    }[];
}

export interface CreateSalesOrderDTO {
    order_no: string;
    order_type: OrderType;
    sub_total: number;
    discount_amount: number;
    vat: number;
    total_amount: number;
    received_amount: number;
    change_amount: number;
    status: OrderStatus;

    discount_id?: string | null;
    payment_method_id?: string | null;
    table_id?: string | null;
    delivery_id?: string | null;
    delivery_code?: string | null;
    created_by_id?: string | null;

    items: CreateOrderItemDTO[];
}
