export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type DiscountsCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type DiscountsCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: DiscountsCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const DISCOUNTS_CAPABILITIES: DiscountsCapability[] = [
    {
        resourceKey: "discounts.page",
        title: "เปิดหน้าจัดการส่วนลด",
        description: "ดูรายการส่วนลดที่พร้อมใช้งานในสาขา",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "discounts.search.feature",
        title: "ค้นหาส่วนลด",
        description: "ใช้ช่องค้นหาจากชื่อหรือคำอธิบายของส่วนลด",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "discounts.filter.feature",
        title: "กรองประเภทและสถานะ",
        description: "ใช้ status/type filter และการเรียงลำดับเพื่อวิเคราะห์แคมเปญส่วนลด",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "discounts.manager.feature",
        title: "เปิด workspace จัดการส่วนลด",
        description: "เข้า manager page เพื่อสร้าง แก้ไข หรือตรวจสอบผลกระทบก่อนลบส่วนลด",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "discounts.create.feature",
        title: "สร้างส่วนลดใหม่",
        description: "เพิ่มส่วนลดพร้อมชื่อ รายละเอียด ประเภท มูลค่า และสถานะเริ่มต้น",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "discounts.edit.feature",
        title: "แก้ metadata ของส่วนลด",
        description: "แก้ชื่อและคำอธิบายของส่วนลดโดยไม่แตะมูลค่าทางการเงิน",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "discounts.pricing.feature",
        title: "แก้กติกามูลค่าส่วนลด",
        description: "เปลี่ยนประเภทส่วนลดและจำนวนลด ซึ่งมีผลโดยตรงต่อราคา",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
    {
        resourceKey: "discounts.status.feature",
        title: "เปิด/ปิดการใช้งานส่วนลด",
        description: "สลับสถานะ active ของส่วนลดจากหน้า list หรือ manager",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "discounts.delete.feature",
        title: "ลบส่วนลด",
        description: "ลบส่วนลดที่ไม่ถูกอ้างอิงโดยออเดอร์และผ่านการตรวจผลกระทบแล้ว",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const DISCOUNTS_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Pricing Governance Owner",
        summary: "ดูแล catalog ส่วนลดและกติกาทางการเงินของสาขา รวมทั้งการลบเมื่อไม่กระทบออเดอร์ย้อนหลัง",
        allowed: [
            "ดู ค้นหา และกรองรายการส่วนลด",
            "เปิด manager workspace เพื่อสร้างและแก้ข้อมูลส่วนลด",
            "แก้ metadata ประเภทส่วนลด มูลค่า และสถานะ active",
            "ลบส่วนลดที่ไม่ถูกอ้างอิงโดยออเดอร์",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Pricing Operator",
        summary: "จัดการโปรโมชั่นและส่วนลดที่ใช้จริงในสาขาได้ แต่ไม่ควรลบ master data ที่อาจกระทบประวัติการขาย",
        allowed: [
            "ดู ค้นหา และกรองรายการส่วนลด",
            "สร้างส่วนลดใหม่",
            "แก้ชื่อ คำอธิบาย ประเภท มูลค่า และสลับสถานะ active",
        ],
        denied: [
            "ลบส่วนลด",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Discount Viewer",
        summary: "ตรวจสอบสิทธิ์ส่วนลดที่มีอยู่เพื่อการขายหน้าร้าน แต่ไม่แก้กติกาทางราคา",
        allowed: [
            "ดู ค้นหา และกรองรายการส่วนลด",
        ],
        denied: [
            "เปิด manager workspace",
            "สร้าง แก้ไข เปลี่ยนมูลค่า เปิด/ปิดใช้งาน หรือลบส่วนลด",
        ],
    },
];

export function isDiscountsCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "discounts.page" || resourceKey.startsWith("discounts.");
}

export function getDiscountsCapability(resourceKey: string): DiscountsCapability | undefined {
    return DISCOUNTS_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
