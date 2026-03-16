"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, App, Button, Card, Col, Form, Input, Modal, Row, Spin, Switch, Typography } from "antd";
import {
    AppstoreOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    DownOutlined,
    ExclamationCircleOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../../../services/auth.service";
import { stockCategoryService } from "../../../../../../services/stock/category.service";
import { ingredientsService } from "../../../../../../services/stock/ingredients.service";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";
import { StockCategory } from "../../../../../../types/api/stock/category";
import { Ingredients } from "../../../../../../types/api/stock/ingredients";
import { IngredientsUnit } from "../../../../../../types/api/stock/ingredientsUnit";
import { isSupportedImageSource, normalizeImageSource } from "../../../../../../utils/image/source";
import { pageStyles, ManagePageStyles, IngredientPreview } from "./style";

const { TextArea } = Input;
const { Title, Text } = Typography;

type ManageMode = "add" | "edit";

type IngredientFormValues = {
    display_name: string;
    description?: string;
    img_url?: string;
    unit_id: string;
    category_id?: string | null;
    is_active: boolean;
};

function getCategoryLoadErrorMessage(error: unknown): string {
    const fallback = "โหลดหมวดหมู่วัตถุดิบไม่สำเร็จ แต่ยังสามารถบันทึกวัตถุดิบโดยไม่เลือกหมวดหมู่ได้";
    if (!(error instanceof Error) || !error.message.trim()) {
        return fallback;
    }

    const message = error.message.trim();
    if (message.includes("Can't find /stock/category") || message.includes("404")) {
        return fallback;
    }

    return `${fallback} (${message})`;
}

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
    const canViewCategory = can("stock.category.page", "view");
    const canAccessPage = isEdit ? canUpdate : isAdd ? canCreate : false;

    const [csrfToken, setCsrfToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);
    const [units, setUnits] = useState<IngredientsUnit[]>([]);
    const [categories, setCategories] = useState<StockCategory[]>([]);
    const [originalIngredient, setOriginalIngredient] = useState<Ingredients | null>(null);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);

    const displayName = Form.useWatch("display_name", form) || "";
    const imageUrl = Form.useWatch("img_url", form) || "";
    const selectedUnitId = Form.useWatch("unit_id", form);
    const selectedCategoryId = Form.useWatch("category_id", form);
    const isActive = Form.useWatch("is_active", form);

    const title = useMemo(() => (isEdit ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบ"), [isEdit]);

    const ensureCsrfToken = useCallback(async (): Promise<string> => {
        if (csrfToken) return csrfToken;

        const token = await authService.getCsrfToken();
        if (token) {
            setCsrfToken(token);
        }

        return token;
    }, [csrfToken]);

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
            setCategoryLoadError(null);

            const unitParams = new URLSearchParams();
            unitParams.set("sort_created", "new");
            const categoryParams = new URLSearchParams();
            categoryParams.set("sort_created", "new");

            const [unitsResult, categoriesResult, ingredientResult] = await Promise.allSettled([
                ingredientsUnitService.findAll(undefined, unitParams),
                canViewCategory ? stockCategoryService.findAll(undefined, categoryParams) : Promise.resolve([]),
                isEdit && id
                    ? ingredientsService.findOne(id, undefined, { signal: controller.signal })
                    : Promise.resolve(null),
            ]);

            if (requestRef.current !== controller) return;

            if (unitsResult.status === "rejected") {
                throw unitsResult.reason;
            }

            if (ingredientResult.status === "rejected") {
                throw ingredientResult.reason;
            }

            const unitsData = unitsResult.value;
            const ingredientData = ingredientResult.value;
            const categoriesData =
                categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value)
                    ? categoriesResult.value
                    : [];

            if (canViewCategory && categoriesResult.status === "rejected") {
                setCategoryLoadError(getCategoryLoadErrorMessage(categoriesResult.reason));
            }

            setUnits(Array.isArray(unitsData) ? unitsData : []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);

            if (ingredientData) {
                form.setFieldsValue({
                    display_name: ingredientData.display_name,
                    description: ingredientData.description || "",
                    img_url: ingredientData.img_url || "",
                    unit_id: ingredientData.unit_id,
                    category_id: ingredientData.category_id || null,
                    is_active: ingredientData.is_active,
                });
                setOriginalIngredient(ingredientData);
            } else {
                form.setFieldsValue({
                    description: "",
                    img_url: "",
                    category_id: null,
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
    }, [canAccessPage, canViewCategory, form, id, isEdit, isValidMode, messageApi, router]);

    useEffect(() => {
        void fetchPageData();
        return () => {
            requestRef.current?.abort();
        };
    }, [fetchPageData]);

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

    const onFinish = async (values: IngredientFormValues) => {
        if (!hasAvailableUnits) {
            messageApi.warning("กรุณาสร้างหน่วยนับวัตถุดิบก่อน");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const token = await ensureCsrfToken();
            const payload = {
                display_name: values.display_name.trim(),
                description: values.description?.trim() || "",
                img_url: normalizeImageSource(values.img_url) || null,
                unit_id: values.unit_id,
                category_id: values.category_id?.trim() || null,
                is_active: Boolean(values.is_active),
            };

            if (isEdit && id) {
                await ingredientsService.update(id, payload, undefined, token);
                messageApi.success("บันทึกการแก้ไขวัตถุดิบเรียบร้อย");
            } else {
                await ingredientsService.create(payload, undefined, token);
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
                    const token = await ensureCsrfToken();
                    await ingredientsService.delete(id, undefined, token);
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
        <div style={pageStyles.container} data-testid="stock-ingredient-manage-page">
            <ManagePageStyles />

            <UIPageHeader
                title={title}
                onBack={() => router.replace("/stock/ingredients")}
                actions={
                    isEdit && canDelete ? (
                        <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleting} data-testid="stock-ingredient-delete">
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: "transparent", border: "none" }}>
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} style={{ borderRadius: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: "#0e7490" }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลวัตถุดิบ</Title>
                                    </div>

                                    {error ? <Alert type="error" showIcon style={{ marginBottom: 20 }} message={error} /> : null}
                                    {categoryLoadError ? <Alert type="warning" showIcon style={{ marginBottom: 20 }} message={categoryLoadError} /> : null}
                                    {!hasAvailableUnits ? (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            style={{ marginBottom: 20 }}
                                            message="ยังไม่มีหน่วยนับวัตถุดิบให้เลือก"
                                            description="กรุณาสร้างหน่วยนับก่อนเพื่อให้สามารถบันทึกวัตถุดิบได้"
                                        />
                                    ) : null}

                                    <Form<IngredientFormValues>
                                        form={form}
                                        layout="vertical"
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{ description: "", img_url: "", category_id: null, is_active: true }}
                                        onFinish={(values) => void onFinish(values)}
                                    >
                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600 }}>ชื่อวัตถุดิบ</span>}
                                            rules={[
                                                { required: true, message: "กรุณากรอกชื่อวัตถุดิบ" },
                                                { max: 100, message: "ความยาวต้องไม่เกิน 100 ตัวอักษร" },
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                maxLength={100}
                                                placeholder="เช่น น้ำตาลทราย"
                                                data-testid="stock-ingredient-display-name-input"
                                            />
                                        </Form.Item>

                                        <Row gutter={12}>
                                            <Col xs={24} md={12}>
                                                <Form.Item name="unit_id" label={<span style={{ fontWeight: 600 }}>หน่วยนับ</span>} rules={[{ required: true, message: "กรุณาเลือกหน่วยนับ" }]}>
                                                    <div onClick={() => setIsUnitModalVisible(true)} data-testid="stock-ingredient-unit-picker" style={{ padding: "10px 16px", borderRadius: 12, border: "2px solid #e2e8f0", cursor: "pointer", minHeight: 46, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span>{selectedUnitId ? units.find((u) => u.id === selectedUnitId)?.display_name : "เลือกหน่วยนับ"}</span>
                                                        <DownOutlined />
                                                    </div>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item name="category_id" label={<span style={{ fontWeight: 600 }}>หมวดหมู่</span>}>
                                                    <div onClick={() => setIsCategoryModalVisible(true)} data-testid="stock-ingredient-category-picker" style={{ padding: "10px 16px", borderRadius: 12, border: "2px solid #e2e8f0", cursor: "pointer", minHeight: 46, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span>{selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId)?.display_name : "เลือกหมวดหมู่"}</span>
                                                        <DownOutlined />
                                                    </div>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="img_url"
                                            label={<span style={{ fontWeight: 600 }}>รูปภาพ URL</span>}
                                            rules={[
                                                {
                                                    validator: async (_, value: string | undefined) => {
                                                        if (!value?.trim()) return;
                                                        if (!isSupportedImageSource(normalizeImageSource(value))) {
                                                            throw new Error("รองรับเฉพาะ URL รูปภาพแบบ http(s), data:image และ blob");
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" placeholder="https://example.com/image.jpg" />
                                        </Form.Item>

                                        <Form.Item name="description" label={<span style={{ fontWeight: 600 }}>รายละเอียดเพิ่มเติม</span>}>
                                            <TextArea rows={4} maxLength={500} placeholder="รายละเอียดสินค้า, หมายเหตุ" />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: "#f8fafc", borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: "block", fontSize: 13 }}>เปิดใช้งานเพื่อให้เลือกวัตถุดิบนี้ในระบบสต็อกได้</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={Boolean(isActive)} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace("/stock/ingredients")} style={{ flex: 1 }}>ยกเลิก</Button>
                                            <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={submitting} disabled={!hasAvailableUnits} style={{ flex: 2 }} data-testid="stock-ingredient-submit">
                                                บันทึกข้อมูล
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div style={{ display: "grid", gap: 14 }}>
                                    <Card style={{ borderRadius: 20 }}>
                                        <Title level={5} style={{ color: "#0e7490", marginBottom: 16 }}>ตัวอย่างการแสดงผล</Title>
                                        <IngredientPreview
                                            name={displayName}
                                            imageUrl={imageUrl}
                                            category={categories.find((c) => c.id === selectedCategoryId)?.display_name}
                                            unit={units.find((u) => u.id === selectedUnitId)?.display_name}
                                            isActive={isActive}
                                        />
                                    </Card>

                                    {isEdit && originalIngredient ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: "#0e7490" }} />
                                                <Text strong>รายละเอียด</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: "block" }}>สร้างเมื่อ: {formatDate(originalIngredient.create_date)}</Text>
                                        </Card>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>

            <Modal title="เลือกหมวดหมู่" open={isCategoryModalVisible} onCancel={() => setIsCategoryModalVisible(false)} footer={null} centered width="min(400px, calc(100vw - 16px))">
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "60vh", overflowY: "auto" }}>
                    <div
                        onClick={() => {
                            form.setFieldsValue({ category_id: null });
                            setIsCategoryModalVisible(false);
                        }}
                        data-testid="stock-ingredient-category-clear"
                        style={{ padding: "14px 18px", border: "2px solid", borderRadius: 12, cursor: "pointer", background: !selectedCategoryId ? "#ecfeff" : "#fff", borderColor: !selectedCategoryId ? "#0e7490" : "#e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                        <span>ไม่เลือกหมวดหมู่</span>
                        {!selectedCategoryId ? <CheckCircleOutlined style={{ color: "#0e7490" }} /> : null}
                    </div>
                    {categories.filter((cat) => cat.is_active || cat.id === selectedCategoryId).map((cat) => (
                        <div key={cat.id} onClick={() => { form.setFieldsValue({ category_id: cat.id }); setIsCategoryModalVisible(false); }} data-testid={`stock-ingredient-category-option-${cat.id}`} style={{ padding: "14px 18px", border: "2px solid", borderRadius: 12, cursor: "pointer", background: selectedCategoryId === cat.id ? "#ecfeff" : "#fff", borderColor: selectedCategoryId === cat.id ? "#0e7490" : "#e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{cat.is_active ? cat.display_name : `${cat.display_name} (ปิดใช้งาน)`}</span>
                            {selectedCategoryId === cat.id ? <CheckCircleOutlined style={{ color: "#0e7490" }} /> : null}
                        </div>
                    ))}
                </div>
            </Modal>

            <Modal title="เลือกหน่วยนับ" open={isUnitModalVisible} onCancel={() => setIsUnitModalVisible(false)} footer={null} centered width="min(400px, calc(100vw - 16px))">
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "60vh", overflowY: "auto" }}>
                    {units.filter((unit) => unit.is_active || unit.id === selectedUnitId).map((unit) => (
                        <div key={unit.id} onClick={() => { form.setFieldsValue({ unit_id: unit.id }); setIsUnitModalVisible(false); }} data-testid={`stock-ingredient-unit-option-${unit.id}`} style={{ padding: "14px 18px", border: "2px solid", borderRadius: 12, cursor: "pointer", background: selectedUnitId === unit.id ? "#ecfeff" : "#fff", borderColor: selectedUnitId === unit.id ? "#0e7490" : "#e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{unit.is_active ? unit.display_name : `${unit.display_name} (ปิดใช้งาน)`}</span>
                            {selectedUnitId === unit.id ? <CheckCircleOutlined style={{ color: "#0e7490" }} /> : null}
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
