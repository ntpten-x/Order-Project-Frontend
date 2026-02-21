"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    App,
    Button,
    Card,
    Col,
    Input,
    Modal,
    Row,
    Space,
    Spin,
    Tag,
    Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, ShoppingOutlined } from "@ant-design/icons";
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { Ingredients } from "../../../../types/api/stock/ingredients";
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
import StockImageThumb from "../../../../components/stock/StockImageThumb";

const { Text, Title, Paragraph } = Typography;

export default function IngredientsPage() {
    const { message: messageApi } = App.useApp();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initRef = useRef(false);

    const { socket } = useSocket();
    const { user, loading: authLoading } = useAuth();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreate = can("stock.ingredients.page", "create");
    const canUpdate = can("stock.ingredients.page", "update");
    const canDelete = can("stock.ingredients.page", "delete");

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [csrfToken, setCsrfToken] = useState("");

    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
    const [totalIngredients, setTotalIngredients] = useState(0);
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

    const fetchIngredients = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(pageSize));
            params.set("sort_created", createdSort);
            if (searchText.trim()) params.set("q", searchText.trim());
            if (statusFilter !== "all") params.set("status", statusFilter);

            const response = await fetch(`/api/stock/ingredients?${params.toString()}`, { cache: "no-store" });
            if (!response.ok) throw new Error("โหลดรายการวัตถุดิบไม่สำเร็จ");

            const payload = await response.json();
            setIngredients(Array.isArray(payload?.data) ? payload.data : []);
            setTotalIngredients(Number(payload?.total || 0));
        } catch {
            setError("โหลดรายการวัตถุดิบไม่สำเร็จ");
            setIngredients([]);
            setTotalIngredients(0);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, createdSort, searchText, statusFilter]);

    useEffect(() => {
        if (isAuthorized !== true || !initRef.current) return;
        void fetchIngredients();
    }, [isAuthorized, fetchIngredients]);

    useEffect(() => {
        if (!socket || isAuthorized !== true) return;

        const refresh = () => {
            void fetchIngredients();
        };

        socket.on(RealtimeEvents.ingredients.create, refresh);
        socket.on(RealtimeEvents.ingredients.update, refresh);
        socket.on(RealtimeEvents.ingredients.delete, refresh);

        return () => {
            socket.off(RealtimeEvents.ingredients.create, refresh);
            socket.off(RealtimeEvents.ingredients.update, refresh);
            socket.off(RealtimeEvents.ingredients.delete, refresh);
        };
    }, [socket, isAuthorized, fetchIngredients]);

    const handleDelete = (ingredient: Ingredients) => {
        if (!canDelete) {
            messageApi.error("คุณไม่มีสิทธิ์ลบวัตถุดิบ");
            return;
        }
        Modal.confirm({
            title: `ลบวัตถุดิบ ${ingredient.display_name}`,
            content: "ต้องการลบวัตถุดิบนี้หรือไม่",
            okText: "ลบ",
            okButtonProps: { danger: true },
            cancelText: "ยกเลิก",
            onOk: async () => {
                try {
                    const response = await fetch(`/api/stock/ingredients/delete/${ingredient.id}`, {
                        method: "DELETE",
                        headers: { "X-CSRF-Token": csrfToken },
                    });
                    if (!response.ok) throw new Error("ลบวัตถุดิบไม่สำเร็จ");
                    messageApi.success("ลบวัตถุดิบแล้ว");
                    void fetchIngredients();
                } catch {
                    messageApi.error("ลบวัตถุดิบไม่สำเร็จ");
                }
            },
        });
    };

    const activeCount = useMemo(() => ingredients.filter((item) => item.is_active).length, [ingredients]);
    const inactiveCount = useMemo(() => ingredients.filter((item) => !item.is_active).length, [ingredients]);

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
                title="จัดการวัตถุดิบ"
                subtitle={`ทั้งหมด ${totalIngredients.toLocaleString()} รายการ`}
                icon={<ShoppingOutlined />}
                actions={
                <Space wrap>
                    <Button icon={<ReloadOutlined />} onClick={() => void fetchIngredients()} loading={loading}>
                        รีเฟรช
                    </Button>
                    {canCreate ? (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/stock/ingredients/manage/add")}>
                            เพิ่มวัตถุดิบ
                        </Button>
                    ) : null}
                </Space>
            }
        />

            <PageContainer maxWidth={1300}>
                <PageStack gap={12}>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Text type="secondary">ทั้งหมด</Text>
                                <Title level={4} style={{ margin: "6px 0 0" }}>{totalIngredients.toLocaleString()}</Title>
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
                                    placeholder="ค้นหาจากชื่อแสดง ชื่อระบบ หรือคำอธิบาย"
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

                    <PageSection title="รายการวัตถุดิบ" extra={<Text strong>{totalIngredients.toLocaleString()} รายการ</Text>}>
                        {loading ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูล" />
                        ) : error ? (
                            <PageState status="error" title={error} onRetry={() => void fetchIngredients()} />
                        ) : ingredients.length === 0 ? (
                            <PageState
                                status="empty"
                                title="ยังไม่มีวัตถุดิบ"
                                action={
                                    canCreate ? (
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/stock/ingredients/manage/add")}>
                                        เพิ่มวัตถุดิบ
                                    </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                {ingredients.map((ingredient) => (
                                    <Card key={ingredient.id} size="small" style={{ borderRadius: 12 }}>
                                        <Row gutter={[12, 12]} align="middle">
                                            <Col xs={24} md={15}>
                                                <Space align="start" size={12}>
                                                    <StockImageThumb
                                                        src={ingredient.img_url}
                                                        alt={ingredient.display_name}
                                                        size={56}
                                                        borderRadius={10}
                                                    />
                                                    <Space direction="vertical" size={2}>
                                                        <Space wrap>
                                                            <Text strong>{ingredient.display_name}</Text>
                                                            <Tag>{ingredient.unit?.display_name || "หน่วย"}</Tag>
                                                            {ingredient.is_active ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ปิดใช้งาน</Tag>}
                                                        </Space>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            ชื่อระบบ: {ingredient.ingredient_name}
                                                        </Text>
                                                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontSize: 12 }}>
                                                            {ingredient.description || "ไม่มีคำอธิบาย"}
                                                        </Paragraph>
                                                    </Space>
                                                </Space>
                                            </Col>
                                            <Col xs={24} md={9}>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                                                    {canUpdate ? (
                                                        <Button icon={<EditOutlined />} onClick={() => router.push(`/stock/ingredients/manage/edit/${ingredient.id}`)}>
                                                            แก้ไข
                                                        </Button>
                                                    ) : null}
                                                    {canDelete ? (
                                                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(ingredient)}>
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
                            </Space>
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
