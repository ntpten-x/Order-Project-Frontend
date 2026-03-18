"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Card, Col, Form, Input, Modal, Row, Space, Spin, Switch, Tag, Typography, message } from "antd";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import { ModalSelector } from "../../../../../../components/ui/select/ModalSelector";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import {
    PRODUCTS_CAPABILITIES,
    PRODUCTS_ROLE_BLUEPRINT,
} from "../../../../../../lib/rbac/products-capabilities";
import { Category } from "../../../../../../types/api/pos/category";
import { Products } from "../../../../../../types/api/pos/products";
import { ProductsUnit } from "../../../../../../types/api/pos/productsUnit";
import { ToppingGroup } from "../../../../../../types/api/pos/toppingGroup";
import { isSupportedImageSource, normalizeImageSource } from "../../../../../../utils/image/source";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { checkProductSetupState, getSetupMissingMessage } from "../../../../../../utils/products/productSetup.utils";
import { ActionButtons, ManagePageStyles, PageHeader, ProductPreview, pageStyles } from "./style";

const { TextArea } = Input;
const { Title, Text } = Typography;

type ManageMode = "add" | "edit";
type ProductFormValues = {
    display_name: string;
    description?: string;
    img_url?: string;
    price: number | string;
    price_delivery?: number | string;
    category_id: string;
    topping_group_ids?: string[];
    unit_id: string;
    is_active?: boolean;
};

const parseListResponse = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
        return (payload as { data: T[] }).data;
    }
    return [];
};

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

