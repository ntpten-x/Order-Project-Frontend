export enum DiscountType {
    Fixed = "Fixed",        // ลดเป็นจำนวนเงินคงที่ (บาท)
    Percentage = "Percentage" // ลดเป็นเปอร์เซ็นต์ (%)
}

export interface Discounts {
    id: string; // รหัสส่วนลด
    discount_name: string; // ชื่อส่วนลด (สำหรับระบบ)
    display_name: string; // ชื่อส่วนลดที่แสดงให้ลูกค้าเห็น
    description?: string; // รายละเอียดเงื่อนไข
    discount_amount: number; // มูลค่าส่วนลด (บาท หรือ %)
    discount_type: DiscountType; // ประเภทส่วนลด
    is_active: boolean; // สถานะการใช้งาน
    create_date: string; // วันที่สร้าง
}
