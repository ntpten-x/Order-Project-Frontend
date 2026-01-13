export interface Delivery {
    id: string; // รหัสอ้างอิงบริการส่ง
    delivery_name: string; // ชื่อบริการส่ง (เช่น Grab, Lineman)
    create_date: string; // วันที่สร้าง
    update_date: string; // วันที่แก้ไข
    is_active: boolean; // สถานะการใช้งาน
}
