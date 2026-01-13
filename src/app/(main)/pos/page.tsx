"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Typography, Row, Col, Card, Tag, Button, Spin, Empty, Badge, Drawer, List, InputNumber, Divider, message, Pagination } from "antd";
import { ShoppingCartOutlined, DeleteOutlined, MinusOutlined, PlusOutlined, ShopOutlined } from "@ant-design/icons";
import { productsService } from "../../../services/pos/products.service";
import { Products } from "../../../types/api/pos/products";
import { useCart } from "../../../contexts/pos/CartContext";
import { useProducts } from "../../../hooks/pos/useProducts";
import { pageStyles, POSStyles, colors } from "./style";

const { Title, Text, Paragraph } = Typography;

export default function POSPage() {
    const [page, setPage] = useState(1);
    const LIMIT = 12;
    const { products, isLoading, total, mutate } = useProducts(page, LIMIT);
    const [cartVisible, setCartVisible] = useState(false);
    const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();

    const handleAddToCart = (product: Products) => {
        addToCart(product);
        message.success(`เพิ่ม ${product.display_name} ลงตะกร้าแล้ว`);
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
                        <ShopOutlined style={{ fontSize: 28 }} />
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>ระบบขายหน้าร้าน (POS)</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>เลือกสินค้าเพื่อทำรายการขาย (ทั้งหมด {total} รายการ)</Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={pageStyles.contentWrapper}>
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

            {/* Floating Cart Button - Teal/Cyan color for contrast */}
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
                width={380}
                open={cartVisible}
                onClose={() => setCartVisible(false)}
                footer={
                    cartItems.length > 0 && (
                        <div style={{ padding: '12px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                <Text strong style={{ fontSize: 16 }}>รวมทั้งหมด</Text>
                                <Text strong style={{ fontSize: 18, color: colors.success }}>
                                    ฿{getTotalPrice().toLocaleString()}
                                </Text>
                            </div>
                            <Button 
                                type="primary" 
                                block 
                                size="large"
                                style={{ 
                                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                    border: 'none',
                                    height: 44,
                                    fontWeight: 600,
                                }}
                            >
                                ชำระเงิน
                            </Button>
                            <Button 
                                block 
                                size="large"
                                onClick={clearCart}
                                style={{ marginTop: 8, height: 44 }}
                            >
                                ล้างตะกร้า
                            </Button>
                        </div>
                    )
                }
            >
                {cartItems.length > 0 ? (
                    <List
                        dataSource={cartItems}
                        renderItem={(item) => (
                            <List.Item style={{ padding: '14px 0' }}>
                                <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ display: 'block', marginBottom: 3, fontSize: 14 }}>
                                                {item.product.display_name}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                ฿{Number(item.product.price).toLocaleString()} / {item.product.unit?.display_name || 'ชิ้น'}
                                            </Text>
                                        </div>
                                        <Button 
                                            type="text" 
                                            danger 
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => removeFromCart(item.product.id)}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Button 
                                                size="small" 
                                                icon={<MinusOutlined />}
                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                            />
                                            <InputNumber
                                                size="small"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(value) => updateQuantity(item.product.id, value || 1)}
                                                style={{ width: 50, textAlign: 'center' }}
                                            />
                                            <Button 
                                                size="small" 
                                                icon={<PlusOutlined />}
                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                            />
                                        </div>
                                        <Text strong style={{ color: colors.success, fontSize: 15 }}>
                                            ฿{(Number(item.product.price) * item.quantity).toLocaleString()}
                                        </Text>
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <div style={{ textAlign: 'center', padding: 36 }}>
                        <ShoppingCartOutlined style={{ fontSize: 50, color: '#d9d9d9' }} />
                        <div style={{ marginTop: 14 }}>
                            <Text type="secondary">ตะกร้าว่างเปล่า</Text>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
}
