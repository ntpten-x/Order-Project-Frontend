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
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    CopyOutlined,
    EyeOutlined,
    FileSearchOutlined,
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
import { AuditPageStyles, pageStyles } from "./style";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { branchService } from "../../../services/branch.service";
import { useDebouncedValue } from "../../../utils/useDebouncedValue";
import type { CreatedSort } from "../../../components/ui/pagination/ListPagination";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../lib/list-sort";

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
        setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20);
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
        if (dateRange?.[0]) params.set("start_date", dateRange[0].startOf("day").toISOString());
        if (dateRange?.[1]) params.set("end_date", dateRange[1].endOf("day").toISOString());

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, page, pageSize, debouncedSearch, actionType, debouncedEntityType, branchFilter, createdSort, dateRange]);

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
            dateRange?.[0]?.toISOString(),
            dateRange?.[1]?.toISOString(),
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
            if (dateRange?.[0]) params.set("start_date", dateRange[0].startOf("day").toISOString());
            if (dateRange?.[1]) params.set("end_date", dateRange[1].endOf("day").toISOString());

            const response = await fetch(`/api/audit/logs?${params.toString()}`, {
                cache: "no-store",
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                const errorMessage = (json as { error?: string }).error;
                throw new Error(errorMessage || "โหลดข้อมูล Audit ไม่สำเร็จ");
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
            message.error(auditQuery.error.message || "ไม่สามารถโหลดข้อมูล Audit");
        }
    }, [auditQuery.error]);

    const columns: ColumnsType<AuditLog> = [
        {
            title: "เวลา",
            dataIndex: "created_at",
            width: 170,
            render: (value: Date) => dayjs(value).format("DD MMM YYYY HH:mm"),
        },
        {
            title: "การกระทำ",
            dataIndex: "action_type",
            width: 180,
            render: (val: AuditActionType) => (
                <Tag color={getActionColor(val)} style={{ fontWeight: 600 }}>
                    {formatActionLabel(val)}
                </Tag>
            ),
        },
        {
            title: "ผู้ใช้",
            dataIndex: "username",
            width: 140,
            render: (val: string, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{val || "ไม่ระบุ"}</Text>
                    {record.user_id && <Text type="secondary">{record.user_id.slice(0, 8)}</Text>}
                </Space>
            ),
        },
        {
            title: "สาขา",
            dataIndex: "branch_id",
            width: 140,
            render: (val: string | null | undefined) => val ? <Tag color="blue">{val.slice(0, 8)}</Tag> : "-",
        },
        {
            title: "เป้าหมาย",
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
            title: "รายละเอียด",
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
            title: "เส้นทาง",
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
                    aria-label="ดูรายละเอียด"
                >
                    ดู
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

    const copyId = async (id?: string) => {
        if (!id || typeof navigator === "undefined" || !navigator.clipboard) return;
        try {
            await navigator.clipboard.writeText(id);
            message.success("คัดลอก ID แล้ว");
        } catch {
            message.error("คัดลอกไม่สำเร็จ");
        }
    };

    return (
        <div style={pageStyles.container}>
            <AuditPageStyles />

            <UIPageHeader
                title="Audit Logs"
                subtitle="ติดตามทุกการเปลี่ยนแปลงของระบบแบบละเอียด"
                icon={<SafetyCertificateOutlined />}
                actions={
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={() => auditQuery.refetch()} loading={auditQuery.isFetching}>
                            รีเฟรช
                        </Button>
                        <Button icon={<FilterOutlined />} onClick={handleResetFilters} disabled={filtersActive === 0}>
                            ล้างตัวกรอง
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageSection>
                    <div style={pageStyles.statsGrid}>
                        <Card size="small" style={{ borderRadius: 16 }}>
                            <Statistic
                                title="จำนวน Log ทั้งหมด"
                                value={total}
                                prefix={<FileSearchOutlined />}
                                valueStyle={{ fontWeight: 700 }}
                            />
                        </Card>
                        <Card size="small" style={{ borderRadius: 16 }}>
                            <Statistic
                                title="บันทึกในหน้านี้"
                                value={logs.length}
                                suffix={`/ หน้า ${auditQuery.data?.page ?? 1}`}
                                valueStyle={{ fontWeight: 700 }}
                            />
                        </Card>
                        <Card size="small" style={{ borderRadius: 16 }}>
                            <Statistic
                                title="ตัวกรองที่ใช้"
                                value={filtersActive}
                                suffix="ตัว"
                                valueStyle={{ fontWeight: 700, color: filtersActive ? "#fa8c16" : undefined }}
                            />
                        </Card>
                        {!canViewBranches && (
                            <Card size="small" style={{ borderRadius: 16 }}>
                                <Statistic
                                    title="สาขาที่กำลังดู"
                                    value={user?.branch?.branch_name || user?.branch_id || "ไม่ระบุ"}
                                    valueStyle={{ fontWeight: 700 }}
                                />
                            </Card>
                        )}
                    </div>
                </PageSection>

                <PageSection title="ตัวกรอง" extra={<Text type="secondary">ช่วยให้ค้นหาเหตุการณ์ได้เร็วขึ้น</Text>}>
                    <Card style={pageStyles.filtersCard} bodyStyle={{ padding: 16 }}>
                        <Space size={12} wrap>
                            <Input
                                allowClear
                                style={{ width: 220 }}
                                placeholder="ค้นหา (ผู้ใช้, รายละเอียด, Entity)"
                                value={search}
                                prefix={<FileSearchOutlined />}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearch(e.target.value);
                                }}
                                onPressEnter={() => auditQuery.refetch()}
                            />
                            <Select
                                allowClear
                                showSearch
                                style={{ width: 220 }}
                                placeholder="เลือก Action"
                                value={actionType}
                                options={actionOptions}
                                optionFilterProp="label"
                                onChange={(val) => {
                                    setActionType(val);
                                    setPage(1);
                                }}
                            />
                            <Input
                                allowClear
                                style={{ width: 200 }}
                                placeholder="Entity type (เช่น Users, Orders)"
                                value={entityType}
                                onChange={(e) => {
                                    setPage(1);
                                    setEntityType(e.target.value);
                                }}
                            />
                            <RangePicker
                                allowClear
                                value={dateRange}
                                onChange={(range) => {
                                    setDateRange(range);
                                    setPage(1);
                                }}
                            />
                            <Select
                                style={{ width: 140 }}
                                value={createdSort}
                                options={[
                                    { label: "เก่าก่อน", value: "old" },
                                    { label: "ใหม่ก่อน", value: "new" },
                                ]}
                                onChange={(val: CreatedSort) => {
                                    setPage(1);
                                    setCreatedSort(val);
                                }}
                            />
                            {canViewBranches && (
                                <Select
                                    allowClear
                                    style={{ width: 220 }}
                                    placeholder="เลือกสาขา"
                                    loading={branchQuery.isLoading}
                                    value={branchFilter}
                                    options={branchQuery.data?.map((b) => ({
                                        label: b.branch_name,
                                        value: b.id,
                                    }))}
                                    onChange={(val) => {
                                        setBranchFilter(val || undefined);
                                        setPage(1);
                                    }}
                                />
                            )}
                        </Space>
                    </Card>
                </PageSection>

                <PageSection title="รายการ Audit">
                    <Card style={pageStyles.tableCard} bodyStyle={{ padding: 0 }}>
                        <Table<AuditLog>
                            className="audit-table"
                            rowKey="id"
                            dataSource={logs}
                            columns={columns}
                            loading={auditQuery.isLoading}
                            scroll={{ x: 1200 }}
                            pagination={{
                                current: page,
                                pageSize,
                                total,
                                showSizeChanger: true,
                                showTotal: (t) => `ทั้งหมด ${t} รายการ`,
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
                                                <Text strong>ยังไม่มีข้อมูลที่ตรงเงื่อนไข</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    ลองล้างตัวกรองหรือปรับช่วงเวลา
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

            <Drawer
                className="audit-drawer"
                title={
                    <Space align="center">
                        <SafetyCertificateOutlined />
                        <span>รายละเอียด Audit</span>
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
                                คัดลอก ID
                            </Button>
                        </Space>

                        <Descriptions size="small" column={1} bordered>
                            <Descriptions.Item label="ผู้ใช้งาน">
                                {selectedLog.username || "ไม่ระบุ"}{" "}
                                {selectedLog.user_id && <Text type="secondary">({selectedLog.user_id})</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="สาขา">
                                {selectedLog.branch_id || "ไม่ระบุ"}
                            </Descriptions.Item>
                            <Descriptions.Item label="เป้าหมาย">
                                {selectedLog.entity_type || "-"}{" "}
                                {selectedLog.entity_id && <Text type="secondary">({selectedLog.entity_id})</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="เส้นทาง">
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
                            <Descriptions.Item label="รายละเอียดเพิ่มเติม">
                                {selectedLog.description || "-"}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider>ค่าที่เปลี่ยนแปลง</Divider>
                        <Card size="small" title="ข้อมูลก่อน" bodyStyle={{ padding: 12 }} bordered>
                            {selectedLog.old_values ? (
                                <pre style={pageStyles.jsonBlock}>
{JSON.stringify(selectedLog.old_values, null, 2)}
                                </pre>
                            ) : (
                                <Text type="secondary">ไม่มีข้อมูลก่อนหน้า</Text>
                            )}
                        </Card>
                        <Card size="small" title="ข้อมูลหลัง" bodyStyle={{ padding: 12 }} bordered>
                            {selectedLog.new_values ? (
                                <pre style={pageStyles.jsonBlock}>
{JSON.stringify(selectedLog.new_values, null, 2)}
                                </pre>
                            ) : (
                                <Text type="secondary">ไม่มีข้อมูลใหม่</Text>
                            )}
                        </Card>
                    </Space>
                )}
            </Drawer>
        </div>
    );
}
