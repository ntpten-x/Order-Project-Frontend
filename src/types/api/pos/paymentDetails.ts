export interface PaymentDetails {
    id: string; // รหัสอ้างอิงรายละเอียด
    payment_id: string; // รหัสการชำระเงินหลัก
    ref_no?: string | null; // เลขที่อ้างอิง (เช่น เลข Slip, TxID)
    remarks?: string | null; // หมายเหตุเพิ่มเติม
    json_metadata?: Record<string, unknown>; // ข้อมูลดิบจากระบบชำระเงิน (JSON)
    create_date: string; // วันที่สร้างข้อมูล
}
