"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { App, Button, Card, Col, Input, Modal, Row, Space, Spin, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, ExperimentOutlined } from "@ant-design/icons";
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { IngredientsUnit } from "../../../../types/api/stock/ingredientsUnit";
import { useSocket } from "../../../../hooks/useSocket";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../services/auth.service";
import ListPagination, { type CreatedSort } from "../../../../components/ui/pagination/ListPagination";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../../lib/list-sort";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import PageState from "../../../../components/ui/states/PageState";

const { Text, Title } = Typography;

export default function IngredientsUnitPage() {
    const { message: messageApi } = App.useApp();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initRef = useRef(false);

    const { socket } = useSocket();
    const { user, loading: authLoading } = useAuth();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreate = can("stock.ingredients_unit.page", "create");
    const canUpdate = can("stock.ingredients_unit.page", "update");
    const canDelete = can("stock.ingredients_unit.page", "delete");

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [csrfToken, setCsrfToken] = useState("");

    const [units, setUnits] = useState<IngredientsUnit[]>([]);
    const [totalUnits, setTotalUnits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

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
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        if (searchText.trim()) params.set("q", searchText.trim());
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set("sort_created", createdSort);

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, page, pageSize, searchText, statusFilter, createdSort]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                setIsAuthorized(false);
                router.replace("/login");
            } else {
                setIsAuthorized(true);
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
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
    }, [messageApi]);

    const fetchUnits = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(pageSize));
            params.set("sort_created", createdSort);
            if (searchText.trim()) params.set("q", searchText.trim());
            if (statusFilter !== "all") params.set("status", statusFilter);

            const response = await fetch(`/api/stock/ingredientsUnit/getAll?${params.toString()}`, { cache: "no-store" });
            if (!response.ok) throw new Error("โหลดรายการหน่วยนับไม่สำเร็จ");

            const payload = await response.json();
            setUnits(Array.isArray(payload?.data) ? payload.data : []);
            setTotalUnits(Number(payload?.total || 0));
        } catch {
            setError("โหลดรายการหน่วยนับไม่สำเร็จ");
            setUnits([]);
            setTotalUnits(0);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, createdSort, searchText, statusFilter]);

    useEffect(() => {
        if (isAuthorized !== true || !initRef.current) return;
        void fetchUnits();
    }, [isAuthorized, fetchUnits]);

    useEffect(() => {
        if (!socket || isAuthorized !== true) return;

        const refresh = () => {
            void fetchUnits();
        };

        socket.on(RealtimeEvents.ingredientsUnit.create, refresh);
        socket.on(RealtimeEvents.ingredientsUnit.update, refresh);
        socket.on(RealtimeEvents.ingredientsUnit.delete, refresh);

        return () => {
            socket.off(RealtimeEvents.ingredientsUnit.create, refresh);
            socket.off(RealtimeEvents.ingredientsUnit.update, refresh);
            socket.off(RealtimeEvents.ingredientsUnit.delete, refresh);
        };
    }, [socket, isAuthorized, fetchUnits]);

    const handleDelete = (unit: IngredientsUnit) => {
        if (!canDelete) {
            messageApi.error("คุณไม่มีสิทธิ์ลบหน่วยนับ");
            return;
        }
        Modal.confirm({
            title: `ลบหน่วยนับ ${unit.display_name}`,
            content: "ต้องการลบหน่วยนับนี้หรือไม่",
            okText: "ลบ",
            okButtonProps: { danger: true },
            cancelText: "ยกเลิก",
            onOk: async () => {
                try {
                    const response = await fetch(`/api/stock/ingredientsUnit/delete/${unit.id}`, {
                        method: "DELETE",
                        headers: { "X-CSRF-Token": csrfToken },
                    });
                    if (!response.ok) throw new Error("ลบหน่วยนับไม่สำเร็จ");
                    messageApi.success("ลบหน่วยนับแล้ว");
                    void fetchUnits();
                } catch {
                    messageApi.error("ลบหน่วยนับไม่สำเร็จ");
                }
            },
        });
    };

    const activeCount = useMemo(() => units.filter((unit) => unit.is_active).length, [units]);
    const inactiveCount = useMemo(() => units.filter((unit) => !unit.is_active).length, [units]);

    if (authLoading || isAuthorized === null) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (isAuthorized === false) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Text type="danger">กำลังพาไปหน้าเข้าสู่ระบบ...</Text>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc", paddingBottom: 120 }}>
            <UIPageHeader
                title="หน่วยนับวัตถุดิบ"
                subtitle={`ทั้งหมด ${totalUnits.toLocaleString()} หน่วย`}
                icon={<ExperimentOutlined />}
                actions={
                <Space wrap>
                    <Button icon={<ReloadOutlined />} onClick={() => void fetchUnits()} loading={loading}>
                        รีเฟรช
                    </Button>
                    {canCreate ? (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/stock/ingredientsUnit/manage/add")}>
                            เพิ่มหน่วยนับ
                        </Button>
                    ) : null}
                </Space>
            }
        />

            <PageContainer maxWidth={1200}>
                <PageStack gap={12}>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Text type="secondary">ทั้งหมด</Text>
                                <Title level={4} style={{ margin: "6px 0 0" }}>{totalUnits.toLocaleString()}</Title>
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Text type="secondary">ใช้งาน</Text>
                                <Title level={4} style={{ margin: "6px 0 0", color: "#389e0d" }}>{activeCount.toLocaleString()}</Title>
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Text type="secondary">ปิดใช้งาน</Text>
                                <Title level={4} style={{ margin: "6px 0 0", color: "#cf1322" }}>{inactiveCount.toLocaleString()}</Title>
                            </Card>
                        </Col>
                    </Row>

                    <PageSection title="ค้นหาและกรอง">
                        <Row gutter={[8, 8]}>
                            <Col xs={24} md={14}>
                                <Input
                                    placeholder="ค้นหาจากชื่อหน่วย หรือชื่อแสดง"
                                    value={searchText}
                                    allowClear
                                    onChange={(event) => {
                                        setPage(1);
                                        setSearchText(event.target.value);
                                    }}
                                />
                            </Col>
                            <Col xs={24} md={10}>
                                <ModalSelector<"all" | "active" | "inactive">
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
                            </Col>
                        </Row>
                    </PageSection>

                    <PageSection title="รายการหน่วยนับ" extra={<Text strong>{totalUnits.toLocaleString()} รายการ</Text>}>
                        {loading ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูล" />
                        ) : error ? (
                            <PageState status="error" title={error} onRetry={() => void fetchUnits()} />
                        ) : units.length === 0 ? (
                            <PageState
                                status="empty"
                                title="ยังไม่มีข้อมูลหน่วยนับ"
                                action={
                                    canCreate ? (
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/stock/ingredientsUnit/manage/add")}>
                                        เพิ่มหน่วยนับ
                                    </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                {units.map((unit) => (
                                    <Card key={unit.id} size="small" style={{ borderRadius: 12 }}>
                                        <Row gutter={[12, 12]} align="middle">
                                            <Col xs={24} md={14}>
                                                <Space direction="vertical" size={2}>
                                                    <Space wrap>
                                                        <Text strong>{unit.display_name}</Text>
                                                        <Tag>{unit.unit_name}</Tag>
                                                        {unit.is_active ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ปิดใช้งาน</Tag>}
                                                    </Space>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        สร้างเมื่อ: {unit.create_date ? new Date(unit.create_date).toLocaleDateString("th-TH") : "-"}
                                                    </Text>
                                                </Space>
                                            </Col>
                                            <Col xs={24} md={10}>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                                                    {canUpdate ? (
                                                        <Button icon={<EditOutlined />} onClick={() => router.push(`/stock/ingredientsUnit/manage/edit/${unit.id}`)}>
                                                            แก้ไข
                                                        </Button>
                                                    ) : null}
                                                    {canDelete ? (
                                                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(unit)}>
                                                            ลบ
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}

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
                            </Space>
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
