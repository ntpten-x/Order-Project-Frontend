"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Grid,
  Input,
  List,
  Row,
  Skeleton,
  Typography,
  message,
} from "antd";
import { ReloadOutlined, SearchOutlined, ShoppingOutlined } from "@ant-design/icons";
import api from "../../../lib/axios";
import IngredientCard from "../../../components/stock/IngredientCard";
import CartDrawer from "../../../components/stock/CartDrawer";
import { Ingredients } from "../../../types/api/stock/ingredients";
import { useSocket } from "../../../hooks/useSocket";
import { RealtimeEvents } from "../../../utils/realtimeEvents";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import PageContainer from "../../../components/ui/page/PageContainer";
import PageSection from "../../../components/ui/page/PageSection";
import PageStack from "../../../components/ui/page/PageStack";
import UIEmptyState from "../../../components/ui/states/EmptyState";

const { Text } = Typography;

export default function StockShoppingPage() {
  const [ingredients, setIngredients] = useState<Ingredients[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const { socket } = useSocket();
  const screens = Grid.useBreakpoint();

  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/stock/ingredients?status=active");
      const payload = response.data;
      setIngredients(Array.isArray(payload) ? payload : payload?.data || []);
    } catch {
      message.error("ไม่สามารถโหลดรายการวัตถุดิบได้");
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIngredients();
  }, [fetchIngredients]);

  useEffect(() => {
    if (!socket) return;

    const onCreate = (newItem: Ingredients) => {
      if (!newItem.is_active) return;
      setIngredients((prev) => [newItem, ...prev]);
      message.info(`มีวัตถุดิบใหม่: ${newItem.display_name}`);
    };

    const onUpdate = (updatedItem: Ingredients) => {
      setIngredients((prev) => {
        const exists = prev.some((item) => item.id === updatedItem.id);
        if (!updatedItem.is_active) {
          return prev.filter((item) => item.id !== updatedItem.id);
        }
        if (!exists) return [updatedItem, ...prev];
        return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      });
    };

    const onDelete = ({ id }: { id: string }) => {
      setIngredients((prev) => prev.filter((item) => item.id !== id));
    };

    socket.on(RealtimeEvents.ingredients.create, onCreate);
    socket.on(RealtimeEvents.ingredients.update, onUpdate);
    socket.on(RealtimeEvents.ingredients.delete, onDelete);

    return () => {
      socket.off(RealtimeEvents.ingredients.create, onCreate);
      socket.off(RealtimeEvents.ingredients.update, onUpdate);
      socket.off(RealtimeEvents.ingredients.delete, onDelete);
    };
  }, [socket]);

  const filteredIngredients = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((item) => {
      return (
        item.display_name.toLowerCase().includes(q) ||
        item.ingredient_name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      );
    });
  }, [ingredients, searchText]);

  const loadingSkeleton = (
    <List
      grid={{ gutter: 12, xs: 1, sm: 2, lg: 3, xl: 4 }}
      dataSource={[1, 2, 3, 4, 5, 6]}
      renderItem={(key) => (
        <List.Item key={key}>
          <Card>
            <Skeleton.Image active style={{ width: "100%", height: 150 }} />
            <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 12 }} />
          </Card>
        </List.Item>
      )}
    />
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc", paddingBottom: 120 }}>
      <UIPageHeader
        title="จดรายการซื้อวัตถุดิบ"
        subtitle={`วัตถุดิบพร้อมใช้งาน ${ingredients.length} รายการ`}
        icon={<ShoppingOutlined />}
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => void fetchIngredients()} loading={loading}>
            รีเฟรช
          </Button>
        }
      />

      <PageContainer maxWidth={1400}>
        <PageStack gap={12}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Card>
                <Text type="secondary">วัตถุดิบทั้งหมด</Text>
                <div>
                  <Text strong style={{ fontSize: 24 }}>{ingredients.length.toLocaleString()}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Text type="secondary">ผลการค้นหา</Text>
                <div>
                  <Text strong style={{ fontSize: 24, color: "#1677ff" }}>{filteredIngredients.length.toLocaleString()}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Text type="secondary">โหมดการแสดงผล</Text>
                <div>
                  <Badge status={screens.md ? "processing" : "default"} text={screens.md ? "เดสก์ท็อป/แท็บเล็ต" : "มือถือ"} />
                </div>
              </Card>
            </Col>
          </Row>

          <PageSection title="ค้นหารายการ">
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
              ค้นหาจากชื่อแสดง ชื่อระบบ หรือคำอธิบาย
            </Text>
            <Input
              allowClear
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="ค้นหาวัตถุดิบ..."
              size="large"
            />
          </PageSection>

          <PageSection
            title="รายการวัตถุดิบ"
            extra={<Text strong>{filteredIngredients.length.toLocaleString()} รายการ</Text>}
          >
            {loading ? (
              loadingSkeleton
            ) : filteredIngredients.length === 0 ? (
              <UIEmptyState
                title="ไม่พบวัตถุดิบตามเงื่อนไข"
                description="ลองเปลี่ยนคำค้นหาหรือกดรีเฟรชข้อมูลอีกครั้ง"
                action={
                  <Button onClick={() => void fetchIngredients()} icon={<ReloadOutlined />}>
                    โหลดใหม่
                  </Button>
                }
              />
            ) : (
              <List
                grid={{ gutter: 12, xs: 1, sm: 2, lg: 3, xl: 4 }}
                dataSource={filteredIngredients}
                renderItem={(item) => (
                  <List.Item>
                    <IngredientCard ingredient={item} />
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
