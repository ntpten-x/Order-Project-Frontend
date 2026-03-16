"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { App, Button, Modal, Space, Switch, Tag, Typography } from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    ShopOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import StockImageThumb from "../../../../components/stock/StockImageThumb";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import ListPagination, { type CreatedSort } from "../../../../components/ui/pagination/ListPagination";
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import UIEmptyState from "../../../../components/ui/states/EmptyState";
import PageState from "../../../../components/ui/states/PageState";
import { useAuth } from "../../../../contexts/AuthContext";
import { useSocket } from "../../../../hooks/useSocket";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../../lib/list-sort";
import { authService } from "../../../../services/auth.service";
import { stockCategoryService } from "../../../../services/stock/category.service";
import { ingredientsService } from "../../../../services/stock/ingredients.service";
import { StockCategory } from "../../../../types/api/stock/category";
import { Ingredients } from "../../../../types/api/stock/ingredients";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { pageStyles } from "./style";

const { Text } = Typography;

type StatusFilter = "all" | "active" | "inactive";
type CategoryFilter = "all" | "uncategorized" | string;

const formatDate = (raw?: string | Date) => {
    if (!raw) return "-";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

type IngredientCardProps = {
    ingredient: Ingredients;
    canUpdate: boolean;
    canDelete: boolean;
    updatingStatusId: string | null;
    deletingId: string | null;
    onEdit: (ingredient: Ingredients) => void;
    onDelete: (ingredient: Ingredients) => void;
    onToggleActive: (ingredient: Ingredients, next: boolean) => void;
};

const IngredientCard = ({
    ingredient,
    canUpdate,
    canDelete,
    updatingStatusId,
    deletingId,
    onEdit,
    onDelete,
    onToggleActive,
}: IngredientCardProps) => {
    return (
        <div
            data-testid={`stock-ingredient-card-${ingredient.id}`}
            style={{
                ...pageStyles.ingredientCard(ingredient.is_active),
                cursor: canUpdate ? "pointer" : "default",
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(ingredient);
            }}
        >
            <div style={pageStyles.ingredientCardInner}>
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 14,
                        border: "1px solid #F1F5F9",
                        overflow: "hidden",
                        position: "relative",
                        background: "#F8FAFC",
                        flexShrink: 0,
                    }}
                >
                    {ingredient.img_url ? (
                        <StockImageThumb
                            src={ingredient.img_url}
                            alt={ingredient.display_name}
                            size={64}
                            borderRadius={14}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
                            }}
                        >
                            <ShopOutlined style={{ fontSize: 20, color: "#4F46E5" }} />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8, paddingLeft: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexShrink: 1 }}>
                            <Text strong style={{ fontSize: 16, color: "#0f172a" }} ellipsis={{ tooltip: ingredient.display_name }}>
                                {ingredient.display_name}
                            </Text>
                            <Tag color={ingredient.is_active ? "green" : "default"} style={{ borderRadius: 999, margin: 0, flexShrink: 0 }}>
                                {ingredient.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                            </Tag>
                        </div>
                        {ingredient.category?.display_name ? (
                            <Tag style={{ margin: 0, border: "none", background: "#eff6ff", color: "#1d4ed8" }}>
                                {ingredient.category.display_name}
                            </Tag>
                        ) : null}
                        {ingredient.unit?.display_name ? (
                            <Tag style={{ margin: 0, border: "none", background: "#ecfeff", color: "#0f766e" }}>
                                {ingredient.unit.display_name}
                            </Tag>
                        ) : null}
                    </div>

                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                        สร้างเมื่อ {formatDate(ingredient.create_date)}
                    </Text>
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Switch
                        size="small"
                        checked={ingredient.is_active}
                        loading={updatingStatusId === ingredient.id}
                        disabled={!canUpdate || deletingId === ingredient.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canUpdate) return;
                            onToggleActive(ingredient, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            data-testid={`stock-ingredient-edit-${ingredient.id}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(ingredient);
                            }}
                            style={{
                                borderRadius: 10,
                                color: "#4F46E5",
                                background: "#EEF2FF",
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === ingredient.id}
                            icon={deletingId === ingredient.id ? undefined : <DeleteOutlined />}
                            data-testid={`stock-ingredient-delete-${ingredient.id}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(ingredient);
                            }}
                            style={{
                                borderRadius: 10,
                                background: "#fef2f2",
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default function IngredientsPage() {
    const { message: messageApi } = App.useApp();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initRef = useRef(false);
    const hasLoadedRef = useRef(false);
    const requestRef = useRef<AbortController | null>(null);

    const { socket } = useSocket();
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canView = can("stock.ingredients.page", "view");
    const canCreate = can("stock.ingredients.page", "create");
    const canUpdate = can("stock.ingredients.page", "update");
    const canDelete = can("stock.ingredients.page", "delete");
    const canViewCategory = can("stock.category.page", "view");
    const [csrfToken, setCsrfToken] = useState("");
    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
    const [categories, setCategories] = useState<StockCategory[]>([]);
    const [totalIngredients, setTotalIngredients] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

    const deferredSearchText = useDeferredValue(searchText.trim());

    const ensureCsrfToken = useCallback(async (): Promise<string> => {
        if (csrfToken) return csrfToken;

        const token = await authService.getCsrfToken();
        if (token) {
            setCsrfToken(token);
        }

        return token;
    }, [csrfToken]);

    useEffect(() => {
        if (initRef.current) return;

        const pageParam = Number(searchParams.get("page") || "1");
        const limitParam = Number(searchParams.get("limit") || "20");
        const sortParam = searchParams.get("sort_created");
        const qParam = searchParams.get("q") || "";
        const statusParam = searchParams.get("status");
        const categoryParam = searchParams.get("category_id");

        setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
        setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20);
        setCreatedSort(parseCreatedSort(sortParam));
        setSearchText(qParam);
        setStatusFilter(statusParam === "active" || statusParam === "inactive" ? statusParam : "all");
        setCategoryFilter(categoryParam === "uncategorized" ? "uncategorized" : categoryParam?.trim() || "all");

        initRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!initRef.current) return;

        const params = new URLSearchParams();
        if (page > 1) params.set("page", String(page));
        if (pageSize !== 20) params.set("limit", String(pageSize));
        if (deferredSearchText) params.set("q", deferredSearchText);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (categoryFilter !== "all") params.set("category_id", categoryFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set("sort_created", createdSort);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [categoryFilter, createdSort, deferredSearchText, page, pageSize, pathname, router, statusFilter]);

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

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            if (!canViewCategory) return;
            try {
                const params = new URLSearchParams();
                params.set("sort_created", "new");
                const data = await stockCategoryService.findAll(undefined, params);
                if (!mounted) return;
                setCategories(Array.isArray(data) ? data : []);
            } catch {
                if (mounted) setCategories([]);
            }
        };

        void run();
        return () => {
            mounted = false;
        };
    }, [canViewCategory]);

    const fetchIngredients = useCallback(
        async ({ background = false }: { background?: boolean } = {}) => {
            if (!canView) return;

            requestRef.current?.abort();
            const controller = new AbortController();
            requestRef.current = controller;

            try {
                if (background) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }
                setError(null);

                const params = new URLSearchParams();
                params.set("page", String(page));
                params.set("limit", String(pageSize));
                params.set("sort_created", createdSort);
                if (deferredSearchText) params.set("q", deferredSearchText);
                if (statusFilter !== "all") params.set("status", statusFilter);
                if (categoryFilter !== "all") params.set("category_id", categoryFilter);

                const payload = await ingredientsService.findAllPaginated(undefined, params, {
                    signal: controller.signal,
                });

                if (requestRef.current !== controller) return;

                setIngredients(Array.isArray(payload.data) ? payload.data : []);
                setTotalIngredients(Number(payload.total || 0));
                hasLoadedRef.current = true;
            } catch (err) {
                if ((err as Error)?.name === "AbortError") return;
                if (requestRef.current !== controller) return;
                setError(err instanceof Error ? err : new Error("โหลดรายการวัตถุดิบไม่สำเร็จ"));
            } finally {
                if (requestRef.current === controller) {
                    requestRef.current = null;
                }
                if (!controller.signal.aborted) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [canView, categoryFilter, createdSort, deferredSearchText, page, pageSize, statusFilter]
    );

    useEffect(() => {
        if (!initRef.current || !canView) return;
        void fetchIngredients({ background: hasLoadedRef.current });
        return () => {
            requestRef.current?.abort();
        };
    }, [canView, fetchIngredients]);

    useEffect(() => {
        if (!socket || !canView) return;

        const refresh = () => {
            void fetchIngredients({ background: true });
        };

        socket.on(RealtimeEvents.ingredients.create, refresh);
        socket.on(RealtimeEvents.ingredients.update, refresh);
        socket.on(RealtimeEvents.ingredients.delete, refresh);

        return () => {
            socket.off(RealtimeEvents.ingredients.create, refresh);
            socket.off(RealtimeEvents.ingredients.update, refresh);
            socket.off(RealtimeEvents.ingredients.delete, refresh);
        };
    }, [canView, fetchIngredients, socket]);

    useEffect(() => {
        if (!socket || !canViewCategory) return;

        const refreshCategories = async () => {
            try {
                const params = new URLSearchParams();
                params.set("sort_created", "new");
                const data = await stockCategoryService.findAll(undefined, params);
                setCategories(Array.isArray(data) ? data : []);
            } catch {
                setCategories([]);
            }
            void fetchIngredients({ background: true });
        };

        socket.on(RealtimeEvents.stockCategories.create, refreshCategories);
        socket.on(RealtimeEvents.stockCategories.update, refreshCategories);
        socket.on(RealtimeEvents.stockCategories.delete, refreshCategories);

        return () => {
            socket.off(RealtimeEvents.stockCategories.create, refreshCategories);
            socket.off(RealtimeEvents.stockCategories.update, refreshCategories);
            socket.off(RealtimeEvents.stockCategories.delete, refreshCategories);
        };
    }, [canViewCategory, fetchIngredients, socket]);

    const categoryOptions = useMemo(
        () => [
            { label: "ทั้งหมด", value: "all" as const },
            { label: "ยังไม่เลือกหมวดหมู่", value: "uncategorized" as const },
            ...categories
                .filter((category) => category.is_active || category.id === categoryFilter)
                .map((category) => ({
                    label: category.is_active ? category.display_name : `${category.display_name} (ปิดใช้งาน)`,
                    value: category.id,
                    searchLabel: category.display_name,
                })),
        ],
        [categories, categoryFilter]
    );

    useEffect(() => {
        if (categoryFilter === "all" || categoryFilter === "uncategorized") return;
        if (categories.some((category) => category.id === categoryFilter)) return;
        setCategoryFilter("all");
    }, [categories, categoryFilter]);

    const handleAdd = () => {
        if (!canCreate) {
            messageApi.warning("คุณไม่มีสิทธิ์เพิ่มวัตถุดิบ");
            return;
        }
        router.push("/stock/ingredients/manage/add");
    };

    const handleEdit = (ingredient: Ingredients) => {
        if (!canUpdate) {
            messageApi.warning("คุณไม่มีสิทธิ์แก้ไขวัตถุดิบ");
            return;
        }
        router.push(`/stock/ingredients/manage/edit/${ingredient.id}`);
    };

    const handleDelete = (ingredient: Ingredients) => {
        if (!canDelete) {
            messageApi.warning("คุณไม่มีสิทธิ์ลบวัตถุดิบ");
            return;
        }

        Modal.confirm({
            title: "ยืนยันการลบวัตถุดิบ",
            content: `ต้องการลบวัตถุดิบ ${ingredient.display_name} หรือไม่?`,
            okText: "ลบ",
            okType: "danger",
            cancelText: "ยกเลิก",
            centered: true,
            icon: <DeleteOutlined style={{ color: "#ef4444" }} />,
            onOk: async () => {
                setDeletingId(ingredient.id);
                try {
                    const token = await ensureCsrfToken();
                    await ingredientsService.delete(ingredient.id, undefined, token);
                    const shouldMoveToPreviousPage = page > 1 && ingredients.length === 1;
                    setIngredients((prev) => prev.filter((item) => item.id !== ingredient.id));
                    setTotalIngredients((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchIngredients({ background: true });
                    }
                    messageApi.success(`ลบวัตถุดิบ "${ingredient.display_name}" สำเร็จ`);
                } catch (err) {
                    messageApi.error(err instanceof Error ? err.message : "ลบวัตถุดิบไม่สำเร็จ");
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (ingredient: Ingredients, next: boolean) => {
        if (!canUpdate) {
            messageApi.warning("คุณไม่มีสิทธิ์เปลี่ยนสถานะวัตถุดิบ");
            return;
        }

        setUpdatingStatusId(ingredient.id);
        try {
            const token = await ensureCsrfToken();
            const updated = await ingredientsService.update(
                ingredient.id,
                {
                    display_name: ingredient.display_name,
                    description: ingredient.description || "",
                    img_url: ingredient.img_url,
                    unit_id: ingredient.unit_id,
                    category_id: ingredient.category_id,
                    is_active: next,
                },
                undefined,
                token
            );
            setIngredients((prev) => prev.map((item) => (item.id === ingredient.id ? updated : item)));
            messageApi.success(next ? "เปิดใช้งานวัตถุดิบแล้ว" : "ปิดใช้งานวัตถุดิบแล้ว");
        } catch (err) {
            messageApi.error(err instanceof Error ? err.message : "เปลี่ยนสถานะวัตถุดิบไม่สำเร็จ");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!user || !canView) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าวัตถุดิบ" tone="danger" />;
    }

    return (
        <div style={pageStyles.container} data-testid="stock-ingredients-page">
            <UIPageHeader
                title="วัตถุดิบ"
                icon={<ShoppingOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button
                            icon={<ReloadOutlined />}
                            loading={refreshing}
                            onClick={() => {
                                if (canViewCategory) {
                                    const params = new URLSearchParams();
                                    params.set("sort_created", "new");
                                    void stockCategoryService.findAll(undefined, params).then((data) => {
                                        setCategories(Array.isArray(data) ? data : []);
                                    }).catch(() => {
                                        setCategories([]);
                                    });
                                }
                                void fetchIngredients({ background: ingredients.length > 0 });
                            }}
                        />
                        {canCreate ? (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAdd}
                                data-testid="stock-ingredients-add"
                            >
                                เพิ่มวัตถุดิบ
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <SearchBar>
                        <div data-testid="stock-ingredients-search">
                            <SearchInput
                                placeholder="ค้นหาวัตถุดิบ"
                                value={searchText}
                                onChange={(value) => {
                                    setPage(1);
                                    setSearchText(value);
                                }}
                            />
                        </div>
                        <Space wrap size={10} style={{ justifyContent: "space-between", width: "100%" }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter>
                                    title="เลือกสถานะ"
                                    options={[
                                        { label: "ทั้งหมด", value: "all" },
                                        { label: "ใช้งาน", value: "active" },
                                        { label: "ปิดใช้งาน", value: "inactive" },
                                    ]}
                                    value={statusFilter}
                                    onChange={(value) => {
                                        setPage(1);
                                        setStatusFilter(value);
                                    }}
                                    style={{ minWidth: 120 }}
                                />
                                <ModalSelector<CategoryFilter>
                                    title="เลือกหมวดหมู่"
                                    options={categoryOptions}
                                    value={categoryFilter}
                                    onChange={(value) => {
                                        setPage(1);
                                        setCategoryFilter(value);
                                    }}
                                    placeholder="หมวดหมู่"
                                    showSearch
                                    style={{ minWidth: 180 }}
                                />
                                <ModalSelector<CreatedSort>
                                    title="เรียงลำดับ"
                                    options={[
                                        { label: "เก่าก่อน", value: "old" },
                                        { label: "ใหม่ก่อน", value: "new" },
                                    ]}
                                    value={createdSort}
                                    onChange={(value) => {
                                        setPage(1);
                                        setCreatedSort(value);
                                    }}
                                    style={{ minWidth: 120 }}
                                />
                            </Space>
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการวัตถุดิบ"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{totalIngredients} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && ingredients.length === 0 ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, width: "100%" }}>
                                <ReloadOutlined spin style={{ fontSize: 32, color: "rgba(0,0,0,0.45)" }} />
                            </div>
                        ) : error && ingredients.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดรายการวัตถุดิบไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchIngredients()}
                            />
                        ) : ingredients.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                {ingredients.map((ingredient) => (
                                    <IngredientCard
                                        key={ingredient.id}
                                        ingredient={ingredient}
                                        canUpdate={canUpdate}
                                        canDelete={canDelete}
                                        updatingStatusId={updatingStatusId}
                                        deletingId={deletingId}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                    />
                                ))}

                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        pageSize={pageSize}
                                        total={totalIngredients}
                                        loading={loading || refreshing}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor="#0369a1"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={deferredSearchText ? "ไม่พบวัตถุดิบตามคำค้น" : "ยังไม่มีวัตถุดิบ"}
                                description={
                                    deferredSearchText
                                        ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
                                        : "เพิ่มวัตถุดิบรายการแรกเพื่อเริ่มใช้งานคลังวัตถุดิบ"
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
