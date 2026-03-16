"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, App, Button, Card, Col, Form, Input, Row, Spin, Switch, Typography } from "antd";
import {
    AppstoreOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    SaveOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../../../services/auth.service";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";
import { IngredientsUnit } from "../../../../../../types/api/stock/ingredientsUnit";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import IngredientsUnitManageStyle, { pageStyles } from "./style";

const { Title, Text } = Typography;

type ManageMode = "add" | "edit";

type FormValues = {
    display_name: string;
    is_active: boolean;
};

const formatDate = (raw?: string | Date) => {
    if (!raw) return "-";
    const date = new Date(raw);
    return Number.isNaN(date.getTime())
        ? "-"
        : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function IngredientsUnitManagePage({ params }: { params: { mode: string[] } }) {
    const { message: messageApi, modal } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm<FormValues>();
    const requestRef = useRef<AbortController | null>(null);

    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === "edit" && Boolean(id);
    const isAdd = mode === "add";
    const isValidMode = isAdd || isEdit;

    const canCreate = can("stock.ingredients_unit.page", "create");
    const canUpdate = can("stock.ingredients_unit.page", "update");
    const canDelete = can("stock.ingredients_unit.page", "delete");
    const canAccessPage = isEdit ? canUpdate : isAdd ? canCreate : false;

    const [csrfToken, setCsrfToken] = useState("");
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [originalUnit, setOriginalUnit] = useState<IngredientsUnit | null>(null);

    const displayName = Form.useWatch("display_name", form) || "";
    const isActive = Form.useWatch("is_active", form);

    const title = useMemo(
        () => (isEdit ? "แก้ไขหน่วยนับวัตถุดิบ" : "เพิ่มหน่วยนับวัตถุดิบ"),
        [isEdit]
    );

    useEffect(() => {
        if (!isValidMode || (mode === "edit" && !id)) {
            messageApi.warning("รูปแบบ URL ไม่ถูกต้อง");
            router.replace("/stock/ingredientsUnit");
        }
    }, [id, isValidMode, messageApi, mode, router]);

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
            setOriginalUnit(data);
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            if (requestRef.current !== controller) return;

            const nextError = err instanceof Error ? err.message : "โหลดข้อมูลหน่วยนับวัตถุดิบไม่สำเร็จ";
            setError(nextError);
            messageApi.error(nextError);
            router.replace("/stock/ingredientsUnit");
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setLoading(false);
            }
        }
    }, [canUpdate, form, id, isEdit, messageApi, router]);

    useEffect(() => {
        if (isEdit) {
            void fetchUnit();
        }
        return () => {
            requestRef.current?.abort();
        };
    }, [fetchUnit, isEdit]);

    const onFinish = async (values: FormValues) => {
        setSubmitting(true);
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

            router.replace("/stock/ingredientsUnit");
        } catch (err) {
            const nextError = err instanceof Error ? err.message : "บันทึกหน่วยนับไม่สำเร็จ";
            setError(nextError);
            messageApi.error(nextError);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDelete) return;

        modal.confirm({
            title: "ลบหน่วยนับวัตถุดิบ",
            content: `ต้องการลบหน่วยนับ "${displayName.trim() || "-"}" หรือไม่`,
            okText: "ลบ",
            okButtonProps: { danger: true, loading: deleting },
            cancelText: "ยกเลิก",
            centered: true,
            onOk: async () => {
                setDeleting(true);
                try {
                    await ingredientsUnitService.delete(id, undefined, csrfToken);
                    messageApi.success("ลบหน่วยนับเรียบร้อย");
                    router.replace("/stock/ingredientsUnit");
                } catch (err) {
                    const nextError = err instanceof Error ? err.message : "ลบหน่วยนับไม่สำเร็จ";
                    setError(nextError);
                    messageApi.error(nextError);
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

    return (
        <div
            className="stock-ingredients-unit-manage-page"
            style={pageStyles.container}
            data-testid="stock-ingredients-unit-manage-page"
        >
            <IngredientsUnitManageStyle />

            <UIPageHeader
                title={title}
                onBack={() => router.replace("/stock/ingredientsUnit")}
                actions={
                    isEdit && canDelete ? (
                        <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleting}>
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: "transparent", border: "none" }}>
                    {loading ? (
                        <div style={pageStyles.loadingWrap}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} style={{ borderRadius: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: "#0e7490" }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลหน่วยนับ</Title>
                                    </div>

                                    {error ? (
                                        <Alert
                                            type="error"
                                            showIcon
                                            style={{ marginBottom: 20 }}
                                            message={error}
                                        />
                                    ) : null}

                                    <Form<FormValues>
                                        form={form}
                                        layout="vertical"
                                        requiredMark={false}
                                        initialValues={{ is_active: true }}
                                        onFinish={(values) => void onFinish(values)}
                                    >
                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600 }}>ชื่อหน่วยนับ</span>}
                                            validateTrigger={["onBlur", "onSubmit"]}
                                            rules={[
                                                { required: true, message: "กรุณากรอกชื่อหน่วยนับ" },
                                                { max: 100, message: "ความยาวต้องไม่เกิน 100 ตัวอักษร" },
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                maxLength={100}
                                                placeholder="เช่น กิโลกรัม, แพ็ก, กล่อง..."
                                                data-testid="stock-ingredients-unit-display-name-input"
                                            />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: "#f8fafc", borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: "block", fontSize: 13 }}>เปิดไว้เมื่อยังต้องการให้หน่วยนี้แสดงในฟอร์มเลือกวัตถุดิบ</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={Boolean(isActive)} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace("/stock/ingredientsUnit")} style={{ flex: 1 }}>ยกเลิก</Button>
                                            <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={submitting} style={{ flex: 2 }}>
                                                บันทึกข้อมูล
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div style={{ display: "grid", gap: 14 }}>
                                    <Card style={{ borderRadius: 20 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                            <UnorderedListOutlined style={{ color: "#0e7490" }} />
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>
                                        <Title level={4} style={{ marginBottom: 8 }}>{displayName.trim() || "ชื่อหน่วยนับ"}</Title>
                                        <Alert
                                            type={isActive === false ? "warning" : "success"}
                                            showIcon
                                            message={isActive === false ? "หน่วยนับนี้ถูกปิดใช้งาน" : "หน่วยนับนี้พร้อมให้เลือกใช้งาน"}
                                        />
                                    </Card>

                                    {isEdit && originalUnit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: "#0e7490" }} />
                                                <Text strong>รายละเอียด</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: "block" }}>สร้างเมื่อ: {formatDate(originalUnit.create_date)}</Text>
                                        </Card>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>
        </div>
    );
}
