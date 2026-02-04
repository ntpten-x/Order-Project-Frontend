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
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";

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
      description: 'รับออเดอร์ลูกค้าที่มานั่งทานที่ร้าน',
      icon: ShopOutlined,
      colors: channelColors.dineIn,
      path: '/pos/channels/dine-in',
      count: stats?.dineIn ?? 0,
    },
    {
      id: 'takeaway',
      title: 'สั่งกลับบ้าน',
      subtitle: 'Take Away',
      description: 'รับออเดอร์ลูกค้าที่สั่งกลับบ้าน',
      icon: ShoppingOutlined,
      colors: channelColors.takeaway,
      path: '/pos/channels/takeaway',
      count: stats?.takeaway ?? 0,
    },
    {
      id: 'delivery',
      title: 'เดลิเวอรี่',
      subtitle: 'Delivery',
      description: 'รับออเดอร์จัดส่งถึงบ้านลูกค้า',
      icon: RocketOutlined,
      colors: channelColors.delivery,
      path: '/pos/channels/delivery',
      count: stats?.delivery ?? 0,
    },
  ];

  const handleChannelClick = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <UIPageHeader title="ช่องทางขาย" subtitle="เลือกช่องทางขาย" />
      <PageContainer>
        <PageSection>
      <POSGlobalStyles />
      <style jsx global>{channelsResponsiveStyles}</style>
      <div style={channelsStyles.channelsContainer}>
        {/* Channel Cards - Main content */}
        <main 
          style={channelsStyles.channelsCardsContainer} 
          className="channels-cards-container-mobile"
          role="main"
        >
          <Row gutter={[20, 20]} justify="center">
            {channels.map((channel, index) => {
              const Icon = channel.icon;
              const hasOrders = channel.count > 0;
              
              return (
                <Col xs={24} sm={24} md={12} lg={8} key={channel.id}>
                  <article
                    className={`channel-card-hover fade-in-up card-delay-${index + 1}`}
                    style={channelsStyles.channelCard}
                    onClick={() => handleChannelClick(channel.path)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleChannelClick(channel.path);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${channel.title} - ${channel.subtitle}. ${hasOrders ? `${channel.count} ออเดอร์กำลังดำเนินการ` : 'ไม่มีออเดอร์'}`}
                  >
                    <div style={channelsStyles.channelCardInner} className="channels-card-inner-mobile">
                      {/* Icon with glow effect */}
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
                          aria-hidden="true"
                        />
                      </div>
                      
                      {/* Channel Title & Subtitle */}
                      <Title 
                        level={2} 
                        style={channelsStyles.channelCardTitle} 
                        className="channels-card-title-mobile"
                      >
                        {channel.title}
                      </Title>
                      <Text 
                        style={channelsStyles.channelCardSubtitle} 
                        className="channels-card-subtitle-mobile"
                      >
                        {channel.subtitle}
                      </Text>

                      {/* Statistics Badge - Clear order count display */}
                      <div
                        className="channels-stats-badge-mobile"
                        style={{
                          ...channelsStyles.channelStatsBadge,
                          background: hasOrders ? channel.colors.light : '#F8FAFC',
                          color: hasOrders ? channel.colors.primary : '#94A3B8',
                          border: `1.5px solid ${hasOrders ? channel.colors.border : '#E2E8F0'}`,
                        }}
                        aria-live="polite"
                      >
                        {hasOrders && (
                          <span
                            className="pulse-animation"
                            style={{
                              ...channelsStyles.channelActiveIndicator,
                              background: channel.colors.primary,
                              boxShadow: `0 0 0 2px ${channel.colors.light}`,
                            }}
                            aria-hidden="true"
                          />
                        )}
                        <span style={{ fontWeight: 600 }}>
                          {formatOrderCount(channel.count)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Col>
              );
            })}
          </Row>
        </main>
      </div>
        </PageSection>
      </PageContainer>
    </>
  );
}
