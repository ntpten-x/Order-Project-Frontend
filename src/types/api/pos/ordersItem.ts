import { OrdersDetail } from "./ordersDetail";

export interface OrdersItem {
    id: string; // รหัสอ้างอิงรายการสินค้าในบิล
    order_id: string; // รหัสออเดอร์หลัก
    product_id: string; // รหัสสินค้า
    quantity: number; // จำนวนที่สั่ง
    price: number; // ราคาต่อหน่วย ณ เวลาที่ขาย
    discount_amount: number; // ส่วนลดเฉพาะรายการนี้
    total_price: number; // ราคารวมของรายการนี้
    notes?: string; // หมายเหตุเพิ่มเติม
    details?: OrdersDetail[]; // รายละเอียดเพิ่มเติม (Modifiers)
}
