export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type ProductsCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type ProductsCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: ProductsCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const PRODUCTS_CAPABILITIES: ProductsCapability[] = [
    {
        resourceKey: "products.page",
        title: "เปิดหน้าสินค้า",
        description: "ดูรายการสินค้า ราคา หน่วย และหมวดหมู่ที่ใช้ใน POS ของสาขา",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "products.search.feature",
        title: "ค้นหาสินค้า",
        description: "ใช้ช่องค้นหาเพื่อหาสินค้าตามชื่อหรือคำอธิบายที่บันทึกไว้",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "products.filter.feature",
        title: "กรองสินค้าและเรียงลำดับ",
        description: "ใช้ตัวกรองสถานะ หมวดหมู่ และการเรียงลำดับเพื่อรีวิว catalog ได้เร็วขึ้น",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "products.manager.feature",
        title: "เปิด workspace จัดการสินค้า",
        description: "เข้าหน้า manage เพื่อสร้าง ตรวจสอบ หรือแก้ไขข้อมูลสินค้าแบบละเอียด",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products.create.feature",
        title: "สร้างสินค้าใหม่",
        description: "เพิ่มสินค้าใหม่พร้อมราคา หมวดหมู่ หน่วย และความพร้อมใช้งานเข้าสู่ระบบ",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products.catalog.feature",
        title: "แก้ข้อมูล catalog",
        description: "แก้ชื่อสินค้า คำอธิบาย และรูปภาพโดยไม่เปลี่ยนโครงสร้างราคา",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products.pricing.feature",
        title: "แก้ราคา",
        description: "แก้ราคาขายหน้าร้านและราคาเดลิเวอรี่ของสินค้า",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products.structure.feature",
        title: "แก้หมวด หน่วย และท็อปปิ้ง",
        description: "ปรับ binding ของสินค้าเข้ากับ category, unit และ topping groups ที่เกี่ยวข้อง",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products.status.feature",
        title: "เปิด/ปิดการขายสินค้า",
        description: "สลับสถานะ active ของสินค้าเพื่อควบคุมการแสดงในหน้า POS",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products.delete.feature",
        title: "ลบสินค้า",
        description: "ลบสินค้าที่ไม่ถูกใช้งานแล้วและไม่กระทบข้อมูลออเดอร์ย้อนหลัง",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const PRODUCTS_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Product Catalog Governor",
        summary: "ดูแล product catalog ครบวงจร ทั้งสร้าง ปรับ catalog ราคา โครงสร้างสินค้า สถานะ และลบเมื่อไม่กระทบข้อมูลธุรกิจ",
        allowed: [
            "ดู ค้นหา และกรองสินค้า",
            "เปิด manage workspace เพื่อสร้างและแก้ไขสินค้า",
            "แก้ข้อมูล catalog ราคา หมวด หน่วย และท็อปปิ้ง",
            "เปิด/ปิดการขายและลบสินค้า",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Product Operator",
        summary: "จัดการสินค้าเชิงปฏิบัติการได้ครบสำหรับสาขา แต่ไม่ควรลบ master data ที่อาจกระทบประวัติออเดอร์หรือการอ้างอิงย้อนหลัง",
        allowed: [
            "ดู ค้นหา และกรองสินค้า",
            "สร้างสินค้าใหม่และเปิด manage workspace",
            "แก้ catalog ราคา โครงสร้างสินค้า และสถานะ active",
        ],
        denied: [
            "ลบสินค้า",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Product Viewer",
        summary: "ตรวจสอบสินค้า ราคา หมวด และหน่วยเพื่อใช้งานหน้าขายได้ แต่ไม่แก้ข้อมูลสินค้า",
        allowed: [
            "ดู ค้นหา และกรองสินค้า",
        ],
        denied: [
            "เปิด manage workspace",
            "สร้าง แก้ไข เปิด/ปิดการขาย หรือลบสินค้า",
        ],
    },
];

export function isProductsCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "products.page" || resourceKey.startsWith("products.");
}

export function getProductsCapability(resourceKey: string): ProductsCapability | undefined {
    return PRODUCTS_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
