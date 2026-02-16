"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Button,
    Card,
    DatePicker,
    Descriptions,
    Divider,
    Drawer,
    Empty,
    Input,
    message,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    CopyOutlined,
    EyeOutlined,
    FilterOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import PageContainer from "../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import PageSection from "../../../components/ui/page/PageSection";
import { AuditLog, AuditActionType } from "../../../types/api/audit";
import { AuditPageStyles, pageStyles, StatsCard, SearchBar } from "./style";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { branchService } from "../../../services/branch.service";
import { useDebouncedValue } from "../../../utils/useDebouncedValue";
import type { CreatedSort } from "../../../components/ui/pagination/ListPagination";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../lib/list-sort";
import { ModalSelector } from "../../../components/ui/select/ModalSelector";
import { useRoleGuard } from "../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../components/pos/AccessGuard";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type AuditResponse = {
    data: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
};

function formatActionLabel(value: string) {
    return value.replace(/_/g, " / ");
}

function getActionColor(action: string): string {
    const upper = action.toUpperCase();
    if (upper.includes("DELETE") || upper.includes("CANCEL")) return "red";
    if (upper.includes("REFUND") || upper.includes("CLOSE")) return "volcano";
    if (upper.includes("UPDATE") || upper.includes("STATUS")) return "geekblue";
    if (upper.includes("CREATE") || upper.includes("ADD") || upper.includes("OPEN")) return "green";
    return "purple";
}


