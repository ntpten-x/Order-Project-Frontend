"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, App, Button, Card, Col, Form, Input, Row, Spin, Switch, Typography } from "antd";
import {
    DeleteOutlined,
    InfoCircleOutlined,
    PictureOutlined,
    SaveOutlined,
    ShoppingOutlined,
    TagsOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import StockImageThumb from "../../../../../../components/stock/StockImageThumb";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";
import { ModalSelector } from "../../../../../../components/ui/select/ModalSelector";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../../../services/auth.service";
import { ingredientsService } from "../../../../../../services/stock/ingredients.service";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";
import { Ingredients } from "../../../../../../types/api/stock/ingredients";
import { IngredientsUnit } from "../../../../../../types/api/stock/ingredientsUnit";
import { isSupportedImageSource, normalizeImageSource } from "../../../../../../utils/image/source";
import IngredientsManageStyle, { pageStyles } from "./style";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

type ManageMode = "add" | "edit";

type IngredientFormValues = {
    display_name: string;
    description?: string;
    img_url?: string;
    unit_id: string;
    is_active: boolean;
};

const selectorStyle: React.CSSProperties = {
    minHeight: 48,
    borderRadius: 14,
    borderColor: "#d9d9d9",
    padding: "12px 14px",
};

const formatDate = (raw?: string | Date) => {
    if (!raw) return "-";
    const date = new Date(raw);
    return Number.isNaN(date.getTime())
        ? "-"
        : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function IngredientsManagePage({ params }: { params: { mode: string[] } }) {
    const { message: messageApi, modal } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm<IngredientFormValues>();
    const requestRef = useRef<AbortController | null>(null);

    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === "edit" && Boolean(id);
    const isAdd = mode === "add";
    const isValidMode = isAdd || isEdit;

    const canCreate = can("stock.ingredients.page", "create");
    const canUpdate = can("stock.ingredients.page", "update");
    const canDelete = can("stock.ingredients.page", "delete");
    const canAccessPage = isEdit ? canUpdate : isAdd ? canCreate : false;

    const [csrfToken, setCsrfToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [units, setUnits] = useState<IngredientsUnit[]>([]);
    const [originalIngredient, setOriginalIngredient] = useState<Ingredients | null>(null);

    const displayName = Form.useWatch("display_name", form) || "";
    const imageUrl = Form.useWatch("img_url", form) || "";
    const description = Form.useWatch("description", form) || "";
    const selectedUnitId = Form.useWatch("unit_id", form);
    const isActive = Form.useWatch("is_active", form);

    const title = useMemo(() => (isEdit ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบ"), [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === "edit" && !id)) {
            messageApi.warning("รูปแบบ URL ไม่ถูกต้อง");
            router.replace("/stock/ingredients");
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

    const fetchPageData = useCallback(async () => {
        if (!canAccessPage || !isValidMode) return;

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;

        try {
            setLoading(true);
            setError(null);

            const unitParams = new URLSearchParams();
            unitParams.set("sort_created", "new");

            const [unitsData, ingredientData] = await Promise.all([
                ingredientsUnitService.findAll(undefined, unitParams),
                isEdit && id
                    ? ingredientsService.findOne(id, undefined, { signal: controller.signal })
                    : Promise.resolve(null),
            ]);

            if (requestRef.current !== controller) return;

            setUnits(Array.isArray(unitsData) ? unitsData : []);

            if (ingredientData) {
                form.setFieldsValue({
                    display_name: ingredientData.display_name,
                    description: ingredientData.description || "",
                    img_url: ingredientData.img_url || "",
                    unit_id: ingredientData.unit_id,
                    is_active: ingredientData.is_active,
                });
                setOriginalIngredient(ingredientData);
            } else {
                form.setFieldsValue({
                    description: "",
                    img_url: "",
                    is_active: true,
                });
                setOriginalIngredient(null);
            }
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            if (requestRef.current !== controller) return;

            const nextError = err instanceof Error ? err.message : "โหลดข้อมูลวัตถุดิบไม่สำเร็จ";
            setError(nextError);
            messageApi.error(nextError);

            if (isEdit) {
                router.replace("/stock/ingredients");
            }
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setLoading(false);
            }
        }
    }, [canAccessPage, form, id, isEdit, isValidMode, messageApi, router]);

    useEffect(() => {
        void fetchPageData();
        return () => {
            requestRef.current?.abort();
        };
    }, [fetchPageData]);

    const selectedUnit = useMemo(
        () => units.find((unit) => unit.id === selectedUnitId) || null,
        [selectedUnitId, units]
    );

    const unitOptions = useMemo(
        () =>
            units
                .filter((unit) => unit.is_active || unit.id === selectedUnitId)
                .map((unit) => ({
                    label: unit.is_active ? unit.display_name : `${unit.display_name} (ปิดใช้งาน)`,
                    value: unit.id,
                    searchLabel: unit.display_name,
                })),
        [selectedUnitId, units]
    );

    const hasAvailableUnits = unitOptions.length > 0;
    const normalizedImageUrl = normalizeImageSource(imageUrl);

    const onFinish = async (values: IngredientFormValues) => {
        if (!hasAvailableUnits) {
            messageApi.warning("กรุณาสร้างหน่วยนับวัตถุดิบก่อน");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                display_name: values.display_name.trim(),
                description: values.description?.trim() || "",
                img_url: normalizeImageSource(values.img_url) || null,
                unit_id: values.unit_id,
                is_active: Boolean(values.is_active),
            };

            if (isEdit && id) {
                await ingredientsService.update(id, payload, undefined, csrfToken);
                messageApi.success("บันทึกการแก้ไขวัตถุดิบเรียบร้อย");
            } else {
                await ingredientsService.create(payload, undefined, csrfToken);
                messageApi.success("สร้างวัตถุดิบเรียบร้อย");
            }

            router.replace("/stock/ingredients");
        } catch (err) {
            const nextError = err instanceof Error ? err.message : "บันทึกข้อมูลวัตถุดิบไม่สำเร็จ";
            setError(nextError);
            messageApi.error(nextError);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDelete) return;

        modal.confirm({
            title: "ลบวัตถุดิบ",
            content: `ต้องการลบ "${displayName.trim() || "-"}" หรือไม่`,
            okText: "ลบ",
            okButtonProps: { danger: true, loading: deleting },
            cancelText: "ยกเลิก",
            centered: true,
            onOk: async () => {
                setDeleting(true);
                try {
                    await ingredientsService.delete(id, undefined, csrfToken);
                    messageApi.success("ลบวัตถุดิบเรียบร้อย");
                    router.replace("/stock/ingredients");
                } catch (err) {
                    const nextError = err instanceof Error ? err.message : "ลบวัตถุดิบไม่สำเร็จ";
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
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการวัตถุดิบ" tone="danger" />;
    }

    return (
        <div className="stock-ingredients-manage-page" style={pageStyles.container}>
            <IngredientsManageStyle />

            <UIPageHeader
                title={title}
                onBack={() => router.replace("/stock/ingredients")}
                actions={
                    isEdit && canDelete ? (
                        <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleting}>
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1140}>
                <PageSection style={{ background: "transparent", border: "none" }}>
                    {loading ? (
                        <div style={pageStyles.loadingWrap}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} className="stock-ingredient-card stock-ingredient-main-card">
                                    <div className="stock-ingredient-card-header">
                                        <ShoppingOutlined className="stock-ingredient-card-icon" />
                                        <Title level={5} style={{ margin: 0 }}>
                                            ข้อมูลวัตถุดิบ
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

                                    {!hasAvailableUnits ? (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            style={{ marginBottom: 20 }}
                                            message="ยังไม่มีหน่วยนับวัตถุดิบให้เลือก"
                                            description={
                                                <div className="stock-ingredient-inline-action">
                                                    สร้างหน่วยนับก่อนเพื่อให้สามารถบันทึกวัตถุดิบได้
                                                    <Button
                                                        type="link"
                                                        onClick={() => router.push("/stock/ingredientsUnit/manage/add")}
                                                        style={{ paddingInline: 0 }}
                                                    >
                                                        ไปหน้าเพิ่มหน่วยนับ
                                                    </Button>
                                                </div>
                                            }
                                        />
                                    ) : null}

                                    <Form<IngredientFormValues>
                                        form={form}
                                        layout="vertical"
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{ description: "", img_url: "", is_active: true }}
                                        onFinish={(values) => void onFinish(values)}
                                    >
                                        <Row gutter={[16, 0]}>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="display_name"
                                                    label={<span style={{ fontWeight: 600 }}>ชื่อวัตถุดิบ</span>}
                                                    extra="ใช้ชื่อที่ทีมงานเข้าใจตรงกัน เช่น น้ำตาลทราย นมสด หรือ แป้งเค้ก"
                                                    rules={[
                                                        { required: true, message: "กรุณากรอกชื่อวัตถุดิบ" },
                                                        { max: 100, message: "ความยาวต้องไม่เกิน 100 ตัวอักษร" },
                                                    ]}
                                                >
                                                    <Input
                                                        size="large"
                                                        maxLength={100}
                                                        placeholder="เช่น น้ำตาลทราย"
                                                        onBlur={() => {
                                                            const value = form.getFieldValue("display_name");
                                                            if (typeof value === "string") {
                                                                form.setFieldValue("display_name", value.trim());
                                                            }
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="unit_id"
                                                    label={<span style={{ fontWeight: 600 }}>หน่วยนับ</span>}
                                                    extra="เลือกหน่วยที่ใช้จริงในการสั่งซื้อ รับเข้า และคุมสต็อก"
                                                    rules={[{ required: true, message: "กรุณาเลือกหน่วยนับ" }]}
                                                >
                                                    <ModalSelector
                                                        title="เลือกหน่วยนับวัตถุดิบ"
                                                        value={selectedUnitId}
                                                        onChange={(value) => form.setFieldValue("unit_id", value)}
                                                        options={unitOptions}
                                                        placeholder="เลือกหน่วยนับ"
                                                        showSearch
                                                        disabled={!hasAvailableUnits}
                                                        style={selectorStyle}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24}>
                                                <Form.Item
                                                    name="img_url"
                                                    label={<span style={{ fontWeight: 600 }}>รูปภาพ</span>}
                                                    extra="รองรับ URL แบบ http, https, data:image, blob หรือ path ภายในระบบ"
                                                    rules={[
                                                        {
                                                            validator: async (_, value: string | undefined) => {
                                                                if (!value?.trim()) return;
                                                                const normalized = normalizeImageSource(value);
                                                                if (!isSupportedImageSource(normalized)) {
                                                                    throw new Error(
                                                                        "รองรับเฉพาะ URL รูปภาพแบบ http(s), data:image, blob หรือ path ภายในระบบ"
                                                                    );
                                                                }
                                                            },
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        size="large"
                                                        placeholder="https://example.com/image.jpg"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24}>
                                                <Form.Item
                                                    name="description"
                                                    label={<span style={{ fontWeight: 600 }}>รายละเอียดเพิ่มเติม</span>}
                                                    extra="ใช้ระบุข้อมูลที่ช่วยให้ค้นหาและใช้งานได้ง่ายขึ้น เช่น ยี่ห้อ ประเภท หรือหมายเหตุ"
                                                >
                                                    <TextArea
                                                        rows={5}
                                                        placeholder="เช่น ใช้สำหรับเมนูเบเกอรี่ หรือซื้อจากผู้ขายประจำ"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24}>
                                                <div className="stock-ingredient-switch-panel">
                                                    <div>
                                                        <Text strong>สถานะการใช้งาน</Text>
                                                        <Text type="secondary" className="stock-ingredient-muted-text">
                                                            ปิดการใช้งานเมื่อต้องการเก็บประวัติไว้ แต่ไม่ให้เลือกใช้ต่อ
                                                        </Text>
                                                    </div>
                                                    <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                        <Switch checked={Boolean(isActive)} />
                                                    </Form.Item>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="stock-ingredient-form-actions">
                                            <Button
                                                size="large"
                                                onClick={() => router.replace("/stock/ingredients")}
                                                className="stock-ingredient-action-button"
                                            >
                                                ยกเลิก
                                            </Button>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                size="large"
                                                icon={<SaveOutlined />}
                                                loading={submitting}
                                                disabled={!hasAvailableUnits}
                                                className="stock-ingredient-action-button stock-ingredient-action-button-primary"
                                            >
                                                บันทึกข้อมูล
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div className="stock-ingredient-side-grid">
                                    <Card className="stock-ingredient-card stock-ingredient-side-card">
                                        <div className="stock-ingredient-card-header">
                                            <PictureOutlined className="stock-ingredient-side-icon" />
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>

                                        <div className="stock-ingredient-preview-row">
                                            <StockImageThumb
                                                src={isSupportedImageSource(normalizedImageUrl) ? normalizedImageUrl : null}
                                                alt={displayName.trim() || "ingredient preview"}
                                                size={84}
                                                borderRadius={18}
                                            />
                                            <div style={{ minWidth: 0 }}>
                                                <Title level={4} className="stock-ingredient-preview-title">
                                                    {displayName.trim() || "ชื่อวัตถุดิบ"}
                                                </Title>
                                                <Text type="secondary" className="stock-ingredient-detail-line">
                                                    หน่วยนับ: {selectedUnit?.display_name || "-"}
                                                </Text>
                                                <Text type="secondary" className="stock-ingredient-detail-line">
                                                    สถานะ: {isActive === false ? "ปิดใช้งาน" : "ใช้งาน"}
                                                </Text>
                                            </div>
                                        </div>

                                        {description.trim() ? (
                                            <Paragraph className="stock-ingredient-preview-description">
                                                {description.trim()}
                                            </Paragraph>
                                        ) : null}
                                    </Card>

                                    <Card className="stock-ingredient-card stock-ingredient-side-card">
                                        <div className="stock-ingredient-card-header">
                                            <TagsOutlined className="stock-ingredient-side-icon" />
                                            <Text strong>คำแนะนำ</Text>
                                        </div>
                                        <Paragraph className="stock-ingredient-help-text">
                                            เลือกหน่วยนับให้ตรงกับการรับเข้าจริง เพื่อให้รายงานสต็อกและการสั่งซื้ออ่านง่าย
                                        </Paragraph>
                                        <Paragraph className="stock-ingredient-help-text" style={{ marginBottom: 0 }}>
                                            หากมีรูปภาพ แนะนำให้ใช้ภาพที่มองเห็นสินค้าได้ชัด เพื่อช่วยตรวจสอบรายการได้เร็วขึ้น
                                        </Paragraph>
                                    </Card>

                                    {isEdit && originalIngredient ? (
                                        <Card className="stock-ingredient-card stock-ingredient-side-card">
                                            <div className="stock-ingredient-card-header">
                                                <InfoCircleOutlined className="stock-ingredient-side-icon" />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <Text type="secondary" className="stock-ingredient-detail-line">
                                                รหัสรายการ: {originalIngredient.id}
                                            </Text>
                                            <Text type="secondary" className="stock-ingredient-detail-line">
                                                สร้างเมื่อ: {formatDate(originalIngredient.create_date)}
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
