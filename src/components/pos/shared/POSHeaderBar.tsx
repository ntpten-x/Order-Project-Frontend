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
  onBack?: () => void;
  subtitlePosition?: 'below' | 'aside';
};

export function POSHeaderBar({ 
  title, 
  subtitle, 
  icon, 
  onBack,
  subtitlePosition = 'below'
}: POSHeaderBarProps) {
  const isAside = subtitlePosition === 'aside';

  return (
    <header style={posLayoutStyles.header} className="pos-header-mobile" role="banner">
      <div style={posLayoutStyles.headerContent}>
        <div style={{ ...posLayoutStyles.headerLeft, width: isAside ? '100%' : 'auto' }}>
          {onBack && (
            <button
              className="pos-header-back"
              style={posLayoutStyles.headerBackButton}
              onClick={onBack}
              aria-label="กลับ"
            >
              <ArrowLeftOutlined style={{ fontSize: 18 }} />
            </button>
          )}

          <div style={posLayoutStyles.headerIconWrapper}>{icon}</div>

          <div 
            style={{ 
              ...posLayoutStyles.headerInfo,
              ...(isAside ? {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                overflow: 'hidden'
              } : {})
            }}
          >
            <Title 
              level={4} 
              style={{ 
                ...posLayoutStyles.headerTitle, 
                marginBottom: 0,
                flexShrink: 1,
                minWidth: 0
              }} 
              className="pos-header-title-mobile"
            >
              {title}
            </Title>
            <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
              {typeof subtitle === 'string' ? (
                <Text 
                  style={{ 
                    ...posLayoutStyles.headerSubtitle, 
                    marginTop: isAside ? 0 : 4,
                    textAlign: isAside ? 'right' : 'left'
                  }} 
                  className="pos-header-subtitle-mobile"
                >
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
