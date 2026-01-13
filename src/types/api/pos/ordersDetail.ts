export interface OrdersDetail {
    id: string; // รหัสอ้างอิงรายละเอียดเพิ่มเติม
    orders_item_id: string; // รหัสรายการสินค้าแม่ข่าย
    detail_name: string; // ชื่อรายละเอียด (เช่น "หวาน 50%", "เพิ่มชีส")
    extra_price: number; // ราคาที่เพิ่มขึ้น
    create_date: string; // วันที่สร้างข้อมูล
}
