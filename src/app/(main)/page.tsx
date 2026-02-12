"use client";

import React from "react";
import { Typography } from "antd";
import { 
    AppstoreOutlined, 
    ShopOutlined, 
    SettingOutlined, 
    BranchesOutlined,
    SafetyCertificateOutlined 
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useEffectivePermissions } from "../../hooks/useEffectivePermissions";
import { pageStyles, DashboardStyles } from "./style";
import PageContainer from "../../components/ui/page/PageContainer";
import PageSection from "../../components/ui/page/PageSection";

const { Title, Text } = Typography;

export default function LandingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { can, canAny } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canAccessPos = canAny([
        { resourceKey: "orders.page", action: "view" },
        { resourceKey: "products.page", action: "view" },
        { resourceKey: "reports.sales.page", action: "view" },
    ]);
    const canAccessStock = canAny([
        { resourceKey: "stock.orders.page", action: "view" },
        { resourceKey: "stock.ingredients.page", action: "view" },
        { resourceKey: "stock.ingredients_unit.page", action: "view" },
    ]);

    const modules = [
        {
            title: "ระบบขาย (POS)",
            icon: ShopOutlined,
            iconColor: "#f59e0b",
            path: "/pos",
            enabled: canAccessPos,
        },
        {
            title: "จัดการสต๊อก",
            icon: AppstoreOutlined,
            iconColor: "#3b82f6",
            path: "/stock",
            enabled: canAccessStock,
        },
        {
            title: "ตั้งค่าและสิทธิ์ผู้ใช้",
            icon: SettingOutlined,
            iconColor: "#10b981",
            path: "/users",
            enabled: can("users.page", "view"),
        },
        {
            title: "จัดการสาขา",
            icon: BranchesOutlined,
            iconColor: "#8b5cf6",
            path: "/branch",
            enabled: can("branches.page", "view"),
        },
        {
            title: "Audit Logs",
            icon: SafetyCertificateOutlined,
            iconColor: "#ef4444",
            path: "/audit",
            enabled: can("audit.page", "view"),
        },
    ].filter((module) => module.enabled);

    const handleModuleClick = (module: typeof modules[0]) => {
        if (module.enabled && module.path) {
            router.push(module.path);
        }
    };

    return (
        <>
            <DashboardStyles />
            <PageContainer>
                <PageSection>
                    <div style={pageStyles.container}>
                        {/* Hero Section */}
                        <div style={pageStyles.heroSection} className="landing-hero-section">
                            <div className="hero-pattern" />
                            <div className="decorative-circle circle-1" />
                            <div className="decorative-circle circle-2" />
                            
                            <div style={pageStyles.heroContent}>
                                <Title 
                                    level={1} 
                                    style={pageStyles.heroTitle}
                                    className="landing-hero-title"
                                >
                                    Point of Sale
                                </Title>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div style={pageStyles.contentWrapper} className="landing-content-wrapper">
                            <div 
                                style={pageStyles.modulesGrid}
                                className="landing-modules-grid"
                            >
                                {modules.map((module, index) => {
                                    const IconComponent = module.icon;
                                    return (
                                        <div
                                            key={index}
                                            className={`module-card-hover animate-card animate-card-delay-${(index % 4) + 1}`}
                                            style={{
                                                ...pageStyles.moduleCard,
                                                ...(module.enabled ? {} : pageStyles.moduleCardDisabled),
                                            }}
                                            onClick={() => handleModuleClick(module)}
                                        >
                                            <div 
                                                style={pageStyles.moduleIconWrapper}
                                                className="module-icon-wrapper landing-module-icon"
                                            >
                                                <IconComponent 
                                                    style={{ 
                                                        fontSize: 36, 
                                                        color: module.iconColor 
                                                    }} 
                                                />
                                            </div>
                                            
                                            <Title 
                                                level={4} 
                                                style={pageStyles.moduleTitle}
                                                className="landing-module-title"
                                            >
                                                {module.title}
                                            </Title>
                                            
                                            <Text 
                                                style={pageStyles.moduleDescription}
                                                className="landing-module-description"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </PageSection>
            </PageContainer>
        </>
    );
}