const formatDate = (raw?: string | Date) => {
    if (!raw) return "-";
    const date = new Date(raw);
    return Number.isNaN(date.getTime())
        ? "-"
        : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const sortStringArray = (value?: string[] | null) => [...(value || [])].map((item) => String(item)).sort();

export default function ProductsManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<ProductFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [toppingGroups, setToppingGroups] = useState<ToppingGroup[]>([]);
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [csrfToken, setCsrfToken] = useState("");
    const [originalProduct, setOriginalProduct] = useState<Products | null>(null);
    const [currentName, setCurrentName] = useState("");

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === "edit" && Boolean(id);
    const isValidMode = mode === "add" || mode === "edit";

    const { isAuthorized, isChecking, user } = useRoleGuard({
        requiredPermission: { resourceKey: "products.manager.feature", action: "access" },
        redirectUnauthorized: "/pos/products",
        unauthorizedMessage: "You do not have permission to access the product manager",
    });
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canCreateProduct =
        can("products.page", "create") &&
        can("products.create.feature", "create") &&
        can("products.manager.feature", "access");
    const canEditCatalog =
        can("products.page", "update") &&
        can("products.catalog.feature", "update") &&
        can("products.manager.feature", "access");
    const canEditPricing =
        can("products.page", "update") &&
        can("products.pricing.feature", "update") &&
        can("products.manager.feature", "access");
    const canEditStructure =
        can("products.page", "update") &&
        can("products.structure.feature", "update") &&
        can("products.manager.feature", "access");
    const canToggleStatus =
        can("products.page", "update") &&
        can("products.status.feature", "update") &&
        can("products.manager.feature", "access");
    const canDeleteProduct =
        can("products.page", "delete") &&
        can("products.delete.feature", "delete") &&
        can("products.manager.feature", "access");
    const canEditAnyProduct = canEditCatalog || canEditPricing || canEditStructure || canToggleStatus || canDeleteProduct;

    const selectedCategoryId = Form.useWatch("category_id", form);
    const watchedToppingGroupIds = Form.useWatch("topping_group_ids", form);
    const toppingGroupIds = useMemo(() => watchedToppingGroupIds ?? [], [watchedToppingGroupIds]);
    const selectedUnitId = Form.useWatch("unit_id", form);
    const displayName = Form.useWatch("display_name", form);
    const imageUrl = Form.useWatch("img_url", form);
    const price = Form.useWatch("price", form);
    const priceDelivery = Form.useWatch("price_delivery", form);
    const isActive = Form.useWatch("is_active", form) ?? true;

    const currentRoleName = String(user?.role ?? "").trim().toLowerCase();
    const selectedRoleBlueprint = useMemo(
        () => PRODUCTS_ROLE_BLUEPRINT.find((item) => item.roleName.toLowerCase() === currentRoleName) ?? null,
        [currentRoleName]
    );
    const capabilityMatrix = useMemo(
        () => PRODUCTS_CAPABILITIES.map((item) => ({ ...item, enabled: can(item.resourceKey, item.action) })),
        [can]
    );

    const activeCategories = useMemo(() => categories.filter((item) => item.is_active), [categories]);
    const activeUnits = useMemo(() => units.filter((item) => item.is_active), [units]);
    const availableCategories = useMemo(() => {
        if (!selectedCategoryId) return activeCategories;
        return categories.filter((item) => item.is_active || item.id === selectedCategoryId);
    }, [activeCategories, categories, selectedCategoryId]);
    const availableUnits = useMemo(() => {
        if (!selectedUnitId) return activeUnits;
        return units.filter((item) => item.is_active || item.id === selectedUnitId);
    }, [activeUnits, selectedUnitId, units]);
    const availableToppingGroups = useMemo(
        () => toppingGroups.filter((item) => item.is_active || toppingGroupIds.includes(item.id)),
        [toppingGroupIds, toppingGroups]
    );
    const setupState = useMemo(() => checkProductSetupState(categories, units), [categories, units]);
    const setupMessage = useMemo(() => getSetupMissingMessage(categories, units), [categories, units]);

    useEffect(() => {
        if (!isValidMode || (mode === "edit" && !id)) {
            message.warning("Invalid product manager URL");
            router.replace("/pos/products");
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        if (mode === "add" && !canCreateProduct) {
            message.warning("You do not have permission to create products");
            router.replace("/pos/products");
            return;
        }
        if (mode === "edit" && !canEditAnyProduct) {
            message.warning("You do not have permission to edit products");
            router.replace("/pos/products");
        }
    }, [canCreateProduct, canEditAnyProduct, isAuthorized, isChecking, mode, permissionLoading, router]);

    const fetchDependencies = useCallback(async () => {
        try {
            const [categoryResponse, toppingResponse, unitResponse] = await Promise.all([
                fetch("/api/pos/category", { cache: "no-store" }),
                fetch("/api/pos/toppingGroup", { cache: "no-store" }),
                fetch("/api/pos/productsUnit", { cache: "no-store" }),
            ]);

            if (categoryResponse.ok) {
                setCategories(parseListResponse<Category>(await categoryResponse.json()));
            }
            if (toppingResponse.ok) {
                setToppingGroups(parseListResponse<ToppingGroup>(await toppingResponse.json()));
            }
            if (unitResponse.ok) {
                setUnits(parseListResponse<ProductsUnit>(await unitResponse.json()));
            }
        } catch (dependencyError) {
            console.error(dependencyError);
        }
    }, []);

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/products/getById/${id}`, { cache: "no-store" });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || errorPayload.message || "Failed to fetch product");
            }

            const data = await response.json();
            form.setFieldsValue({
                display_name: data.display_name,
                description: data.description || "",
                img_url: data.img_url || undefined,
                price: Number(data.price || 0),
                price_delivery: Number(data.price_delivery ?? data.price ?? 0),
                category_id: data.category_id,
                topping_group_ids: (data.topping_groups || []).map((group: ToppingGroup) => group.id),
                unit_id: data.unit_id,
                is_active: data.is_active,
            });
            setCurrentName((data.display_name || "").toLowerCase());
            setOriginalProduct(data);
        } catch (fetchError) {
            console.error(fetchError);
            message.error(fetchError instanceof Error ? fetchError.message : "Failed to fetch product");
            router.replace("/pos/products");
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (!isAuthorized || permissionLoading) return;
        void fetchDependencies();
        if (isEdit) void fetchProduct();
    }, [fetchDependencies, fetchProduct, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;
        if (isEdit && value.toLowerCase() === currentName) return false;
        try {
            const response = await fetch(`/api/pos/products/getByName/${encodeURIComponent(value)}`, { cache: "no-store" });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [currentName, id, isEdit]);

    const buildCreatePayload = (values: ProductFormValues) => ({
        display_name: values.display_name.trim(),
        description: values.description?.trim() ?? "",
        img_url: normalizeImageSource(values.img_url) || null,
        price: Number(values.price || 0),
        price_delivery:
            values.price_delivery === undefined || values.price_delivery === null || values.price_delivery === ""
                ? Number(values.price || 0)
                : Number(values.price_delivery),
        category_id: values.category_id,
        topping_group_ids: values.topping_group_ids || [],
        unit_id: values.unit_id,
        is_active: values.is_active ?? true,
    });

    const buildUpdatePayload = (values: ProductFormValues) => {
        if (!originalProduct) return {};
        const payload: Record<string, unknown> = {};

        const normalizedDisplayName = values.display_name.trim();
        const normalizedDescription = values.description?.trim() ?? "";
        const normalizedImageUrl = normalizeImageSource(values.img_url) || null;
        const nextPrice = Number(values.price || 0);
        const nextDeliveryPrice =
            values.price_delivery === undefined || values.price_delivery === null || values.price_delivery === ""
                ? nextPrice
                : Number(values.price_delivery);
        const nextToppingGroups = sortStringArray(values.topping_group_ids);
        const currentToppingGroups = sortStringArray((originalProduct.topping_groups || []).map((group) => group.id));

        if (canEditCatalog && normalizedDisplayName !== (originalProduct.display_name || "").trim()) {
            payload.display_name = normalizedDisplayName;
        }
        if (canEditCatalog && normalizedDescription !== (originalProduct.description || "").trim()) {
            payload.description = normalizedDescription;
        }
        if (canEditCatalog && normalizedImageUrl !== (normalizeImageSource(originalProduct.img_url) || null)) {
            payload.img_url = normalizedImageUrl;
        }
        if (canEditPricing && nextPrice !== Number(originalProduct.price || 0)) {
            payload.price = nextPrice;
        }
        if (canEditPricing && nextDeliveryPrice !== Number(originalProduct.price_delivery ?? originalProduct.price ?? 0)) {
            payload.price_delivery = nextDeliveryPrice;
        }
        if (canEditStructure && values.category_id !== originalProduct.category_id) {
            payload.category_id = values.category_id;
        }
        if (canEditStructure && values.unit_id !== originalProduct.unit_id) {
            payload.unit_id = values.unit_id;
        }
        if (canEditStructure && nextToppingGroups.join("|") !== currentToppingGroups.join("|")) {
            payload.topping_group_ids = nextToppingGroups;
        }
        if (canToggleStatus && Boolean(values.is_active) !== Boolean(originalProduct.is_active)) {
            payload.is_active = Boolean(values.is_active);
        }

        return payload;
    };

    const handleSubmit = async (values: ProductFormValues) => {
        if (!isEdit && !canCreateProduct) {
            message.warning("You do not have permission to create products");
            return;
        }
        if (isEdit && !canEditAnyProduct) {
            message.warning("You do not have permission to update products");
            return;
        }
        if (!isEdit && !setupState.isReady) {
            message.warning(setupMessage || "Product setup is not ready");
            return;
        }
        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload = isEdit ? buildUpdatePayload(values) : buildCreatePayload(values);

            if (isEdit && Object.keys(payload).length === 0) {
                message.warning("No authorized changes detected");
                return;
            }

            const response = await fetch(isEdit ? `/api/pos/products/update/${id}` : "/api/pos/products/create", {
                method: isEdit ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": token,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || errorPayload.message || "Failed to save product");
            }

            message.success(isEdit ? "Product updated successfully" : "Product created successfully");
            router.replace("/pos/products");
        } catch (submitError) {
            console.error(submitError);
            message.error(submitError instanceof Error ? submitError.message : "Failed to save product");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDeleteProduct) return;
        Modal.confirm({
            title: "Delete product",
            content: `Delete "${displayName || "-"}" from this branch catalog?`,
            okText: "Delete",
            cancelText: "Cancel",
            okType: "danger",
            centered: true,
            icon: <DeleteOutlined style={{ color: "#ef4444" }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/products/delete/${id}`, {
                        method: "DELETE",
                        headers: { "X-CSRF-Token": token },
                    });
                    if (!response.ok) {
                        const errorPayload = await response.json().catch(() => ({}));
                        throw new Error(errorPayload.error || errorPayload.message || "Failed to delete product");
                    }
                    message.success("Product deleted successfully");
                    router.replace("/pos/products");
                } catch (deleteError) {
                    console.error(deleteError);
                    message.error(deleteError instanceof Error ? deleteError.message : "Failed to delete product");
                }
            },
        });
    };

    if (isChecking || permissionLoading) return <AccessGuardFallback message="Checking product permissions..." />;
    if (!isAuthorized) return <AccessGuardFallback message="You do not have permission to access this page" tone="danger" />;
    if (mode === "add" && !canCreateProduct) return <AccessGuardFallback message="You do not have permission to create products" tone="danger" />;
    if (mode === "edit" && !canEditAnyProduct) return <AccessGuardFallback message="You do not have permission to edit this product" tone="danger" />;

    return (
        <div className="manage-page" style={pageStyles.container}>
            <ManagePageStyles />
            <PageHeader
                isEdit={isEdit}
                onBack={() => router.replace("/pos/products")}
                onDelete={canDeleteProduct ? handleDelete : undefined}
            />

            <PageContainer maxWidth={1120}>
                <PageSection style={{ background: "transparent", border: "none" }}>
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} style={{ borderRadius: 22 }}>
                                    <Space direction="vertical" size={12} style={{ width: "100%", marginBottom: 20 }}>
                                        <Alert
                                            type={selectedRoleBlueprint?.roleName === "Employee" ? "info" : "success"}
                                            showIcon
                                            message={selectedRoleBlueprint?.title || "Products Governance"}
                                            description={
                                                selectedRoleBlueprint
                                                    ? `${selectedRoleBlueprint.summary} | Allowed: ${selectedRoleBlueprint.allowed.join(", ")}${
                                                        selectedRoleBlueprint.denied.length > 0 ? ` | Restricted: ${selectedRoleBlueprint.denied.join(", ")}` : ""
                                                    }`
                                                    : "Capability-based governance is active for this page"
                                            }
                                        />
                                        {!setupState.isReady ? (
                                            <Alert
                                                type="warning"
                                                showIcon
                                                message="Catalog dependencies are incomplete"
                                                description={setupMessage || "Activate at least one category and one unit before creating products"}
                                            />
                                        ) : null}
                                    </Space>

                                    <Form<ProductFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSubmit}
                                        initialValues={{
                                            is_active: true,
                                            price: 0,
                                            price_delivery: 0,
                                            topping_group_ids: [],
                                        }}
                                        onValuesChange={(changed) => {
                                            if (!isEdit && changed.price !== undefined && !form.isFieldTouched("price_delivery")) {
                                                form.setFieldsValue({ price_delivery: changed.price });
                                            }
                                        }}
                                    >
                                        <Form.Item
                                            name="display_name"
                                            label="Product name"
                                            validateTrigger={["onBlur", "onSubmit"]}
                                            rules={[
                                                { required: true, message: "Please enter a product name" },
                                                { max: 100, message: "Product name must be 100 characters or fewer" },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        if (await checkNameConflict(value)) throw new Error("This product name is already in use");
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" maxLength={100} placeholder="Americano, Latte, Fried rice..." disabled={isEdit && !canEditCatalog} />
                                        </Form.Item>

                                        <Row gutter={12}>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="price"
                                                    label="Store price"
                                                    rules={[{ required: true, message: "Please enter a price" }]}
                                                >
                                                    <Input
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        disabled={isEdit && !canEditPricing}
                                                        style={{ width: "100%", borderRadius: 12, height: 46 }}
                                                        onChange={(event) => {
                                                            const normalized = normalizeDigits(event.target.value);
                                                            form.setFieldValue("price", normalized);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item name="price_delivery" label="Delivery price">
                                                    <Input
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        disabled={isEdit && !canEditPricing}
                                                        style={{ width: "100%", borderRadius: 12, height: 46 }}
                                                        onChange={(event) => {
                                                            const normalized = normalizeDigits(event.target.value);
                                                            form.setFieldValue("price_delivery", normalized);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={12}>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="category_id"
                                                    label="Category"
                                                    rules={[{ required: true, message: "Please select a category" }]}
                                                >
                                                    <ModalSelector<string>
                                                        title="Select category"
                                                        value={selectedCategoryId}
                                                        onChange={(value) => form.setFieldValue("category_id", value)}
                                                        options={availableCategories.map((item) => ({
                                                            label: item.display_name,
                                                            value: item.id,
                                                            searchLabel: item.display_name,
                                                        }))}
                                                        showSearch
                                                        disabled={isEdit && !canEditStructure}
                                                        placeholder="Select category"
                                                        style={{ minHeight: 46, borderRadius: 12, padding: "10px 16px" }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="unit_id"
                                                    label="Unit"
                                                    rules={[{ required: true, message: "Please select a unit" }]}
                                                >
                                                    <ModalSelector<string>
                                                        title="Select unit"
                                                        value={selectedUnitId}
                                                        onChange={(value) => form.setFieldValue("unit_id", value)}
                                                        options={availableUnits.map((item) => ({
                                                            label: item.display_name,
                                                            value: item.id,
                                                            searchLabel: item.display_name,
                                                        }))}
                                                        showSearch
                                                        disabled={isEdit && !canEditStructure}
                                                        placeholder="Select unit"
                                                        style={{ minHeight: 46, borderRadius: 12, padding: "10px 16px" }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="topping_group_ids"
                                            label="Topping groups"
                                            extra="Select topping groups that should be available when this product is ordered"
                                        >
                                            <ModalSelector<string>
                                                title="Select topping groups"
                                                value={toppingGroupIds}
                                                onChange={(value) => form.setFieldValue("topping_group_ids", value)}
                                                multiple
                                                showSearch
                                                disabled={isEdit && !canEditStructure}
                                                options={availableToppingGroups.map((item) => ({
                                                    label: item.display_name,
                                                    value: item.id,
                                                    searchLabel: item.display_name,
                                                }))}
                                                placeholder="No topping groups"
                                                style={{ minHeight: 46, borderRadius: 12, padding: "10px 16px" }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="img_url"
                                            label="Image URL"
                                            rules={[
                                                {
                                                    validator: async (_, value: string | undefined) => {
                                                        if (!value?.trim()) return;
                                                        if (!isSupportedImageSource(normalizeImageSource(value))) {
                                                            throw new Error("Only http(s), data:image, and blob image sources are supported");
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" placeholder="https://example.com/image.jpg" disabled={isEdit && !canEditCatalog} />
                                        </Form.Item>

                                        <Form.Item name="description" label="Description">
                                            <TextArea rows={4} maxLength={500} placeholder="Optional catalog note or description" disabled={isEdit && !canEditCatalog} />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: "#f8fafc", borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                                <div>
                                                    <Text strong>Product status</Text>
                                                    <Text type="secondary" style={{ display: "block", fontSize: 13 }}>
                                                        Control whether this product appears in POS ordering flows
                                                    </Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={isActive} disabled={isEdit && !canToggleStatus} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <ActionButtons
                                            isEdit={isEdit}
                                            loading={submitting}
                                            onCancel={() => router.replace("/pos/products")}
                                        />
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div style={{ display: "grid", gap: 14 }}>
                                    <Card style={{ borderRadius: 20 }}>
                                        <Title level={5} style={{ color: "#4f46e5", marginBottom: 16 }}>
                                            Products Governance
                                        </Title>
                                        <Space size={[8, 8]} wrap style={{ marginBottom: 12 }}>
                                            <Tag color={canCreateProduct ? "green" : "default"}>create</Tag>
                                            <Tag color={canEditCatalog ? "green" : "default"}>catalog</Tag>
                                            <Tag color={canEditPricing ? "gold" : "default"}>pricing</Tag>
                                            <Tag color={canEditStructure ? "cyan" : "default"}>structure</Tag>
                                            <Tag color={canToggleStatus ? "green" : "default"}>status</Tag>
                                            <Tag color={canDeleteProduct ? "red" : "default"}>delete</Tag>
                                        </Space>
                                        <Text type="secondary">
                                            This workspace separates catalog, pricing, structure, status, and delete controls so each role only changes the product domains it is trusted to own.
                                        </Text>
                                    </Card>

                                    <Card style={{ borderRadius: 20 }}>
                                        <Title level={5} style={{ color: "#4f46e5", marginBottom: 16 }}>
                                            Product preview
                                        </Title>
                                        <ProductPreview
                                            name={displayName}
                                            imageUrl={imageUrl}
                                            price={Number(price || 0)}
                                            priceDelivery={Number(priceDelivery ?? price ?? 0)}
                                            category={categories.find((item) => item.id === selectedCategoryId)?.display_name}
                                            unit={units.find((item) => item.id === selectedUnitId)?.display_name}
                                        />
                                    </Card>

                                    <Card style={{ borderRadius: 16 }}>
                                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <ExclamationCircleOutlined style={{ color: "#0369a1" }} />
                                                <Text strong>Capability Matrix</Text>
                                            </div>
                                            {capabilityMatrix.map((item) => (
                                                <div
                                                    key={item.resourceKey}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        gap: 12,
                                                        padding: "10px 12px",
                                                        borderRadius: 12,
                                                        background: item.enabled ? "#eef2ff" : "#f8fafc",
                                                    }}
                                                >
                                                    <div style={{ minWidth: 0 }}>
                                                        <Text strong>{item.title}</Text>
                                                        <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                                            {item.description}
                                                        </Text>
                                                    </div>
                                                    <Tag color={item.enabled ? "green" : "default"}>{item.enabled ? "Enabled" : "Locked"}</Tag>
                                                </div>
                                            ))}
                                        </Space>
                                    </Card>

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <Space direction="vertical" size={4}>
                                                <Text strong>Audit metadata</Text>
                                                <Text type="secondary">Created {formatDate(originalProduct?.create_date)}</Text>
                                                <Text type="secondary">Updated {formatDate(originalProduct?.update_date)}</Text>
                                            </Space>
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
