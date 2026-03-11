"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Badge,
  Button,
  Card,
  List,
  Pagination,
  Segmented,
  Typography,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";

import IngredientCard from "../../../components/stock/IngredientCard";
import CartDrawer from "../../../components/stock/CartDrawer";
import { AccessGuardFallback } from "../../../components/pos/AccessGuard";
import { StatsGroup } from "../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../components/ui/input/SearchInput";
import PageContainer from "../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import PageSection from "../../../components/ui/page/PageSection";
import PageStack from "../../../components/ui/page/PageStack";
import PageState from "../../../components/ui/states/PageState";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/stock/CartContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { ingredientsService } from "../../../services/stock/ingredients.service";
import { Ingredients } from "../../../types/api/stock/ingredients";
import { useDebouncedValue } from "../../../utils/useDebouncedValue";
import ItemsPageStyle from "./style";

const { Text, Title } = Typography;

type SortCreated = "old" | "new";

function formatDateTime(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StockShoppingPage() {
  const { message: messageApi } = App.useApp();
  const { user } = useAuth();
  const { can, loading: permissionsLoading } = useEffectivePermissions({
    enabled: Boolean(user?.id),
  });
  const { items, itemCount } = useCart();

  const canViewOrders = can("stock.orders.page", "view");
  const canCreateOrders = can("stock.orders.page", "create");

  const [ingredients, setIngredients] = useState<Ingredients[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [lastPage, setLastPage] = useState(1);
  const [sortCreated, setSortCreated] = useState<SortCreated>("new");
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText.trim(), 250);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const loadIngredients = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent) && hasLoadedRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (silent) setRefreshing(true);
      else {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams({
        status: "active",
        page: String(page),
        limit: String(pageSize),
        sort_created: sortCreated,
      });
      if (debouncedSearch) params.set("q", debouncedSearch);

      try {
        const payload = await ingredientsService.findAllPaginated(undefined, params, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (payload.last_page > 0 && page > payload.last_page) {
          setPage(payload.last_page);
          return;
        }

        hasLoadedRef.current = true;
        setIngredients(payload.data);
        setTotal(payload.total);
        setLastPage(payload.last_page);
        setLastSyncedAt(new Date());
      } catch (caughtError) {
        if ((caughtError as { name?: string })?.name === "AbortError") return;
        setError(caughtError);
        if (!silent) {
          messageApi.error(
            caughtError instanceof Error ? caughtError.message : "โหลดรายการวัตถุดิบไม่สำเร็จ"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [debouncedSearch, messageApi, page, pageSize, sortCreated]
  );

  useEffect(() => {
    if (!canViewOrders) return;
    void loadIngredients({ silent: hasLoadedRef.current });
  }, [canViewOrders, loadIngredients]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const cartQuantityTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const metrics = useMemo(
    () => [
      {
        label: "วัตถุดิบทั้งหมด",
        value: total.toLocaleString(),
        color: "#0f172a",
        subLabel: "พร้อมสั่งซื้อในสาขาปัจจุบัน",
      },
      {
        label: "แสดงในหน้านี้",
        value: ingredients.length.toLocaleString(),
        color: "#1d4ed8",
        subLabel: `หน้า ${page} จาก ${Math.max(lastPage, 1)}`,
      },
      {
        label: "รายการในตะกร้า",
        value: itemCount.toLocaleString(),
        color: "#7c3aed",
        subLabel: `${items.length.toLocaleString()} วัตถุดิบ`,
      },
      {
        label: "จำนวนที่ต้องซื้อ",
        value: cartQuantityTotal.toLocaleString(),
        color: "#15803d",
        subLabel: canCreateOrders ? "พร้อมสร้างใบซื้อ" : "สิทธิ์สร้างใบซื้อถูกปิด",
      },
    ],
    [canCreateOrders, cartQuantityTotal, ingredients.length, itemCount, items.length, lastPage, page, total]
  );

  if (permissionsLoading) {
    return <PageState status="loading" title="กำลังตรวจสอบสิทธิ์การใช้งาน" />;
  }

  if (!canViewOrders) {
    return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าสั่งของสต๊อก" tone="danger" />;
  }

  return (
    <div className="stock-catalog-shell" data-testid="stock-catalog-page">
      <ItemsPageStyle />

      <UIPageHeader
        title="จดรายการซื้อวัตถุดิบ"
        subtitle={
          lastSyncedAt
            ? `อัปเดตล่าสุด ${formatDateTime(lastSyncedAt.toISOString())}`
            : "เลือกวัตถุดิบใส่ตะกร้า เพื่อสร้างใบซื้อสำหรับไปซื้อของ"
        }
        icon={<ShoppingOutlined />}
        actions={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void loadIngredients({ silent: true })}
            loading={refreshing}
          >
            รีเฟรช
          </Button>
        }
      />

      <PageContainer maxWidth={1440}>
        <PageStack gap={16}>
          <section className="stock-catalog-hero">
            <div className="stock-catalog-hero-copy">
              <Badge
                status={refreshing ? "processing" : "success"}
                text={refreshing ? "กำลังซิงก์ข้อมูลล่าสุด" : "หน้าสั่งของสำหรับจดรายการไปซื้อ"}
              />
              <Title level={3} style={{ margin: "12px 0 8px" }}>
                เลือกสินค้า ใส่ตะกร้า สร้างใบซื้อ แล้วนำไปซื้อของจริง
              </Title>
              <Text type="secondary">
                flow นี้เป็น stock-only: ใช้จดวัตถุดิบที่ต้องไปซื้อ และพิมพ์ใบซื้อเพื่อถือไปเช็กรายการหน้างาน
              </Text>
            </div>

            <div className="stock-catalog-hero-side">
              <StatsGroup stats={metrics} />
            </div>
          </section>

          <PageSection title="ค้นหาและเลือกวัตถุดิบ">
            <div className="stock-catalog-toolbar">
              <div className="stock-catalog-toolbar-main">
                <div className="stock-catalog-search" data-testid="stock-catalog-search">
                  <SearchInput
                    value={searchText}
                    onChange={(value) => {
                      setSearchText(value);
                      setPage(1);
                    }}
                    onClear={() => {
                      setSearchText("");
                      setPage(1);
                    }}
                    placeholder="ค้นหาจากชื่อแสดง ชื่อระบบ หรือคำอธิบาย"
                  />
                </div>

                <Segmented<SortCreated>
                  value={sortCreated}
                  onChange={(value) => {
                    setSortCreated(value);
                    setPage(1);
                  }}
                  options={[
                    { label: "ใหม่ก่อน", value: "new" },
                    { label: "เก่าก่อน", value: "old" },
                  ]}
                  className="stock-catalog-segmented"
                />
              </div>

              <div className="stock-catalog-toolbar-side">
                <div className="stock-catalog-inline-stat">
                  <SearchOutlined />
                  <span>{total.toLocaleString()} รายการ</span>
                </div>
                <Segmented<number>
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(value);
                    setPage(1);
                  }}
                  options={[
                    { label: "8/หน้า", value: 8 },
                    { label: "12/หน้า", value: 12 },
                    { label: "20/หน้า", value: 20 },
                  ]}
                  className="stock-catalog-segmented stock-catalog-segmented-compact"
                />
              </div>
            </div>

            {loading && !hasLoadedRef.current ? (
              <PageState status="loading" title="กำลังโหลดวัตถุดิบ" />
            ) : error ? (
              <PageState
                status="error"
                title="โหลดรายการวัตถุดิบไม่สำเร็จ"
                error={error}
                onRetry={() => void loadIngredients()}
              />
            ) : ingredients.length === 0 ? (
              <div className="stock-catalog-empty">
                <PageState
                  status="empty"
                  title="ไม่พบวัตถุดิบในเงื่อนไขนี้"
                  description="ลองเปลี่ยนคำค้นหา หรือกดรีเฟรชข้อมูลอีกครั้ง"
                  action={
                    <Button icon={<ReloadOutlined />} onClick={() => void loadIngredients()}>
                      โหลดใหม่
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <List
                  className="stock-catalog-grid"
                  data-testid="stock-catalog-list"
                  grid={{ gutter: 16, xs: 1, sm: 2, lg: 3, xl: 4 }}
                  dataSource={ingredients}
                  renderItem={(ingredient) => (
                    <List.Item key={ingredient.id}>
                      <IngredientCard
                        ingredient={ingredient}
                        orderingEnabled={canCreateOrders}
                      />
                    </List.Item>
                  )}
                />

                <div className="stock-catalog-pagination">
                  <div className="stock-catalog-pagination-summary">
                    แสดง {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} จาก {total.toLocaleString()} รายการ
                  </div>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger={false}
                    onChange={(nextPage) => setPage(nextPage)}
                  />
                </div>
              </>
            )}
          </PageSection>

          {!canCreateOrders ? (
            <Card className="stock-catalog-empty" bordered={false}>
              <Text type="secondary">
                บัญชีนี้ดูรายการวัตถุดิบได้ แต่ยังไม่มีสิทธิ์สร้างใบซื้อ
              </Text>
            </Card>
          ) : null}
        </PageStack>
      </PageContainer>

      <CartDrawer />
    </div>
  );
}
