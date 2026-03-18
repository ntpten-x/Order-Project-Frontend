export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type ProductsUnitCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type ProductsUnitCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: ProductsUnitCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const PRODUCTS_UNIT_CAPABILITIES: ProductsUnitCapability[] = [
    {
        resourceKey: "products_unit.page",
        title: "เปิดหน้าหน่วยสินค้า",
        description: "ดูรายการหน่วยสินค้าทั้งหมดที่ใช้ใน POS และ product setup ของสาขา",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "products_unit.search.feature",
        title: "ค้นหาหน่วยสินค้า",
        description: "ใช้ช่องค้นหาในหน้า list เพื่อหา unit ตามชื่อที่ใช้งานจริง",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "products_unit.filter.feature",
        title: "กรองสถานะและเรียงลำดับ",
        description: "ใช้ status filter และ sort เพื่อรีวิวรายการหน่วยสินค้าที่ active หรือ inactive",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "products_unit.manager.feature",
        title: "เปิด workspace จัดการหน่วยสินค้า",
        description: "เข้าหน้า manager เพื่อสร้าง ตรวจสอบ หรือแก้ไขรายละเอียดของหน่วยสินค้า",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products_unit.create.feature",
        title: "สร้างหน่วยสินค้าใหม่",
        description: "เพิ่ม master unit ใหม่เพื่อให้ทีมขายและทีมจัดการสินค้าเลือกใช้งานได้ถูกต้อง",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products_unit.edit.feature",
        title: "แก้ชื่อและรายละเอียดหน่วยสินค้า",
        description: "แก้ display name ของหน่วยสินค้าโดยไม่ลบประวัติการอ้างอิงของสินค้าเดิม",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products_unit.status.feature",
        title: "เปิด/ปิดการใช้งานหน่วยสินค้า",
        description: "สลับสถานะ active ของหน่วยสินค้าเพื่อควบคุมว่าจะแสดงให้เลือกใช้ในระบบหรือไม่",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "products_unit.delete.feature",
        title: "ลบหน่วยสินค้า",
        description: "ลบหน่วยสินค้าที่ไม่ถูกใช้งานแล้วและไม่กระทบข้อมูลอ้างอิงในสินค้า",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const PRODUCTS_UNIT_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Product Unit Governor",
        summary: "ดูแล master data ของหน่วยสินค้าได้ครบวงจร ทั้งการสร้าง ปรับชื่อ ควบคุมสถานะ และลบเมื่อไม่กระทบข้อมูลสินค้า",
        allowed: [
            "ดู ค้นหา และกรองหน่วยสินค้า",
            "เปิด manager workspace เพื่อสร้างและแก้ไขหน่วยสินค้า",
            "ปรับชื่อและสถานะ active ของหน่วยสินค้า",
            "ลบหน่วยสินค้าที่ไม่ควรอยู่ใน catalog แล้ว",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Catalog Operator",
        summary: "จัดการหน่วยสินค้าของสาขาได้ในระดับปฏิบัติการ แต่ไม่ควรลบ master data ที่อาจกระทบการแมปสินค้าย้อนหลัง",
        allowed: [
            "ดู ค้นหา และกรองหน่วยสินค้า",
            "สร้างหน่วยสินค้าใหม่และเปิด manager workspace",
            "แก้ชื่อแสดงและสลับสถานะ active",
        ],
        denied: [
            "ลบหน่วยสินค้า",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Unit Viewer",
        summary: "ตรวจสอบรายการหน่วยสินค้าเพื่อใช้อ้างอิงการขายและการตั้งค่าสินค้าได้ แต่ไม่แก้ master data",
        allowed: [
            "ดู ค้นหา และกรองหน่วยสินค้า",
        ],
        denied: [
            "เปิด manager workspace",
            "สร้าง แก้ไข เปิด/ปิดการใช้งาน หรือลบหน่วยสินค้า",
        ],
    },
];

export function isProductsUnitCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "products_unit.page" || resourceKey.startsWith("products_unit.");
}

export function getProductsUnitCapability(resourceKey: string): ProductsUnitCapability | undefined {
    return PRODUCTS_UNIT_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
