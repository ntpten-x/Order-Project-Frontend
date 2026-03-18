export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type DeliveryCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type DeliveryCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: DeliveryCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const DELIVERY_CAPABILITIES: DeliveryCapability[] = [
    {
        resourceKey: "delivery.page",
        title: "เปิดหน้าจัดการเดลิเวอรี่",
        description: "ดูรายชื่อผู้ให้บริการเดลิเวอรี่ใน POS ของสาขา",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "delivery.search.feature",
        title: "ค้นหาผู้ให้บริการ",
        description: "ใช้ช่องค้นหาบนหน้า list เพื่อค้นหาจากชื่อหรือ prefix",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "delivery.filter.feature",
        title: "กรองสถานะและเรียงลำดับ",
        description: "ใช้ status filter และการเรียงตามวันที่สร้างเพื่อวิเคราะห์รายการเดลิเวอรี่",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "delivery.manager.feature",
        title: "เปิด workspace จัดการเดลิเวอรี่",
        description: "เข้า manager page สำหรับสร้าง แก้ไข หรือเตรียมลบผู้ให้บริการเดลิเวอรี่",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "delivery.create.feature",
        title: "สร้างผู้ให้บริการเดลิเวอรี่",
        description: "เพิ่มผู้ให้บริการใหม่พร้อมชื่อ prefix โลโก้ และสถานะเริ่มต้น",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "delivery.edit.feature",
        title: "แก้ไขรายละเอียดผู้ให้บริการ",
        description: "เปลี่ยนชื่อ prefix และโลโก้ของผู้ให้บริการผ่าน manager page",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "delivery.status.feature",
        title: "เปิด/ปิดการใช้งานผู้ให้บริการ",
        description: "สลับสถานะ active จากหน้า list หรือ manager page โดยไม่แตะข้อมูลอื่น",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "delivery.delete.feature",
        title: "ลบผู้ให้บริการเดลิเวอรี่",
        description: "ลบผู้ให้บริการที่ไม่ถูกอ้างอิงโดยออเดอร์และผ่านการตรวจผลกระทบแล้ว",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const DELIVERY_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Delivery Governance Owner",
        summary: "ดูแล provider catalog ของเดลิเวอรี่ทั้งสาขา รวมการปรับข้อมูลแบรนด์ สถานะ และการลบเมื่อไม่กระทบออเดอร์",
        allowed: [
            "ดู ค้นหา และกรองรายชื่อเดลิเวอรี่",
            "เปิด manager workspace เพื่อสร้างและแก้ไข provider",
            "ปรับชื่อ prefix โลโก้ และสถานะ active",
            "ลบ provider ที่ไม่ถูกอ้างอิงโดยออเดอร์",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Delivery Operator",
        summary: "จัดการ provider ที่ใช้จริงในสาขาได้ แต่ไม่ควรลบ master data ที่อาจกระทบ historical orders",
        allowed: [
            "ดู ค้นหา และกรองรายชื่อเดลิเวอรี่",
            "สร้าง provider ใหม่ในสาขา",
            "แก้ชื่อ prefix โลโก้ และสลับสถานะ active",
        ],
        denied: [
            "ลบ provider เดลิเวอรี่",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Delivery Viewer",
        summary: "ตรวจสอบรายชื่อ provider เพื่อใช้งานหน้าร้านได้ แต่ไม่แก้ master data",
        allowed: [
            "ดู ค้นหา และกรองรายชื่อเดลิเวอรี่",
        ],
        denied: [
            "เปิด manager workspace",
            "สร้าง แก้ไข สลับสถานะ หรือลบ provider เดลิเวอรี่",
        ],
    },
];

export function isDeliveryCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "delivery.page" || resourceKey.startsWith("delivery.");
}

export function getDeliveryCapability(resourceKey: string): DeliveryCapability | undefined {
    return DELIVERY_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
