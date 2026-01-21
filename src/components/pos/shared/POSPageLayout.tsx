"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Typography, Button, Spin, Empty, Badge, Drawer, List, message, Pagination, Divider, Input, Modal, Tag } from "antd";
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
import { categoryService } from "../../../services/pos/category.service";
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
    getTotalItems, 
    getSubtotal,
    getFinalPrice,
  } = useCart();

  // Note Editing State
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [currentNoteItem, setCurrentNoteItem] = useState<{id: string, name: string, note: string} | null>(null);
  const [noteInput, setNoteInput] = useState("");

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
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">กำลังโหลดเมนู...</Text>
              </div>
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
                        {item.notes && (
                          <div style={posCartStyles.cartItemNote}>
                            <Text type="warning" style={{ fontSize: 11 }}>
                              <EditOutlined style={{ marginRight: 4 }} />
                              {item.notes}
                            </Text>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 4 }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ color: posColors.primary }} />}
                          onClick={() => openNoteModal(item.product.id, item.product.display_name, item.notes || "")}
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeFromCart(item.product.id)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <div style={posCartStyles.quantityControl}>
                        <MinusOutlined
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{ fontSize: 12, cursor: 'pointer', padding: 4 }}
                        />
                        <Text style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>
                        <PlusOutlined
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{ fontSize: 12, cursor: 'pointer', padding: 4 }}
                        />
                      </div>
                      <Text strong style={{ fontSize: 15 }}>
                        {formatPrice(Number(item.product.price) * item.quantity)}
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
              title="สรุปรายการออเดอร์"
              width={400}
              open={checkoutVisible}
              onClose={() => setCheckoutVisible(false)}
              footer={
                <div style={{ padding: '12px 0' }}>
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={isProcessing}
                    onClick={handleConfirm}
                    style={{
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      border: 'none',
                      height: 50,
                      fontWeight: 600,
                      fontSize: 18,
                      boxShadow: '0 4px 12px rgba(24, 144, 255, 0.35)'
                    }}
                  >
                    ยืนยันการสั่งออเดอร์
                  </Button>
                </div>
              }
            >
              <div style={posCartStyles.checkoutSummary}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">รวมเป็นเงิน ({formatItemCount(getTotalItems())})</Text>
                  <Text strong>{formatPrice(getSubtotal())}</Text>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 600 }}>ยอดสุทธิ</Text>
                  <Text style={{ fontSize: 24, fontWeight: 700, color: posColors.primary }}>
                    {formatPrice(getFinalPrice())}
                  </Text>
                </div>
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
        </Drawer>
      </div>
    </>
  );
}
