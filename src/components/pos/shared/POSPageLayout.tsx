"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Typography, Button, Spin, Empty, Badge, Drawer, List, message, Pagination, Input, Modal, Tag, InputNumber } from "antd";
import { 
  ShoppingCartOutlined, 
  DeleteOutlined, 
  MinusOutlined, 
  PlusOutlined, 
  ShopOutlined, 
  EditOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCart, CartItem, CartDetail } from "../../../contexts/pos/CartContext";
import { useGlobalLoading } from "../../../contexts/pos/GlobalLoadingContext";
import { useProducts } from "../../../hooks/pos/useProducts";
import { useCategories } from "../../../hooks/pos/useCategories";
import { Products } from "../../../types/api/pos/products";
import { 
  posLayoutStyles, 
  posColors, 
  POSSharedStyles 
} from "./style";
import { groupOrderItems, type GroupedOrderItem } from "../../../utils/orderGrouping";
import { 
  formatPrice, 
  hasProductImage, 
  getProductCategoryName 
} from "../../../utils/products/productDisplay.utils";

const { Title, Text } = Typography;

interface POSPageLayoutProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  onConfirmOrder: () => Promise<void>;
}

export default function POSPageLayout({ title, subtitle, icon, onConfirmOrder }: POSPageLayoutProps) {
  const { isLoading: isGlobalLoading } = useGlobalLoading();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  
  // Category State
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { data: categories = [] } = useCategories();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [searchQuery]);

  const { products, isLoading, total } = useProducts(page, LIMIT, selectedCategory, debouncedQuery);

  // UI State
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);

  // Context State
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    updateItemNote,
    clearCart,
    updateItemDetails,
    orderMode,
    getTotalItems, 
    getSubtotal,
    getFinalPrice,
  } = useCart();

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();
  const finalPrice = getFinalPrice();
  const discountAmount = Math.max(0, subtotal - finalPrice);

  const getProductUnitPrice = (product: Products): number => {
    return orderMode === 'DELIVERY'
      ? Number(product.price_delivery ?? product.price)
      : Number(product.price);
  };

  // Clear cart when leaving the specific page (navigation) but NOT on refresh
  React.useEffect(() => {
    const originalPath = window.location.pathname;
    
    return () => {
       if (window.location.pathname !== originalPath) {
           clearCart();
       }
    };
  }, [clearCart]);

  // Note Editing State
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [currentNoteItem, setCurrentNoteItem] = useState<{ id: string; name: string; note: string } | null>(null);
  const [noteInput, setNoteInput] = useState("");

  // Detail/Topping Management State
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentDetailItem, setCurrentDetailItem] = useState<{ id: string; name: string; details: { detail_name: string; extra_price: number }[] } | null>(null);

  const openDetailModal = (id: string, name: string, details?: { detail_name: string; extra_price: number }[]) => {
    setCurrentDetailItem({ id, name, details: details || [] });
    setIsDetailModalVisible(true);
  };

  const openNoteModal = (id: string, name: string, note: string) => {
    setCurrentNoteItem({ id, name, note });
    setNoteInput(note || "");
    setIsNoteModalVisible(true);
  };

  const handleSaveNote = () => {
    if (currentNoteItem) {
      updateItemNote(currentNoteItem.id, noteInput);
      setIsNoteModalVisible(false);
      setCurrentNoteItem(null);
      message.success("บันทึกโน้ตเรียบร้อยแล้ว");
    }
  };

  const handleAddToCart = (product: Products) => {
    const cartItemId = addToCart(product);
    const productName = product.display_name || product.product_name || "สินค้า";
    message.open({
      type: "success",
      content: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span>เพิ่ม {productName} ลงตะกร้าแล้ว</span>
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              removeFromCart(cartItemId);
              message.destroy("cart-add");
            }}
            style={{ padding: 0, height: "auto" }}
          >
            Undo
          </Button>
        </span>
      ),
      key: "cart-add",
      duration: 2.5,
    });
  };

  const openProductModal = (product: Products) => {
    setSelectedProduct(product);
    setIsProductModalVisible(true);
  };

  const closeProductModal = () => {
    setIsProductModalVisible(false);
    setSelectedProduct(null);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      message.warning("กรุณาเพิ่มสินค้าลงตะกร้าก่อน");
      return;
    }
    setCheckoutVisible(true);
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirmOrder();
      setCheckoutVisible(false);
      setCartVisible(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== RENDER HELPERS ====================
  const renderCartItem = (item: CartItem) => {
    const unitPrice = getProductUnitPrice(item.product);
    const detailsTotal = (item.details || []).reduce((sum: number, d: CartDetail) => sum + Number(d.extra_price || 0), 0);
    const itemDiscountAmount = Number(item.discount || 0);
    const lineTotal = Math.max(0, (unitPrice + detailsTotal) * item.quantity - itemDiscountAmount);
    
    return (
        <List.Item
            key={item.cart_item_id}
            style={{
                padding: "12px",
                marginBottom: "12px",
                background: "#fff",
                borderRadius: "16px",
                border: "none",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
            className="cart-item-hover"
        >
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
                {/* Image */}
                <div style={{ flexShrink: 0 }}>
                    {item.product.img_url ? (
                        <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={item.product.img_url} alt={item.product.display_name || item.product.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
                           <ShopOutlined style={{ fontSize: 24, color: '#94a3b8' }} />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 600, fontSize: 15, color: "#1e293b", display: "block", lineHeight: 1.2, marginBottom: 4 }}>
                                {item.product.display_name || item.product.product_name}
                            </Text>
                            <Tag style={{ border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: 11, padding: '0 6px', margin: 0, borderRadius: 6 }}>
                                {item.product.category?.display_name || 'ทั่วไป'}
                            </Tag>
                        </div>
                        <Text style={{ fontWeight: 700, fontSize: 16, color: "#10b981", whiteSpace: 'nowrap', marginLeft: 8 }}>
                            {formatPrice(lineTotal)}
                        </Text>
                    </div>

                    {/* Addons / Details */}
                    {(item.details && item.details.length > 0) && (
                        <div style={{ marginTop: 6, marginBottom: 4 }}>
                            {item.details!.map((d: CartDetail, idx: number) => (
                                <Text key={idx} style={{ display: 'block', fontSize: 12, color: '#10b981', lineHeight: 1.4 }}>
                                    + {d.detail_name} <span style={{ opacity: 0.8 }}>(+{formatPrice(Number(d.extra_price || 0))})</span>
                                </Text>
                            ))}
                        </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                        <div style={{ marginTop: 4, background: "#fef2f2", padding: "2px 6px", borderRadius: 4, display: "inline-block", border: '1px solid #fecaca' }}>
                            <Text style={{ fontSize: 11, color: "#ef4444" }}>
                                โน้ต: {item.notes}
                            </Text>
                        </div>
                    )}

                    {/* Controls */}
                    <div
                      className="pos-cart-item-controls"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}
                    >
                         {/* Quantity */}
                         <div
                           className="pos-cart-qty-control"
                           style={{ display: "flex", alignItems: "center", background: "#f8fafc", borderRadius: 10, padding: "4px", border: '1px solid #e2e8f0' }}
                         >
                               <Button
                                   type="text"
                                   size="small"
                                   icon={<MinusOutlined style={{ fontSize: 10 }} />}
                                   className="pos-cart-icon-btn pos-cart-qty-btn"
                                   aria-label="ลดจำนวน"
                                   onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                                   style={{ borderRadius: 10, background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                               />
                               <Text style={{ margin: "0 8px", fontWeight: 600, minWidth: 16, textAlign: "center", fontSize: 13 }}>
                                   {item.quantity}
                               </Text>
                               <Button
                                   type="text"
                                   size="small"
                                   icon={<PlusOutlined style={{ fontSize: 10 }} />}
                                   className="pos-cart-icon-btn pos-cart-qty-btn"
                                   aria-label="เพิ่มจำนวน"
                                   onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                                   style={{ borderRadius: 10, background: "#10b981", color: "white" }}
                               />
                         </div>

                         {/* Actions */}
                         <div className="pos-cart-action-row" style={{ display: "flex", gap: 6 }}>
                               <Button
                                   type="text"
                                   icon={<EditOutlined />}
                                   size="small"
                                   className="pos-cart-icon-btn pos-cart-action-btn"
                                   aria-label="แก้ไขโน้ต"
                                   onClick={() => {
                                       openNoteModal(item.cart_item_id, item.product.display_name, item.notes || "");
                                   }}
                                   style={{ color: "#64748b", background: "#f1f5f9", borderRadius: 10 }}
                               />
                               <Button
                                   type="text"
                                   icon={<PlusOutlined />}
                                   size="small"
                                   className="pos-cart-icon-btn pos-cart-action-btn"
                                   aria-label="เพิ่มรายละเอียด"
                                   onClick={() => {
                                       openDetailModal(item.cart_item_id, item.product.display_name, item.details);
                                   }}
                                   style={{ color: "#10b981", background: "#ecfdf5", borderRadius: 10 }}
                               />
                               <Button
                                   type="text"
                                   danger
                                   icon={<DeleteOutlined />}
                                   size="small"
                                   className="pos-cart-icon-btn pos-cart-action-btn"
                                   aria-label="ลบออกจากตะกร้า"
                                   onClick={() => removeFromCart(item.cart_item_id)}
                                   style={{ background: "#fef2f2", borderRadius: 10 }}
                               />
                         </div>
                    </div>
                </div>
            </div>
        </List.Item>
    );
  };

  return (
    <>
      <POSSharedStyles />

      <div style={posLayoutStyles.container}>
        {/* Sticky Header */}
        <header style={posLayoutStyles.header} className="pos-header-mobile" role="banner">
          <div style={posLayoutStyles.headerContent}>
            <div style={posLayoutStyles.headerLeft}>
              {/* Back Button */}
              <button
                className="pos-header-back"
                style={posLayoutStyles.headerBackButton}
                onClick={() => router.back()}
                aria-label="กลับ"
              >
                <ArrowLeftOutlined style={{ fontSize: 18 }} />
              </button>

              {/* Icon Wrapper */}
              <div style={posLayoutStyles.headerIconWrapper}>
                {icon}
              </div>

              {/* Title Info */}
              <div style={posLayoutStyles.headerInfo}>
                <Title level={4} style={posLayoutStyles.headerTitle} className="pos-header-title-mobile">
                  {title}
                </Title>
                <Text style={posLayoutStyles.headerSubtitle} className="pos-header-subtitle-mobile">
                  {subtitle}
                </Text>
              </div>
            </div>
          </div>
        </header>

        {/* Category Filter */}
        <nav 
          style={posLayoutStyles.categoryBar} 
          className="pos-category-bar pos-category-bar-mobile"
          role="navigation"
          aria-label="ตัวกรองหมวดหมู่"
        >
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              value={searchQuery}
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="ค้นหาสินค้า..."
              aria-label="ค้นหาสินค้า"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pos-product-search"
              style={{ borderRadius: 16, height: 44 }}
            />

            <div style={posLayoutStyles.categoryScroll} className="pos-category-scroll-row">
              <Button
                type={!selectedCategory ? "primary" : "text"}
                onClick={() => { setSelectedCategory(undefined); setPage(1); }}
                className="pos-category-btn"
                style={{ 
                  background: !selectedCategory ? posColors.primary : 'white',
                  borderColor: !selectedCategory ? posColors.primary : '#E2E8F0',
                  color: !selectedCategory ? '#fff' : '#64748B',
                  border: !selectedCategory ? `1px solid ${posColors.primary}` : '1px solid #E2E8F0',
                  fontWeight: !selectedCategory ? 600 : 400,
                  boxShadow: !selectedCategory ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                  height: 36,
                  padding: '0 20px',
                  borderRadius: 18,
                  transition: 'all 0.3s ease'
                }}
              >
                ทั้งหมด
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  type={selectedCategory === cat.id ? "primary" : "text"}
                  onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                  className="pos-category-btn"
                  style={{ 
                    background: selectedCategory === cat.id ? posColors.primary : 'white',
                    borderColor: selectedCategory === cat.id ? posColors.primary : '#E2E8F0',
                    color: selectedCategory === cat.id ? '#fff' : '#64748B',
                    border: selectedCategory === cat.id ? `1px solid ${posColors.primary}` : '1px solid #E2E8F0',
                    fontWeight: selectedCategory === cat.id ? 600 : 400,
                    boxShadow: selectedCategory === cat.id ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                    height: 36,
                    padding: '0 20px',
                    borderRadius: 18,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {cat.display_name}
                </Button>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main style={posLayoutStyles.content} className="pos-content-mobile" role="main">
          {isLoading && !isGlobalLoading ? (
            <div style={posLayoutStyles.loadingContainer}>
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 16, color: posColors.textSecondary }}>
                กำลังโหลดสินค้า...
              </Text>
            </div>
          ) : products.length > 0 ? (
            <>
              <div style={posLayoutStyles.productGrid} className="pos-product-grid pos-product-grid-mobile">
                {products.map((product, index) => (
                  <article
                     key={product.id}
                     className={`pos-product-card pos-fade-in pos-delay-${(index % 4) + 1}`}
                     style={posLayoutStyles.productCard}
                     onClick={() => openProductModal(product)}
                     role="button"
                     tabIndex={0}
                     aria-label={`ดูรายละเอียด ${product.display_name}`}
                     aria-haspopup="dialog"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault();
                         openProductModal(product);
                       }
                     }}
                  >
                    {/* Product Image */}
                    <div style={posLayoutStyles.productImage} className="pos-product-image-mobile">
                      {hasProductImage(product) ? (
                        <Image
                          alt={product.product_name}
                          src={product.img_url!}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 50vw, 220px"
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          background: `linear-gradient(135deg, ${posColors.primaryLight} 0%, #DBEAFE 100%)`,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center"
                        }}>
                          <ShopOutlined style={{ fontSize: 48, color: posColors.primary, opacity: 0.4 }} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div style={posLayoutStyles.productInfo} className="pos-product-info-mobile">
                      <Text ellipsis style={posLayoutStyles.productName} className="pos-product-name-mobile">
                        {product.display_name}
                      </Text>
                      <Tag 
                        color="blue" 
                        style={{ 
                          fontSize: 10, 
                          marginBottom: 0, 
                          borderRadius: 6,
                          border: 'none',
                          background: posColors.primaryLight,
                          color: posColors.primary,
                        }}
                      >
                        {getProductCategoryName(product)}
                      </Tag>
                      <div style={posLayoutStyles.productFooter} className="pos-product-footer-mobile">
                        <Text style={posLayoutStyles.productPrice} className="pos-product-price-mobile">
                          {formatPrice(getProductUnitPrice(product))}
                        </Text>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          className="pos-add-button pos-add-button-mobile"
                          style={posLayoutStyles.addButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          เพิ่ม
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              
              {/* Pagination */}
              <div style={posLayoutStyles.paginationContainer}>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={LIMIT}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                  showTotal={(total) => `ทั้งหมด ${total} รายการ`}
                />
              </div>
            </>
          ) : (
            <div style={{ 
                background: '#fff', 
                borderRadius: 24, 
                padding: '80px 24px', 
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
            }}>
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                imageStyle={{ height: 120 }}
                description={
                  <div style={{ marginTop: 20 }}>
                    <Title level={4} style={{ marginBottom: 8, color: posColors.text }}>
                      {debouncedQuery ? "ไม่พบสินค้า" : "ยังไม่มีข้อมูลสินค้า"}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                      {debouncedQuery
                        ? `ไม่พบสินค้า${debouncedQuery ? ` สำหรับ “${debouncedQuery}”` : ""} ลองเปลี่ยนคำค้นหา หรือเลือกหมวดอื่น`
                        : "กรุณาเพิ่มสินค้าก่อนใช้งาน"}
                    </Text>
                  </div>
                }
              >
                {debouncedQuery ? (
                  <Button
                    size="large"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    style={{
                      height: 52,
                      padding: '0 40px',
                      borderRadius: 16,
                      fontSize: 16,
                      fontWeight: 700,
                      marginTop: 20,
                      background: "#fff",
                      border: `1px solid ${posColors.border}`,
                      color: posColors.text,
                    }}
                  >
                    ล้างคำค้นหา
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<ShopOutlined />}
                    style={{ 
                      height: 52, 
                      padding: '0 40px', 
                      borderRadius: 16,
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: 20,
                      background: `linear-gradient(135deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`,
                      border: 'none',
                      boxShadow: '0 8px 20px rgb(var(--color-primary-rgb) / 0.25)',
                    }}
                    onClick={() => router.push("/pos/products")}
                  >
                    ไปหน้าจัดการสินค้า
                  </Button>
                )}
              </Empty>
            </div>
          )}
        </main>

        {/* Floating Cart Button */}
        <div className="pos-floating-btn-container">
          <Badge count={totalItems} size="default" offset={[-5, 5]}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<ShoppingCartOutlined style={{ fontSize: 26 }} />}
              onClick={() => setCartVisible(true)}
              style={posLayoutStyles.floatingCartButton}
              className={totalItems > 0 ? 'pos-cart-pulse' : ''}
              aria-label={`ตะกร้าสินค้า ${totalItems} รายการ`}
            />
          </Badge>
        </div>

        {/* Cart Drawer */}
        {/* Cart Drawer */}
        <Drawer
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: "#ecfdf5", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ShoppingCartOutlined style={{ fontSize: 20, color: "#10b981" }} />
                    </div>
                    <div>
                        <Text style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", display: "block", lineHeight: 1.2 }}>ตะกร้าสินค้า</Text>
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>{totalItems} รายการ</Text>
                    </div>
                </div>
            }
            placement="right"
            onClose={() => setCartVisible(false)}
            open={cartVisible}
            width={420}
            styles={{ 
                wrapper: { maxWidth: "100vw" },
                body: { padding: "16px 20px", background: "#f8fafc" },
                header: { padding: "20px", borderBottom: "1px solid #f1f5f9" },
                footer: { padding: "20px", borderTop: "1px solid #e2e8f0", background: "white" }
            }}
            footer={
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text type="secondary" style={{ fontSize: 15 }}>ยอดรวม ({totalItems} รายการ)</Text>
                    <Text style={{ fontWeight: 600, fontSize: 16 }}>{formatPrice(subtotal)}</Text>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text type="secondary" style={{ fontSize: 15 }}>ส่วนลด</Text>
                    <Text style={{ fontWeight: 600, fontSize: 16, color: "#ef4444" }}>-{formatPrice(discountAmount)}</Text>
                  </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>ยอดสุทธิ</Text>
                    <div style={{ textAlign: "right" }}>
                            <Title level={2} style={{ margin: 0, color: "#10b981", lineHeight: 1 }}>
                                {formatPrice(finalPrice)}
                            </Title>
                    </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                        <Button 
                            size="large" 
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: "ล้างตะกร้าสินค้า?",
                                content: "รายการทั้งหมดจะถูกลบ และไม่สามารถย้อนกลับได้",
                                okText: "ล้างตะกร้า",
                                okType: "danger",
                                cancelText: "ยกเลิก",
                                centered: true,
                                onOk: clearCart,
                              });
                            }}
                            disabled={cartItems.length === 0}
                            style={{ borderRadius: 12, height: 48, fontWeight: 600, border: "none", background: "#fef2f2", color: "#ef4444" }}
                        >
                            ล้างตะกร้า
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleCheckout}
                            disabled={cartItems.length === 0}
                            style={{ 
                                borderRadius: 12, 
                                height: 48, 
                                fontWeight: 700, 
                                background: "#10b981", 
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)" 
                            }}
                        >
                            ชำระเงิน
                        </Button>
                </div>
            </div>
            }
        >
            {cartItems.length > 0 ? (
                <List
                    dataSource={cartItems}
                    renderItem={renderCartItem}
                    split={false}
                />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5 }}>
                    <ShoppingCartOutlined style={{ fontSize: 64, color: "#cbd5e1", marginBottom: 16 }} />
                    <Text style={{ color: "#64748b", fontSize: 16 }}>ไม่มีสินค้าในตะกร้า</Text>
                    <Text style={{ color: "#94a3b8", fontSize: 14 }}>เลือกสินค้าจากเมนูเพื่อเพิ่มลงตะกร้า</Text>
                </div>
            )}
        </Drawer>

          {/* Checkout Drawer (Nested) */}
          {cartVisible && (
            <Drawer
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                  <ShoppingCartOutlined style={{ fontSize: 20 }} />
                  <span style={{ fontWeight: 700, fontSize: 18 }}>สรุปรายการออเดอร์</span>
                </div>
              }
              width={420}
              open={checkoutVisible}
              onClose={() => setCheckoutVisible(false)}
              closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
              styles={{
                wrapper: { maxWidth: "100vw" },
                header: { background: `linear-gradient(145deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`, padding: "20px 24px" },
                body: { padding: "0 24px" },
                footer: { padding: "16px 24px" },
              }}
              footer={
                <div style={{ padding: '8px 0' }}>
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={isProcessing}
                    onClick={handleConfirm}
                    style={{
                      background: `linear-gradient(135deg, ${posColors.success} 0%, #059669 100%)`,
                      border: 'none',
                      height: 56,
                      fontWeight: 700,
                      fontSize: 18,
                      borderRadius: 14,
                      boxShadow: `0 8px 20px ${posColors.success}40`,
                    }}
                  >
                    ยืนยันการสั่งออเดอร์
                  </Button>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 0' }}>
                {/* Itemized List */}
                <section>
                  <Title level={5} style={{ marginBottom: 16, color: posColors.text }}>รายการที่สั่ง</Title>
                  <List
                    itemLayout="horizontal"
                    dataSource={groupOrderItems(cartItems)}
                    renderItem={(item: GroupedOrderItem<CartItem>) => (
                      <div key={item.id} style={{ 
                        display: 'flex', 
                        gap: 12, 
                        padding: '14px 0', 
                        borderBottom: '1px dashed #E2E8F0' 
                      }}>
                        {/* Image */}
                        <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid #E2E8F0' }}>
                          {item.product.img_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={item.product.img_url} alt={item.product.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: posColors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShopOutlined style={{ fontSize: 16, color: posColors.primary, opacity: 0.5 }} />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>{item.product.display_name}</Text>
                              
                              {/* Actions - Removed as per user request */}

                              {/* Price Breakdown */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>ราคาอาหาร</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{formatPrice(getProductUnitPrice(item.product))}</Text>
                                </div>
                                
                                {item.details && item.details.map((d: { detail_name: string; extra_price: number }, idx: number) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, color: posColors.success }}>+ {d.detail_name}</Text>
                                    <Text style={{ fontSize: 12, color: posColors.success }}>{formatPrice(Number(d.extra_price))}</Text>
                                  </div>
                                ))}

                                <div style={{ marginTop: 4 }}>
                                  <Text style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>จำนวน : ☓ {item.quantity}</Text>
                                </div>
                              </div>

                              {/* Note Display */}
                              {item.notes && (
                                <div style={{ marginTop: 8, padding: '6px 10px', background: '#fef2f2', borderRadius: 8, borderLeft: `3px solid #ef4444` }}>
                                  <Text italic style={{ fontSize: 12, color: '#ef4444' }}>โน้ต: {item.notes}</Text>
                                </div>
                              )}
                            </div>
                            
                            {/* Line Total */}
                            <Text strong style={{ fontSize: 15, marginLeft: 12, color: posColors.primary }}>
                              {formatPrice((getProductUnitPrice(item.product) + (item.details || []).reduce((sum: number, d: CartDetail) => sum + Number(d.extra_price), 0)) * item.quantity)}
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </section>

                {/* Category Summary */}
                <section style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                  <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block', color: posColors.textSecondary }}>สรุปตามหมวดหมู่</Text>
                  {(() => {
                    const categoriesMap: Record<string, number> = {};
                    cartItems.forEach(item => {
                      const catName = item.product.category?.display_name || 'อื่นๆ';
                      categoriesMap[catName] = (categoriesMap[catName] || 0) + item.quantity;
                    });
                    return Object.entries(categoriesMap).map(([name, count]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>{name}</Text>
                        <Text strong style={{ fontSize: 13 }}>{count} รายการ</Text>
                      </div>
                    ));
                  })()}
                </section>

                {/* Totals */}
                <section style={{ background: '#fff', padding: '20px', borderTop: '2px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 15 }}>รวมจำนวนทั้งหมด</Text>
                    <Text strong style={{ fontSize: 15 }}>{totalItems} รายการ</Text>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 15 }}>ส่วนลด</Text>
                      <Text strong style={{ fontSize: 15, color: '#ef4444' }}>-{formatPrice(discountAmount)}</Text>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: 700, color: posColors.text }}>ยอดรวมสุทธิ</Text>
                    <Text style={{ fontSize: 32, fontWeight: 800, color: posColors.primary }}>
                      {formatPrice(finalPrice)}
                    </Text>
                  </div>
                </section>
              </div>
            </Drawer>
          )}

          {/* Note Modal */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: posColors.warningLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <EditOutlined style={{ color: posColors.warning, fontSize: 16 }} />
                </div>
                <span>ระบุรายละเอียด: {currentNoteItem?.name}</span>
              </div>
            }
            open={isNoteModalVisible}
            onOk={handleSaveNote}
            onCancel={() => {
              setIsNoteModalVisible(false);
              setCurrentNoteItem(null);
            }}
            okText="บันทึก"
            cancelText="ยกเลิก"
            centered
            okButtonProps={{ style: { background: posColors.primary, borderRadius: 10, height: 42 } }}
            cancelButtonProps={{ style: { borderRadius: 10, height: 42 } }}
          >
            <div style={{ padding: '16px 0' }}>
              <Text style={{ display: 'block', marginBottom: 10, color: posColors.textSecondary }}>รายละเอียด / หมายเหตุ</Text>
              <Input.TextArea
                rows={4}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="เช่น ไม่ใส่ผัก, หวานน้อย, แยกน้ำ..."
                maxLength={200}
                showCount
                style={{ borderRadius: 10 }}
              />
            </div>
          </Modal>

          {/* Product Detail Modal */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: posColors.primaryLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ShopOutlined style={{ color: posColors.primary, fontSize: 16 }} />
                </div>
                <span style={{ fontWeight: 700 }}>{selectedProduct?.display_name}</span>
              </div>
            }
            open={isProductModalVisible}
            onCancel={closeProductModal}
            centered
            width={560}
            footer={[
              <Button key="close" onClick={closeProductModal} style={{ borderRadius: 10, height: 44 }}>
                ปิด
              </Button>,
              <Button
                key="add"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (!selectedProduct) return;
                  handleAddToCart(selectedProduct);
                  closeProductModal();
                }}
                style={{
                  borderRadius: 10,
                  height: 44,
                  background: `linear-gradient(135deg, ${posColors.success} 0%, #059669 100%)`,
                  border: 'none',
                  fontWeight: 700,
                }}
              >
                เพิ่มลงตะกร้า
              </Button>,
            ]}
          >
            {selectedProduct && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 240,
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: `1px solid ${posColors.borderLight}`,
                    background: `linear-gradient(135deg, ${posColors.primaryLight} 0%, #DBEAFE 100%)`,
                  }}
                >
                  {hasProductImage(selectedProduct) ? (
                    <Image
                      alt={selectedProduct.product_name}
                      src={selectedProduct.img_url!}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 90vw, 560px"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShopOutlined style={{ fontSize: 56, color: posColors.primary, opacity: 0.4 }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Tag
                      style={{
                        border: 'none',
                        background: posColors.primaryLight,
                        color: posColors.primary,
                        fontSize: 12,
                        padding: '2px 10px',
                        borderRadius: 999,
                        margin: 0,
                      }}
                    >
                      {getProductCategoryName(selectedProduct)}
                    </Tag>
                    <Title level={4} style={{ margin: '10px 0 0', color: posColors.text, lineHeight: 1.2 }}>
                      {selectedProduct.display_name}
                    </Title>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>ราคา</Text>
                    <div style={{ fontSize: 24, fontWeight: 800, color: posColors.primary, lineHeight: 1.1 }}>
                      {formatPrice(getProductUnitPrice(selectedProduct))}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: `1px solid ${posColors.borderLight}` }}>
                  <Text style={{ display: 'block', marginBottom: 6, fontWeight: 700, color: posColors.textSecondary }}>
                    รายละเอียดสินค้า
                  </Text>
                  <Text style={{ color: posColors.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
                    {selectedProduct.description?.trim() ? selectedProduct.description : "ไม่มีรายละเอียดสินค้า"}
                  </Text>
                </div>
              </div>
            )}
          </Modal>

          {/* Detail/Topping Modal */}
          <CartItemDetailModal
            item={currentDetailItem}
            isOpen={isDetailModalVisible}
            onClose={() => {
              setIsDetailModalVisible(false);
              setCurrentDetailItem(null);
            }}
            onSave={(details) => {
              if (currentDetailItem) {
                updateItemDetails(currentDetailItem.id, details);
              }
            }}
          />
      </div>
    </>
  );
}

