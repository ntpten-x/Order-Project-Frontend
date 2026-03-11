"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Form, Input, Space, Switch, Typography } from "antd";
import { DeleteOutlined, SaveOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import StockImageThumb from "../../../../../../components/stock/StockImageThumb";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";
import PageSection from "../../../../../../components/ui/page/PageSection";
import PageStack from "../../../../../../components/ui/page/PageStack";
import { ModalSelector } from "../../../../../../components/ui/select/ModalSelector";
import PageState from "../../../../../../components/ui/states/PageState";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../../../services/auth.service";
import { ingredientsService } from "../../../../../../services/stock/ingredients.service";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";
import { IngredientsUnit } from "../../../../../../types/api/stock/ingredientsUnit";
import { isSupportedImageSource, normalizeImageSource } from "../../../../../../utils/image/source";
import IngredientsManageStyle from "./style";

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

type IngredientFormValues = {
    display_name: string;
    description?: string;
    img_url?: string;
    unit_id: string;
    is_active: boolean;
};

export default function IngredientsManagePage({ params }: { params: { mode: string[] } }) {
    const { message: messageApi, modal } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm<IngredientFormValues>();
    const requestRef = useRef<AbortController | null>(null);

    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === "edit" && Boolean(id);
    const isAdd = mode === "add";

    const canCreate = can("stock.ingredients.page", "create");
    const canUpdate = can("stock.ingredients.page", "update");
    const canDelete = can("stock.ingredients.page", "delete");
    const canAccessPage = isEdit ? canUpdate : isAdd ? canCreate : false;

    const [csrfToken, setCsrfToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [units, setUnits] = useState<IngredientsUnit[]>([]);

    const displayName = Form.useWatch("display_name", form) || "";
    const imageUrl = Form.useWatch("img_url", form) || "";
    const selectedUnitId = Form.useWatch("unit_id", form);
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

    const fetchPageData = useCallback(async () => {
        if (!canAccessPage || (!isAdd && !isEdit)) return;

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
            } else {
                form.setFieldsValue({
                    description: "",
                    img_url: "",
                    is_active: true,
                });
            }
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            if (requestRef.current !== controller) return;

            setError(err instanceof Error ? err.message : "โหลดข้อมูลวัตถุดิบไม่สำเร็จ");
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setLoading(false);
            }
        }
    }, [canAccessPage, form, id, isAdd, isEdit]);

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
                })),
        [selectedUnitId, units]
    );

    const pageMeta = useMemo(() => {
        if (isEdit) {
            return {
                title: "แก้ไขวัตถุดิบ",
                subtitle: "อัปเดตชื่อที่ใช้แสดง หน่วยนับ รูปภาพ และสถานะให้ตรงกับงานจริงของสาขา",
            };
        }

        return {
            title: "เพิ่มวัตถุดิบ",
            subtitle: "สร้างวัตถุดิบใหม่เพื่อใช้ในใบสั่งซื้อและการตรวจรับของในระบบ stock",
        };
    }, [isEdit]);

    const onFinish = async (values: IngredientFormValues) => {
        setSaving(true);
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

            router.push("/stock/ingredients");
        } catch (err) {
            const message = err instanceof Error ? err.message : "บันทึกข้อมูลวัตถุดิบไม่สำเร็จ";
            setError(message);
            messageApi.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDelete) return;

        modal.confirm({
            title: "ลบวัตถุดิบ",
            content: `ต้องการลบ "${displayName || "-"}" หรือไม่ หากมีใบสั่งซื้ออ้างอิงอยู่ ระบบจะไม่อนุญาตให้ลบ`,
            okText: "ลบวัตถุดิบ",
            okButtonProps: { danger: true, loading: deleting },
            cancelText: "ยกเลิก",
            onOk: async () => {
                setDeleting(true);
                try {
                    await ingredientsService.delete(id, undefined, csrfToken);
                    messageApi.success("ลบวัตถุดิบเรียบร้อย");
                    router.push("/stock/ingredients");
                } catch (err) {
                    const message = err instanceof Error ? err.message : "ลบวัตถุดิบไม่สำเร็จ";
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
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการวัตถุดิบ" tone="danger" />;
    }

    if (!isAdd && !isEdit) {
        return (
            <div className="stock-ingredient-manage-shell">
                <IngredientsManageStyle />
                <UIPageHeader
                    title="รูปแบบหน้าจอไม่ถูกต้อง"
                    subtitle="โปรดกลับไปที่รายการวัตถุดิบ แล้วเลือกเพิ่มหรือแก้ไขอีกครั้ง"
                    icon={<ShoppingOutlined />}
                    onBack={() => router.push("/stock/ingredients")}
                />
                <PageContainer maxWidth={960}>
                    <PageSection>
                        <PageState
                            status="error"
                            title="ไม่พบโหมดที่ต้องการใช้งาน"
                            action={
                                <Button type="primary" onClick={() => router.push("/stock/ingredients")}>
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
        <div className="stock-ingredient-manage-shell" data-testid="stock-ingredient-manage-page">
            <IngredientsManageStyle />

            <UIPageHeader
                title={pageMeta.title}
                subtitle={pageMeta.subtitle}
                icon={<ShoppingOutlined />}
                onBack={() => router.push("/stock/ingredients")}
                actions={
                    isEdit && canDelete ? (
                        <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleting}>
                            ลบวัตถุดิบ
                        </Button>
                    ) : undefined
                }
            />

            <PageContainer maxWidth={980}>
                <PageStack gap={14}>
                    <section className="stock-ingredient-manage-hero">
                        <div className="stock-ingredient-manage-grid">
                            <div>
                                <span className="stock-ingredient-manage-eyebrow">
                                    <ShoppingOutlined />
                                    {isEdit ? "edit ingredient" : "create ingredient"}
                                </span>
                                <h1 className="stock-ingredient-manage-title">{pageMeta.title}</h1>
                                <p className="stock-ingredient-manage-subtitle">
                                    ใช้ชื่อเดียวเป็นมาตรฐานทั้งการ์ดวัตถุดิบ ใบสั่งซื้อ และหน้าตรวจรับของ เพื่อลดความสับสนเวลาใช้งานจริง
                                </p>
                            </div>

                            <aside className="stock-ingredient-manage-preview">
                                <span className="stock-ingredient-manage-preview-key">ตัวอย่างที่จะแสดงในระบบ</span>
                                <div className="stock-ingredient-manage-preview-row">
                                    <StockImageThumb
                                        src={isSupportedImageSource(imageUrl) ? imageUrl : null}
                                        alt={displayName?.trim() || "ingredient preview"}
                                        size={84}
                                        borderRadius={18}
                                    />
                                    <div>
                                        <div className="stock-ingredient-manage-preview-value">
                                            {displayName?.trim() || "ชื่อวัตถุดิบที่ใช้แสดง"}
                                        </div>
                                        <Paragraph style={{ margin: "4px 0 0", color: "#64748b" }}>
                                            หน่วยนับ: <Text strong>{selectedUnit?.display_name || "-"}</Text>
                                        </Paragraph>
                                        <Space wrap style={{ marginTop: 6 }}>
                                            <Text type="secondary">
                                                สถานะ: <Text strong>{isActive === false ? "ปิดใช้งาน" : "ใช้งาน"}</Text>
                                            </Text>
                                        </Space>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </section>

                    <section className="stock-ingredient-manage-panel">
                        {loading ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูลวัตถุดิบ" />
                        ) : error && isEdit && !displayName ? (
                            <PageState status="error" title={error} onRetry={() => void fetchPageData()} />
                        ) : unitOptions.length === 0 ? (
                            <PageState
                                status="empty"
                                title="ยังไม่มีหน่วยนับวัตถุดิบให้เลือก"
                                description="ควรสร้างหน่วยนับก่อน เช่น กิโลกรัม กรัม ลิตร หรือ แพ็ก เพื่อให้วัตถุดิบถูกจัดเก็บอย่างเป็นมาตรฐาน"
                                action={
                                    <Button type="primary" onClick={() => router.push("/stock/ingredientsUnit")}>
                                        ไปหน้าหน่วยนับ
                                    </Button>
                                }
                            />
                        ) : (
                            <Form<IngredientFormValues>
                                form={form}
                                layout="vertical"
                                requiredMark={false}
                                autoComplete="off"
                                initialValues={{ description: "", img_url: "", is_active: true }}
                                onFinish={(values) => void onFinish(values)}
                            >
                                <Form.Item
                                    name="display_name"
                                    label="ชื่อวัตถุดิบ"
                                    extra="ชื่อนี้จะใช้แสดงในหน้าวัตถุดิบ ใบสั่งซื้อ และรายการตรวจรับ"
                                    rules={[
                                        { required: true, message: "กรุณากรอกชื่อวัตถุดิบ" },
                                        { max: 100, message: "ความยาวต้องไม่เกิน 100 ตัวอักษร" },
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="เช่น น้ำตาลทราย"
                                        data-testid="stock-ingredient-display-name-input"
                                        onBlur={() => {
                                            const value = form.getFieldValue("display_name");
                                            if (typeof value === "string") {
                                                form.setFieldValue("display_name", value.trim());
                                            }
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="unit_id"
                                    label="หน่วยนับวัตถุดิบ"
                                    extra="เลือกหน่วยนับที่ใช้จริงในการสั่งซื้อและตรวจรับ"
                                    rules={[{ required: true, message: "กรุณาเลือกหน่วยนับวัตถุดิบ" }]}
                                >
                                    <ModalSelector
                                        title="เลือกหน่วยนับวัตถุดิบ"
                                        value={selectedUnitId}
                                        onChange={(value) => form.setFieldValue("unit_id", value)}
                                        options={unitOptions}
                                        placeholder="เลือกหน่วยนับ"
                                        showSearch
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="img_url"
                                    label="รูปภาพ"
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
                                    <Input size="large" placeholder="https://example.com/image.jpg" />
                                </Form.Item>

                                <Form.Item
                                    name="description"
                                    label="รายละเอียด"
                                    extra="ใช้บันทึกรายละเอียดเพิ่มเติม เช่น ยี่ห้อ ประเภท หรือหมายเหตุสำหรับการซื้อ"
                                >
                                    <TextArea rows={5} placeholder="เช่น ใช้ทำเมนูเบเกอรี่หรือซื้อจากร้านประจำ" />
                                </Form.Item>

                                <Form.Item
                                    name="is_active"
                                    label="สถานะการใช้งาน"
                                    valuePropName="checked"
                                    extra="ปิดใช้งานเมื่อต้องการเก็บประวัติไว้ แต่ไม่ต้องการให้เลือกใช้ต่อ"
                                >
                                    <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิดใช้งาน" />
                                </Form.Item>
                            </Form>
                        )}
                    </section>

                    <section className="stock-ingredient-manage-actions">
                        <div className="stock-ingredient-manage-actions-left">
                            <Button size="large" onClick={() => router.push("/stock/ingredients")}>
                                กลับหน้ารายการ
                            </Button>
                        </div>
                        <div className="stock-ingredient-manage-actions-right">
                            {isEdit && canDelete ? (
                                <Button danger size="large" icon={<DeleteOutlined />} onClick={handleDelete} loading={deleting}>
                                    ลบวัตถุดิบ
                                </Button>
                            ) : null}
                            <Button
                                type="primary"
                                size="large"
                                icon={<SaveOutlined />}
                                loading={saving}
                                onClick={() => form.submit()}
                                data-testid="stock-ingredient-save"
                            >
                                {isEdit ? "บันทึกการแก้ไข" : "สร้างวัตถุดิบ"}
                            </Button>
                        </div>
                    </section>
                </PageStack>
            </PageContainer>
        </div>
    );
}
