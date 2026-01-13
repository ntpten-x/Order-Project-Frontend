export interface PaymentMethod {
    id: string; // รหัสวิธีการชำระเงิน
    payment_method_name: string; // ชื่อวิธีการชำระเงิน (เช่น Cash, Credit Card)
    display_name: string; // ชื่อที่แสดงให้เห็น (เช่น เงินสด, บัตรเครดิต)
    is_active: boolean; // สถานะการใช้งาน
    create_date: string; // วันที่สร้าง
}
