"use client";

import React from "react";
import { Typography } from "antd";
import { 
    AppstoreOutlined, 
    ShopOutlined, 
    SettingOutlined, 
    BranchesOutlined 
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { pageStyles, DashboardStyles } from "./style";
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";

const { Title, Text } = Typography;

export default function LandingPage() {
    const router = useRouter();

    const modules = [
        {
            title: "ระบบขาย (POS)",
            icon: ShopOutlined,
            iconColor: "#f59e0b",
            path: "/pos",
            enabled: true,
        },
        {
            title: "จัดการสต๊อก",
            icon: AppstoreOutlined,
            iconColor: "#3b82f6",
            path: "/stock",
            enabled: true,
        },
        {
            title: "ตั้งค่าและสิทธิ์ผู้ใช้",
            icon: SettingOutlined,
            iconColor: "#10b981",
            path: "/users",
            enabled: true,
        },
        {
            title: "จัดการสาขา",
            icon: BranchesOutlined,
            iconColor: "#8b5cf6",
            path: "/branch",
            enabled: true,
        },
    ];

    const handleModuleClick = (module: typeof modules[0]) => {
        if (module.enabled && module.path) {
            router.push(module.path);
        }
    };

    return (
        <>
            <DashboardStyles />
            <UIPageHeader title="หน้าหลัก" subtitle="เลือกเมนูที่ต้องการ" />
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
