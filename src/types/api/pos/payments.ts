export enum PaymentStatus {
    Pending = "Pending",    // รอชำระ
    Success = "Success",    // สำเร็จ
    Failed = "Failed"       // ล้มเหลว
}

export interface Payments {
    id: string; // รหัสอ้างอิงการชำระเงิน
    order_id: string; // รหัสออเดอร์
    payment_method_id: string; // รหัสวิธีการชำระเงิน
    amount: number; // ยอดเงินที่ชำระในรายการนี้
    amount_received: number; // ยอดเงินที่รับมาจริง
    change_amount: number; // เงินทอน
    status: PaymentStatus; // สถานะการชำระเงิน
    payment_date: string; // วันที่และเวลาชำระเงิน
}
