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
import { useCart } from "../../../contexts/stock/CartContext";
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
  const { items, itemCount } = useCart();

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

  const cartQuantityTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const notedItemsCount = useMemo(
    () => items.filter((item) => item.note?.trim()).length,
    [items]
  );

  const cartPreviewItems = useMemo(() => items.slice(0, 5), [items]);

  const hiddenCartItemsCount = Math.max(items.length - cartPreviewItems.length, 0);

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
              <section className="stock-order-hero">
                <div className="stock-order-hero-copy">
                  <Badge
                    status={refreshing ? "processing" : "success"}
                    text={refreshing ? "กำลังซิงก์ข้อมูลล่าสุด" : "พร้อมจัดรายการสั่งซื้อ"}
                  />
                  <Title level={3} className="stock-order-title">
                    เลือกวัตถุดิบ ค้นหาได้เร็ว และจัดลงตะกร้าแบบเข้าใจง่าย
                  </Title>
                  <Text type="secondary" className="stock-order-subtitle">
                    โครงหน้านี้ดึงแนวคิดจากหน้า order มาใช้กับ stock: รายการสินค้าอ่านง่าย, สรุปตะกร้าชัด,
                    และยืนยันการสั่งซื้อได้ต่อเนื่องโดยไม่เปลี่ยน flow เดิมของระบบ
                  </Text>
                </div>

                <div className="stock-order-hero-metrics">
                  <div className="stock-order-metric-card">
                    <span className="stock-order-metric-label">วัตถุดิบทั้งหมด</span>
                    <span className="stock-order-metric-value">{total.toLocaleString()}</span>
                  </div>
                  <div className="stock-order-metric-card">
                    <span className="stock-order-metric-label">รายการในตะกร้า</span>
                    <span className="stock-order-metric-value">{itemCount.toLocaleString()}</span>
                  </div>
                  <div className="stock-order-metric-card">
                    <span className="stock-order-metric-label">จำนวนที่ต้องซื้อ</span>
                    <span className="stock-order-metric-value">{cartQuantityTotal.toLocaleString()}</span>
                  </div>
                </div>
              </section>

              <PageSection title="ค้นหาและเลือกวัตถุดิบ">
                <div className="stock-order-toolbar">
                  <div className="stock-order-toolbar-main">
                    <div className="stock-order-search" data-testid="stock-catalog-search">
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
                        placeholder="ค้นหาจากชื่อแสดง ชื่อในระบบ หรือคำอธิบาย"
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
                      className="stock-order-segmented"
                    />
                  </div>

                  <div className="stock-order-toolbar-side">
                    <div className="stock-order-inline-stat">
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
                      className="stock-order-segmented stock-order-segmented-compact"
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

          <aside className="stock-order-side">
            <Card className="stock-order-summary-card" bordered={false}>
              <div className="stock-order-summary-header">
                <div>
                  <Title level={5} className="stock-order-summary-title">
                    สรุปรายการที่เลือก
                  </Title>
                  <Text type="secondary">
                    ใช้ปุ่มตะกร้ามุมขวาล่างเพื่อแก้ไขหมายเหตุและยืนยันการสร้างใบซื้อ
                  </Text>
                </div>
                <Badge count={itemCount} overflowCount={99}>
                  <div className="stock-order-summary-badge">
                    <ShoppingCartOutlined />
                  </div>
                </Badge>
              </div>

              {cartPreviewItems.length === 0 ? (
                <div className="stock-order-summary-empty">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="ยังไม่มีรายการในตะกร้า"
                  />
                </div>
              ) : (
                <>
                  <div className="stock-order-summary-list">
                    {cartPreviewItems.map((item, index) => (
                      <div
                        key={item.ingredient.id}
                        className={`stock-order-summary-item${index === cartPreviewItems.length - 1 ? " is-last" : ""}`}
                      >
                        <StockImageThumb
                          src={item.ingredient.img_url}
                          alt={item.ingredient.display_name}
                          size={48}
                          borderRadius={14}
                        />
                        <div className="stock-order-summary-item-content">
                          <div className="stock-order-summary-item-head">
                            <Text strong ellipsis={{ tooltip: item.ingredient.display_name }}>
                              {item.ingredient.display_name}
                            </Text>
                            <Text strong>{item.quantity.toLocaleString()}</Text>
                          </div>
                          <Text type="secondary" className="stock-order-summary-item-subtitle">
                            หน่วย: {item.ingredient.unit?.display_name || "-"}
                          </Text>
                          {item.note?.trim() ? (
                            <div className="stock-order-summary-item-note">{item.note}</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  {hiddenCartItemsCount > 0 ? (
                    <div className="stock-order-summary-more">
                      + อีก {hiddenCartItemsCount.toLocaleString()} รายการในตะกร้า
                    </div>
                  ) : null}
                </>
              )}

              <div className="stock-order-summary-total">
                <div className="stock-order-summary-row">
                  <Text type="secondary">จำนวนรายการ</Text>
                  <Text strong>{itemCount.toLocaleString()} ชิ้น</Text>
                </div>
                <div className="stock-order-summary-row">
                  <Text type="secondary">รวมที่ต้องซื้อ</Text>
                  <Text strong>{cartQuantityTotal.toLocaleString()} หน่วย</Text>
                </div>
                <div className="stock-order-summary-row">
                  <Text type="secondary">มีหมายเหตุ</Text>
                  <Text strong>{notedItemsCount.toLocaleString()} รายการ</Text>
                </div>
              </div>

              <div className="stock-order-summary-footer">
                <div className="stock-order-summary-action">
                  <ShoppingCartOutlined />
                  <span>แตะปุ่มตะกร้าเพื่อแก้ไขและยืนยันการสั่งซื้อ</span>
                </div>
              </div>
            </Card>

            {!canCreateOrders ? (
              <Alert
                type="warning"
                showIcon
                className="stock-order-side-alert"
                message="บัญชีนี้ยังไม่มีสิทธิ์สร้างใบซื้อ"
                description="สามารถดูรายการวัตถุดิบและจัดตะกร้าได้ แต่ยังไม่สามารถยืนยันการสร้างใบซื้อ"
              />
            ) : null}
          </aside>
        </div>
      </PageContainer>

      <CartDrawer />
    </div>
  );
}
