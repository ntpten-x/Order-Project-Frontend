"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ReloadOutlined, ShoppingOutlined } from "@ant-design/icons";
import { App, Alert, Button, Pagination, Spin, Typography } from "antd";

import { AccessGuardFallback } from "../../../components/pos/AccessGuard";
import { POSCategoryFilterBar } from "../../../components/pos/shared/POSCategoryFilterBar";
import { POSSharedStyles, posLayoutStyles } from "../../../components/pos/shared/style";
import CartDrawer from "../../../components/stock/CartDrawer";
import IngredientCard from "../../../components/stock/IngredientCard";
import PageContainer from "../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import PageStack from "../../../components/ui/page/PageStack";
import PageState from "../../../components/ui/states/PageState";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { useSocket } from "../../../hooks/useSocket";
import { stockCategoryService } from "../../../services/stock/category.service";
import { ingredientsService } from "../../../services/stock/ingredients.service";
import { StockCategory } from "../../../types/api/stock/category";
import { Ingredients } from "../../../types/api/stock/ingredients";
import { useRealtimeRefresh } from "../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../utils/realtimeEvents";
import { useDebouncedValue } from "../../../utils/useDebouncedValue";
import StockPageStyle from "./style";

const { Text } = Typography;
const PAGE_SIZE = 12;
const SORT_CREATED = "new";

export default function StockShoppingPage() {
  const { message: messageApi } = App.useApp();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { can, loading: permissionsLoading } = useEffectivePermissions({
    enabled: Boolean(user?.id),
  });

  const canViewOrders = can("stock.orders.page", "view");
  const canCreateOrders = can("stock.orders.page", "create");

  const [ingredients, setIngredients] = useState<Ingredients[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText.trim(), 250);

  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [isFilterPending, startFilterTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const loadCategories = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        status: "active",
        sort_created: SORT_CREATED,
      });
      const data = await stockCategoryService.findAll(undefined, params);
      setCategories(data);
    } catch (caughtError) {
      setCategories([]);
      console.error("Failed to load categories", caughtError);
    }
  }, []);

  useEffect(() => {
    if (!canViewOrders) return;
    void loadCategories();
  }, [canViewOrders, loadCategories]);

  useEffect(() => {
    if (!selectedCategory) return;
    if (categories.some((category) => category.id === selectedCategory)) return;
    setSelectedCategory(undefined);
  }, [categories, selectedCategory]);

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
        limit: String(PAGE_SIZE),
        sort_created: SORT_CREATED,
      });

      if (debouncedSearch) params.set("q", debouncedSearch);
      if (selectedCategory) params.set("category_id", selectedCategory);

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
        setError(null);
        setIngredients(payload.data);
        setTotal(payload.total);
      } catch (caughtError) {
        if ((caughtError as { name?: string })?.name === "AbortError") return;

        if (!silent || !hasLoadedRef.current) {
          setError(caughtError);
          messageApi.error(
            caughtError instanceof Error ? caughtError.message : "โหลดรายการวัตถุดิบไม่สำเร็จ"
          );
        } else {
          messageApi.warning(
            caughtError instanceof Error ? caughtError.message : "รีเฟรชรายการวัตถุดิบไม่สำเร็จ"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [debouncedSearch, messageApi, page, selectedCategory]
  );

  const refreshCatalog = useCallback(
    async (options?: { silent?: boolean }) => {
      await Promise.allSettled([loadCategories(), loadIngredients(options)]);
    },
    [loadCategories, loadIngredients]
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

  useRealtimeRefresh({
    socket,
    events: [
      RealtimeEvents.stockCategories.create,
      RealtimeEvents.stockCategories.update,
      RealtimeEvents.stockCategories.delete,
      RealtimeEvents.ingredients.create,
      RealtimeEvents.ingredients.update,
      RealtimeEvents.ingredients.delete,
    ],
    enabled: Boolean(canViewOrders),
    debounceMs: 250,
    onRefresh: () => {
      void refreshCatalog({ silent: true });
    },
  });

  if (permissionsLoading) {
    return <PageState status="loading" title="กำลังตรวจสอบสิทธิ์การใช้งาน" />;
  }

  if (!canViewOrders) {
    return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าสั่งของสต็อก" tone="danger" />;
  }

  return (
    <div className="stock-order-shell" data-testid="stock-catalog-page">
      <POSSharedStyles />
      <StockPageStyle />

      <UIPageHeader
        title="รายการวัตถุดิบ"
        icon={<ShoppingOutlined />}
        actions={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              void refreshCatalog({ silent: true });
            }}
            loading={refreshing}
            data-testid="stock-catalog-refresh"
          />
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

              <POSCategoryFilterBar
                categories={categories}
                searchQuery={searchText}
                searchInputTestId="stock-catalog-search"
                selectedCategory={selectedCategory}
                isPending={isFilterPending}
                onSearchChange={(value) => {
                  setSearchText(value);
                  setPage(1);
                }}
                onSelectCategory={(categoryId) => {
                  startFilterTransition(() => {
                    setSelectedCategory(categoryId);
                    setPage(1);
                  });
                }}
              />

              {loading && !hasLoadedRef.current ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                  <Spin size="large" />
                </div>
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
                  <div style={posLayoutStyles.productGrid} className="pos-product-grid pos-product-grid-mobile">
                    {ingredients.map((ingredient) => (
                      <IngredientCard
                        key={ingredient.id}
                        ingredient={ingredient}
                        orderingEnabled={canCreateOrders}
                      />
                    ))}
                  </div>

                  <div
                    className="pos-pagination-container"
                    style={{ ...posLayoutStyles.paginationContainer, position: "relative" }}
                  >
                    <div
                      className="pos-pagination-total"
                      style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }}
                    >
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        ทั้งหมด {total.toLocaleString()} รายการ
                      </Text>
                    </div>
                    <Pagination
                      current={page}
                      pageSize={PAGE_SIZE}
                      total={total}
                      showSizeChanger={false}
                      onChange={(nextPage) => setPage(nextPage)}
                    />
                  </div>
                </>
              )}
            </PageStack>
          </main>
        </div>
      </PageContainer>

      <CartDrawer />
    </div>
  );
}
