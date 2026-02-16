"use client";

import React from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Flex,
    Input,
    Row,
    Segmented,
    Space,
    Spin,
    Statistic,
    Tag,
    Typography,
} from "antd";
import {
    ApiOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DatabaseOutlined,
    LockOutlined,
    RadarChartOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

import { useRoleGuard } from "../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../components/pos/AccessGuard";
import PageContainer from "../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import PageSection from "../../../components/ui/page/PageSection";
import { systemHealthService } from "../../../services/system-health.service";
import type { HealthCheckItem, HealthLevel, SystemHealthReport } from "../../../types/api/system-health";

const { Text, Title } = Typography;

type LevelFilter = "all" | HealthLevel;

type LevelMeta = {
    label: "Ready" | "Warning" | "Error";
    color: "success" | "warning" | "error";
    cardBorder: string;
    softBg: string;
    icon: React.ReactNode;
};

const LEVEL_META: Record<HealthLevel, LevelMeta> = {
    ok: {
        label: "Ready",
        color: "success",
        cardBorder: "#b7eb8f",
        softBg: "#f6ffed",
        icon: <CheckCircleOutlined />,
    },
    warn: {
        label: "Warning",
        color: "warning",
        cardBorder: "#ffd591",
        softBg: "#fff7e6",
        icon: <WarningOutlined />,
    },
    error: {
        label: "Error",
        color: "error",
        cardBorder: "#ffa39e",
        softBg: "#fff1f0",
        icon: <CloseCircleOutlined />,
    },
};

function formatDateTime(iso?: string | null): string {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} วัน`);
    if (hours > 0 || days > 0) parts.push(`${hours} ชั่วโมง`);
    parts.push(`${minutes} นาที`);

    return parts.join(" ");
}

function humanizeKey(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();
}

function renderDetailValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined) return <Text type="secondary">-</Text>;

    if (typeof value === "boolean") {
        return <Tag color={value ? "success" : "error"}>{value ? "Enabled" : "Disabled"}</Tag>;
    }

    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "string") return value || "-";

    if (Array.isArray(value)) {
        if (value.length === 0) return <Text type="secondary">-</Text>;
        return (
            <Space size={[4, 4]} wrap>
                {value.slice(0, 10).map((item, index) => (
                    <Tag key={`${index}-${String(item)}`}>{String(item)}</Tag>
                ))}
            </Space>
        );
    }

    return (
        <Text style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12 }}>
            {JSON.stringify(value)}
        </Text>
    );
}

function filterChecks(checks: HealthCheckItem[], keyword: string, level: LevelFilter): HealthCheckItem[] {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return checks.filter((item) => {
        if (level !== "all" && item.level !== level) return false;

        if (!normalizedKeyword) return true;

        const haystack = [
            item.title,
            item.summary,
            item.key,
            ...Object.keys(item.details || {}),
            ...Object.values(item.details || {}).map((detail) => String(detail ?? "")),
        ]
            .join(" ")
            .toLowerCase();

        return haystack.includes(normalizedKeyword);
    });
}

function StatusTag({ level }: { level: HealthLevel }) {
    const meta = LEVEL_META[level];
    return (
        <Tag color={meta.color} icon={meta.icon} style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
            {meta.label}
        </Tag>
    );
}

function CheckCard({ item }: { item: HealthCheckItem }) {
    const meta = LEVEL_META[item.level];
    const details = Object.entries(item.details || {});

    return (
        <Card
            size="small"
            style={{
                height: "100%",
                borderRadius: 16,
                borderColor: meta.cardBorder,
                background: "#fff",
            }}
            bodyStyle={{ padding: 14 }}
        >
            <Flex vertical gap={10}>
                <Flex justify="space-between" align="center" gap={10}>
                    <Text strong style={{ fontSize: 15 }}>{item.title}</Text>
                    <StatusTag level={item.level} />
                </Flex>

                <Text style={{ color: "#334155", minHeight: 40 }}>{item.summary}</Text>

                <Space size={8} wrap>
                    {typeof item.latencyMs === "number" ? (
                        <Tag style={{ borderRadius: 999, margin: 0, background: meta.softBg, borderColor: "transparent" }}>
                            Latency {item.latencyMs.toFixed(2)} ms
                        </Tag>
                    ) : null}
                    <Tag style={{ borderRadius: 999, margin: 0 }}>Checked {formatDateTime(item.checkedAt)}</Tag>
                </Space>

                {details.length > 0 ? (
                    <div
                        style={{
                            borderRadius: 12,
                            border: "1px solid #f1f5f9",
                            padding: 10,
                            background: "#fafcff",
                        }}
                    >
                        <Space direction="vertical" size={6} style={{ width: "100%" }}>
                            {details.slice(0, 8).map(([key, value]) => (
                                <Flex key={key} justify="space-between" gap={10} align="start">
                                    <Text type="secondary" style={{ textTransform: "capitalize" }}>
                                        {humanizeKey(key)}
                                    </Text>
                                    <div style={{ textAlign: "right", maxWidth: "65%" }}>{renderDetailValue(value)}</div>
                                </Flex>
                            ))}
                        </Space>
                    </div>
                ) : null}
            </Flex>
        </Card>
    );
}

export default function HealthSystemPage() {
    const router = useRouter();
    const { isAuthorized, isChecking, user } = useRoleGuard({
        requiredRole: "Admin",
        unauthorizedMessage: "หน้านี้สำหรับผู้ดูแลระบบเท่านั้น",
        redirectUnauthorized: "/",
    });

    const [report, setReport] = React.useState<SystemHealthReport | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [keyword, setKeyword] = React.useState("");
    const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");

    const loadReport = React.useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await systemHealthService.getReport();
            setReport(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "โหลดรายงานสุขภาพระบบไม่สำเร็จ");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    React.useEffect(() => {
        void loadReport(false);
        const timer = window.setInterval(() => {
            void loadReport(true);
        }, 30_000);

        return () => {
            window.clearInterval(timer);
        };
    }, [loadReport]);

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized || user?.role !== "Admin") {
        return <AccessGuardFallback message="หน้านี้สำหรับผู้ดูแลระบบเท่านั้น" tone="danger" />;
    }

    const readiness = filterChecks(report?.readiness || [], keyword, levelFilter);
    const security = filterChecks(report?.security || [], keyword, levelFilter);
    const jobs = filterChecks(report?.jobs || [], keyword, levelFilter);

    const totalChecks = (report?.readiness.length || 0) + (report?.security.length || 0) + (report?.jobs.length || 0);
    const readyChecks = [...(report?.readiness || []), ...(report?.security || []), ...(report?.jobs || [])].filter(
        (item) => item.level === "ok"
    ).length;
    const warningChecks = [...(report?.readiness || []), ...(report?.security || []), ...(report?.jobs || [])].filter(
        (item) => item.level === "warn"
    ).length;
    const errorChecks = [...(report?.readiness || []), ...(report?.security || []), ...(report?.jobs || [])].filter(
        (item) => item.level === "error"
    ).length;

    if (loading && !report) {
        return (
            <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f4f7fb 0%, #eef3f9 100%)" }}>
                <UIPageHeader
                    title="Health System"
                    subtitle="ศูนย์ตรวจสอบความพร้อมระบบ (Admin)"
                    icon={<SafetyCertificateOutlined />}
                    onBack={() => router.push("/")}
                />
                <PageContainer>
                    <PageSection>
                        <Flex vertical align="center" justify="center" style={{ minHeight: 360 }} gap={12}>
                            <Spin />
                            <Text type="secondary">กำลังโหลดข้อมูลสุขภาพระบบ...</Text>
                        </Flex>
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    if (!report) {
        return (
            <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f4f7fb 0%, #eef3f9 100%)" }}>
                <UIPageHeader
                    title="Health System"
                    subtitle="ศูนย์ตรวจสอบความพร้อมระบบ (Admin)"
                    icon={<SafetyCertificateOutlined />}
                    onBack={() => router.push("/")}
                    actions={
                        <Button icon={<ReloadOutlined />} onClick={() => void loadReport(false)}>
                            โหลดใหม่
                        </Button>
                    }
                />
                <PageContainer>
                    <PageSection>
                        <Empty description={error || "ไม่พบข้อมูล Health Report"} />
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    const overallMeta = LEVEL_META[report.overallLevel];
    const perfMeta = LEVEL_META[report.performance.level];

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f4f7fb 0%, #eef3f9 100%)" }}>
            <UIPageHeader
                title="Health System"
                subtitle="ภาพรวมความพร้อมของระบบแบบเรียลไทม์ (อัปเดตทุก 30 วินาที)"
                icon={<SafetyCertificateOutlined />}
                onBack={() => router.push("/")}
                actions={
                    <Space size={8}>
                        <Tag color={overallMeta.color} icon={overallMeta.icon} style={{ borderRadius: 999, fontWeight: 700 }}>
                            Overall {overallMeta.label}
                        </Tag>
                        <Button
                            icon={<ReloadOutlined spin={refreshing} />}
                            onClick={() => void loadReport(true)}
                            loading={refreshing}
                        >
                            รีเฟรช
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    {error ? <Alert type="error" showIcon message={error} /> : null}
                    {report.warnings.length > 0 ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="รายการที่ควรติดตาม"
                            description={
                                <Space direction="vertical" size={2}>
                                    {report.warnings.map((warning) => (
                                        <Text key={warning}>{warning}</Text>
                                    ))}
                                </Space>
                            }
                        />
                    ) : null}

                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12} xl={6}>
                            <Card style={{ borderRadius: 16 }}>
                                <Statistic title="สถานะรวม" value={overallMeta.label} prefix={overallMeta.icon} valueStyle={{ color: "#0f172a" }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} xl={6}>
                            <Card style={{ borderRadius: 16 }}>
                                <Statistic title="Uptime" value={formatUptime(report.uptimeSeconds)} prefix={<ClockCircleOutlined />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} xl={6}>
                            <Card style={{ borderRadius: 16 }}>
                                <Statistic title="Environment" value={String(report.environment.nodeEnv || "-").toUpperCase()} prefix={<ApiOutlined />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} xl={6}>
                            <Card style={{ borderRadius: 16 }}>
                                <Statistic title="ตรวจล่าสุด" value={formatDateTime(report.checkedAt)} />
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        style={{ borderRadius: 18, border: "1px solid #e2e8f0" }}
                        bodyStyle={{ padding: 16 }}
                    >
                        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                            <Space direction="vertical" size={2}>
                                <Title level={5} style={{ margin: 0 }}>ภาพรวมการตรวจทั้งหมด</Title>
                                <Text type="secondary">
                                    ตรวจสอบระบบหลัก ความปลอดภัย งานอัตโนมัติ และประสิทธิภาพในหน้าจอเดียว
                                </Text>
                            </Space>
                            <Space size={8} wrap>
                                <Tag color="success" style={{ borderRadius: 999, margin: 0 }}>Ready {readyChecks}</Tag>
                                <Tag color="warning" style={{ borderRadius: 999, margin: 0 }}>Warning {warningChecks}</Tag>
                                <Tag color="error" style={{ borderRadius: 999, margin: 0 }}>Error {errorChecks}</Tag>
                                <Tag style={{ borderRadius: 999, margin: 0 }}>Total {totalChecks}</Tag>
                            </Space>
                        </Flex>

                        <Row gutter={[10, 10]} style={{ marginTop: 14 }}>
                            <Col xs={24} md={15}>
                                <Input.Search
                                    allowClear
                                    placeholder="ค้นหาเช่น database, redis, csrf, retention, socket"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                />
                            </Col>
                            <Col xs={24} md={9}>
                                <Segmented<LevelFilter>
                                    block
                                    value={levelFilter}
                                    onChange={(value) => setLevelFilter(value)}
                                    options={[
                                        { label: "ทั้งหมด", value: "all" },
                                        { label: "Ready", value: "ok" },
                                        { label: "Warning", value: "warn" },
                                        { label: "Error", value: "error" },
                                    ]}
                                />
                            </Col>
                        </Row>
                    </Card>

                    <PageSection title="ความพร้อมระบบหลัก" extra={<Tag color="processing" icon={<DatabaseOutlined />}>Readiness</Tag>}>
                        <Row gutter={[12, 12]}>
                            {readiness.length > 0 ? (
                                readiness.map((item) => (
                                    <Col xs={24} md={12} xl={8} key={item.key}>
                                        <CheckCard item={item} />
                                    </Col>
                                ))
                            ) : (
                                <Col span={24}>
                                    <Card style={{ borderRadius: 14 }}>
                                        <Empty description="ไม่พบรายการตามตัวกรอง" />
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    </PageSection>

                    <PageSection title="ความปลอดภัย" extra={<Tag color="gold" icon={<LockOutlined />}>Security</Tag>}>
                        <Row gutter={[12, 12]}>
                            {security.length > 0 ? (
                                security.map((item) => (
                                    <Col xs={24} md={12} xl={8} key={item.key}>
                                        <CheckCard item={item} />
                                    </Col>
                                ))
                            ) : (
                                <Col span={24}>
                                    <Card style={{ borderRadius: 14 }}>
                                        <Empty description="ไม่พบรายการตามตัวกรอง" />
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    </PageSection>

                    <PageSection title="งานอัตโนมัติ (Cron / Scheduler)" extra={<Tag color="purple" icon={<RadarChartOutlined />}>Jobs</Tag>}>
                        <Row gutter={[12, 12]}>
                            {jobs.length > 0 ? (
                                jobs.map((item) => (
                                    <Col xs={24} md={12} xl={8} key={item.key}>
                                        <CheckCard item={item} />
                                    </Col>
                                ))
                            ) : (
                                <Col span={24}>
                                    <Card style={{ borderRadius: 14 }}>
                                        <Empty description="ไม่พบรายการตามตัวกรอง" />
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    </PageSection>

                    <PageSection title="ประสิทธิภาพและดัชนีฐานข้อมูล" extra={<Tag color={perfMeta.color} icon={<ThunderboltOutlined />}>Performance {perfMeta.label}</Tag>}>
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Alert
                                type={perfMeta.color === "error" ? "error" : perfMeta.color === "warning" ? "warning" : "success"}
                                showIcon
                                message={report.performance.summary}
                            />

                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12} xl={6}>
                                    <Card style={{ borderRadius: 14 }}>
                                        <Statistic title="Average (ms)" value={report.performance.averageResponseMs} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} xl={6}>
                                    <Card style={{ borderRadius: 14 }}>
                                        <Statistic title="P95 (ms)" value={report.performance.p95ResponseMs} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} xl={6}>
                                    <Card style={{ borderRadius: 14 }}>
                                        <Statistic title="P99 (ms)" value={report.performance.p99ResponseMs} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} xl={6}>
                                    <Card style={{ borderRadius: 14 }}>
                                        <Statistic title="Sample Size" value={report.performance.sampleSize} />
                                    </Card>
                                </Col>
                            </Row>

                            <Row gutter={[12, 12]}>
                                {report.performance.indexChecks.map((indexItem) => (
                                    <Col xs={24} md={12} key={`${indexItem.table}-${indexItem.columns.join("-")}`}>
                                        <Card
                                            style={{
                                                borderRadius: 14,
                                                borderColor: indexItem.matched ? "#b7eb8f" : "#ffd591",
                                            }}
                                            bodyStyle={{ padding: 14 }}
                                        >
                                            <Flex justify="space-between" align="center" gap={10}>
                                                <Text strong>{indexItem.table}</Text>
                                                <Tag color={indexItem.matched ? "success" : "warning"} style={{ borderRadius: 999, margin: 0 }}>
                                                    {indexItem.matched ? "Ready" : "Review"}
                                                </Tag>
                                            </Flex>
                                            <Text type="secondary">Columns: {indexItem.columns.join(", ")}</Text>
                                            <br />
                                            <Text type="secondary">{indexItem.reason}</Text>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Space>
                    </PageSection>

                    <PageSection title="การเชื่อมต่อ Frontend ↔ Backend" extra={<Tag color="blue" icon={<ApiOutlined />}>Integration</Tag>}>
                        <Row gutter={[12, 12]}>
                            <Col xs={24} xl={12}>
                                <Card style={{ borderRadius: 14 }} bodyStyle={{ padding: 14 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Flex justify="space-between" align="center">
                                            <Text type="secondary">Frontend Proxy Prefix</Text>
                                            <Text code>{report.integration.frontendProxyPrefix}</Text>
                                        </Flex>
                                        <Flex justify="space-between" align="center">
                                            <Text type="secondary">Backend API Prefix</Text>
                                            <Text code>{report.integration.backendApiPrefix || "/api"}</Text>
                                        </Flex>
                                        <Flex justify="space-between" align="center">
                                            <Text type="secondary">Health Endpoint</Text>
                                            <Text code>{report.integration.healthEndpoint || "/system/health"}</Text>
                                        </Flex>
                                        <Flex justify="space-between" align="center">
                                            <Text type="secondary">CORS Credentials</Text>
                                            <Tag color={report.integration.corsCredentialsEnabled ? "success" : "error"} style={{ margin: 0 }}>
                                                {report.integration.corsCredentialsEnabled ? "Enabled" : "Disabled"}
                                            </Tag>
                                        </Flex>
                                        <Flex justify="space-between" align="center">
                                            <Text type="secondary">Auth Mode</Text>
                                            <Tag color="processing" style={{ margin: 0 }}>
                                                {report.integration.authMode || "JWT + Cookie"}
                                            </Tag>
                                        </Flex>
                                    </Space>
                                </Card>
                            </Col>

                            <Col xs={24} xl={12}>
                                <Card style={{ borderRadius: 14 }} bodyStyle={{ padding: 14 }}>
                                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                        <div>
                                            <Text strong>Frontend Origins ที่อนุญาต</Text>
                                            <div style={{ marginTop: 8 }}>
                                                <Space size={[6, 6]} wrap>
                                                    {report.integration.allowedFrontendOrigins.length > 0 ? (
                                                        report.integration.allowedFrontendOrigins.map((origin) => (
                                                            <Tag key={origin} style={{ borderRadius: 999 }}>{origin}</Tag>
                                                        ))
                                                    ) : (
                                                        <Text type="secondary">ไม่พบข้อมูล</Text>
                                                    )}
                                                </Space>
                                            </div>
                                        </div>

                                        <div>
                                            <Text strong>Frontend Path ที่อนุญาตให้เรียก Backend</Text>
                                            <div style={{ marginTop: 8 }}>
                                                <Space size={[6, 6]} wrap>
                                                    {(report.integration.allowedProxyPaths || []).length > 0 ? (
                                                        (report.integration.allowedProxyPaths || []).map((path) => (
                                                            <Tag key={path} color="blue" style={{ borderRadius: 999 }}>{path}</Tag>
                                                        ))
                                                    ) : (
                                                        <Text type="secondary">ไม่พบข้อมูล</Text>
                                                    )}
                                                </Space>
                                            </div>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </PageSection>
                </Space>
            </PageContainer>
        </div>
    );
}
