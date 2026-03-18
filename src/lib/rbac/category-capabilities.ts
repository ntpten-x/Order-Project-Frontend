export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type CategoryCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type CategoryCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: CategoryCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const CATEGORY_CAPABILITIES: CategoryCapability[] = [
    {
        resourceKey: "category.page",
        title: "เปิดหน้าหมวดหมู่สินค้า",
        description: "ดูรายการหมวดหมู่สินค้าใน POS ของสาขา",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "category.search.feature",
        title: "ค้นหาหมวดหมู่",
        description: "ใช้ช่องค้นหาเพื่อหาหมวดหมู่ตามชื่อ",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "category.filter.feature",
        title: "กรองและเรียงรายการ",
        description: "ใช้ตัวกรองสถานะและลำดับการสร้างเพื่อวิเคราะห์รายการหมวดหมู่",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "category.manager.feature",
        title: "เปิด workspace จัดการหมวดหมู่",
        description: "เข้า manager page สำหรับสร้าง แก้ไข หรือลบหมวดหมู่",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "category.create.feature",
        title: "สร้างหมวดหมู่ใหม่",
        description: "กดปุ่มเพิ่มหมวดหมู่และบันทึกรายการใหม่เข้าสาขา",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "category.edit.feature",
        title: "แก้ชื่อหมวดหมู่",
        description: "ปรับชื่อหมวดหมู่และตรวจชื่อซ้ำผ่าน manager page",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "category.status.feature",
        title: "เปิด/ปิดการใช้งานหมวดหมู่",
        description: "เปลี่ยนสถานะ active ของหมวดหมู่จากหน้า list หรือ manager",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "category.delete.feature",
        title: "ลบหมวดหมู่",
        description: "ลบหมวดหมู่ที่ไม่ถูกอ้างอิงโดยสินค้าและท็อปปิ้ง",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const CATEGORY_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Catalog Administrator",
        summary: "ดูแล taxonomy ของเมนูทั้งระบบ รวมถึงลบหมวดหมู่ที่ผ่านการตรวจผลกระทบแล้ว",
        allowed: [
            "ดูรายการ ค้นหา และกรองหมวดหมู่",
            "เปิด manager workspace เพื่อสร้างและแก้ไขหมวดหมู่",
            "เปิด/ปิดการใช้งานหมวดหมู่จาก list หรือ manager page",
            "ลบหมวดหมู่เมื่อไม่ถูกอ้างอิง",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Catalog Operator",
        summary: "จัดการหมวดหมู่เพื่อการปฏิบัติงานประจำสาขาได้ แต่ไม่ควรลบ taxonomy ที่มีผลต่อโครงสร้างเมนู",
        allowed: [
            "ดูรายการ ค้นหา และกรองหมวดหมู่",
            "สร้างหมวดหมู่ใหม่",
            "แก้ชื่อและสลับสถานะ active",
        ],
        denied: [
            "ลบหมวดหมู่",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Catalog Viewer",
        summary: "ตรวจสอบหมวดหมู่เพื่อการขายและการทำงานหน้าร้าน แต่ไม่แก้โครงสร้างข้อมูล",
        allowed: [
            "ดูรายการ ค้นหา และกรองหมวดหมู่",
        ],
        denied: [
            "เปิด manager workspace",
            "สร้าง แก้ไข เปิด/ปิดการใช้งาน หรือลบหมวดหมู่",
        ],
    },
];

export function isCategoryCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "category.page" || resourceKey.startsWith("category.");
}

export function getCategoryCapability(resourceKey: string): CategoryCapability | undefined {
    return CATEGORY_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
