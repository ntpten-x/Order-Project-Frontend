export enum TableStatus {
    Available = "Available",    // ว่าง
    Unavailable = "Unavailable" // ไม่ว่าง
}

export interface Tables {
    id: string; // รหัสโต๊ะ
    table_name: string; // ชื่อโต๊ะ (เช่น T1, A10)
    status: TableStatus; // สถานะโต๊ะ
    active_order_status?: string; // สถานะออเดอร์ล่าสุด (ถ้ามี)
    create_date: string; // วันที่สร้าง
    update_date: string; // วันที่แก้ไขล่าสุด
    is_active: boolean; // สถานะการใช้งาน (เปิด/ปิด)
}
