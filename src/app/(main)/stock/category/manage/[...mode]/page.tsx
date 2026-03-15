"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, App, Button, Card, Col, Form, Input, Row, Spin, Switch, Typography } from "antd";
import {
    AppstoreOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    SaveOutlined,
    TagsOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../../../services/auth.service";
import { stockCategoryService } from "../../../../../../services/stock/category.service";
import { StockCategory } from "../../../../../../types/api/stock/category";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import StockCategoryManageStyle, { pageStyles } from "./style";

const { Title, Text, Paragraph } = Typography;

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

export default function StockCategoryManagePage({ params }: { params: { mode: string[] } }) {
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

    const canCreate = can("stock.category.page", "create");
    const canUpdate = can("stock.category.page", "update");
    const canDelete = can("stock.category.page", "delete");
    const canAccessPage = isEdit ? canUpdate : isAdd ? canCreate : false;

    const [csrfToken, setCsrfToken] = useState("");
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [originalCategory, setOriginalCategory] = useState<StockCategory | null>(null);

    const displayName = Form.useWatch("display_name", form) || "";
    const isActive = Form.useWatch("is_active", form);

    const title = useMemo(
        () => (isEdit ? "แก้ไขหมวดหมู่วัตถุดิบ" : "เพิ่มหมวดหมู่วัตถุดิบ"),
        [isEdit]
    );

    useEffect(() => {
        if (!isValidMode || (mode === "edit" && !id)) {
            messageApi.warning("รูปแบบ URL ไม่ถูกต้อง");
            router.replace("/stock/category");
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

    const fetchCategory = useCallback(async () => {
        if (!isEdit || !id || !canUpdate) return;

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;

        try {
            setLoading(true);
            setError(null);

            const data = await stockCategoryService.findOne(id, undefined, { signal: controller.signal });
            if (requestRef.current !== controller) return;

            form.setFieldsValue({
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setOriginalCategory(data);
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            if (requestRef.current !== controller) return;

            const nextError = err instanceof Error ? err.message : "โหลดข้อมูลหมวดหมู่วัตถุดิบไม่สำเร็จ";
            setError(nextError);
            messageApi.error(nextError);
            router.replace("/stock/category");
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setLoading(false);
            }
        }
    }, [canUpdate, form, id, isEdit, messageApi, router]);

    useEffect(() => {
        if (isEdit) {
            void fetchCategory();
        }
        return () => {
            requestRef.current?.abort();
        };
    }, [fetchCategory, isEdit]);

    const onFinish = async (values: FormValues) => {
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                display_name: values.display_name.trim(),
                is_active: Boolean(values.is_active),
            };

            if (isEdit && id) {
                await stockCategoryService.update(id, payload, undefined, csrfToken);
                messageApi.success("บันทึกการแก้ไขหมวดหมู่วัตถุดิบเรียบร้อย");
            } else {
                await stockCategoryService.create(payload, undefined, csrfToken);
                messageApi.success("สร้างหมวดหมู่วัตถุดิบเรียบร้อย");
            }

            router.replace("/stock/category");
        } catch (err) {
            const nextError = err instanceof Error ? err.message : "บันทึกหมวดหมู่วัตถุดิบไม่สำเร็จ";
            setError(nextError);
            messageApi.error(nextError);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDelete) return;

        modal.confirm({
            title: "ลบหมวดหมู่วัตถุดิบ",
            content: `ต้องการลบหมวดหมู่ "${displayName.trim() || "-"}" หรือไม่`,
            okText: "ลบ",
            okButtonProps: { danger: true, loading: deleting },
            cancelText: "ยกเลิก",
            centered: true,
            onOk: async () => {
                setDeleting(true);
                try {
                    await stockCategoryService.delete(id, undefined, csrfToken);
                    messageApi.success("ลบหมวดหมู่วัตถุดิบเรียบร้อย");
                    router.replace("/stock/category");
                } catch (err) {
                    const nextError = err instanceof Error ? err.message : "ลบหมวดหมู่วัตถุดิบไม่สำเร็จ";
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
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการหมวดหมู่วัตถุดิบ" tone="danger" />;
    }

    return (
        <div className="stock-category-manage-page" style={pageStyles.container}>
            <StockCategoryManageStyle />

            <UIPageHeader
                title={title}
                onBack={() => router.replace("/stock/category")}
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
                                        <AppstoreOutlined style={{ fontSize: 20, color: "#0f766e" }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลหมวดหมู่วัตถุดิบ</Title>
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
                                            label={<span style={{ fontWeight: 600 }}>ชื่อหมวดหมู่</span>}
                                            validateTrigger={["onBlur", "onSubmit"]}
                                            rules={[
                                                { required: true, message: "กรุณากรอกชื่อหมวดหมู่" },
                                                { max: 100, message: "ความยาวต้องไม่เกิน 100 ตัวอักษร" },
                                            ]}
                                        >
                                            <Input size="large" maxLength={100} placeholder="เครื่องดื่ม, อาหาร, ของหวาน..." />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: "#f8fafc", borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: "block", fontSize: 13 }}>ปิดการใช้งานเมื่อยังไม่ต้องการให้หมวดหมู่นี้แสดงในฟอร์มวัตถุดิบ</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={Boolean(isActive)} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace("/stock/category")} style={{ flex: 1 }}>ยกเลิก</Button>
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
                                            <TagsOutlined style={{ color: "#0f766e" }} />
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>
                                        <Title level={4} style={{ marginBottom: 8 }}>{displayName.trim() || "ชื่อหมวดหมู่"}</Title>
                                        <Alert
                                            type={isActive === false ? "warning" : "success"}
                                            showIcon
                                            message={isActive === false ? "หมวดหมู่นี้ถูกปิดใช้งาน" : "หมวดหมู่นี้พร้อมให้เลือกใช้งาน"}
                                        />
                                    </Card>

                                    {isEdit && originalCategory ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: "#0e7490" }} />
                                                <Text strong>รายละเอียด</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: "block" }}>สร้างเมื่อ: {formatDate(originalCategory.create_date)}</Text>
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
