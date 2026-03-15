"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, App, Button, Card, Col, Form, Input, Row, Spin, Switch, Typography } from "antd";
import {
    DeleteOutlined,
    ExperimentOutlined,
    InfoCircleOutlined,
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
        <div className="stock-ingredients-unit-manage-page" style={pageStyles.container}>
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
                                <Card bordered={false} className="stock-manage-card stock-manage-main-card">
                                    <div className="stock-manage-card-header">
                                        <ExperimentOutlined className="stock-manage-card-icon" />
                                        <Title level={5} style={{ margin: 0 }}>
                                            ข้อมูลหน่วยนับ
                                        </Title>
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
                                            extra="ใช้ชื่อสั้น ชัดเจน เช่น กิโลกรัม กรัม ลิตร หรือ แพ็ก"
                                            rules={[
                                                { required: true, message: "กรุณากรอกชื่อหน่วยนับ" },
                                                { max: 100, message: "ความยาวต้องไม่เกิน 100 ตัวอักษร" },
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                maxLength={100}
                                                placeholder="เช่น กิโลกรัม"
                                                onBlur={() => {
                                                    const value = form.getFieldValue("display_name");
                                                    if (typeof value === "string") {
                                                        form.setFieldValue("display_name", value.trim());
                                                    }
                                                }}
                                            />
                                        </Form.Item>

                                        <div className="stock-manage-switch-panel">
                                            <div>
                                                <Text strong>สถานะการใช้งาน</Text>
                                                <Text type="secondary" className="stock-manage-muted-text">
                                                    เปิดไว้เมื่อยังต้องการให้หน่วยนี้แสดงในฟอร์มเลือกวัตถุดิบ
                                                </Text>
                                            </div>
                                            <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                <Switch checked={Boolean(isActive)} />
                                            </Form.Item>
                                        </div>

                                        <div className="stock-manage-form-actions">
                                            <Button
                                                size="large"
                                                onClick={() => router.replace("/stock/ingredientsUnit")}
                                                className="stock-manage-action-button"
                                            >
                                                ยกเลิก
                                            </Button>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                size="large"
                                                icon={<SaveOutlined />}
                                                loading={submitting}
                                                className="stock-manage-action-button stock-manage-action-button-primary"
                                            >
                                                บันทึกข้อมูล
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div className="stock-manage-side-grid">
                                    <Card className="stock-manage-card stock-manage-side-card">
                                        <div className="stock-manage-card-header">
                                            <UnorderedListOutlined className="stock-manage-side-icon" />
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>

                                        <Title level={4} className="stock-manage-preview-title">
                                            {displayName.trim() || "ชื่อหน่วยนับ"}
                                        </Title>

                                        <Alert
                                            type={isActive === false ? "warning" : "success"}
                                            showIcon
                                            message={
                                                isActive === false
                                                    ? "หน่วยนับนี้ถูกปิดใช้งาน"
                                                    : "หน่วยนับนี้พร้อมให้เลือกใช้งาน"
                                            }
                                        />
                                    </Card>

                                    <Card className="stock-manage-card stock-manage-side-card">
                                        <div className="stock-manage-card-header">
                                            <InfoCircleOutlined className="stock-manage-side-icon" />
                                            <Text strong>คำแนะนำ</Text>
                                        </div>
                                        <Paragraph className="stock-manage-help-text">
                                            ตั้งชื่อให้ตรงกับการใช้งานจริงของคลัง เพื่อให้ทีมงานค้นหาและเลือกได้เร็วขึ้น
                                        </Paragraph>
                                        <Paragraph className="stock-manage-help-text" style={{ marginBottom: 0 }}>
                                            หากเลิกใช้หน่วยนี้ชั่วคราว แนะนำให้ปิดการใช้งานแทนการลบ เพื่อไม่ให้กระทบข้อมูลเดิม
                                        </Paragraph>
                                    </Card>

                                    {isEdit && originalUnit ? (
                                        <Card className="stock-manage-card stock-manage-side-card">
                                            <div className="stock-manage-card-header">
                                                <InfoCircleOutlined className="stock-manage-side-icon" />
                                                <Text strong>รายละเอียด</Text>
                                            </div>
                                            <Text type="secondary" className="stock-manage-detail-line">
                                                รหัสรายการ: {originalUnit.id}
                                            </Text>
                                            <Text type="secondary" className="stock-manage-detail-line">
                                                สร้างเมื่อ: {formatDate(originalUnit.create_date)}
                                            </Text>
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
