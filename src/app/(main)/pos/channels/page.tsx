"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col } from "antd";
import { ShopOutlined, ShoppingOutlined, RocketOutlined } from "@ant-design/icons";
import { channelColors } from "../../../../theme/pos";
import { channelsStyles, channelsResponsiveStyles } from "../../../../theme/pos/channels/style";
import { POSGlobalStyles } from "../../../../theme/pos/GlobalStyles";
import { 
  useChannelStats,
  formatOrderCount
} from "../../../../utils/channels/channelStats.utils";
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { usePOSPrefetching } from "../../../../hooks/pos/usePrefetching";

const { Title, Text } = Typography;

export default function ChannelSelectionPage() {
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();
  // Use the new hook for real-time stats (WebSocket driven)
  const { stats, isLoading: statsLoading } = useChannelStats();
  
  // Prefetch POS data (products, categories)
  usePOSPrefetching();

  useEffect(() => {
    router.prefetch("/pos/channels/dine-in");
    router.prefetch("/pos/channels/takeaway");
    router.prefetch("/pos/channels/delivery");
  }, [router]);

  React.useEffect(() => {
    if (statsLoading) {
      showLoading();
    } else {
      hideLoading();
    }
  }, [statsLoading, showLoading, hideLoading]);

  const channels = [
    {
      id: 'dine-in',
      title: 'หน้าร้าน',
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
      <POSGlobalStyles />
      <style jsx global>{channelsResponsiveStyles}</style>
      <div style={channelsStyles.channelsContainer}>
        {/* Header Section */}
        <div style={channelsStyles.channelsHeader} className="channels-header-mobile">
          <div className="header-pattern"></div>
          <div className="header-circle circle-1"></div>
          <div className="header-circle circle-2"></div>
          
          <div style={channelsStyles.channelsHeaderContent}>
            <div className="header-icon-animate">
              <ShopOutlined style={channelsStyles.channelsHeaderIcon} className="channels-header-icon-mobile" />
            </div>
            <Title level={1} style={channelsStyles.channelsHeaderTitle} className="channels-header-title-mobile">
              เลือกช่องทางขาย
            </Title>
            <Text style={channelsStyles.channelsHeaderSubtitle} className="channels-header-subtitle-mobile">
              Select Sales Channel
            </Text>
          </div>
        </div>

        {/* Channel Cards */}
        <div style={channelsStyles.channelsCardsContainer} className="channels-cards-container-mobile">
          <Row gutter={[24, 24]} justify="center">
            {channels.map((channel, index) => {
              const Icon = channel.icon;
              const hasOrders = channel.count > 0;
              
              return (
                <Col xs={24} sm={12} md={8} key={channel.id}>
                  <div
                    className={`channel-card-hover fade-in-up card-delay-${index + 1}`}
                    style={channelsStyles.channelCard}
                    onClick={() => router.push(channel.path)}
                  >
                    <div style={channelsStyles.channelCardInner} className="channels-card-inner-mobile">
                      <div 
                        className="icon-wrapper channels-icon-wrapper-mobile"
                        style={{
                          ...channelsStyles.channelIconWrapper,
                          background: channel.colors.light,
                          border: `2px solid ${channel.colors.border}`,
                        }}
                      >
                        <div 
                          className="decorative-glow"
                          style={{
                            ...channelsStyles.channelDecorativeGlow,
                            background: channel.colors.gradient,
                          }}
                        />
                        <Icon 
                          className="channels-channel-icon-mobile"
                          style={{
                            ...channelsStyles.channelIcon,
                            color: channel.colors.primary,
                          }} 
                        />
                      </div>
                      
                      <Title level={2} style={channelsStyles.channelCardTitle} className="channels-card-title-mobile">
                        {channel.title}
                      </Title>
                      <Text style={channelsStyles.channelCardSubtitle} className="channels-card-subtitle-mobile">
                        {channel.subtitle}
                      </Text>

                      {/* Statistics Badge */}
                      <div
                        className="channels-stats-badge-mobile"
                        style={{
                          ...channelsStyles.channelStatsBadge,
                          background: hasOrders ? channel.colors.light : '#fafafa',
                          color: hasOrders ? channel.colors.primary : '#8c8c8c',
                          border: `1px solid ${hasOrders ? channel.colors.border : '#f0f0f0'}`,
                        }}
                      >
                        {hasOrders && (
                          <span
                            className="pulse-animation"
                            style={{
                              ...channelsStyles.channelActiveIndicator,
                              background: channel.colors.primary,
                            }}
                          />
                        )}
                        <span>{formatOrderCount(channel.count)}</span>
                      </div>
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
