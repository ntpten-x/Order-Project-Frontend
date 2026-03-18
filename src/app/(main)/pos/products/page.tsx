"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Empty, Modal, Space, Statistic, Switch, Tag, Typography, message } from "antd";
import {
    AppstoreOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    ShoppingOutlined,
    TagsOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Image from "../../../../components/ui/image/SmartImage";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import ListPagination, { type CreatedSort } from "../../../../components/ui/pagination/ListPagination";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import PageStack from "../../../../components/ui/page/PageStack";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageState from "../../../../components/ui/states/PageState";
import UIEmptyState from "../../../../components/ui/states/EmptyState";
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { useSocket } from "../../../../hooks/useSocket";
import { useListState } from "../../../../hooks/pos/useListState";
import {
    PRODUCTS_CAPABILITIES,
    PRODUCTS_ROLE_BLUEPRINT,
} from "../../../../lib/rbac/products-capabilities";
import { DEFAULT_CREATED_SORT } from "../../../../lib/list-sort";
import { pageStyles, globalStyles } from "../../../../theme/pos/products/style";
import { Category } from "../../../../types/api/pos/category";
import { Products } from "../../../../types/api/pos/products";
import { ProductsUnit } from "../../../../types/api/pos/productsUnit";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { checkProductSetupState, getSetupMissingMessage } from "../../../../utils/products/productSetup.utils";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { isSupportedImageSource } from "../../../../utils/image/source";

const { Text } = Typography;

type StatusFilter = "all" | "active" | "inactive";
type CategoryFilter = "all" | string;
type ProductsCachePayload = {
    items: Products[];
    total: number;
    activeCount: number;
};

const PRODUCTS_CACHE_KEY = "pos:products:list:default-v1";
const PRODUCTS_CACHE_TTL_MS = 60 * 1000;

const parseListResponse = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
        return (payload as { data: T[] }).data;
    }
    return [];
};

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatCurrency = (value: number | string | undefined | null) =>
    `฿${Number(value || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

type ProductCardProps = {
    product: Products;
    categoryName: string;
    unitName: string;
    canOpenManager: boolean;
    canToggleStatus: boolean;
    canDelete: boolean;
    onEdit: (product: Products) => void;
    onDelete: (product: Products) => void;
    onToggleActive: (product: Products, next: boolean) => void;
    updatingStatusId: string | null;
    deletingId: string | null;
};

function ProductCard({
    product,
    categoryName,
    unitName,
    canOpenManager,
    canToggleStatus,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: ProductCardProps) {
    const deliveryPrice = Number(product.price_delivery ?? product.price ?? 0);

    return (
        <div
            className="product-card"
            style={{
                ...pageStyles.productCard(product.is_active),
                borderRadius: 18,
                cursor: canOpenManager ? "pointer" : "default",
            }}
            onClick={() => {
                if (!canOpenManager) return;
                onEdit(product);
            }}
        >
            <div className="product-card-inner" style={{ ...pageStyles.productCardInner, alignItems: "stretch" }}>
                <div
                    style={{
                        width: 88,
                        height: 88,
                        borderRadius: 18,
                        overflow: "hidden",
                        position: "relative",
                        background: "linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%)",
                        border: "1px solid #e2e8f0",
                        flexShrink: 0,
                    }}
                >
                    {isSupportedImageSource(product.img_url) ? (
                        <Image
                            src={product.img_url || ""}
                            alt={product.display_name}
                            fill
                            sizes="88px"
                            style={{ objectFit: "cover" }}
                            onError={(event) => {
                                (event.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ShoppingOutlined style={{ fontSize: 28, color: "#4f46e5" }} />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <Space size={[8, 8]} wrap style={{ marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 16, color: "#0f172a" }} ellipsis={{ tooltip: product.display_name }}>
                            {product.display_name}
                        </Text>
                        <Tag color={product.is_active ? "green" : "default"} style={{ borderRadius: 999 }}>
                            {product.is_active ? "Active" : "Inactive"}
                        </Tag>
                    </Space>
                    <Text type="secondary" style={{ display: "block", marginBottom: 10 }}>
                        {product.description?.trim() || "No description"}
                    </Text>

                    <Space size={[8, 8]} wrap style={{ marginBottom: 10 }}>
                        <Tag color="blue">{categoryName}</Tag>
                        <Tag color="cyan">{unitName}</Tag>
                        <Tag color="gold">Store {formatCurrency(product.price)}</Tag>
                        <Tag color="magenta">Delivery {formatCurrency(deliveryPrice)}</Tag>
                        <Tag color={(product.topping_groups?.length || 0) > 0 ? "purple" : "default"}>
                            {(product.topping_groups?.length || 0) > 0
                                ? `${product.topping_groups?.length || 0} topping groups`
                                : "No topping groups"}
                        </Tag>
                    </Space>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Updated {formatDate(product.update_date)}
                    </Text>
                </div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
                    <Switch
                        size="small"
                        checked={product.is_active}
                        loading={updatingStatusId === product.id}
                        disabled={!canToggleStatus || deletingId === product.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canToggleStatus) return;
                            onToggleActive(product, checked);
                        }}
                    />
                    <Space size={6}>
                        {canOpenManager ? (
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onEdit(product);
                                }}
                                style={{
                                    borderRadius: 10,
                                    color: "#4f46e5",
                                    background: "#eef2ff",
                                    width: 36,
                                    height: 36,
                                }}
                            />
                        ) : null}
                        {canDelete ? (
                            <Button
                                type="text"
                                danger
                                loading={deletingId === product.id}
                                icon={deletingId === product.id ? undefined : <DeleteOutlined />}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onDelete(product);
                                }}
                                style={{
                                    borderRadius: 10,
                                    background: "#fef2f2",
                                    width: 36,
                                    height: 36,
                                }}
                            />
                        ) : null}
                    </Space>
                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    const router = useRouter();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const [products, setProducts] = useState<Products[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [activeCount, setActiveCount] = useState(0);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const requestRef = useRef<AbortController | null>(null);
    const cacheHydratedRef = useRef(false);
    const {
        searchText,
        setSearchText,
        debouncedSearch,
        page,
        setPage,
        pageSize,
        setPageSize,
        createdSort,
        setCreatedSort,
        filters,
        updateFilter,
        total,
        setTotal,
        getQueryParams,
        isUrlReady,
    } = useListState<{ status: StatusFilter; category: CategoryFilter }>({
        defaultPageSize: 10,
        defaultFilters: { status: "all", category: "all" },
    });

    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canViewProducts = can("products.page", "view");
    const canSearchProducts = can("products.search.feature", "view");
    const canFilterProducts = can("products.filter.feature", "view");
    const canOpenProductsManager = can("products.manager.feature", "access");
    const canCreateProduct =
        can("products.page", "create") &&
        can("products.create.feature", "create") &&
        canOpenProductsManager;
    const canEditProductCatalog =
        can("products.page", "update") &&
        can("products.catalog.feature", "update") &&
        canOpenProductsManager;
    const canEditProductPricing =
        can("products.page", "update") &&
        can("products.pricing.feature", "update") &&
        canOpenProductsManager;
    const canEditProductStructure =
        can("products.page", "update") &&
        can("products.structure.feature", "update") &&
        canOpenProductsManager;
    const canToggleProductStatus =
        can("products.page", "update") &&
        can("products.status.feature", "update") &&
        canOpenProductsManager;
    const canDeleteProduct =
        can("products.page", "delete") &&
        can("products.delete.feature", "delete") &&
        canOpenProductsManager;
    const canOpenProductEditWorkspace =
        canOpenProductsManager &&
        (canEditProductCatalog || canEditProductPricing || canEditProductStructure || canToggleProductStatus || canDeleteProduct);

    const currentRoleName = String(user?.role ?? "").trim().toLowerCase();
    const selectedRoleBlueprint = useMemo(
        () => PRODUCTS_ROLE_BLUEPRINT.find((item) => item.roleName.toLowerCase() === currentRoleName) ?? null,
        [currentRoleName]
    );
    const capabilityMatrix = useMemo(
        () => PRODUCTS_CAPABILITIES.map((item) => ({ ...item, enabled: can(item.resourceKey, item.action) })),
        [can]
    );

    const isDefaultListView = useMemo(
        () =>
            page === 1 &&
            pageSize === 10 &&
            createdSort === DEFAULT_CREATED_SORT &&
            !debouncedSearch.trim() &&
            filters.status === "all" &&
            filters.category === "all",
        [createdSort, debouncedSearch, filters.category, filters.status, page, pageSize]
    );

    const setupState = useMemo(() => checkProductSetupState(categories, units), [categories, units]);
    const setupMessage = useMemo(() => getSetupMissingMessage(categories, units), [categories, units]);
    const activeCategories = useMemo(() => categories.filter((item) => item.is_active), [categories]);
    const activeUnits = useMemo(() => units.filter((item) => item.is_active), [units]);

    useEffect(() => {
        void getCsrfTokenCached();
    }, []);

    useEffect(() => () => {
        requestRef.current?.abort();
    }, []);

    useEffect(() => {
        if (!isUrlReady || !isAuthorized || !isDefaultListView || cacheHydratedRef.current) return;
        cacheHydratedRef.current = true;
        const cached = readCache<ProductsCachePayload>(PRODUCTS_CACHE_KEY, PRODUCTS_CACHE_TTL_MS);
        if (!cached) return;
        setProducts(cached.items || []);
        setTotal(cached.total || 0);
        setActiveCount(cached.activeCount || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<ProductsCachePayload>(PRODUCTS_CACHE_KEY, {
            items: products,
            total,
            activeCount,
        });
    }, [activeCount, isDefaultListView, loading, products, total]);

    useEffect(() => {
        if (!canSearchProducts && searchText) setSearchText("");
    }, [canSearchProducts, searchText, setSearchText]);

    useEffect(() => {
        if (!canFilterProducts && filters.status !== "all") updateFilter("status", "all");
        if (!canFilterProducts && filters.category !== "all") updateFilter("category", "all");
    }, [canFilterProducts, filters.category, filters.status, updateFilter]);

    useEffect(() => {
        if (!canFilterProducts && createdSort !== DEFAULT_CREATED_SORT) setCreatedSort(DEFAULT_CREATED_SORT);
    }, [canFilterProducts, createdSort, setCreatedSort]);

    const fetchDependencies = useCallback(async () => {
        try {
            const [categoryResponse, unitResponse] = await Promise.all([
                fetch("/api/pos/category", { cache: "no-store" }),
                fetch("/api/pos/productsUnit", { cache: "no-store" }),
            ]);

            if (categoryResponse.ok) {
                const payload = await categoryResponse.json();
                setCategories(parseListResponse<Category>(payload));
            }

            if (unitResponse.ok) {
                const payload = await unitResponse.json();
                setUnits(parseListResponse<ProductsUnit>(payload));
            }
        } catch (dependencyError) {
            console.error("Failed to fetch products dependencies", dependencyError);
        }
    }, []);

    const fetchActiveCount = useCallback(async () => {
        if (!isAuthorized) return;
        try {
            const params = new URLSearchParams();
            if (canFilterProducts && filters.category !== "all") {
                params.set("category_id", String(filters.category));
            }

            const query = params.toString();
            const response = await fetch(`/api/pos/products/active-count${query ? `?${query}` : ""}`, {
                cache: "no-store",
            });
            if (!response.ok) return;
            const payload = await response.json();
            setActiveCount(Number(payload.total || 0));
        } catch (countError) {
            console.error("Failed to fetch active product count", countError);
        }
    }, [canFilterProducts, filters.category, isAuthorized]);

    const fetchProducts = useCallback(async (options?: { background?: boolean }) => {
        if (!isAuthorized) return;

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        const background = options?.background === true;

        if (background) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const params = getQueryParams();
            if (!canSearchProducts) params.delete("q");
            if (!canFilterProducts) {
                params.delete("category");
                params.delete("category_id");
                params.delete("status");
                params.delete("is_active");
                params.delete("sort_created");
            } else {
                const categoryValue = params.get("category");
                if (categoryValue && categoryValue !== "all") {
                    params.set("category_id", categoryValue);
                }
                params.delete("category");
                const statusValue = params.get("status");
                if (statusValue === "active") params.set("is_active", "true");
                if (statusValue === "inactive") params.set("is_active", "false");
                params.delete("status");
            }

            const response = await fetch(`/api/pos/products?${params.toString()}`, {
                cache: "no-store",
                signal: controller.signal,
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || errorPayload.message || "Failed to fetch products");
            }

            const payload = await response.json();
            if (controller.signal.aborted) return;

            setProducts(payload.data || []);
            setTotal(payload.total || 0);
            await fetchActiveCount();
        } catch (fetchError) {
            if (controller.signal.aborted) return;
            setError(fetchError instanceof Error ? fetchError : new Error("Failed to fetch products"));
        } finally {
            if (requestRef.current === controller) requestRef.current = null;
            if (!controller.signal.aborted) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [canFilterProducts, canSearchProducts, fetchActiveCount, getQueryParams, isAuthorized, setTotal]);

    useEffect(() => {
        if (!isAuthorized || !isUrlReady) return;
        void fetchDependencies();
        void fetchProducts({ background: hasCachedSnapshot });
    }, [fetchDependencies, fetchProducts, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.products.create,
            RealtimeEvents.products.update,
            RealtimeEvents.products.delete,
            RealtimeEvents.categories.create,
            RealtimeEvents.categories.update,
            RealtimeEvents.productsUnit.create,
            RealtimeEvents.productsUnit.update,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchDependencies();
            void fetchProducts({ background: true });
        },
    });

    const resolveCategoryName = useCallback(
        (product: Products) => product.category?.display_name || categories.find((item) => item.id === product.category_id)?.display_name || "Unknown category",
        [categories]
    );
    const resolveUnitName = useCallback(
        (product: Products) => product.unit?.display_name || units.find((item) => item.id === product.unit_id)?.display_name || "Unknown unit",
        [units]
    );

    const handleAdd = () => {
        if (!canCreateProduct) {
            message.warning("You do not have permission to create products");
            return;
        }
        if (!setupState.isReady) {
            message.warning(setupMessage || "Product setup is not ready");
            return;
        }
        showLoading("Opening product management workspace...");
        router.push("/pos/products/manage/add");
    };

    const handleEdit = (product: Products) => {
        if (!canOpenProductEditWorkspace) {
            message.warning("You do not have permission to edit products");
            return;
        }
        showLoading("Opening product editor...");
        router.push(`/pos/products/manage/edit/${product.id}`);
    };

    const handleDelete = (product: Products) => {
        if (!canDeleteProduct) {
            message.warning("You do not have permission to delete products");
            return;
        }
        Modal.confirm({
            title: "Delete product",
            content: `Delete "${product.display_name}" from this branch catalog?`,
            okText: "Delete",
            cancelText: "Cancel",
            okType: "danger",
            centered: true,
            icon: <DeleteOutlined style={{ color: "#ef4444" }} />,
            onOk: async () => {
                setDeletingId(product.id);
                try {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/products/delete/${product.id}`, {
                        method: "DELETE",
                        headers: { "X-CSRF-Token": csrfToken },
                    });
                    if (!response.ok) {
                        const errorPayload = await response.json().catch(() => ({}));
                        throw new Error(errorPayload.error || errorPayload.message || "Failed to delete product");
                    }

                    const shouldMoveToPreviousPage = page > 1 && products.length === 1;
                    setProducts((previous) => previous.filter((item) => item.id !== product.id));
                    setTotal((previous) => Math.max(previous - 1, 0));
                    setActiveCount((previous) => Math.max(previous - (product.is_active ? 1 : 0), 0));

                    if (shouldMoveToPreviousPage) setPage(page - 1);
                    else void fetchProducts({ background: true });

                    message.success(`Deleted "${product.display_name}"`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : "Failed to delete product");
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (product: Products, next: boolean) => {
        if (!canToggleProductStatus) {
            message.warning("You do not have permission to change product status");
            return;
        }

        setUpdatingStatusId(product.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/products/update/${product.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({ is_active: next }),
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || errorPayload.message || "Failed to update product status");
            }

            const updated = await response.json();
            setProducts((previous) => previous.map((item) => (item.id === product.id ? updated : item)));
            void fetchProducts({ background: true });
            message.success(next ? "Product enabled" : "Product disabled");
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : "Failed to update product status");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) return <AccessGuardFallback message="Checking access..." />;
    if (!isAuthorized) return <AccessGuardFallback message="You do not have permission to access this page" tone="danger" />;
    if (permissionLoading) return <AccessGuardFallback message="Loading permissions..." />;

    return (
        <div className="products-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="Products"
                subtitle="Branch product catalog governance"
                icon={<AppstoreOutlined />}
                actions={(
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchProducts({ background: products.length > 0 })} />
                        {canCreateProduct ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!setupState.isReady}>
                                Add product
                            </Button>
                        ) : null}
                    </Space>
                )}
            />

            <PageContainer>
                <PageStack>
                    <Alert
                        type={selectedRoleBlueprint?.roleName === "Employee" ? "info" : "success"}
                        showIcon
                        message={selectedRoleBlueprint?.title || "Products permissions"}
                        description={
                            selectedRoleBlueprint
                                ? `${selectedRoleBlueprint.summary} | Allowed: ${selectedRoleBlueprint.allowed.join(", ")}${
                                    selectedRoleBlueprint.denied.length > 0 ? ` | Restricted: ${selectedRoleBlueprint.denied.join(", ")}` : ""
                                }`
                                : canViewProducts
                                    ? "This account can open the product catalog"
                                    : "This account cannot open the product catalog"
                        }
                    />

                    {!setupState.isReady ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Product setup dependencies are incomplete"
                            description={setupMessage || "Activate at least one category and one product unit before creating new products"}
                        />
                    ) : null}

                    <PageSection
                        title="Catalog Health"
                        extra={<Tag color="blue">{activeCount} active</Tag>}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                            <Card bordered={false} style={{ borderRadius: 18, background: "linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)" }}>
                                <Statistic title="Total products" value={total} prefix={<ShoppingOutlined />} />
                            </Card>
                            <Card bordered={false} style={{ borderRadius: 18, background: "linear-gradient(180deg, #ffffff 0%, #ecfeff 100%)" }}>
                                <Statistic title="Active products" value={activeCount} prefix={<TagsOutlined />} />
                            </Card>
                            <Card bordered={false} style={{ borderRadius: 18, background: "linear-gradient(180deg, #ffffff 0%, #fefce8 100%)" }}>
                                <Statistic title="Active categories" value={activeCategories.length} />
                            </Card>
                            <Card bordered={false} style={{ borderRadius: 18, background: "linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)" }}>
                                <Statistic title="Active units" value={activeUnits.length} />
                            </Card>
                        </div>
                    </PageSection>

                    <PageSection
                        title="Products Capability Matrix"
                        extra={<Tag color="green">{capabilityMatrix.filter((item) => item.enabled).length}/{capabilityMatrix.length} enabled</Tag>}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                            {capabilityMatrix.map((item) => (
                                <div
                                    key={item.resourceKey}
                                    style={{
                                        borderRadius: 18,
                                        padding: 16,
                                        border: item.enabled ? "1px solid rgba(79, 70, 229, 0.16)" : "1px solid rgba(148, 163, 184, 0.24)",
                                        background: item.enabled ? "linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)" : "#ffffff",
                                        boxShadow: item.enabled ? "0 14px 32px rgba(79, 70, 229, 0.08)" : "0 10px 24px rgba(15, 23, 42, 0.04)",
                                    }}
                                >
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Space wrap>
                                            <Tag color={item.enabled ? "green" : "default"}>{item.enabled ? "Enabled" : "Locked"}</Tag>
                                            <Tag color={item.securityLevel === "governance" ? "red" : item.securityLevel === "sensitive" ? "gold" : "blue"}>
                                                {item.securityLevel}
                                            </Tag>
                                        </Space>
                                        <Text strong>{item.title}</Text>
                                        <Text type="secondary">{item.description}</Text>
                                    </Space>
                                </div>
                            ))}
                        </div>
                    </PageSection>

                    <SearchBar>
                        <SearchInput
                            placeholder="Search products"
                            value={searchText}
                            onChange={setSearchText}
                            disabled={!canSearchProducts}
                        />
                        <Space wrap size={10} style={{ justifyContent: "space-between", width: "100%" }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter>
                                    title="Filter status"
                                    value={filters.status}
                                    onChange={(value) => updateFilter("status", value)}
                                    options={[
                                        { label: "All status", value: "all" },
                                        { label: "Active", value: "active" },
                                        { label: "Inactive", value: "inactive" },
                                    ]}
                                    style={{ minWidth: 120 }}
                                    disabled={!canFilterProducts}
                                />
                                <ModalSelector<CategoryFilter>
                                    title="Filter category"
                                    value={filters.category}
                                    onChange={(value) => updateFilter("category", value)}
                                    options={[
                                        { label: "All categories", value: "all" },
                                        ...categories.map((item) => ({
                                            label: item.display_name,
                                            value: item.id,
                                            searchLabel: item.display_name,
                                        })),
                                    ]}
                                    showSearch
                                    style={{ minWidth: 160 }}
                                    disabled={!canFilterProducts}
                                />
                                <ModalSelector<CreatedSort>
                                    title="Sort by created date"
                                    value={createdSort}
                                    onChange={setCreatedSort}
                                    options={[
                                        { label: "Oldest first", value: "old" },
                                        { label: "Newest first", value: "new" },
                                    ]}
                                    style={{ minWidth: 140 }}
                                    disabled={!canFilterProducts}
                                />
                            </Space>
                        </Space>
                    </SearchBar>

                    {!canSearchProducts || !canFilterProducts ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Some controls are locked by policy"
                            description={`Search ${canSearchProducts ? "enabled" : "locked"} | Filter and sort ${canFilterProducts ? "enabled" : "locked"}`}
                        />
                    ) : null}

                    <PageSection
                        title="Product Catalog"
                        extra={(
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">Refreshing</Tag> : null}
                                <Tag color={canCreateProduct ? "green" : "default"}>create</Tag>
                                <Tag color={canEditProductCatalog ? "green" : "default"}>catalog</Tag>
                                <Tag color={canEditProductPricing ? "gold" : "default"}>pricing</Tag>
                                <Tag color={canEditProductStructure ? "cyan" : "default"}>structure</Tag>
                                <Tag color={canToggleProductStatus ? "green" : "default"}>status</Tag>
                                <Tag color={canDeleteProduct ? "red" : "default"}>delete</Tag>
                            </Space>
                        )}
                    >
                        {loading && products.length === 0 ? (
                            <PageState status="loading" title="Loading products..." />
                        ) : error && products.length === 0 ? (
                            <PageState status="error" title="Failed to load products" error={error} onRetry={() => void fetchProducts()} />
                        ) : products.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        categoryName={resolveCategoryName(product)}
                                        unitName={resolveUnitName(product)}
                                        canOpenManager={canOpenProductEditWorkspace}
                                        canToggleStatus={canToggleProductStatus}
                                        canDelete={canDeleteProduct}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                        deletingId={deletingId}
                                    />
                                ))}
                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        pageSize={pageSize}
                                        total={total}
                                        loading={loading || refreshing}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor="#4f46e5"
                                    />
                                </div>
                            </Space>
                        ) : debouncedSearch.trim() || filters.status !== "all" || filters.category !== "all" ? (
                            <UIEmptyState
                                title="No products found"
                                description="Try a different search term or adjust your filters"
                            />
                        ) : (
                            <Empty
                                description={
                                    canCreateProduct
                                        ? "Start by adding the first product to this branch catalog"
                                        : "This account can view products but cannot create or edit catalog data"
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
