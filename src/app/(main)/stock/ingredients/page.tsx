"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { App, Button, Card, Input, Modal, Space, Tag, Typography } from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import PageContainer from "../../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import ListPagination, { type CreatedSort } from "../../../../components/ui/pagination/ListPagination";
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import PageState from "../../../../components/ui/states/PageState";
import StockImageThumb from "../../../../components/stock/StockImageThumb";
import { useAuth } from "../../../../contexts/AuthContext";
import { useSocket } from "../../../../hooks/useSocket";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../../lib/list-sort";
import { authService } from "../../../../services/auth.service";
import { ingredientsService } from "../../../../services/stock/ingredients.service";
import { Ingredients } from "../../../../types/api/stock/ingredients";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import IngredientsPageStyle from "./style";

const { Paragraph, Text, Title } = Typography;

type StatusFilter = "all" | "active" | "inactive";

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

    const [csrfToken, setCsrfToken] = useState("");
    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
    const [totalIngredients, setTotalIngredients] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const deferredSearchText = useDeferredValue(searchText.trim());

    useEffect(() => {
        if (initRef.current) return;

        const pageParam = Number(searchParams.get("page") || "1");
        const limitParam = Number(searchParams.get("limit") || "20");
        const sortParam = searchParams.get("sort_created");
        const qParam = searchParams.get("q") || "";
        const statusParam = searchParams.get("status");

        setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
        setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20);
        setCreatedSort(parseCreatedSort(sortParam));
        setSearchText(qParam);
        setStatusFilter(statusParam === "active" || statusParam === "inactive" ? statusParam : "all");

        initRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!initRef.current) return;

        const params = new URLSearchParams();
        if (page > 1) params.set("page", String(page));
        if (pageSize !== 20) params.set("limit", String(pageSize));
        if (deferredSearchText) params.set("q", deferredSearchText);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set("sort_created", createdSort);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, page, pageSize, deferredSearchText, statusFilter, createdSort]);

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

    const fetchIngredients = useCallback(
        async ({ silent = false }: { silent?: boolean } = {}) => {
            if (!canView) return;

            requestRef.current?.abort();
            const controller = new AbortController();
            requestRef.current = controller;

            try {
                if (!silent) setLoading(true);
                setError(null);

                const params = new URLSearchParams();
                params.set("page", String(page));
                params.set("limit", String(pageSize));
                params.set("sort_created", createdSort);
                if (deferredSearchText) params.set("q", deferredSearchText);
                if (statusFilter !== "all") params.set("status", statusFilter);

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

                setError(err instanceof Error ? err.message : "โหลดรายการวัตถุดิบไม่สำเร็จ");
                setIngredients([]);
                setTotalIngredients(0);
            } finally {
                if (requestRef.current === controller) {
                    requestRef.current = null;
                    if (!silent) setLoading(false);
                }
            }
        },
        [canView, createdSort, deferredSearchText, page, pageSize, statusFilter]
    );

    useEffect(() => {
        if (!initRef.current || !canView) return;
        void fetchIngredients({ silent: hasLoadedRef.current });

        return () => {
            requestRef.current?.abort();
        };
    }, [canView, fetchIngredients]);

    useEffect(() => {
        if (!socket || !canView) return;

        const refresh = () => {
            void fetchIngredients({ silent: true });
        };

        socket.on(RealtimeEvents.ingredients.create, refresh);
        socket.on(RealtimeEvents.ingredients.update, refresh);
        socket.on(RealtimeEvents.ingredients.delete, refresh);

        return () => {
            socket.off(RealtimeEvents.ingredients.create, refresh);
            socket.off(RealtimeEvents.ingredients.update, refresh);
            socket.off(RealtimeEvents.ingredients.delete, refresh);
        };
    }, [socket, canView, fetchIngredients]);

    const handleDelete = (ingredient: Ingredients) => {
        if (!canDelete) {
            messageApi.error("คุณไม่มีสิทธิ์ลบวัตถุดิบ");
            return;
        }

        Modal.confirm({
            title: `ลบวัตถุดิบ ${ingredient.display_name}`,
            content:
                "หากวัตถุดิบนี้ยังถูกอ้างอิงในใบสั่งซื้อหรือประวัติการใช้งาน ระบบจะไม่อนุญาตให้ลบ",
            okText: "ลบวัตถุดิบ",
            okButtonProps: { danger: true },
            cancelText: "ยกเลิก",
            onOk: async () => {
                try {
                    await ingredientsService.delete(ingredient.id, undefined, csrfToken);
                    messageApi.success("ลบวัตถุดิบเรียบร้อย");
                    void fetchIngredients({ silent: true });
                } catch (err) {
                    messageApi.error(err instanceof Error ? err.message : "ลบวัตถุดิบไม่สำเร็จ");
                }
            },
        });
    };

    const summary = useMemo(() => {
        const active = ingredients.filter((item) => item.is_active).length;
        const inactive = ingredients.filter((item) => !item.is_active).length;
        const withImage = ingredients.filter((item) => Boolean(item.img_url)).length;
        return { active, inactive, withImage };
    }, [ingredients]);

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!user || !canView) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการวัตถุดิบ" tone="danger" />;
    }

    return (
        <div className="stock-ingredient-shell" data-testid="stock-ingredients-page">
            <IngredientsPageStyle />

            <UIPageHeader
                title="วัตถุดิบ"
                subtitle="จัดการวัตถุดิบของสาขาปัจจุบันสำหรับใช้สร้างใบสั่งซื้อและตรวจรับสินค้า"
                icon={<ShoppingOutlined />}
                actions={
                    <Space wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => void fetchIngredients()} loading={loading}>
                            รีเฟรช
                        </Button>
                        {canCreate ? (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => router.push("/stock/ingredients/manage/add")}
                                data-testid="stock-ingredients-add"
                            >
                                เพิ่มวัตถุดิบ
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer maxWidth={1240}>
                <PageStack gap={14}>
                    <section className="stock-ingredient-hero">
                        <div className="stock-ingredient-hero-grid">
                            <div>
                                <span className="stock-ingredient-eyebrow">
                                    <ShoppingOutlined />
                                    stock ingredients
                                </span>
                                <h1 className="stock-ingredient-title">
                                    เก็บรายการวัตถุดิบให้ค้นหาเร็ว ใช้งานง่าย และแยกตามสาขาชัดเจน
                                </h1>
                                <p className="stock-ingredient-subtitle">
                                    หน้านี้ใช้ดู ค้นหา และแก้ไขวัตถุดิบของสาขาปัจจุบันโดยตรง พร้อมรีเฟรชข้อมูลแบบเงียบเมื่อมีการเพิ่ม
                                    แก้ไข หรือลบรายการที่จำเป็นต้องเห็นทันที
                                </p>
                            </div>

                            <div className="stock-ingredient-side">
                                <div className="stock-ingredient-side-card">
                                    <span className="stock-ingredient-side-label">วัตถุดิบทั้งหมดในผลลัพธ์</span>
                                    <span className="stock-ingredient-side-value">{totalIngredients.toLocaleString()}</span>
                                </div>
                                <div className="stock-ingredient-side-card">
                                    <span className="stock-ingredient-side-label">มีรูปภาพ / ใช้งานอยู่</span>
                                    <span className="stock-ingredient-side-value">
                                        {summary.withImage.toLocaleString()} / {summary.active.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="stock-ingredient-stat-grid">
                        <article className="stock-ingredient-stat-card">
                            <span className="stock-ingredient-stat-label">ผลลัพธ์ทั้งหมด</span>
                            <span className="stock-ingredient-stat-value">{totalIngredients.toLocaleString()}</span>
                        </article>
                        <article className="stock-ingredient-stat-card">
                            <span className="stock-ingredient-stat-label">พร้อมใช้งาน</span>
                            <span className="stock-ingredient-stat-value" style={{ color: "#15803d" }}>
                                {summary.active.toLocaleString()}
                            </span>
                        </article>
                        <article className="stock-ingredient-stat-card">
                            <span className="stock-ingredient-stat-label">ปิดใช้งาน</span>
                            <span className="stock-ingredient-stat-value" style={{ color: "#b42318" }}>
                                {summary.inactive.toLocaleString()}
                            </span>
                        </article>
                    </section>

                    <PageSection title="ค้นหาและกรอง">
                        <div className="stock-ingredient-panel">
                            <div className="stock-ingredient-toolbar">
                                <Input
                                    size="large"
                                    allowClear
                                    placeholder="ค้นหาจากชื่อที่ใช้แสดง ชื่อในระบบ รายละเอียด หรือชื่อหน่วยนับ"
                                    value={searchText}
                                    data-testid="stock-ingredients-search"
                                    onChange={(event) => {
                                        setPage(1);
                                        setSearchText(event.target.value);
                                    }}
                                />
                                <ModalSelector<StatusFilter>
                                    title="เลือกสถานะ"
                                    value={statusFilter}
                                    onChange={(value) => {
                                        setPage(1);
                                        setStatusFilter(value);
                                    }}
                                    options={[
                                        { label: "ทุกสถานะ", value: "all" },
                                        { label: "ใช้งาน", value: "active" },
                                        { label: "ปิดใช้งาน", value: "inactive" },
                                    ]}
                                    placeholder="เลือกสถานะ"
                                />
                            </div>
                        </div>
                    </PageSection>

                    <PageSection title="รายการวัตถุดิบ" extra={<Text strong>{totalIngredients.toLocaleString()} รายการ</Text>}>
                        {loading ? (
                            <PageState status="loading" title="กำลังโหลดรายการวัตถุดิบ" />
                        ) : error ? (
                            <PageState status="error" title={error} onRetry={() => void fetchIngredients()} />
                        ) : ingredients.length === 0 ? (
                            <div className="stock-ingredient-panel stock-ingredient-empty">
                                <PageState
                                    status="empty"
                                    title="ยังไม่มีรายการวัตถุดิบ"
                                    description="เริ่มต้นด้วยการเพิ่มวัตถุดิบหลักของร้าน เช่น น้ำตาล เกลือ นม หรือวัตถุดิบที่ใช้สั่งซื้อเป็นประจำ"
                                    action={
                                        canCreate ? (
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={() => router.push("/stock/ingredients/manage/add")}
                                            >
                                                เพิ่มวัตถุดิบ
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            </div>
                        ) : (
                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                {ingredients.map((ingredient) => (
                                    <Card key={ingredient.id} className="stock-ingredient-card" bordered={false}>
                                        <div className="stock-ingredient-card-grid">
                                            <div className="stock-ingredient-card-main">
                                                <div className="stock-ingredient-thumb">
                                                    <StockImageThumb
                                                        src={ingredient.img_url}
                                                        alt={ingredient.display_name}
                                                        size={72}
                                                        borderRadius={16}
                                                    />
                                                </div>

                                                <div>
                                                    <div className="stock-ingredient-meta">
                                                        {ingredient.unit?.display_name ? (
                                                            <Tag color="blue">{ingredient.unit.display_name}</Tag>
                                                        ) : null}
                                                        {ingredient.is_active ? (
                                                            <Tag color="success">ใช้งาน</Tag>
                                                        ) : (
                                                            <Tag>ปิดใช้งาน</Tag>
                                                        )}
                                                    </div>

                                                    <Title level={5} style={{ margin: 0, color: "#0f172a" }}>
                                                        {ingredient.display_name}
                                                    </Title>
                                                    <Paragraph className="stock-ingredient-desc" ellipsis={{ rows: 2 }}>
                                                        {ingredient.description?.trim() || "ไม่มีรายละเอียดเพิ่มเติม"}
                                                    </Paragraph>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        สร้างเมื่อ{" "}
                                                        {ingredient.create_date
                                                            ? new Date(ingredient.create_date).toLocaleDateString("th-TH", {
                                                                  day: "2-digit",
                                                                  month: "short",
                                                                  year: "numeric",
                                                              })
                                                            : "-"}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div className="stock-ingredient-actions">
                                                {canUpdate ? (
                                                    <Button
                                                        icon={<EditOutlined />}
                                                        onClick={() => router.push(`/stock/ingredients/manage/edit/${ingredient.id}`)}
                                                    >
                                                        แก้ไข
                                                    </Button>
                                                ) : null}
                                                {canDelete ? (
                                                    <Button
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleDelete(ingredient)}
                                                    >
                                                        ลบ
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Card>
                                ))}

                                <div className="stock-ingredient-panel">
                                    <ListPagination
                                        page={page}
                                        pageSize={pageSize}
                                        total={totalIngredients}
                                        loading={loading}
                                        onPageChange={setPage}
                                        onPageSizeChange={(size) => {
                                            setPage(1);
                                            setPageSize(size);
                                        }}
                                        sortCreated={createdSort}
                                        onSortCreatedChange={(nextSort) => {
                                            setPage(1);
                                            setCreatedSort(nextSort);
                                        }}
                                    />
                                </div>
                            </Space>
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
