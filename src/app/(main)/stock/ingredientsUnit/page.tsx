"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { App, Button, Card, Input, Modal, Space, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, ExperimentOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { IngredientsUnit } from "../../../../types/api/stock/ingredientsUnit";
import { useSocket } from "../../../../hooks/useSocket";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../services/auth.service";
import { ingredientsUnitService } from "../../../../services/stock/ingredientsUnit.service";
import ListPagination, { type CreatedSort } from "../../../../components/ui/pagination/ListPagination";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../../lib/list-sort";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import PageState from "../../../../components/ui/states/PageState";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import IngredientsUnitPageStyle from "./style";

const { Paragraph, Text, Title } = Typography;

type StatusFilter = "all" | "active" | "inactive";

export default function IngredientsUnitPage() {
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

    const canView = can("stock.ingredients_unit.page", "view");
    const canCreate = can("stock.ingredients_unit.page", "create");
    const canUpdate = can("stock.ingredients_unit.page", "update");
    const canDelete = can("stock.ingredients_unit.page", "delete");

    const [csrfToken, setCsrfToken] = useState("");
    const [units, setUnits] = useState<IngredientsUnit[]>([]);
    const [totalUnits, setTotalUnits] = useState(0);
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
                if (mounted) messageApi.error("โหลดโทเคนความปลอดภัยไม่สำเร็จ");
            }
        };
        void run();
        return () => {
            mounted = false;
        };
    }, [messageApi, user?.id]);

    const fetchUnits = useCallback(
        async ({ silent = false }: { silent?: boolean } = {}) => {
            if (!canView) return;

            requestRef.current?.abort();
            const controller = new AbortController();
            requestRef.current = controller;

            try {
                if (!silent) {
                    setLoading(true);
                }
                setError(null);

                const params = new URLSearchParams();
                params.set("page", String(page));
                params.set("limit", String(pageSize));
                params.set("sort_created", createdSort);
                if (deferredSearchText) params.set("q", deferredSearchText);
                if (statusFilter !== "all") params.set("status", statusFilter);

                const payload = await ingredientsUnitService.findAllPaginated(undefined, params, {
                    signal: controller.signal,
                });

                if (requestRef.current !== controller) return;

                setUnits(Array.isArray(payload.data) ? payload.data : []);
                setTotalUnits(Number(payload.total || 0));
                hasLoadedRef.current = true;
            } catch (err) {
                if ((err as Error)?.name === "AbortError") return;
                if (requestRef.current !== controller) return;

                setError(err instanceof Error ? err.message : "โหลดรายการหน่วยนับไม่สำเร็จ");
                setUnits([]);
                setTotalUnits(0);
            } finally {
                if (requestRef.current === controller) {
                    requestRef.current = null;
                    if (!silent) {
                        setLoading(false);
                    }
                }
            }
        },
        [canView, createdSort, deferredSearchText, page, pageSize, statusFilter]
    );

    useEffect(() => {
        if (!initRef.current || !canView) return;
        void fetchUnits({ silent: hasLoadedRef.current });
        return () => {
            requestRef.current?.abort();
        };
    }, [canView, fetchUnits]);

    useEffect(() => {
        if (!socket || !canView) return;

        const refresh = () => {
            void fetchUnits({ silent: true });
        };

        socket.on(RealtimeEvents.ingredientsUnit.create, refresh);
        socket.on(RealtimeEvents.ingredientsUnit.update, refresh);
        socket.on(RealtimeEvents.ingredientsUnit.delete, refresh);

        return () => {
            socket.off(RealtimeEvents.ingredientsUnit.create, refresh);
            socket.off(RealtimeEvents.ingredientsUnit.update, refresh);
            socket.off(RealtimeEvents.ingredientsUnit.delete, refresh);
        };
    }, [socket, canView, fetchUnits]);

    const handleDelete = (unit: IngredientsUnit) => {
        if (!canDelete) {
            messageApi.error("คุณไม่มีสิทธิ์ลบหน่วยนับ");
            return;
        }

        Modal.confirm({
            title: `ลบหน่วยนับ ${unit.display_name}`,
            content: "หน่วยนับนี้จะถูกลบออกจากระบบ หากยังมีวัตถุดิบใช้งานอยู่ ระบบจะไม่อนุญาตให้ลบ",
            okText: "ลบหน่วยนับ",
            okButtonProps: { danger: true },
            cancelText: "ยกเลิก",
            onOk: async () => {
                try {
                    await ingredientsUnitService.delete(unit.id, undefined, csrfToken);
                    messageApi.success("ลบหน่วยนับแล้ว");
                    void fetchUnits({ silent: true });
                } catch (err) {
                    messageApi.error(err instanceof Error ? err.message : "ลบหน่วยนับไม่สำเร็จ");
                }
            },
        });
    };

    const summary = useMemo(() => {
        const active = units.filter((unit) => unit.is_active).length;
        const inactive = units.filter((unit) => !unit.is_active).length;
        return { active, inactive };
    }, [units]);

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!user || !canView) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าหน่วยนับวัตถุดิบ" tone="danger" />;
    }

    return (
        <div className="stock-unit-shell" data-testid="stock-ingredients-unit-page">
            <IngredientsUnitPageStyle />

            <UIPageHeader
                title="หน่วยนับวัตถุดิบ"
                subtitle="ดูแลหน่วยที่ใช้ในสูตรและใบซื้อให้เป็นมาตรฐานเดียวกันทุกสาขา"
                icon={<ExperimentOutlined />}
                actions={
                    <Space wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => void fetchUnits()} loading={loading}>
                            รีเฟรช
                        </Button>
                        {canCreate ? (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => router.push("/stock/ingredientsUnit/manage/add")}
                                data-testid="stock-ingredients-unit-add"
                            >
                                เพิ่มหน่วยนับ
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer maxWidth={1200}>
                <PageStack gap={14}>
                    <section className="stock-unit-hero">
                        <div className="stock-unit-hero-grid">
                            <div className="stock-unit-hero-copy">
                                <span className="stock-unit-eyebrow">
                                    <ExperimentOutlined />
                                    ingredients unit
                                </span>
                                <h1 className="stock-unit-title">จัดการหน่วยให้ชัด ใช้ซ้ำได้ และไม่ซ้ำกัน</h1>
                                <p className="stock-unit-subtitle">
                                    หน้านี้ใช้ดูรายการหน่วยทั้งหมด ค้นหาได้เร็ว แยกสถานะได้ และเข้าหน้าเพิ่มหรือแก้ไขได้ทันที
                                    โดยข้อมูลจะรีเฟรชแบบเงียบเมื่อมีการเปลี่ยนแปลงที่จำเป็น
                                </p>
                            </div>

                            <div className="stock-unit-hero-side">
                                <div className="stock-unit-side-card">
                                    <span className="stock-unit-side-label">ผลลัพธ์ทั้งหมด</span>
                                    <span className="stock-unit-side-value">{totalUnits.toLocaleString()}</span>
                                </div>
                                <div className="stock-unit-side-card">
                                    <span className="stock-unit-side-label">พร้อมใช้งาน / ปิดใช้งาน</span>
                                    <span className="stock-unit-side-value">
                                        {summary.active.toLocaleString()} / {summary.inactive.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="stock-unit-stat-grid">
                        <article className="stock-unit-stat-card">
                            <span className="stock-unit-stat-label">ผลลัพธ์ทั้งหมด</span>
                            <span className="stock-unit-stat-value">{totalUnits.toLocaleString()}</span>
                        </article>
                        <article className="stock-unit-stat-card">
                            <span className="stock-unit-stat-label">ใช้งานในหน้าปัจจุบัน</span>
                            <span className="stock-unit-stat-value" style={{ color: "#15803d" }}>
                                {summary.active.toLocaleString()}
                            </span>
                        </article>
                        <article className="stock-unit-stat-card">
                            <span className="stock-unit-stat-label">ปิดใช้งานในหน้าปัจจุบัน</span>
                            <span className="stock-unit-stat-value" style={{ color: "#b42318" }}>
                                {summary.inactive.toLocaleString()}
                            </span>
                        </article>
                    </section>

                    <PageSection title="ค้นหาและกรอง">
                        <div className="stock-unit-panel">
                            <div className="stock-unit-toolbar">
                                <Input
                                    placeholder="ค้นหาจากรหัสหน่วย เช่น kg, g, pack หรือชื่อที่ใช้แสดง"
                                    value={searchText}
                                    allowClear
                                    size="large"
                                    data-testid="stock-ingredients-unit-search"
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

                    <PageSection title="รายการหน่วยนับ" extra={<Text strong>{totalUnits.toLocaleString()} รายการ</Text>}>
                        {loading ? (
                            <PageState status="loading" title="กำลังโหลดรายการหน่วยนับ" />
                        ) : error ? (
                            <PageState status="error" title={error} onRetry={() => void fetchUnits()} />
                        ) : units.length === 0 ? (
                            <div className="stock-unit-panel stock-unit-list-empty">
                                <PageState
                                    status="empty"
                                    title="ยังไม่มีข้อมูลหน่วยนับ"
                                    description="เริ่มต้นด้วยการเพิ่มหน่วยพื้นฐาน เช่น กิโลกรัม กรัม ลิตร หรือแพ็ก"
                                    action={
                                        canCreate ? (
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={() => router.push("/stock/ingredientsUnit/manage/add")}
                                            >
                                                เพิ่มหน่วยนับ
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            </div>
                        ) : (
                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                {units.map((unit) => (
                                    <Card key={unit.id} className="stock-unit-card" bordered={false}>
                                        <div className="stock-unit-card-grid">
                                            <div>
                                                <Space wrap size={8} style={{ marginBottom: 8 }}>
                                                    {unit.is_active ? (
                                                        <Tag color="success">ใช้งาน</Tag>
                                                    ) : (
                                                        <Tag>ปิดใช้งาน</Tag>
                                                    )}
                                                </Space>

                                                <Title level={5} style={{ margin: 0, color: "#0f172a" }}>
                                                    {unit.display_name}
                                                </Title>
                                                <Paragraph style={{ margin: "8px 0 0", color: "#64748b" }}>
                                                    ใช้เป็นชื่อที่ผู้ใช้งานเห็นจริงในหน้าวัตถุดิบ ใบซื้อ และเอกสารที่เกี่ยวข้อง
                                                </Paragraph>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    สร้างเมื่อ{" "}
                                                    {unit.create_date
                                                        ? new Date(unit.create_date).toLocaleDateString("th-TH", {
                                                              day: "2-digit",
                                                              month: "short",
                                                              year: "numeric",
                                                          })
                                                        : "-"}
                                                </Text>
                                            </div>

                                            <div className="stock-unit-actions">
                                                {canUpdate ? (
                                                    <Button
                                                        icon={<EditOutlined />}
                                                        onClick={() => router.push(`/stock/ingredientsUnit/manage/edit/${unit.id}`)}
                                                    >
                                                        แก้ไข
                                                    </Button>
                                                ) : null}
                                                {canDelete ? (
                                                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(unit)}>
                                                        ลบ
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Card>
                                ))}

                                <div className="stock-unit-panel">
                                    <ListPagination
                                        page={page}
                                        pageSize={pageSize}
                                        total={totalUnits}
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