export default function AuditPage() {
    const { isAuthorized, isChecking } = useRoleGuard({
        requiredPermission: { resourceKey: "audit.page", action: "view" },
        unauthorizedMessage: "You do not have permission to access this page.",
        redirectUnauthorized: "/",
    });

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isUrlReadyRef = useRef(false);
    const { user } = useAuth();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canViewBranches = can("branches.page", "view");

    const [search, setSearch] = useState("");
    const [actionType, setActionType] = useState<string>();
    const [entityType, setEntityType] = useState<string>();
    const [branchFilter, setBranchFilter] = useState<string>();
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const debouncedSearch = useDebouncedValue(search, 300);
    const debouncedEntityType = useDebouncedValue(entityType ?? "", 300);
    const SHIFT_PREVIEW_ACTION = AuditActionType.SHIFT_CLOSE_PREVIEW;

    const startDateIso = useMemo(
        () => (dateRange?.[0] ? dateRange[0].startOf("day").toISOString() : undefined),
        [dateRange]
    );
    const endDateIso = useMemo(
        () => (dateRange?.[1] ? dateRange[1].endOf("day").toISOString() : undefined),
        [dateRange]
    );

    useEffect(() => {
        if (isUrlReadyRef.current) return;

        const pageParam = Number(searchParams.get("page") || "1");
        const limitParam = Number(searchParams.get("limit") || "20");
        const searchParam = searchParams.get("search") || "";
        const actionParam = searchParams.get("action_type") || undefined;
        const entityParam = searchParams.get("entity_type") || undefined;
        const branchParam = searchParams.get("branch_id") || undefined;
        const sortParam = searchParams.get("sort_created");
        const startParam = searchParams.get("start_date");
        const endParam = searchParams.get("end_date");

        const startDate = startParam ? dayjs(startParam) : null;
        const endDate = endParam ? dayjs(endParam) : null;

        setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
        // Backend enforces max limit=100; keep UI state consistent with server behavior.
        const safeLimit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20;
        setPageSize(Math.min(safeLimit, 100));
        setSearch(searchParam);
        setActionType(actionParam);
        setEntityType(entityParam);
        setBranchFilter(branchParam);
        setCreatedSort(parseCreatedSort(sortParam));
        if ((startDate && startDate.isValid()) || (endDate && endDate.isValid())) {
            setDateRange([startDate && startDate.isValid() ? startDate : null, endDate && endDate.isValid() ? endDate : null]);
        }

        isUrlReadyRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;

        const params = new URLSearchParams();
        if (page > 1) params.set("page", String(page));
        if (pageSize !== 20) params.set("limit", String(pageSize));
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        if (actionType) params.set("action_type", actionType);
        if (debouncedEntityType.trim()) params.set("entity_type", debouncedEntityType.trim());
        if (branchFilter) params.set("branch_id", branchFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set("sort_created", createdSort);
        if (startDateIso) params.set("start_date", startDateIso);
        if (endDateIso) params.set("end_date", endDateIso);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, page, pageSize, debouncedSearch, actionType, debouncedEntityType, branchFilter, createdSort, startDateIso, endDateIso]);

    const filtersActive = useMemo(
        () =>
            [search, actionType, entityType, branchFilter, dateRange?.[0], dateRange?.[1]].filter(Boolean).length,
        [search, actionType, entityType, branchFilter, dateRange]
    );

    const actionOptions = useMemo(
        () =>
            Object.values(AuditActionType).map((value) => ({
                value,
                label: formatActionLabel(value),
            })),
        []
    );

    const branchQuery = useQuery({
        queryKey: ["branches", canViewBranches],
        queryFn: () => branchService.getAll(),
        enabled: canViewBranches,
        staleTime: 5 * 60 * 1000,
    });

    const auditQuery = useQuery<AuditResponse, Error, AuditResponse>({
        queryKey: [
            "auditLogs",
            page,
            pageSize,
            debouncedSearch,
            actionType,
            debouncedEntityType,
            branchFilter,
            createdSort,
            startDateIso,
            endDateIso,
        ],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(pageSize));
            if (debouncedSearch) params.set("search", debouncedSearch.trim());
            if (actionType) params.set("action_type", actionType);
            if (debouncedEntityType) params.set("entity_type", debouncedEntityType.trim());
            if (branchFilter) params.set("branch_id", branchFilter);
            params.set("sort_created", createdSort);
            if (startDateIso) params.set("start_date", startDateIso);
            if (endDateIso) params.set("end_date", endDateIso);

            const response = await fetch(`/api/audit/logs?${params.toString()}`, {
                cache: "no-store",
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                const errorMessage = (json as { error?: string }).error;
                throw new Error(errorMessage || "เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅ Audit เนเธกเนเธชเธณเน€เธฃเนเธ");
            }
            const payload = json as AuditResponse;
            const normalized = {
                ...payload,
                data: (payload.data || []).map((item) => ({
                    ...item,
                    created_at: new Date(item.created_at),
                })),
            };
            return normalized;
        },
        placeholderData: (prev) => prev,
        staleTime: 60 * 1000,
    });

    const logs = auditQuery.data?.data ?? [];
    const total = auditQuery.data?.total ?? 0;

    useEffect(() => {
        if (auditQuery.error) {
            message.error(auditQuery.error.message || "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅ Audit");
        }
    }, [auditQuery.error]);

    const columns: ColumnsType<AuditLog> = [
        {
            title: "เน€เธงเธฅเธฒ",
            dataIndex: "created_at",
            width: 170,
            render: (value: Date) => dayjs(value).format("DD MMM YYYY HH:mm"),
        },
        {
            title: "เธเธฒเธฃเธเธฃเธฐเธ—เธณ",
            dataIndex: "action_type",
            width: 180,
            render: (val: AuditActionType) => (
                <Tag color={getActionColor(val)} style={{ fontWeight: 600 }}>
                    {formatActionLabel(val)}
                </Tag>
            ),
        },
        {
            title: "เธเธนเนเนเธเน",
            dataIndex: "username",
            width: 140,
            render: (val: string, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{val || "เนเธกเนเธฃเธฐเธเธธ"}</Text>
                    {record.user_id && <Text type="secondary">{record.user_id.slice(0, 8)}</Text>}
                </Space>
            ),
        },
        {
            title: "เธชเธฒเธเธฒ",
            dataIndex: "branch_id",
            width: 140,
            render: (val: string | null | undefined) => val ? <Tag color="blue">{val.slice(0, 8)}</Tag> : "-",
        },
        {
            title: "เน€เธเนเธฒเธซเธกเธฒเธข",
            dataIndex: "entity_type",
            width: 180,
            render: (_: string, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.entity_type || "-"}</Text>
                    {record.entity_id && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            ID: {record.entity_id.slice(0, 12)}
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: "เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”",
            dataIndex: "description",
            ellipsis: true,
            render: (val: string | null | undefined) =>
                val ? (
                    <Tooltip title={val}>
                        <Text>{val}</Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
        {
            title: "เน€เธชเนเธเธ—เธฒเธ",
            dataIndex: "path",
            width: 220,
            render: (_: string, record) => (
                <Space size={8}>
                    {record.method && (
                        <Tag color="cyan" className="audit-chip">
                            {record.method}
                        </Tag>
                    )}
                    <Text type="secondary">{record.path || "-"}</Text>
                </Space>
            ),
        },
        {
            title: "IP / Agent",
            dataIndex: "ip_address",
            width: 200,
            render: (_: string, record) => (
                <Space direction="vertical" size={0}>
                    <Text code>{record.ip_address}</Text>
                    {record.user_agent && (
                        <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                            {record.user_agent}
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: "",
            key: "actions",
            fixed: "right",
            width: 70,
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setSelectedLog(record)}
                    aria-label="เธ”เธนเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”"
                >
                    เธ”เธน
                </Button>
            ),
        },
    ];

    const handleResetFilters = () => {
        setSearch("");
        setActionType(undefined);
        setEntityType(undefined);
        setDateRange(null);
        if (canViewBranches) setBranchFilter(undefined);
        setCreatedSort(DEFAULT_CREATED_SORT);
        setPage(1);
        setPageSize(20);
    };

    const isShiftPreviewQuickFilterActive = actionType === SHIFT_PREVIEW_ACTION;

    const toggleShiftPreviewQuickFilter = () => {
        setPage(1);
        setActionType((prev) => (prev === SHIFT_PREVIEW_ACTION ? undefined : SHIFT_PREVIEW_ACTION));
    };

    const copyId = async (id?: string) => {
        if (!id || typeof navigator === "undefined" || !navigator.clipboard) return;
        try {
            await navigator.clipboard.writeText(id);
            message.success("เธเธฑเธ”เธฅเธญเธ ID เนเธฅเนเธง");
        } catch {
            message.error("เธเธฑเธ”เธฅเธญเธเนเธกเนเธชเธณเน€เธฃเนเธ");
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="Checking permissions..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="You do not have permission to access this page." tone="danger" />;
    }

    return (
        <div style={pageStyles.container}>
            <AuditPageStyles />

            <UIPageHeader
                title="Audit Logs"
                subtitle="เธ•เธดเธ”เธ•เธฒเธกเธ—เธธเธเธเธฒเธฃเน€เธเธฅเธตเนเธขเธเนเธเธฅเธเธเธญเธเธฃเธฐเธเธเนเธเธเธฅเธฐเน€เธญเธตเธขเธ”"
                icon={<SafetyCertificateOutlined />}
                actions={
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={() => auditQuery.refetch()} loading={auditQuery.isFetching}>
                            เธฃเธตเน€เธเธฃเธ
                        </Button>
                        <Button icon={<FilterOutlined />} onClick={handleResetFilters} disabled={filtersActive === 0}>
                            เธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธ
                        </Button>
                    </Space>
                }
            />

            <div style={pageStyles.listContainer}>
                <PageContainer>
                    <StatsCard total={total} currentPage={logs.length} filtersActive={filtersActive} />

                    <SearchBar
                        search={search}
                        onSearchChange={setSearch}
                        filtersActive={filtersActive}
                        onReset={handleResetFilters}
                        onRefresh={() => auditQuery.refetch()}
                        loading={auditQuery.isFetching}
                    />

                    <Card style={{ borderRadius: 14, marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
                        <Space size={8} wrap>
                            <Text type="secondary" style={{ fontSize: 13 }}>คัดกรองด่วน:</Text>
                            <Button
                                size="small"
                                icon={<FilterOutlined />}
                                type={isShiftPreviewQuickFilterActive ? "primary" : "default"}
                                onClick={toggleShiftPreviewQuickFilter}
                                style={{ borderRadius: 999, fontWeight: 600 }}
                            >
                                SHIFT_CLOSE_PREVIEW
                            </Button>
                            {isShiftPreviewQuickFilterActive ? (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    แสดงเฉพาะ log การพรีวิวปิดกะก่อนยืนยันจริง
                                </Text>
                            ) : null}
                        </Space>
                    </Card>
                    <PageSection title="เธ•เธฑเธงเธเธฃเธญเธเน€เธเธดเนเธกเน€เธ•เธดเธก" extra={<Text type="secondary">เน€เธฅเธทเธญเธเน€เธเธทเนเธญเธเนเธเน€เธเธทเนเธญเธเธงเธฒเธกเนเธกเนเธเธขเธณ</Text>}>
                        <Card style={{ borderRadius: 16, marginBottom: 20 }} bodyStyle={{ padding: 16 }}>
                            <Space size={12} wrap>
                                <div style={{ width: 220 }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Action Type</Text>
                                    <ModalSelector
                                        title="เน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ—เธเธฒเธฃเธเธฃเธฐเธ—เธณ"
                                        placeholder="เธเธฃเธฐเน€เธ เธ—เธเธฒเธฃเธเธฃเธฐเธ—เธณ"
                                        value={actionType}
                                        options={actionOptions}
                                        onChange={(val) => {
                                            setActionType(val as string);
                                            setPage(1);
                                        }}
                                        showSearch
                                    />
                                </div>
                                <div style={{ width: 200 }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Entity Type</Text>
                                    <Input
                                        allowClear
                                        placeholder="เน€เธเนเธ Users, Orders"
                                        value={entityType}
                                        onChange={(e) => {
                                            setPage(1);
                                            setEntityType(e.target.value);
                                        }}
                                        style={{ borderRadius: 8 }}
                                    />
                                </div>
                                <div style={{ width: 280 }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>เธเนเธงเธเน€เธงเธฅเธฒ</Text>
                                    <RangePicker
                                        allowClear
                                        value={dateRange}
                                        onChange={(range) => {
                                            setDateRange(range);
                                            setPage(1);
                                        }}
                                        style={{ width: '100%', borderRadius: 8 }}
                                    />
                                </div>
                                <div style={{ width: 140 }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>เน€เธฃเธตเธขเธเธฅเธณเธ”เธฑเธ</Text>
                                    <ModalSelector<CreatedSort>
                                        title="เน€เธฅเธทเธญเธเธเธฒเธฃเน€เธฃเธตเธขเธเธฅเธณเธ”เธฑเธ"
                                        value={createdSort}
                                        options={[
                                            { label: "เน€เธเนเธฒเธเนเธญเธ", value: "old" },
                                            { label: "เนเธซเธกเนเธเนเธญเธ", value: "new" },
                                        ]}
                                        onChange={(val) => {
                                            setPage(1);
                                            setCreatedSort(val);
                                        }}
                                    />
                                </div>
                                {canViewBranches && (
                                    <div style={{ width: 220 }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>เธชเธฒเธเธฒ</Text>
                                        <ModalSelector
                                            title="เน€เธฅเธทเธญเธเธชเธฒเธเธฒ"
                                            placeholder="เน€เธฅเธทเธญเธเธชเธฒเธเธฒ"
                                            loading={branchQuery.isLoading}
                                            value={branchFilter}
                                            options={branchQuery.data?.map((b) => ({
                                                label: b.branch_name,
                                                value: b.id,
                                            })) || []}
                                            onChange={(val) => {
                                                setBranchFilter(val as string || undefined);
                                                setPage(1);
                                            }}
                                            showSearch
                                        />
                                    </div>
                                )}
                            </Space>
                        </Card>
                    </PageSection>

                <PageSection title="เธฃเธฒเธขเธเธฒเธฃ Audit">
                    <Card style={pageStyles.tableCard} bodyStyle={{ padding: 0 }}>
                        <Table<AuditLog>
                            className="audit-table"
                            rowKey="id"
                            dataSource={logs}
                            columns={columns}
                            loading={auditQuery.isFetching}
                            scroll={{ x: 1200 }}
                            pagination={{
                                current: page,
                                pageSize,
                                total,
                                showSizeChanger: true,
                                showTotal: (t) => `เธ—เธฑเนเธเธซเธกเธ” ${t} เธฃเธฒเธขเธเธฒเธฃ`,
                                onChange: (p, s) => {
                                    setPage(p);
                                    setPageSize(s);
                                },
                            }}
                            locale={{
                                emptyText: (
                                    <Empty
                                        description={
                                            <Space direction="vertical" size={4}>
                                                <Text strong>เธขเธฑเธเนเธกเนเธกเธตเธเนเธญเธกเธนเธฅเธ—เธตเนเธ•เธฃเธเน€เธเธทเนเธญเธเนเธ</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    เธฅเธญเธเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธซเธฃเธทเธญเธเธฃเธฑเธเธเนเธงเธเน€เธงเธฅเธฒ
                                                </Text>
                                            </Space>
                                        }
                                    />
                                ),
                            }}
                        />
                    </Card>
                </PageSection>
            </PageContainer>
        </div>

            <Drawer
                className="audit-drawer"
                title={
                    <Space align="center">
                        <SafetyCertificateOutlined />
                        <span>เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ” Audit</span>
                    </Space>
                }
                open={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                width={640}
            >
                {selectedLog && (
                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                        <Space align="center" wrap>
                            <Tag color={getActionColor(selectedLog.action_type)} style={{ fontWeight: 700 }}>
                                {formatActionLabel(selectedLog.action_type)}
                            </Tag>
                            <Tag color="blue">{dayjs(selectedLog.created_at).format("DD MMM YYYY HH:mm:ss")}</Tag>
                            <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => copyId(selectedLog.id)}
                            >
                                เธเธฑเธ”เธฅเธญเธ ID
                            </Button>
                        </Space>

                        <Descriptions size="small" column={1} bordered>
                            <Descriptions.Item label="เธเธนเนเนเธเนเธเธฒเธ">
                                {selectedLog.username || "เนเธกเนเธฃเธฐเธเธธ"}{" "}
                                {selectedLog.user_id && <Text type="secondary">({selectedLog.user_id})</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="เธชเธฒเธเธฒ">
                                {selectedLog.branch_id || "เนเธกเนเธฃเธฐเธเธธ"}
                            </Descriptions.Item>
                            <Descriptions.Item label="เน€เธเนเธฒเธซเธกเธฒเธข">
                                {selectedLog.entity_type || "-"}{" "}
                                {selectedLog.entity_id && <Text type="secondary">({selectedLog.entity_id})</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="เน€เธชเนเธเธ—เธฒเธ">
                                <Space size={8}>
                                    {selectedLog.method && <Tag color="cyan">{selectedLog.method}</Tag>}
                                    <Text>{selectedLog.path || "-"}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="IP / Agent">
                                <Space direction="vertical" size={4}>
                                    <Text code>{selectedLog.ip_address}</Text>
                                    {selectedLog.user_agent && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {selectedLog.user_agent}
                                        </Text>
                                    )}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก">
                                {selectedLog.description || "-"}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider>เธเนเธฒเธ—เธตเนเน€เธเธฅเธตเนเธขเธเนเธเธฅเธ</Divider>
                        <Card size="small" title="เธเนเธญเธกเธนเธฅเธเนเธญเธ" bodyStyle={{ padding: 12 }} bordered>
                            {selectedLog.old_values ? (
                                <pre style={pageStyles.jsonBlock}>
{JSON.stringify(selectedLog.old_values, null, 2)}
                                </pre>
                            ) : (
                                <Text type="secondary">เนเธกเนเธกเธตเธเนเธญเธกเธนเธฅเธเนเธญเธเธซเธเนเธฒ</Text>
                            )}
                        </Card>
                        <Card size="small" title="เธเนเธญเธกเธนเธฅเธซเธฅเธฑเธ" bodyStyle={{ padding: 12 }} bordered>
                            {selectedLog.new_values ? (
                                <pre style={pageStyles.jsonBlock}>
{JSON.stringify(selectedLog.new_values, null, 2)}
                                </pre>
                            ) : (
                                <Text type="secondary">เนเธกเนเธกเธตเธเนเธญเธกเธนเธฅเนเธซเธกเน</Text>
                            )}
                        </Card>
                    </Space>
                )}
            </Drawer>
        </div>
    );
}

