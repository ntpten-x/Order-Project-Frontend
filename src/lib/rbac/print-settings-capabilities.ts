export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type PrintSettingsCapabilityAction = "access" | "view" | "update";

export type PrintSettingsCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: PrintSettingsCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const PRINT_SETTINGS_CAPABILITIES: PrintSettingsCapability[] = [
    {
        resourceKey: "print_settings.page",
        title: "เปิดหน้าตั้งค่าการพิมพ์",
        description: "เข้าใช้งานหน้าตั้งค่าการพิมพ์ของสาขา",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "core",
    },
    {
        resourceKey: "print_settings.preview.feature",
        title: "ดูตัวอย่างเอกสาร",
        description: "เห็นตัวอย่างเอกสาร, สถานะกระดาษ, และสรุปผลลัพธ์ของค่าปัจจุบัน",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "core",
    },
    {
        resourceKey: "print_settings.test_print.feature",
        title: "ทดสอบพิมพ์",
        description: "เปิดเอกสารทดสอบพิมพ์เพื่อตรวจสอบหน้างานก่อนบันทึก",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "core",
    },
    {
        resourceKey: "print_settings.presets.feature",
        title: "เปลี่ยน preset เอกสาร",
        description: "เลือก preset กระดาษและ profile ที่เหมาะกับประเภทเอกสาร",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "print_settings.layout.feature",
        title: "แก้ขนาดและเลย์เอาต์",
        description: "ปรับเครื่องพิมพ์, หน่วย, ขนาดกระดาษ, margin, typography และสำเนา",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "print_settings.visibility.feature",
        title: "แก้ส่วนแสดงผลบนเอกสาร",
        description: "เปิด/ปิด logo, QR, footer, ข้อมูลอ้างอิง และ note ของเอกสาร",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "print_settings.automation.feature",
        title: "ตั้งค่าพิมพ์อัตโนมัติ",
        description: "ควบคุมการพิมพ์หลังชำระเงิน, ปิดกะ, ยืนยันสั่งซื้อ และหมุน QR",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "print_settings.branch_defaults.feature",
        title: "แก้ค่ากลางของสาขา",
        description: "ปรับหน่วยหลักและ locale ที่ใช้ทั้งสาขา",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "print_settings.override_policy.feature",
        title: "ควบคุม manual override",
        description: "กำหนดว่าทีมหน้างานสามารถเปลี่ยนค่าพิมพ์ชั่วคราวได้หรือไม่",
        action: "update",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
    {
        resourceKey: "print_settings.reset.feature",
        title: "รีเซ็ตค่าพิมพ์",
        description: "คืนค่าเอกสารหรือค่าทั้งหน้าเป็น baseline มาตรฐาน",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "print_settings.publish.feature",
        title: "บันทึกและเผยแพร่ค่า",
        description: "ยืนยันการเปลี่ยนแปลงขึ้นระดับสาขาและส่งผลกับอุปกรณ์ที่เชื่อมต่อ",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
];

export const PRINT_SETTINGS_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Administrator",
        summary: "กำกับนโยบาย, ตั้งค่า branch baseline, และควบคุม governance ทุกจุดของระบบพิมพ์",
        allowed: [
            "ดูและแก้ทุกส่วนของหน้าตั้งค่าการพิมพ์",
            "เปิด/ปิด manual override",
            "บันทึกค่าข้ามอุปกรณ์และรีเซ็ต baseline",
            "บริหารสิทธิ์ที่หน้า Users / Permissions",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Manager",
        summary: "ปรับงานพิมพ์เพื่อการปฏิบัติงานของสาขาได้ แต่ไม่แตะ governance policy",
        allowed: [
            "เข้าหน้า print-setting",
            "ทดสอบพิมพ์และแก้ preset / layout / visibility / automation",
            "บันทึกค่าของสาขาและรีเซ็ตค่ากลับ baseline",
        ],
        denied: [
            "เปลี่ยนนโยบาย manual override ของทีมหน้างาน",
            "บริหารสิทธิ์ของผู้ใช้คนอื่น",
        ],
    },
    {
        roleName: "Employee",
        title: "Employee",
        summary: "ทำงานตามค่าที่สาขากำหนดไว้ ไม่สามารถเข้าไปแก้ configuration ของระบบพิมพ์",
        allowed: [
            "ใช้งานเอกสารตามค่าที่ถูก publish แล้วในหน้าปฏิบัติงาน",
        ],
        denied: [
            "เข้าหน้า print-setting",
            "เปลี่ยน preset / layout / automation / policy",
            "ทดสอบพิมพ์หรือบันทึกค่าระดับสาขา",
        ],
    },
];

export function isPrintSettingsCapabilityResource(resourceKey: string): boolean {
    return (
        resourceKey === "print_settings.page" ||
        resourceKey.startsWith("print_settings.")
    );
}

export function getPrintSettingsCapability(resourceKey: string): PrintSettingsCapability | undefined {
    return PRINT_SETTINGS_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
