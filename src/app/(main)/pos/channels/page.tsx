"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Spin } from "antd";
import { ShopOutlined, ShoppingOutlined, RocketOutlined, LoadingOutlined } from "@ant-design/icons";
import { 
  channelPageStyles, 
  channelColors, 
  ChannelStyles 
} from "./style";
import { 
  useChannelStats,
  formatOrderCount, 
  ChannelStats 
} from "../../../../utils/channels/channelStats.utils";

const { Title, Text } = Typography;

export default function ChannelSelectionPage() {
  const router = useRouter();
  // Use the new hook for real-time stats (WebSocket driven)
  const { stats, isLoading: loading } = useChannelStats();

  const channels = [
    {
      id: 'dine-in',
      title: 'ทานที่ร้าน',
      subtitle: 'Dine In',
      icon: ShopOutlined,
      colors: channelColors.dineIn,
      path: '/pos/channels/dine-in',
      count: stats?.dineIn ?? 0,
    },
    {
      id: 'takeaway',
      title: 'สั่งกลับบ้าน',
      subtitle: 'Take Away',
      icon: ShoppingOutlined,
      colors: channelColors.takeaway,
      path: '/pos/channels/takeaway',
      count: stats?.takeaway ?? 0,
    },
    {
      id: 'delivery',
      title: 'เดลิเวอรี่',
      subtitle: 'Delivery',
      icon: RocketOutlined,
      colors: channelColors.delivery,
      path: '/pos/channels/delivery',
      count: stats?.delivery ?? 0,
    },
  ];

  return (
    <>
      <ChannelStyles />
      <div style={channelPageStyles.container}>
        {/* Header Section */}
        <div style={channelPageStyles.header} className="channels-header-mobile">
          <div className="header-pattern"></div>
          <div className="header-circle circle-1"></div>
          <div className="header-circle circle-2"></div>
          
          <div style={channelPageStyles.headerContent}>
            <div className="header-icon-animate">
              <ShopOutlined style={channelPageStyles.headerIcon} className="channels-header-icon-mobile" />
            </div>
            <Title level={1} style={channelPageStyles.headerTitle} className="channels-header-title-mobile">
              เลือกช่องทางการขาย
            </Title>
            <Text style={channelPageStyles.headerSubtitle} className="channels-header-subtitle-mobile">
              Select Sales Channel
            </Text>
          </div>
        </div>

        {/* Channel Cards */}
        <div style={channelPageStyles.cardsContainer} className="channels-cards-container-mobile">
          <Row gutter={[24, 24]} justify="center">
            {channels.map((channel, index) => {
              const Icon = channel.icon;
              const hasOrders = channel.count > 0;
              
              return (
                <Col xs={24} sm={12} md={8} key={channel.id}>
                  <div
                    className={`channel-card-hover fade-in-up card-delay-${index + 1}`}
                    style={channelPageStyles.channelCard}
                    onClick={() => router.push(channel.path)}
                  >
                    <div style={channelPageStyles.cardInner} className="channels-card-inner-mobile">
                      <div 
                        className="icon-wrapper channels-icon-wrapper-mobile"
                        style={{
                          ...channelPageStyles.iconWrapper,
                          background: channel.colors.light,
                          border: `2px solid ${channel.colors.border}`,
                        }}
                      >
                        <div 
                          className="decorative-glow"
                          style={{
                            ...channelPageStyles.decorativeGlow,
                            background: channel.colors.gradient,
                          }}
                        />
                        <Icon 
                          className="channels-channel-icon-mobile"
                          style={{
                            ...channelPageStyles.channelIcon,
                            color: channel.colors.primary,
                          }} 
                        />
                      </div>
                      
                      <Title level={2} style={channelPageStyles.cardTitle} className="channels-card-title-mobile">
                        {channel.title}
                      </Title>
                      <Text style={channelPageStyles.cardSubtitle} className="channels-card-subtitle-mobile">
                        {channel.subtitle}
                      </Text>

                      {/* Statistics Badge */}
                      {loading ? (
                        <div style={channelPageStyles.loadingSkeleton} />
                      ) : (
                        <div
                          className="channels-stats-badge-mobile"
                          style={{
                            ...channelPageStyles.statsBadge,
                            background: hasOrders ? channel.colors.light : '#fafafa',
                            color: hasOrders ? channel.colors.primary : '#8c8c8c',
                            border: `1px solid ${hasOrders ? channel.colors.border : '#f0f0f0'}`,
                          }}
                        >
                          {hasOrders && (
                            <span
                              className="pulse-animation"
                              style={{
                                ...channelPageStyles.activeIndicator,
                                background: channel.colors.primary,
                              }}
                            />
                          )}
                          <span>{formatOrderCount(channel.count)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>
    </>
  );
}
