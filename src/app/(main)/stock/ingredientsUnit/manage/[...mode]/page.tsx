"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Form, Input, Switch, Typography } from "antd";
import { DeleteOutlined, ExperimentOutlined, SaveOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../../../services/auth.service";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import PageStack from "../../../../../../components/ui/page/PageStack";
import PageState from "../../../../../../components/ui/states/PageState";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import IngredientsUnitManageStyle from "./style";

const { Paragraph, Text } = Typography;

type FormValues = {
    display_name: string;
    is_active: boolean;
};

export default function IngredientsUnitManagePage({ params }: { params: { mode: string[] } }) {
    const { message: messageApi, modal } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm<FormValues>();
    const requestRef = useRef<AbortController | null>(null);

    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === "edit" && Boolean(id);
    const isAdd = mode === "add";

    const canCreate = can("stock.ingredients_unit.page", "create");
    const canUpdate = can("stock.ingredients_unit.page", "update");
    const canDelete = can("stock.ingredients_unit.page", "delete");
    const canAccessPage = isEdit ? canUpdate : isAdd ? canCreate : false;

    const [csrfToken, setCsrfToken] = useState("");
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const displayName = Form.useWatch("display_name", form) || "";
    const isActive = Form.useWatch("is_active", form);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            if (!user?.id) return;
            try {
                const token = await authService.getCsrfToken();
                if (mounted) setCsrfToken(token);
            } catch {
                if (mounted) messageApi.error("โหลดโทเค็นความปลอดภัยไม่สำเร็จ");
            }
        };
        void run();
        return () => {
            mounted = false;
        };
    }, [messageApi, user?.id]);

    const fetchUnit = useCallback(async () => {
        if (!isEdit || !id || !canUpdate) return;

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;

        try {
            setLoading(true);
            setError(null);

            const data = await ingredientsUnitService.findOne(id, undefined, { signal: controller.signal });
            if (requestRef.current !== controller) return;

            form.setFieldsValue({
                display_name: data.display_name,
                is_active: data.is_active,
            });
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            if (requestRef.current !== controller) return;
            setError(err instanceof Error ? err.message : "โหลดข้อมูลหน่วยนับไม่สำเร็จ");
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setLoading(false);
            }
        }
    }, [canUpdate, form, id, isEdit]);

    useEffect(() => {
        if (isEdit) {
            void fetchUnit();
        }
        return () => {
            requestRef.current?.abort();
        };
    }, [fetchUnit, isEdit]);

    const pageMeta = useMemo(() => {
        if (isEdit) {
            return {
                title: "แก้ไขหน่วยนับวัตถุดิบ",
                subtitle: "อัปเดตชื่อที่ใช้แสดงและสถานะการใช้งานให้ตรงกับงานจริงของสาขา",
            };
        }
        return {
            title: "เพิ่มหน่วยนับวัตถุดิบ",
            subtitle: "สร้างหน่วยนับใหม่ที่ใช้ซ้ำได้กับวัตถุดิบหลายรายการ เช่น กิโลกรัม กรัม ลิตร หรือ แพ็ก",
        };
    }, [isEdit]);

    const onFinish = async (values: FormValues) => {
        setSaving(true);
        setError(null);
        try {
            const payload = {
                display_name: values.display_name.trim(),
                is_active: Boolean(values.is_active),
            };

            if (isEdit && id) {
                await ingredientsUnitService.update(id, payload, undefined, csrfToken);
                messageApi.success("บันทึกการแก้ไขหน่วยนับเรียบร้อย");
            } else {
                await ingredientsUnitService.create(payload, undefined, csrfToken);
                messageApi.success("สร้างหน่วยนับเรียบร้อย");
            }

            router.push("/stock/ingredientsUnit");
        } catch (err) {
            const message = err instanceof Error ? err.message : "บันทึกหน่วยนับไม่สำเร็จ";
            setError(message);
            messageApi.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDelete) return;

        modal.confirm({
            title: "ลบหน่วยนับวัตถุดิบ",
            content: `ต้องการลบหน่วย "${displayName || "-"}" หรือไม่ หากยังมีวัตถุดิบอ้างอิงอยู่ ระบบจะไม่อนุญาตให้ลบ`,
            okText: "ลบหน่วยนับ",
            okButtonProps: { danger: true, loading: deleting },
            cancelText: "ยกเลิก",
            onOk: async () => {
                setDeleting(true);
                try {
                    await ingredientsUnitService.delete(id, undefined, csrfToken);
                    messageApi.success("ลบหน่วยนับเรียบร้อย");
                    router.push("/stock/ingredientsUnit");
                } catch (err) {
                    const message = err instanceof Error ? err.message : "ลบหน่วยนับไม่สำเร็จ";
                    setError(message);
                    messageApi.error(message);
                    throw err;
                } finally {
                    setDeleting(false);
                }
            },
        });
    };

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!user || !canAccessPage) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการหน่วยนับวัตถุดิบ" tone="danger" />;
    }

    if (!isAdd && !isEdit) {
        return (
            <div className="stock-unit-manage-shell">
                <IngredientsUnitManageStyle />
                <UIPageHeader
                    title="รูปแบบหน้าจอไม่ถูกต้อง"
                    subtitle="โปรดกลับไปที่รายการหน่วยนับแล้วเลือกเพิ่มหรือแก้ไขอีกครั้ง"
                    icon={<ExperimentOutlined />}
                    onBack={() => router.push("/stock/ingredientsUnit")}
                />
                <PageContainer maxWidth={960}>
                    <PageSection>
                        <PageState
                            status="error"
                            title="ไม่พบโหมดที่ต้องการใช้งาน"
                            action={
                                <Button type="primary" onClick={() => router.push("/stock/ingredientsUnit")}>
                                    กลับหน้ารายการ
                                </Button>
                            }
                        />
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    return (
        <div className="stock-unit-manage-shell" data-testid="stock-ingredients-unit-manage-page">
            <IngredientsUnitManageStyle />

            <UIPageHeader
                title={pageMeta.title}
                subtitle={pageMeta.subtitle}
                icon={<ExperimentOutlined />}
                onBack={() => router.push("/stock/ingredientsUnit")}
                actions={
                    isEdit && canDelete ? (
                        <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleting}>
                            ลบหน่วยนับ
                        </Button>
                    ) : undefined
                }
            />

            <PageContainer maxWidth={980}>
                <PageStack gap={14}>
                    <section className="stock-unit-manage-hero">
                        <div className="stock-unit-manage-grid">
                            <div>
                                <span className="stock-unit-manage-eyebrow">
                                    <ExperimentOutlined />
                                    {isEdit ? "edit mode" : "create mode"}
                                </span>
                                <h1 className="stock-unit-manage-title">{pageMeta.title}</h1>
                                <p className="stock-unit-manage-subtitle">
                                    ใช้ชื่อเดียวเป็นมาตรฐานทั้งการเลือกในฟอร์ม รายการวัตถุดิบ และเอกสารสั่งซื้อ เพื่อให้ทีมงานอ่านตรงกันทุกหน้าจอ
                                </p>
                            </div>

                            <aside className="stock-unit-manage-preview">
                                <span className="stock-unit-manage-preview-key">ตัวอย่างที่จะแสดงในระบบ</span>
                                <div className="stock-unit-manage-preview-value" style={{ marginTop: 6 }}>
                                    {displayName?.trim() || "ชื่อหน่วยนับที่ใช้แสดง"}
                                </div>
                                <Paragraph style={{ margin: "10px 0 0", color: "#64748b" }}>
                                    สถานะ: <Text strong>{isActive === false ? "ปิดใช้งาน" : "ใช้งาน"}</Text>
                                </Paragraph>
                            </aside>
                        </div>
                    </section>

                    <section className="stock-unit-manage-panel">
                        {loading ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูลหน่วยนับ" />
                        ) : error && isEdit && !displayName ? (
                            <PageState status="error" title={error} onRetry={() => void fetchUnit()} />
                        ) : (
                            <Form<FormValues>
                                form={form}
                                layout="vertical"
                                requiredMark={false}
                                autoComplete="off"
                                initialValues={{ is_active: true }}
                                onFinish={(values) => void onFinish(values)}
                            >
                                <Form.Item
                                    name="display_name"
                                    label="ชื่อหน่วยนับ"
                                    extra="ชื่อนี้จะใช้แสดงในหน้าวัตถุดิบ หน้าสั่งซื้อ และเอกสารที่เกี่ยวข้อง"
                                    rules={[
                                        { required: true, message: "กรอกชื่อหน่วยนับ" },
                                        { max: 100, message: "ความยาวต้องไม่เกิน 100 ตัวอักษร" },
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="เช่น กิโลกรัม"
                                        data-testid="stock-ingredients-unit-display-name-input"
                                        onBlur={() => {
                                            const value = form.getFieldValue("display_name");
                                            if (typeof value === "string") {
                                                form.setFieldValue("display_name", value.trim());
                                            }
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="is_active"
                                    label="สถานะการใช้งาน"
                                    valuePropName="checked"
                                    extra="ปิดใช้งานเมื่อไม่ต้องการให้หน่วยนี้ถูกเลือกใช้ต่อ แต่ยังต้องการเก็บประวัติเดิมไว้"
                                >
                                    <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิดใช้งาน" />
                                </Form.Item>
                            </Form>
                        )}
                    </section>

                    <section className="stock-unit-manage-actions">
                        <div className="stock-unit-manage-actions-left">
                            <Button size="large" onClick={() => router.push("/stock/ingredientsUnit")}>
                                กลับหน้ารายการ
                            </Button>
                        </div>
                        <div className="stock-unit-manage-actions-right">
                            {isEdit && canDelete ? (
                                <Button danger size="large" icon={<DeleteOutlined />} onClick={handleDelete} loading={deleting}>
                                    ลบหน่วยนับ
                                </Button>
                            ) : null}
                            <Button
                                type="primary"
                                size="large"
                                icon={<SaveOutlined />}
                                loading={saving}
                                onClick={() => form.submit()}
                                data-testid="stock-ingredients-unit-save"
                            >
                                {isEdit ? "บันทึกการแก้ไข" : "สร้างหน่วยนับ"}
                            </Button>
                        </div>
                    </section>
                </PageStack>
            </PageContainer>
        </div>
    );
}
