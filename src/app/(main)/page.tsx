"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
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
import { DashboardStyles, pageStyles } from "./style";

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
        const response = await axios.get("/api/ingredients?active=true");
        setIngredients(response.data);
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
      
      {/* Hero Section */}
      <div style={pageStyles.heroParams}>
        <div className="hero-pattern" />
        <div className="decorative-circle circle-1" />
        <div className="decorative-circle circle-2" />
        
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Space align="center" size={16} style={{ marginBottom: 8 }}>
            <ShoppingOutlined style={{ fontSize: 32, color: '#fff' }} />
            <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 800 }}>
              เลือกซื้อวัตถุดิบ
            </Title>
          </Space>
          <Text style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: 16, marginTop: 8, paddingLeft: 4 }}>
            คัดสรรวัตถุดิบคุณภาพดีที่สุดเพื่อครัวของคุณ
          </Text>
          
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
             <Badge 
              count={loading ? 0 : ingredients.length} 
              style={{ backgroundColor: '#fff', color: '#4f46e5', fontWeight: 'bold' }}
              overflowCount={999}
             >
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '6px 16px', 
                  borderRadius: 20, 
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                  fontWeight: 500
                }}>
                   รายการทั้งหมด
                </div>
             </Badge>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div style={pageStyles.contentWrapper}>
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
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <ReloadOutlined style={{ marginRight: 8 }} />
                ลองใหม่อีกครั้ง
              </button>
            }
            style={{ 
              background: 'white', 
              padding: 40, 
              borderRadius: 24, 
              marginTop: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
            }}
          />
        ) : ingredients.length === 0 ? (
          <div style={{ 
            background: 'white', 
            padding: '60px 20px', 
            borderRadius: 24, 
            marginTop: 24,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
          }}>
            <ShoppingOutlined style={{ color: '#d1d5db', fontSize: 80, marginBottom: 16 }} />
            <Title level={3} style={{ color: '#374151', margin: 0 }}>ยังไม่มีวัตถุดิบ</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>ยังไม่มีวัตถุดิบที่พร้อมให้สั่งซื้อในขณะนี้ โปรดกลับมาใหม่ภายหลัง</Text>
          </div>
        ) : (
          <List
            grid={pageStyles.gridConfig}
            dataSource={ingredients}
            renderItem={(item, index) => (
              <List.Item 
                className="animate-card"
                // Add staggered animation delay
                style={{ animationDelay: `${index * 50}ms`, marginBottom: 24 }}
              >
                <IngredientCard ingredient={item}/>
              </List.Item>
            )}
          />
        )}
      </div>
      <CartDrawer />
    </div>
  );
}

