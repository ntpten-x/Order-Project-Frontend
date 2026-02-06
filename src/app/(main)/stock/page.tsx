"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "../../../lib/axios";
import { 
  List,
  Badge,
  Card,
  Skeleton,
  message,
  Button
} from "antd";
import { ShoppingOutlined, ReloadOutlined } from "@ant-design/icons";
import IngredientCard from "../../../components/stock/IngredientCard";
import CartDrawer from "../../../components/stock/CartDrawer";
import { Ingredients } from "../../../types/api/stock/ingredients";
import { useSocket } from "../../../hooks/useSocket";
import { DashboardStyles, pageStyles } from "./style";
import { RealtimeEvents } from "../../../utils/realtimeEvents";
import PageContainer from "../../../components/ui/page/PageContainer";
import PageSection from "../../../components/ui/page/PageSection";
import PageStack from "../../../components/ui/page/PageStack";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../components/ui/states/EmptyState";


export default function HomePage() {
  const [ingredients, setIngredients] = useState<Ingredients[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/stock/ingredients?active=true");
      const data = response.data;
      setIngredients(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error: unknown) {
      console.error("Error fetching ingredients:", error);
      setError("ไม่สามารถโหลดรายการวัตถุดิบได้");
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  useEffect(() => {
    if (!socket) return;

    const onIngredientCreate = (newItem: Ingredients) => {
      if (newItem.is_active) {
        setIngredients((prev) => [newItem, ...prev]);
        message.info(`มีวัตถุดิบใหม่: ${newItem.display_name}`);
      }
    };

    const onIngredientUpdate = (updatedItem: Ingredients) => {
      setIngredients((prev) => {
        const exists = prev.find(item => item.id === updatedItem.id);
        
        if (updatedItem.is_active) {
          if (exists) {
            return prev.map(item => item.id === updatedItem.id ? updatedItem : item);
          } else {
            return [updatedItem, ...prev];
          }
        } else {
          return prev.filter(item => item.id !== updatedItem.id);
        }
      });
    };

    const onIngredientDelete = ({ id }: { id: string }) => {
      setIngredients((prev) => prev.filter((item) => item.id !== id));
    };

    socket.on(RealtimeEvents.ingredients.create, onIngredientCreate);
    socket.on(RealtimeEvents.ingredients.update, onIngredientUpdate);
    socket.on(RealtimeEvents.ingredients.delete, onIngredientDelete);

    return () => {
      socket.off(RealtimeEvents.ingredients.create, onIngredientCreate);
      socket.off(RealtimeEvents.ingredients.update, onIngredientUpdate);
      socket.off(RealtimeEvents.ingredients.delete, onIngredientDelete);
    };
  }, [socket]);

  const SkeletonCard = () => (
    <Card 
      style={{ 
        borderRadius: 16, 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: 'none',
      }}
    >
      <Skeleton.Image active style={{ width: '100%', height: 180 }} />
      <div style={{ padding: '16px 0' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    </Card>
  );

  return (
    <div style={pageStyles.container}>
      <DashboardStyles />

      <UIPageHeader
        title="เลือกซื้อวัตถุดิบ"
        subtitle={`${ingredients.length} รายการ`}
        icon={<ShoppingOutlined />}
        actions={
          <Button icon={<ReloadOutlined />} onClick={fetchIngredients} loading={loading}>
            รีเฟรช
          </Button>
        }
      />

      <PageContainer>
        <PageStack>
          <PageSection
            title="รายการวัตถุดิบ"
            extra={
              <Badge 
                count={loading ? 0 : ingredients.length} 
                style={{ backgroundColor: '#6366f1' }}
                overflowCount={999}
              />
            }
          >
            {loading ? (
              <List
                grid={pageStyles.gridConfig}
                dataSource={[1, 2, 3, 4, 5, 6]}
                renderItem={() => (
                  <List.Item>
                    <SkeletonCard />
                  </List.Item>
                )}
              />
            ) : error ? (
              <UIEmptyState
                title="เกิดข้อผิดพลาด"
                description={error}
                action={
                  <Button type="primary" icon={<ReloadOutlined />} onClick={fetchIngredients}>
                    ลองใหม่อีกครั้ง
                  </Button>
                }
              />
            ) : ingredients.length === 0 ? (
              <UIEmptyState
                title="ยังไม่มีวัตถุดิบ"
                description="ยังไม่มีวัตถุดิบที่พร้อมให้สั่งซื้อในขณะนี้"
              />
            ) : (
              <List
                grid={pageStyles.gridConfig}
                dataSource={Array.isArray(ingredients) ? ingredients : []}
                renderItem={(item, index) => (
                  <List.Item 
                    className="animate-card"
                    style={{ animationDelay: `${index * 50}ms`, marginBottom: 24 }}
                  >
                    <IngredientCard ingredient={item}/>
                  </List.Item>
                )}
              />
            )}
          </PageSection>
        </PageStack>
      </PageContainer>
      <CartDrawer />
    </div>
  );
}
