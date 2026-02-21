"use client";

import React from "react";
import { Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { posLayoutStyles } from "./style";

const { Title, Text } = Typography;

type POSHeaderBarProps = {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  onBack: () => void;
};

export function POSHeaderBar({ title, subtitle, icon, onBack }: POSHeaderBarProps) {
  return (
    <header style={posLayoutStyles.header} className="pos-header-mobile" role="banner">
      <div style={posLayoutStyles.headerContent}>
        <div style={posLayoutStyles.headerLeft}>
          <button
            className="pos-header-back"
            style={posLayoutStyles.headerBackButton}
            onClick={onBack}
            aria-label="กลับ"
          >
            <ArrowLeftOutlined style={{ fontSize: 18 }} />
          </button>

          <div style={posLayoutStyles.headerIconWrapper}>{icon}</div>

          <div style={posLayoutStyles.headerInfo}>
            <Title level={4} style={posLayoutStyles.headerTitle} className="pos-header-title-mobile">
              {title}
            </Title>
            <Text style={posLayoutStyles.headerSubtitle} className="pos-header-subtitle-mobile">
              {subtitle}
            </Text>
          </div>
        </div>
      </div>
    </header>
  );
}
