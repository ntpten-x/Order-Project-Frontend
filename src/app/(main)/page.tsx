"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Layout, 
  Typography, 
  Spin, 
  Result,
  List,
  theme as antTheme,
  message
} from "antd";
import IngredientCard from "@/components/IngredientCard";
import CartDrawer from "@/components/CartDrawer";
import { Ingredients } from "@/types/api/ingredients";
import { useSocket } from "@/hooks/useSocket";

const { Content } = Layout;
const { Title } = Typography;
const { useToken } = antTheme;

export default function HomePage() {
  const { token } = useToken();
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
      } catch (error: any) {
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
        message.info(`New ingredient added: ${newItem.display_name}`);
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

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgContainer }}>
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Title level={2} style={{ marginBottom: 24, textAlign: 'center' }}>
          วัตถุดิบ
        </Title>
        
        {loading ? (
           <div style={{ textAlign: 'center', padding: 80 }}>
             <Spin size="large" />
           </div>
        ) : error ? (
          <Result
            status="error"
            title="Overview Failed"
            subTitle={error}
          />
        ) : (
          <List
            grid={{
              gutter: 24,
              xs: 1,  // 1 column on mobile
              sm: 1,
              md: 2,
              lg: 3,  // 3 columns on desktop (large screens)
              xl: 3,
              xxl: 3,
            }}
            dataSource={ingredients}
            renderItem={(item) => (
              <List.Item>
                <IngredientCard ingredient={item} />
              </List.Item>
            )}
            locale={{ emptyText: "No active ingredients found" }}
          />
        )}
      </Content>
      <CartDrawer />
    </Layout>
  );
}
