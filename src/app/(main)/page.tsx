"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Layout, 
  Typography, 
  Result,
  List,
  Badge,
  Card,
  Skeleton,
  Space,
  message
} from "antd";
import { ShoppingOutlined, ReloadOutlined } from "@ant-design/icons";
import IngredientCard from "../../components/IngredientCard";
import CartDrawer from "../../components/CartDrawer";
import { Ingredients } from "../../types/api/ingredients";
import { useSocket } from "../../hooks/useSocket";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function HomePage() {
  const [ingredients, setIngredients] = useState<Ingredients[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/ingredients/getAll");
        const allIngredients: Ingredients[] = response.data;
        // Filter active ingredients
        const activeIngredients = allIngredients.filter(item => item.is_active);
        setIngredients(activeIngredients);
        setError(null);
      } catch (error: unknown) {
        console.error("Error fetching ingredients:", error);
        setError("Failed to load ingredients. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onIngredientCreate = (newItem: Ingredients) => {
      if (newItem.is_active) {
        setIngredients((prev) => [newItem, ...prev]);
        message.info(`🆕 มีวัตถุดิบใหม่: ${newItem.display_name}`);
      }
    };

    const onIngredientUpdate = (updatedItem: Ingredients) => {
      setIngredients((prev) => {
        const exists = prev.find(item => item.id === updatedItem.id);
        
        if (updatedItem.is_active) {
          if (exists) {
            // Update existing
            return prev.map(item => item.id === updatedItem.id ? updatedItem : item);
          } else {
            // Add if it became active and wasn't in list
            return [updatedItem, ...prev];
          }
        } else {
          // Remove if it became inactive
          return prev.filter(item => item.id !== updatedItem.id);
        }
      });
    };

    const onIngredientDelete = ({ id }: { id: string }) => {
      setIngredients((prev) => prev.filter((item) => item.id !== id));
    };

    socket.on('ingredients:create', onIngredientCreate);
    socket.on('ingredients:update', onIngredientUpdate);
    socket.on('ingredients:delete', onIngredientDelete);

    return () => {
      socket.off('ingredients:create', onIngredientCreate);
      socket.off('ingredients:update', onIngredientUpdate);
      socket.off('ingredients:delete', onIngredientDelete);
    };
  }, [socket]);

  // Skeleton loading component
  const SkeletonCard = () => (
    <Card 
      style={{ 
        borderRadius: 16, 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      <Skeleton.Image active style={{ width: '100%', height: 180 }} />
      <div style={{ padding: '16px 0' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    </Card>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: '#f8f9fc' }}>
      {/* Simple Title Section */}
      <Content 
        style={{ 
          padding: '24px 24px 120px', 
          maxWidth: 1200, 
          margin: '0 auto', 
          width: '100%' 
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <Space align="center" size={12}>
            <Title 
              level={3} 
              style={{ 
                margin: 0, 
                color: '#1a1a2e',
                fontWeight: 700,
              }}
            >
              วัตถุดิบ
            </Title>
            <Badge 
              count={loading ? '...' : ingredients.length}
              style={{
                backgroundColor: '#0d9488',
                fontWeight: 600,
              }}
              showZero
            />
          </Space>
          <Text type="secondary" style={{ fontSize: 14, display: 'block', marginTop: 4 }}>
            เลือกวัตถุดิบที่ต้องการสั่งซื้อ
          </Text>
        </div>

        {loading ? (
          <List
            grid={{
              gutter: 24,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 3,
              xl: 3,
              xxl: 3,
            }}
            dataSource={[1, 2, 3, 4, 5, 6]}
            renderItem={() => (
              <List.Item>
                <SkeletonCard />
              </List.Item>
            )}
          />
        ) : error ? (
          <Result
            status="error"
            title="เกิดข้อผิดพลาด"
            subTitle={error}
            extra={
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ReloadOutlined style={{ marginRight: 8 }} />
                ลองใหม่อีกครั้ง
              </button>
            }
          />
        ) : ingredients.length === 0 ? (
          <Result
            icon={<ShoppingOutlined style={{ color: '#667eea', fontSize: 64 }} />}
            title="ยังไม่มีวัตถุดิบ"
            subTitle="ยังไม่มีวัตถุดิบที่พร้อมให้สั่งซื้อในขณะนี้"
          />
        ) : (
          <List
            grid={{
              gutter: 24,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 3,
              xl: 3,
              xxl: 3,
            }}
            dataSource={ingredients}
            renderItem={(item) => (
              <List.Item style={{ marginBottom: 8 }}>
                <IngredientCard ingredient={item} />
              </List.Item>
            )}
          />
        )}
      </Content>
      <CartDrawer />
    </Layout>
  );
}

