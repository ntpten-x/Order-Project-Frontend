export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type PaymentMethodCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type PaymentMethodCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: PaymentMethodCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const PAYMENT_METHOD_CAPABILITIES: PaymentMethodCapability[] = [
    {
        resourceKey: "payment_method.page",
        title: "เปิดหน้าวิธีชำระเงิน",
        description: "ดู catalog วิธีชำระเงินที่สาขาเปิดใช้งานบน POS",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "payment_method.search.feature",
        title: "ค้นหาวิธีชำระเงิน",
        description: "ใช้ช่องค้นหาบนหน้า list เพื่อค้นหาจากชื่อระบบหรือชื่อที่แสดง",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "payment_method.filter.feature",
        title: "กรองสถานะและเรียงลำดับ",
        description: "ใช้ status filter และ sort เพื่อรีวิว catalog วิธีรับชำระเงิน",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "payment_method.manager.feature",
        title: "เปิด workspace จัดการวิธีชำระเงิน",
        description: "เข้า manager page เพื่อสร้าง ตรวจสอบ หรือแก้ไขรายละเอียดก่อนใช้งานจริง",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_method.create.feature",
        title: "สร้างวิธีชำระเงินใหม่",
        description: "เพิ่มช่องทางรับชำระเงินจาก system key ที่กำหนดไว้ พร้อมสถานะเริ่มต้น",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_method.catalog.feature",
        title: "แก้รายละเอียด catalog",
        description: "ปรับชื่อที่แสดงหรือ metadata ของวิธีชำระเงินโดยไม่ลบประวัติการรับชำระ",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_method.status.feature",
        title: "เปิด/ปิดการใช้งานวิธีชำระเงิน",
        description: "สลับสถานะ active จากหน้า list หรือ manager เพื่อควบคุมการแสดงบน POS",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_method.delete.feature",
        title: "ลบวิธีชำระเงิน",
        description: "ลบวิธีชำระเงินที่ไม่ถูกอ้างอิงโดยรายการรับชำระแล้วเท่านั้น",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const PAYMENT_METHOD_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Payment Catalog Governor",
        summary: "ดูแล catalog วิธีชำระเงินทั้งสาขา รวมถึงการปรับชื่อที่แสดง สถานะ และการลบเมื่อไม่กระทบรายการรับชำระย้อนหลัง",
        allowed: [
            "ดู ค้นหา และกรองวิธีชำระเงิน",
            "เปิด manager workspace เพื่อสร้างและแก้ไขวิธีชำระเงิน",
            "ปรับชื่อที่แสดงและสถานะ active",
            "ลบวิธีชำระเงินที่ไม่ถูกอ้างอิงโดย payments",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Payment Operator",
        summary: "จัดการช่องทางรับชำระเงินของสาขาได้ แต่ไม่ควรลบ master data ที่อาจกระทบประวัติการชำระเงิน",
        allowed: [
            "ดู ค้นหา และกรองวิธีชำระเงิน",
            "สร้างวิธีชำระเงินใหม่จาก system key ที่อนุญาต",
            "แก้ชื่อที่แสดงและสลับสถานะ active",
        ],
        denied: [
            "ลบวิธีชำระเงิน",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Payment Viewer",
        summary: "ตรวจสอบวิธีชำระเงินที่พร้อมใช้งานสำหรับการขายหน้าร้านได้ แต่ไม่แก้ master data",
        allowed: [
            "ดู ค้นหา และกรองวิธีชำระเงิน",
        ],
        denied: [
            "เปิด manager workspace",
            "สร้าง แก้ไข เปิด/ปิดใช้งาน หรือลบวิธีชำระเงิน",
        ],
    },
];

export function isPaymentMethodCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "payment_method.page" || resourceKey.startsWith("payment_method.");
}

export function getPaymentMethodCapability(resourceKey: string): PaymentMethodCapability | undefined {
    return PAYMENT_METHOD_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
