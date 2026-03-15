"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  List,
  Pagination,
  Segmented,
  Typography,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";

import IngredientCard from "../../../components/stock/IngredientCard";
import CartDrawer from "../../../components/stock/CartDrawer";
import StockImageThumb from "../../../components/stock/StockImageThumb";
import { AccessGuardFallback } from "../../../components/pos/AccessGuard";
import { SearchInput } from "../../../components/ui/input/SearchInput";
import PageContainer from "../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import PageSection from "../../../components/ui/page/PageSection";
import PageStack from "../../../components/ui/page/PageStack";
import PageState from "../../../components/ui/states/PageState";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { ingredientsService } from "../../../services/stock/ingredients.service";
import { Ingredients } from "../../../types/api/stock/ingredients";
import { useDebouncedValue } from "../../../utils/useDebouncedValue";
import StockPageStyle from "./style";

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

  const canViewOrders = can("stock.orders.page", "view");
  const canCreateOrders = can("stock.orders.page", "create");

  const [ingredients, setIngredients] = useState<Ingredients[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
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

      if (silent) {
        setRefreshing(true);
      } else {
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


  if (permissionsLoading) {
    return <PageState status="loading" title="กำลังตรวจสอบสิทธิ์การใช้งาน" />;
  }

  if (!canViewOrders) {
    return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าสั่งของสต็อก" tone="danger" />;
  }

  return (
    <div className="stock-order-shell" data-testid="stock-catalog-page">
      <StockPageStyle />

      <UIPageHeader
        title="จัดรายการซื้อวัตถุดิบ"
        subtitle={
          lastSyncedAt
            ? `อัปเดตล่าสุด ${formatDateTime(lastSyncedAt.toISOString())}`
            : "เลือกวัตถุดิบลงตะกร้า แล้วเปิดตะกร้าเพื่อยืนยันการสร้างใบซื้อ"
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
        <div className="stock-order-layout">
          <main className="stock-order-main">
            <PageStack gap={16}>

              {!canCreateOrders ? (
                <Alert
                  type="warning"
                  showIcon
                  style={{ borderRadius: 18, marginBottom: 16 }}
                  message="บัญชีนี้ยังไม่มีสิทธิ์สร้างใบซื้อ"
                  description="สามารถดูรายการวัตถุดิบและจัดตะกร้าได้ แต่ยังไม่สามารถยืนยันการสร้างใบซื้อ"
                />
              ) : null}

              <PageSection title="ค้นหาและเลือกวัตถุดิบ">

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
                  <div className="stock-order-empty">
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
                      className="stock-order-grid"
                      data-testid="stock-catalog-list"
                      grid={{ gutter: 16, xs: 1, sm: 2, lg: 2, xl: 3, xxl: 3 }}
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

                    <div className="stock-order-pagination">
                      <div className="stock-order-pagination-summary">
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
            </PageStack>
          </main>

        </div>
      </PageContainer>

      <CartDrawer />
    </div>
  );
}
