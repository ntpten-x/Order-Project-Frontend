"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Typography, Row, Col, Card, Tag, Button, Spin, Empty, Badge, Drawer, List, message, Pagination, Divider, Input, Modal } from "antd";
import { ShoppingCartOutlined, DeleteOutlined, MinusOutlined, PlusOutlined, ShopOutlined, EditOutlined } from "@ant-design/icons";
import { useCart } from "../../../contexts/pos/CartContext";
import { useProducts } from "../../../hooks/pos/useProducts";
import { pageStyles, POSStyles, colors } from "../../../app/(main)/pos/style";
import { Products } from "../../../types/api/pos/products";

import { categoryService } from "../../../services/pos/category.service";
import { Category } from "../../../types/api/pos/category";

const { Title, Text, Paragraph } = Typography;

interface POSPageLayoutProps {
    title: React.ReactNode;
    subtitle: React.ReactNode;
    icon: React.ReactNode;
    onConfirmOrder: () => Promise<void>;
}

export default function POSPageLayout({ title, subtitle, icon, onConfirmOrder }: POSPageLayoutProps) {
    const [page, setPage] = useState(1);
    const LIMIT = 12;
    
    // Category State
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryService.findAll();
                setCategories(data);
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
        setCheckoutVisible(true);
    };

    const handleConfirm = async () => {
        try {
            setIsProcessing(true);
            await onConfirmOrder();
            // Close drawers on success (assuming onConfirmOrder throws on failure)
            setCheckoutVisible(false);
            setCartVisible(false);
        } catch (error) {
            console.error(error);
            // Error handling is usually done in onConfirmOrder with message.error, but we catch here to stop loading
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={pageStyles.container}>
            <POSStyles />
            
            {/* Hero Section */}
            <div style={pageStyles.heroParams}>
                <div className="hero-pattern" />
                <div className="decorative-circle circle-1" />
                <div className="decorative-circle circle-2" />
                
                <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                        {icon}
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>{title}</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                                {subtitle}
                            </Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={pageStyles.contentWrapper}>
                {/* Category Filter */}
                <div style={{ marginBottom: 24, overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 8, display: 'flex', gap: 8 }}>
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

                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "60px", background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16 }}>
                            <Text type="secondary">กำลังโหลดสินค้า...</Text>
                        </div>
                    </div>
                ) : products.length > 0 ? (
                    <>
                        <Row gutter={[pageStyles.gridConfig.gutter, pageStyles.gridConfig.gutter]}>
                            {products.map((product, index) => (
                                <Col 
                                    xs={24} 
                                    sm={12} 
                                    md={8} 
                                    lg={6} 
                                    xl={6}
                                    key={product.id}
                                >
                                    <div 
                                        className="animate-card product-card" 
                                        style={{ 
                                            ...pageStyles.productCard, 
                                            animationDelay: `${index * 0.04}s` 
                                        }}
                                    >
                                        <Card
                                            hoverable
                                            cover={
                                                <div style={pageStyles.productImage}>
                                                    {product.img_url ? (
                                                        <Image
                                                            alt={product.product_name}
                                                            src={product.img_url}
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                            priority={index < 8}
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
                                                            <ShopOutlined style={{ fontSize: 40, color: colors.primary, opacity: 0.35 }} />
                                                        </div>
                                                    )}
                                                    <div style={pageStyles.priceBadge}>
                                                        ฿{Number(product.price).toLocaleString()}
                                                    </div>
                                                </div>
                                            }
                                            styles={{ body: { padding: 14 } }}
                                            style={{ border: 'none', background: 'transparent' }}
                                        >
                                            <div style={{ marginBottom: 8 }}>
                                                <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 2, color: colors.text }} ellipsis>
                                                    {product.display_name}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {product.product_name}
                                                </Text>
                                            </div>
                                            
                                            <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 12, color: colors.textSecondary, height: 36, marginBottom: 10 }}>
                                                {product.description || "ไม่มีรายละเอียดสินค้า"}
                                            </Paragraph>
                                            
                                            <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                                                <Tag color="blue" style={{ fontSize: 11 }}>{product.category?.display_name || "ไม่มีหมวดหมู่"}</Tag>
                                                <Tag color="cyan" style={{ fontSize: 11 }}>{product.unit?.display_name || "ชิ้น"}</Tag>
                                            </div>
                                            
                                            <Button 
                                                type="primary" 
                                                icon={<ShoppingCartOutlined />} 
                                                onClick={() => handleAddToCart(product)}
                                                style={pageStyles.cartButton}
                                            >
                                                เพิ่มลงตะกร้า
                                            </Button>
                                        </Card>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, padding: '20px 0' }}>
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
                    <div style={{ background: '#fff', borderRadius: 12, padding: 50, textAlign: 'center' }}>
                        <Empty description="ไม่พบสินค้า" />
                    </div>
                )}
            </div>

            {/* Floating Cart Button */}
            <div 
                style={{ 
                    position: 'fixed', 
                    bottom: 24, 
                    right: 24, 
                    zIndex: 1000 
                }}
            >
                <Badge count={getTotalItems()} size="default" offset={[-5, 5]}>
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={<ShoppingCartOutlined style={{ fontSize: 22 }} />}
                        onClick={() => setCartVisible(true)}
                        style={pageStyles.floatingCartButton}
                    />
                </Badge>
            </div>

            {/* Cart Drawer */}
            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShoppingCartOutlined style={{ fontSize: 18, color: colors.secondary }} />
                        <span>ตะกร้าสินค้า</span>
                        <Badge count={getTotalItems()} style={{ marginLeft: 8, backgroundColor: colors.secondary }} />
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
                                <Text strong style={{ fontSize: 16 }}>฿{getSubtotal().toLocaleString()}</Text>
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
                {/* Cart Items List */}
                {cartItems.length > 0 ? (
                    <List
                        dataSource={cartItems}
                        renderItem={(item) => (
                            <List.Item style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        {/* Product Image */}
                                        <div style={{ marginRight: 12, flexShrink: 0 }}>
                                            {item.product.img_url ? (
                                                <Image 
                                                    src={item.product.img_url} 
                                                    alt={item.product.product_name}
                                                    width={50} 
                                                    height={50} 
                                                    style={{ objectFit: 'cover', borderRadius: 8 }} 
                                                />
                                            ) : (
                                                <div style={{ 
                                                    width: 50, 
                                                    height: 50, 
                                                    background: '#f5f5f5', 
                                                    borderRadius: 8, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center' 
                                                }}>
                                                    <ShopOutlined style={{ fontSize: 20, color: '#ccc' }} />
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ display: 'block', marginBottom: 2, fontSize: 14, lineHeight: 1.2 }}>
                                                {item.product.display_name}
                                            </Text>
                                            
                                            {item.product.category?.display_name && (
                                                <div style={{ marginBottom: 4 }}>
                                                    <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', border: 'none', margin: 0 }}>
                                                        {item.product.category.display_name}
                                                    </Tag>
                                                </div>
                                            )}
                                            
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                ฿{Number(item.product.price).toLocaleString()} / {item.product.unit?.display_name || 'ชิ้น'}
                                            </Text>
                                            {item.notes && (
                                                <div style={{ marginTop: 4, background: '#fff7e6', padding: '2px 6px', borderRadius: 4, border: '1px dashed #fa8c16', display: 'inline-block' }}>
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
                                                icon={<EditOutlined style={{ color: colors.primary }} />}
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f5f5', padding: '2px 8px', borderRadius: 20 }}>
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
                                        <Text strong style={{ color: colors.text, fontSize: 15 }}>
                                            ฿{(Number(item.product.price) * item.quantity).toLocaleString()}
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
                
                {cartVisible && (
                     /* Checkout Drawer (Nested) */
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
                        {/* Summary Section */}
                        <div style={{ background: '#fafafa', padding: 20, borderRadius: 12, marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text type="secondary">รวมเป็นเงิน ({getTotalItems()} รายการ)</Text>
                                <Text strong>฿{getSubtotal().toLocaleString()}</Text>
                            </div>
                            
                            <Divider style={{ margin: '12px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: 600 }}>ยอดสุทธิ</Text>
                                <Text style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>
                                    ฿{getFinalPrice().toLocaleString()}
                                </Text>
                            </div>
                        </div>
                    </Drawer>
                )}
                
                {/* Note Edit Modal */}
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
    );
}
