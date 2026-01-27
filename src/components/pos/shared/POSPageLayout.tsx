"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Typography, Button, Spin, Empty, Badge, Drawer, List, message, Pagination, Divider, Input, Modal, Tag, InputNumber } from "antd";
import { 
  ShoppingCartOutlined, 
  DeleteOutlined, 
  MinusOutlined, 
  PlusOutlined, 
  ShopOutlined, 
  EditOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCart } from "../../../contexts/pos/CartContext";
import { useProducts } from "../../../hooks/pos/useProducts";
import { Products } from "../../../types/api/pos/products";
import { Category } from "../../../types/api/pos/category";
import { 
  posLayoutStyles, 
  posCartStyles, 
  posColors, 
  POSSharedStyles 
} from "./style";
import { 
  formatPrice, 
  formatItemCount, 
  hasProductImage, 
  getProductCategoryName 
} from "@/utils/products/productDisplay.utils";

const { Title, Text } = Typography;

interface POSPageLayoutProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  onConfirmOrder: () => Promise<void>;
}

export default function POSPageLayout({ title, subtitle, icon, onConfirmOrder }: POSPageLayoutProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  
  // Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/pos/category');
        if (response.ok) {
            const data = await response.json();
            setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);


  const { products, isLoading, total } = useProducts(page, LIMIT, selectedCategory);

  // UI State
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Context State
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    updateItemNote,
    clearCart,
    addDetailToItem,
    removeDetailFromItem,
    updateItemDetails,
    getTotalItems, 
    getSubtotal,
    getFinalPrice,
  } = useCart();

  // Clear cart when leaving the specific page (navigation) but NOT on refresh
  React.useEffect(() => {
    const originalPath = window.location.pathname;
    
    return () => {
       // On refresh, originalPath stays same as current window.location.pathname
       // On navigation, window.location.pathname updates to new page
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
      message.success("บันทึกโน๊ตเรียบร้อยแล้ว");
    }
  };

  const handleAddToCart = (product: Products) => {
    addToCart(product);
    message.success(`เพิ่ม ${product.display_name} ลงตะกร้าแล้ว`);
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

  return (
    <>
      <POSSharedStyles />
      <div style={posLayoutStyles.container}>
        {/* Sticky Header */}
        <div style={posLayoutStyles.header} className="pos-header-mobile">
          <div style={posLayoutStyles.headerContent}>
            <div style={posLayoutStyles.headerLeft}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined style={{ color: '#fff' }} />}
                onClick={() => router.back()}
                style={{ 
                  color: '#fff', 
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {icon}
              </div>
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
        </div>

        {/* Category Filter */}
        <div style={posLayoutStyles.categoryBar} className="pos-category-bar pos-category-bar-mobile">
          <div style={posLayoutStyles.categoryScroll}>
            <Button
              type={!selectedCategory ? "primary" : "default"}
              onClick={() => { setSelectedCategory(undefined); setPage(1); }}
              shape="round"
              size="large"
            >
              ทั้งหมด
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                type={selectedCategory === cat.id ? "primary" : "default"}
                onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                shape="round"
                size="large"
              >
                {cat.display_name}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={posLayoutStyles.content} className="pos-content-mobile">
          {isLoading ? (
            <div style={posLayoutStyles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div style={posLayoutStyles.productGrid} className="pos-product-grid pos-product-grid-mobile">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className={`pos-product-card pos-fade-in pos-delay-${(index % 4) + 1}`}
                    style={posLayoutStyles.productCard}
                    onClick={() => handleAddToCart(product)}
                  >
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
                          background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center"
                        }}>
                          <ShopOutlined style={{ fontSize: 40, color: posColors.primary, opacity: 0.35 }} />
                        </div>
                      )}
                    </div>
                    <div style={posLayoutStyles.productInfo} className="pos-product-info-mobile">
                      <Text ellipsis style={posLayoutStyles.productName} className="pos-product-name-mobile">
                        {product.display_name}
                      </Text>
                      <Tag color="blue" style={{ fontSize: 10, marginBottom: 8 }}>
                        {getProductCategoryName(product)}
                      </Tag>
                      <div style={posLayoutStyles.productFooter}>
                        <Text style={posLayoutStyles.productPrice} className="pos-product-price-mobile">
                          {formatPrice(Number(product.price))}
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
                  </div>
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
            <div style={posLayoutStyles.emptyContainer}>
              <Empty description="ไม่พบเมนู" />
            </div>
          )}
        </div>



        {/* Floating Cart Button (Always Visible) */}
        <div className="pos-floating-btn-container">
          <Badge count={getTotalItems()} size="default" offset={[-5, 5]}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<ShoppingCartOutlined style={{ fontSize: 22 }} />}
              onClick={() => setCartVisible(true)}
              style={posLayoutStyles.floatingCartButton}
            />
          </Badge>
        </div>

        {/* Cart Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={posCartStyles.cartHeader}>
                <ShoppingCartOutlined style={{ fontSize: 18, color: posColors.primary }} />
                <span>ตะกร้าสินค้า</span>
                <Badge count={getTotalItems()} style={{ marginLeft: 8 }} />
              </div>
              <Button
                danger
                type="text"
                onClick={() => {
                  if (cartItems.length > 0) {
                    Modal.confirm({
                      title: 'ล้างตะกร้า',
                      content: 'คุณต้องการล้างสินค้าทั้งหมดในตะกร้าใช่หรือไม่?',
                      okText: 'ใช่, ล้างตะกร้า',
                      cancelText: 'ยกเลิก',
                      okType: 'danger',
                      onOk: () => {
                        clearCart();
                        message.success('ล้างตะกร้าเรียบร้อยแล้ว');
                        setCartVisible(false);
                      }
                    });
                  }
                }}
                icon={<DeleteOutlined />}
                style={{ fontSize: 16 }}
              >
                ล้างตะกร้า
              </Button>
            </div>
          }
          placement="right"
          width={420}
          open={cartVisible}
          onClose={() => setCartVisible(false)}
          footer={
            cartItems.length > 0 && (
              <div style={{ padding: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">รวมเป็นเงิน</Text>
                  <Text strong style={{ fontSize: 16 }}>{formatPrice(getSubtotal())}</Text>
                </div>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleCheckout}
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    height: 48,
                    fontWeight: 600,
                    fontSize: 16
                  }}
                >
                  ดำเนินการสั่งออเดอร์
                </Button>
              </div>
            )
          }
        >
          {cartItems.length > 0 ? (
            <List
              dataSource={cartItems}
              renderItem={(item) => (
                <List.Item style={posCartStyles.cartItem}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ marginRight: 12, flexShrink: 0 }}>
                        {hasProductImage(item.product) ? (
                          <Image
                            src={item.product.img_url!}
                            alt={item.product.product_name}
                            width={50}
                            height={50}
                            style={posCartStyles.cartItemImage}
                          />
                        ) : (
                          <div style={{
                            ...posCartStyles.cartItemImage,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <ShopOutlined style={{ fontSize: 20, color: '#ccc' }} />
                          </div>
                        )}
                      </div>

                      <div style={posCartStyles.cartItemInfo}>
                        <Text strong style={posCartStyles.cartItemName}>
                          {item.product.display_name}
                        </Text>
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={posCartStyles.cartItemPrice}>
                            {formatPrice(Number(item.product.price))} / {item.product.unit?.display_name || 'ชิ้น'}
                          </Text>
                        </div>
                        
                        {/* Selected Toppings/Details Display */}
                        {item.details && item.details.length > 0 && (
                          <div style={{ marginTop: 4, padding: '4px 8px', background: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
                            {item.details.map((t, idx) => (
                              <div key={`${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 11, color: '#52c41a' }}>+ {t.detail_name}</Text>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Text style={{ fontSize: 11, color: '#52c41a' }}>{formatPrice(Number(t.extra_price))}</Text>
                                  <Button 
                                    type="text" 
                                    size="small" 
                                    danger 
                                    icon={<DeleteOutlined style={{ fontSize: 10 }} />} 
                                    onClick={() => removeDetailFromItem(item.cart_item_id, idx)}
                                    style={{ height: 16, width: 16, padding: 0 }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <div style={posCartStyles.cartItemNote}>
                            <Text type="warning" style={{ fontSize: 11 }}>
                              <EditOutlined style={{ marginRight: 4 }} />
                              {item.notes}
                            </Text>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ color: posColors.primary, fontSize: 12 }} />}
                          onClick={() => openNoteModal(item.cart_item_id, item.product.display_name, item.notes || "")}
                          style={{ background: '#f0f7ff', borderRadius: 6, fontSize: 11, fontWeight: 500, padding: '0 8px', height: 24 }}
                        >
                          โน้ต
                        </Button>
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined style={{ color: '#52c41a', fontSize: 12 }} />}
                          onClick={() => openDetailModal(item.cart_item_id, item.product.display_name, item.details)}
                          style={{ background: '#f6ffed', borderRadius: 6, fontSize: 11, fontWeight: 500, padding: '0 8px', height: 24 }}
                        >
                          ท็อปปิ้ง
                        </Button>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                          onClick={() => removeFromCart(item.cart_item_id)}
                          style={{ background: '#fff1f0', borderRadius: 6, fontSize: 11, fontWeight: 500, padding: '0 8px', height: 24 }}
                        >
                          ลบ
                        </Button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <div style={posCartStyles.quantityControl}>
                        <MinusOutlined
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                          style={{ fontSize: 12, cursor: 'pointer', padding: 4 }}
                        />
                        <Text style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>
                        <PlusOutlined
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          style={{ fontSize: 12, cursor: 'pointer', padding: 4 }}
                        />
                      </div>
                      <Text strong style={{ fontSize: 15 }}>
                        {formatPrice((Number(item.product.price) + (item.details || []).reduce((sum, d) => sum + Number(d.extra_price), 0)) * item.quantity)}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 36, opacity: 0.5 }}>
              <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <Text>ยังไม่มีสินค้าในตะกร้า</Text>
            </div>
          )}

          {/* Checkout Drawer (Nested) */}
          {cartVisible && (
            <Drawer
              title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCartOutlined /> สรุปรายการออเดอร์</div>}
              width={400}
              open={checkoutVisible}
              onClose={() => setCheckoutVisible(false)}
              footer={
                <div style={{ padding: '12px 16px' }}>
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={isProcessing}
                    onClick={handleConfirm}
                    style={{
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      border: 'none',
                      height: 52,
                      fontWeight: 700,
                      fontSize: 18,
                      borderRadius: 12,
                      boxShadow: '0 4px 12px rgba(24, 144, 255, 0.35)'
                    }}
                  >
                    ยืนยันการสั่งออเดอร์
                  </Button>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Itemized List */}
                <section>
                  <Title level={5} style={{ marginBottom: 12 }}>รายการที่สั่ง</Title>
                  <List
                    itemLayout="horizontal"
                    dataSource={cartItems}
                    renderItem={(item) => (
                      <div key={item.cart_item_id} style={{ 
                        display: 'flex', 
                        gap: 12, 
                        padding: '12px 0', 
                        borderBottom: '1px dashed #f0f0f0' 
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid #f0f0f0' }}>
                          {item.product.img_url ? (
                            <img src={item.product.img_url} alt={item.product.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShopOutlined style={{ fontSize: 16, color: '#ccc' }} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text strong style={{ fontSize: 13, display: 'block' }}>{item.product.display_name}</Text>
                                
                                {/* Item Actions */}
                                <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 8 }}>
                                    <Button 
                                        type="text" 
                                        size="small" 
                                        icon={<EditOutlined style={{ color: posColors.primary, fontSize: 12 }} />} 
                                        onClick={() => {
                                            setCheckoutVisible(false);
                                            openNoteModal(item.cart_item_id, item.product.display_name, item.notes || "");
                                        }}
                                        style={{ height: 22, padding: '0 4px', fontSize: 10, background: '#f0f7ff', borderRadius: 4 }}
                                    >
                                        โน้ต
                                    </Button>
                                    <Button 
                                        type="text" 
                                        size="small" 
                                        icon={<PlusOutlined style={{ color: '#52c41a', fontSize: 12 }} />} 
                                        onClick={() => {
                                            setCheckoutVisible(false);
                                            openDetailModal(item.cart_item_id, item.product.display_name, item.details);
                                        }}
                                        style={{ height: 22, padding: '0 4px', fontSize: 10, background: '#f6ffed', borderRadius: 4 }}
                                    >
                                        ท็อปปิ้ง
                                    </Button>
                                </div>

                                {/* Price Breakdown Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>ราคาอาหาร</Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{formatPrice(Number(item.product.price))}</Text>
                                    </div>
                                    
                                    {item.details && item.details.map((d: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 11, color: '#52c41a' }}>+ {d.detail_name}</Text>
                                            <Text style={{ fontSize: 11, color: '#52c41a' }}>{formatPrice(Number(d.extra_price))}</Text>
                                        </div>
                                    ))}

                                    <div style={{ marginTop: 2 }}>
                                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 500 }}>จำนวน: x{item.quantity}</Text>
                                    </div>
                                </div>

                                {item.notes && (
                                    <div style={{ marginTop: 6, padding: '4px 8px', background: '#fffbe6', borderRadius: 4, borderLeft: '3px solid #faad14' }}>
                                        <Text italic style={{ fontSize: 11, color: '#d46b08' }}>โน๊ต: {item.notes}</Text>
                                    </div>
                                )}
                            </div>
                            <Text strong style={{ fontSize: 14, marginLeft: 12, color: posColors.primary }}>
                                {formatPrice((Number(item.product.price) + (item.details || []).reduce((sum, d) => sum + Number(d.extra_price), 0)) * item.quantity)}
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </section>

                {/* Category Summary */}
                <section style={{ background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <Text strong style={{ fontSize: 13, marginBottom: 8, display: 'block', color: '#64748b' }}>สรุป</Text>
                  {(() => {
                    const categories: Record<string, number> = {};
                    cartItems.forEach(item => {
                      const catName = item.product.category?.display_name || 'อื่นๆ';
                      categories[catName] = (categories[catName] || 0) + item.quantity;
                    });
                    return Object.entries(categories).map(([name, count]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{name}</Text>
                        <Text strong style={{ fontSize: 12 }}>{count} รายการ</Text>
                      </div>
                    ));
                  })()}
                </section>

                {/* Totals */}
                <section style={{ background: '#fff', padding: '16px 4px', borderTop: '2px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>รวมจำนวนทั้งหมด</Text>
                    <Text strong style={{ fontSize: 14 }}>{getTotalItems()} รายการ</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 700 }}>ยอดรวมสุทธิ</Text>
                    <Text style={{ fontSize: 28, fontWeight: 800, color: '#1890ff' }}>
                      {formatPrice(getFinalPrice())}
                    </Text>
                  </div>
                </section>
              </div>
            </Drawer>
          )}

          {/* Note Modal */}
          <Modal
            title={`ระบุรายละเอียดเพิ่มเติม: ${currentNoteItem?.name}`}
            open={isNoteModalVisible}
            onOk={handleSaveNote}
            onCancel={() => {
              setIsNoteModalVisible(false);
              setCurrentNoteItem(null);
            }}
            okText="บันทึก"
            cancelText="ยกเลิก"
            centered
          >
            <div style={{ padding: '10px 0' }}>
              <Text style={{ display: 'block', marginBottom: 8 }}>รายละเอียด / หมายเหตุ</Text>
              <Input.TextArea
                rows={4}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="เช่น ไม่ใส่ผัก, หวานน้อย, แยกน้ำ..."
                maxLength={200}
                showCount
              />
            </div>
          </Modal>

          
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
        </Drawer>
      </div>
    </>
  );
}

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

  const handleUpdateDetail = (index: number, field: string, value: any) => {
    const newDetails = [...details];
    // @ts-ignore
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const handleSave = () => {
    onSave(details.filter(d => d.detail_name.trim() !== ''));
    onClose();
  };

  return (
    <Modal
      title={`รายละเอียดเพิ่มเติม: ${item?.name}`}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>ยกเลิก</Button>,
        <Button key="save" type="primary" onClick={handleSave}>บันทึก</Button>
      ]}
      width={500}
      centered
    >
      <div style={{ padding: '10px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong>รายการเพิ่มเติม</Text>
          <Button 
            type="dashed" 
            size="small"
            icon={<PlusOutlined />} 
            onClick={handleAddDetail}
          >
            เพิ่มรายการ
          </Button>
        </div>
        
        {details.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', background: '#f5f5f5', borderRadius: 8, color: '#999' }}>
            ไม่มีรายการเพิ่มเติม
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {details.map((detail, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input 
                  placeholder="ชื่อรายการ" 
                  value={detail.detail_name}
                  onChange={(e) => handleUpdateDetail(index, 'detail_name', e.target.value)}
                  style={{ flex: 2 }}
                />
                <InputNumber
                  placeholder="ราคา"
                  value={detail.extra_price}
                  onChange={(val) => handleUpdateDetail(index, 'extra_price', val || 0)}
                  style={{ flex: 1 }}
                  min={0}
                />
                <Button 
                  danger 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleRemoveDetail(index)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