// ============================================
// Detail/Topping Modal Component
// ============================================
interface CartItemDetailModalProps {
  item: { id: string; name: string; details: { detail_name: string; extra_price: number }[] } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { detail_name: string; extra_price: number }[]) => void;
}

function CartItemDetailModal({ item, isOpen, onClose, onSave }: CartItemDetailModalProps) {
  const [details, setDetails] = useState<{ detail_name: string; extra_price: number }[]>([]);

  React.useEffect(() => {
    if (item && isOpen) {
      setDetails(item.details ? [...item.details.map(d => ({ ...d }))] : []);
    }
  }, [item, isOpen]);

  const handleAddDetail = () => {
    setDetails([...details, { detail_name: '', extra_price: 0 }]);
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleUpdateDetail = (index: number, field: string, value: unknown) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const handleSave = () => {
    onSave(details.filter(d => d.detail_name.trim() !== ''));
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: posColors.successLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <PlusOutlined style={{ color: posColors.success, fontSize: 16 }} />
          </div>
          <span>รายละเอียดเพิ่มเติม: {item?.name}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} style={{ borderRadius: 10, height: 42 }}>ยกเลิก</Button>,
        <Button key="save" type="primary" onClick={handleSave} style={{ background: posColors.success, borderRadius: 10, height: 42 }}>บันทึก</Button>
      ]}
      width={520}
      centered
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text strong style={{ color: posColors.textSecondary }}>รายการเพิ่มเติม</Text>
          <Button 
            type="dashed" 
            size="small"
            icon={<PlusOutlined />} 
            onClick={handleAddDetail}
            style={{ borderRadius: 8 }}
          >
            เพิ่มรายการ
          </Button>
        </div>
        
        {details.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px', 
            background: '#F8FAFC', 
            borderRadius: 12, 
            color: posColors.textSecondary 
          }}>
            <PlusOutlined style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }} />
            <div>ไม่มีรายการเพิ่มเติม</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {details.map((detail, index) => (
              <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Input 
                  placeholder="ชื่อรายการ" 
                  value={detail.detail_name}
                  onChange={(e) => handleUpdateDetail(index, 'detail_name', e.target.value)}
                  style={{ flex: 2, borderRadius: 8, height: 42 }}
                />
                <InputNumber<number>
                  placeholder="ราคา"
                  value={detail.extra_price}
                  onChange={(val: number | null) => handleUpdateDetail(index, 'extra_price', val || 0)}
                  style={{ flex: 1, height: 42 }}
                  inputMode="decimal"
                  controls={false}
                  min={0}
                  precision={2}
                  formatter={(value: number | undefined | string) => {
                    if (value === undefined || value === null || value === '') return '';
                    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  }}
                  parser={(value: string | undefined) => {
                    const cleaned = (value ?? '').replace(/[^\d.]/g, '');
                    const parsed = Number.parseFloat(cleaned);
                    return Number.isFinite(parsed) ? parsed : 0;
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.'];
                    if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                      e.preventDefault();
                    }
                    if (e.key === '.' && detail.extra_price.toString().includes('.')) {
                      e.preventDefault();
                    }
                  }}
                />
                <Button 
                  danger 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleRemoveDetail(index)}
                  style={{ borderRadius: 8, height: 42, width: 42 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
