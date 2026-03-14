"use client";

import React, { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { App, Button, Modal, Space, Switch, Tag, Typography } from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    ExperimentOutlined,
    PlusOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
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
import { ingredientsUnitService } from "../../../../services/stock/ingredientsUnit.service";
import { IngredientsUnit } from "../../../../types/api/stock/ingredientsUnit";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import IngredientsUnitPageStyle, { globalStyles, pageStyles } from "./style";

const { Text } = Typography;

type StatusFilter = "all" | "active" | "inactive";

const formatDate = (raw?: string | Date) => {
    if (!raw) return "-";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

type UnitCardProps = {
    unit: IngredientsUnit;
    canUpdate: boolean;
    canDelete: boolean;
    updatingStatusId: string | null;
    deletingId: string | null;
    onEdit: (unit: IngredientsUnit) => void;
    onDelete: (unit: IngredientsUnit) => void;
    onToggleActive: (unit: IngredientsUnit, next: boolean) => void;
};

const UnitCard = ({
    unit,
    canUpdate,
    canDelete,
    updatingStatusId,
    deletingId,
    onEdit,
    onDelete,
    onToggleActive,
}: UnitCardProps) => {
    return (
        <div
            className="stock-ingredients-unit-card"
            style={pageStyles.unitCard(unit.is_active)}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(unit);
            }}
        >
            <div style={pageStyles.unitCardInner}>
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: unit.is_active
                            ? "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)"
                            : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: unit.is_active ? "0 4px 10px rgba(15, 118, 110, 0.18)" : "none",
                    }}
                >
                    <ExperimentOutlined
                        style={{
                            fontSize: 22,
                            color: unit.is_active ? "#0f766e" : "#94a3b8",
                        }}
                    />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <Text strong style={{ fontSize: 16, color: "#0f172a" }} ellipsis={{ tooltip: unit.display_name }}>
                            {unit.display_name}
                        </Text>
                        <Tag color={unit.is_active ? "green" : "default"} style={{ borderRadius: 999 }}>
                            {unit.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                        สร้างเมื่อ {formatDate(unit.create_date)}
                    </Text>
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Switch
                        size="small"
                        checked={unit.is_active}
                        loading={updatingStatusId === unit.id}
                        disabled={!canUpdate || deletingId === unit.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canUpdate) return;
                            onToggleActive(unit, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(unit);
                            }}
                            style={{
                                borderRadius: 10,
                                color: "#0f766e",
                                background: "#ecfdf5",
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === unit.id}
                            icon={deletingId === unit.id ? undefined : <DeleteOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(unit);
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
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
    }, [createdSort, deferredSearchText, page, pageSize, pathname, router, statusFilter]);

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

    const fetchUnits = useCallback(
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
                setError(err instanceof Error ? err : new Error("โหลดรายการหน่วยนับไม่สำเร็จ"));
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
        [canView, createdSort, deferredSearchText, page, pageSize, statusFilter]
    );

    useEffect(() => {
        if (!initRef.current || !canView) return;
        void fetchUnits({ background: hasLoadedRef.current });
        return () => {
            requestRef.current?.abort();
        };
    }, [canView, fetchUnits]);

    useEffect(() => {
        if (!socket || !canView) return;

        const refresh = () => {
            void fetchUnits({ background: true });
        };

        socket.on(RealtimeEvents.ingredientsUnit.create, refresh);
        socket.on(RealtimeEvents.ingredientsUnit.update, refresh);
        socket.on(RealtimeEvents.ingredientsUnit.delete, refresh);

        return () => {
            socket.off(RealtimeEvents.ingredientsUnit.create, refresh);
            socket.off(RealtimeEvents.ingredientsUnit.update, refresh);
            socket.off(RealtimeEvents.ingredientsUnit.delete, refresh);
        };
    }, [canView, fetchUnits, socket]);

    const handleAdd = () => {
        if (!canCreate) {
            messageApi.warning("คุณไม่มีสิทธิ์เพิ่มหน่วยนับวัตถุดิบ");
            return;
        }
        router.push("/stock/ingredientsUnit/manage/add");
    };

    const handleEdit = (unit: IngredientsUnit) => {
        if (!canUpdate) {
            messageApi.warning("คุณไม่มีสิทธิ์แก้ไขหน่วยนับวัตถุดิบ");
            return;
        }
        router.push(`/stock/ingredientsUnit/manage/edit/${unit.id}`);
    };

    const handleDelete = (unit: IngredientsUnit) => {
        if (!canDelete) {
            messageApi.warning("คุณไม่มีสิทธิ์ลบหน่วยนับวัตถุดิบ");
            return;
        }

        Modal.confirm({
            title: "ยืนยันการลบหน่วยนับวัตถุดิบ",
            content: `ต้องการลบหน่วยนับ ${unit.display_name} หรือไม่?`,
            okText: "ลบ",
            okType: "danger",
            cancelText: "ยกเลิก",
            centered: true,
            icon: <DeleteOutlined style={{ color: "#ef4444" }} />,
            onOk: async () => {
                setDeletingId(unit.id);
                try {
                    await ingredientsUnitService.delete(unit.id, undefined, csrfToken);
                    const shouldMoveToPreviousPage = page > 1 && units.length === 1;
                    setUnits((prev) => prev.filter((item) => item.id !== unit.id));
                    setTotalUnits((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchUnits({ background: true });
                    }
                    messageApi.success(`ลบหน่วยนับ "${unit.display_name}" สำเร็จ`);
                } catch (err) {
                    messageApi.error(err instanceof Error ? err.message : "ลบหน่วยนับวัตถุดิบไม่สำเร็จ");
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (unit: IngredientsUnit, next: boolean) => {
        if (!canUpdate) {
            messageApi.warning("คุณไม่มีสิทธิ์เปลี่ยนสถานะหน่วยนับวัตถุดิบ");
            return;
        }

        setUpdatingStatusId(unit.id);
        try {
            const updated = await ingredientsUnitService.update(
                unit.id,
                {
                    display_name: unit.display_name,
                    is_active: next,
                },
                undefined,
                csrfToken
            );
            setUnits((prev) => prev.map((item) => (item.id === unit.id ? updated : item)));
            messageApi.success(next ? "เปิดใช้งานหน่วยนับแล้ว" : "ปิดใช้งานหน่วยนับแล้ว");
        } catch (err) {
            messageApi.error(err instanceof Error ? err.message : "เปลี่ยนสถานะหน่วยนับไม่สำเร็จ");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!user || !canView) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าหน่วยนับวัตถุดิบ" tone="danger" />;
    }

    return (
        <div className="stock-ingredients-unit-list-page" style={pageStyles.container}>
            <IngredientsUnitPageStyle />
            <style>{globalStyles}</style>

            <UIPageHeader
                title="หน่วยนับวัตถุดิบ"
                icon={<ExperimentOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button
                            icon={<ReloadOutlined />}
                            loading={refreshing}
                            onClick={() => void fetchUnits({ background: units.length > 0 })}
                        />
                        {canCreate ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มหน่วยนับ
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <SearchBar>
                        <SearchInput placeholder="ค้นหาหน่วยนับ" value={searchText} onChange={(value) => {
                            setPage(1);
                            setSearchText(value);
                        }} />
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
                        title="รายการหน่วยนับวัตถุดิบ"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{totalUnits} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && units.length === 0 ? (
                            <PageState status="loading" title="กำลังโหลดรายการหน่วยนับวัตถุดิบ..." />
                        ) : error && units.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดรายการหน่วยนับวัตถุดิบไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchUnits()}
                            />
                        ) : units.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                {units.map((unit) => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
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
                                        total={totalUnits}
                                        loading={loading || refreshing}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor="#0f766e"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={deferredSearchText ? "ไม่พบหน่วยนับตามคำค้น" : "ยังไม่มีหน่วยนับวัตถุดิบ"}
                                description={
                                    deferredSearchText
                                        ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
                                        : "เพิ่มหน่วยนับแรกเพื่อให้ทีมงานเลือกใช้งานได้ถูกต้อง"
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
