import { OrdersItem } from "./ordersItem";
import { Payments } from "./payments";

export enum OrderType {
    DineIn = "DineIn",      // ทานที่ร้าน
    TakeAway = "TakeAway",  // สั่งกลับบ้าน
    Delivery = "Delivery"   // เดลิเวอรี่
}

export enum OrderStatus {
    Pending = "Pending",    // รอรับออเดอร์
    Cooking = "Cooking",    // กำลังปรุงอาหาร
    Served = "Served",      // เสิร์ฟแล้ว
    Paid = "Paid",          // ชำระเงินแล้ว
    Cancelled = "Cancelled" // ยกเลิกออเดอร์
}

export interface Orders {
    id: string; // รหัสอ้างอิงหลักของออเดอร์
    order_no: string; // เลขที่ออเดอร์
    order_type: OrderType; // ประเภทของออเดอร์
    table_id?: string | null; // รหัสโต๊ะ
    delivery_id?: string | null; // รหัสผู้ให้บริการส่งอาหาร
    delivery_code?: string | null; // รหัสออเดอร์จากผู้ให้บริการ
    sub_total: number; // ยอดรวมค่าอาหาร
    discount_id?: string | null; // รหัสส่วนลดที่ใช้
    discount_amount: number; // มูลค่าส่วนลดรวม
    vat: number; // ภาษีมูลค่าเพิ่ม
    total_amount: number; // ยอดสุทธิที่ต้องชำระ
    received_amount: number; // ยอดเงินที่รับจากลูกค้า
    change_amount: number; // เงินทอน
    status: OrderStatus; // สถานะของออเดอร์
    created_by_id?: string | null; // รหัสพนักงานที่สร้างออเดอร์
    create_date: string; // วันที่สร้าง
    update_date: string; // วันที่แก้ไขล่าสุด
    items?: OrdersItem[]; // รายการอาหารในออเดอร์นี้
    payments?: Payments[]; // ประวัติการชำระเงินของออเดอร์นี้
}
