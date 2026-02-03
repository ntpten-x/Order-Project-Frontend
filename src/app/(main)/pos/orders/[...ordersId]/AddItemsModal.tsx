
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Modal, Input, Button, Typography, Empty, Divider, InputNumber, App, Tag, Grid } from 'antd';
import { 
    SearchOutlined, 
    PlusOutlined, 
    MinusOutlined, 
    ShoppingCartOutlined,
    ArrowLeftOutlined,
    CloseOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { categoryService } from '../../../../../services/pos/category.service';
import { productsService } from '../../../../../services/pos/products.service';
import { Category } from '../../../../../types/api/pos/category';
import { Products } from '../../../../../types/api/pos/products';
import { orderDetailColors, modalStyles, addItemsModalStyles, ordersResponsiveStyles } from '../../../../../theme/pos/orders/style';
import { formatCurrency, calculateItemTotal } from "../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

type ItemDetailInput = {
    detail_name: string;
    extra_price: number;
};

type DetailFormItem = {
    id: number;
    name: string;
    price: number;
};

interface AddItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItem: (product: Products, quantity: number, notes: string, details: ItemDetailInput[]) => Promise<void>;
}

export const AddItemsModal: React.FC<AddItemsModalProps> = ({ isOpen, onClose, onAddItem }) => {
    const screens = useBreakpoint();
    const { message } = App.useApp();
    const [products, setProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const { showLoading, hideLoading } = useGlobalLoading();
    
    // Selection State
    const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [details, setDetails] = useState<DetailFormItem[]>([]);

    const fetchInitialData = useCallback(async () => {
        try {
            showLoading("กำลังโหลดข้อมูลสินค้า...");
            const [productsRes, categoriesRes] = await Promise.all([
                productsService.findAll(1, 100),
                categoryService.findAll()
            ]);
            setProducts(productsRes.data);
            setFilteredProducts(productsRes.data);
            setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
        } catch {
            message.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            hideLoading();
        }
    }, [showLoading, hideLoading, message]);

    const resetForm = useCallback(() => {
        setQuantity(1);
        setNotes('');
        setDetails([]);
        setSelectedProduct(null);
        setSearchText('');
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            resetForm();
        }
    }, [fetchInitialData, isOpen, resetForm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchText(value);
        applyFilters(value, selectedCategoryId);
    };

    const handleCategoryClick = (categoryId: string | null) => {
        setSelectedCategoryId(categoryId);
        applyFilters(searchText, categoryId);
    };

    const applyFilters = (search: string, categoryId: string | null) => {
        let filtered = products;

        if (categoryId) {
            filtered = filtered.filter(p => p.category_id === categoryId);
        }

        if (search) {
            filtered = filtered.filter(p => 
                p.display_name.toLowerCase().includes(search.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    };

    const handleSelectProduct = (product: Products) => {
        setSelectedProduct(product);
        setQuantity(1);
        setNotes('');
        setDetails([]);
    };

    const addDetail = () => {
        setDetails(prev => [...prev, { id: Date.now(), name: '', price: 0 }]);
    };

    const updateDetail = (id: number, field: 'name' | 'price', value: string | number) => {
        setDetails(prev => prev.map(d => {
            if (d.id !== id) return d;
            if (field === 'price') {
                const price = typeof value === 'number' ? value : Number(value) || 0;
                return { ...d, price };
            }
            return { ...d, name: String(value) };
        }));
    };

    const removeDetail = (id: number) => {
        setDetails(prev => prev.filter(d => d.id !== id));
    };

    const handleConfirmAdd = async () => {
        if (!selectedProduct) return;
        try {
            showLoading("กำลังเพิ่มรายการ...");
            const formattedDetails = details.filter(d => d.name.trim() !== '').map(d => ({
                detail_name: d.name,
                extra_price: d.price
            }));
            await onAddItem(selectedProduct, quantity, notes, formattedDetails);
            message.success("เพิ่มรายการเรียบร้อย");
            onClose();
            setSelectedProduct(null);
        } catch {
            // Error handled by parent
        } finally {
            hideLoading();
        }
    };

    const calculateTotalPrice = () => {
        if (!selectedProduct) return 0;
        const formattedDetails = details.map(d => ({
            detail_name: d.name,
            extra_price: d.price
        }));
        return calculateItemTotal(selectedProduct.price, quantity, formattedDetails);
    };

    return (
        <Modal
            className="mobile-fullscreen-modal"
            title={null}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={850}
            destroyOnHidden
            centered
            closable={false}
            maskClosable={true}
            style={{ paddingBottom: 0, maxWidth: '100vw' }}
            styles={{ body: { padding: 0, height: '100%' } }}
        >
            <style jsx global>{ordersResponsiveStyles}</style>
            
            {/* Modal Header */}
            <div style={modalStyles.modalHeader} className="modal-header">
                {selectedProduct ? (
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => setSelectedProduct(null)}
                        aria-label="กลับ"
                        style={{ 
                            height: 40, 
                            width: 40, 
                            borderRadius: 12,
                            background: orderDetailColors.backgroundSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${orderDetailColors.border}`,
                            marginRight: 8
                        }}
                        className="scale-hover"
                    />
                ) : (
                    <div style={{ width: 0 }} /> /* Spacer if no back button */
                )}
                
                <Text strong style={{ fontSize: 18, flex: 1, color: orderDetailColors.text, lineHeight: 1.4 }}>
                    {selectedProduct ? 'ระบุรายละเอียด' : 'เลือกสินค้า'}
                </Text>

                <Button 
                    type="text" 
                    icon={<CloseOutlined />} 
                    onClick={onClose}
                    aria-label="ปิด"
                    style={{ 
                        height: 40, 
                        width: 40, 
                        borderRadius: 12,
                        background: orderDetailColors.backgroundSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${orderDetailColors.border}`,
                    }}
                    className="scale-hover"
                />
            </div>

            {!selectedProduct ? (
                <>
                    {/* Fixed Search & Filter Section (Flex Item) */}
                    <div style={{
                        padding: '12px 20px',
                        background: orderDetailColors.white,
                        borderBottom: `1px solid ${orderDetailColors.borderLight}`,
                        flexShrink: 0,
                        zIndex: 5
                    }}>
                        <Input 
                            placeholder="ค้นหาสินค้า..." 
                            prefix={<SearchOutlined style={{ color: orderDetailColors.textSecondary }} />} 
                            value={searchText}
                            onChange={handleSearch} 
                            allowClear
                            style={{
                                borderRadius: 12,
                                background: orderDetailColors.backgroundSecondary,
                                border: 'none',
                                padding: '8px 12px',
                                marginBottom: 12
                            }}
                        />
                        
                        {/* Categories Scrollable Bar */}
                        <div style={{ 
                            display: 'flex', 
                            overflowX: 'auto', 
                            gap: 8, 
                            paddingBottom: 4,
                            scrollBehavior: 'smooth',
                        }} className="hide-scrollbar">
                            <Button 
                                size="middle"
                                type={selectedCategoryId === null ? 'primary' : 'default'}
                                onClick={() => handleCategoryClick(null)}
                                shape="round"
                                style={{ 
                                    minWidth: 80,
                                    border: selectedCategoryId === null ? 'none' : `1px solid ${orderDetailColors.border}`
                                }}
                            >
                                ทั้งหมด
                            </Button>
                            {categories.map(cat => (
                                <Button 
                                    key={cat.id}
                                    size="middle"
                                    type={selectedCategoryId === cat.id ? 'primary' : 'default'}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    shape="round"
                                    style={{ 
                                        border: selectedCategoryId === cat.id ? 'none' : `1px solid ${orderDetailColors.border}`
                                    }}
                                >
                                    {cat.display_name || cat.category_name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid (Flex Grow, Scrollable) */}
                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                        <div className="product-grid" style={addItemsModalStyles.productGrid}>
                                {filteredProducts.map(item => (
                                    <div 
                                        key={item.id}
                                        className="product-card-hoverable scale-in"
                                        style={addItemsModalStyles.productCard}
                                        onClick={() => handleSelectProduct(item)}
                                    >
                                        <div style={{ position: 'relative', width: '100%', height: 130, background: orderDetailColors.backgroundSecondary }}>
                                            {item.img_url ? (
                                                <Image 
                                                    alt={item.display_name} 
                                                    src={item.img_url} 
                                                    fill
                                                    style={{ objectFit: 'cover', borderRadius: '18px 18px 0 0' }}
                                                    sizes="(max-width: 768px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div style={addItemsModalStyles.productPlaceholder}>
                                                    <ShoppingCartOutlined style={{ fontSize: 28, opacity: 0.3 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{...addItemsModalStyles.productInfo, minHeight: 80}} className="product-info">
                                            <div style={{...addItemsModalStyles.productName}} className="product-name">
                                                {item.display_name}
                                            </div>
                                            <Text style={{...addItemsModalStyles.productPrice}} className="product-price">
                                                {formatCurrency(item.price)}
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        
                        {filteredProducts.length === 0 && (
                            <Empty description="ไม่พบสินค้า" style={{ marginTop: 60, padding: '40px 20px' }} />
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Detail Scrollable Content (Flex Grow) */}
                    <div className="custom-scrollbar" style={{ 
                        flex: 1,
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column' 
                    }}>
                        <div style={addItemsModalStyles.detailSection} className="detail-section">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* Product Large Info */}
                                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }} className="product-info-section">
                                    {selectedProduct.img_url ? (
                                        <Image 
                                            src={selectedProduct.img_url} 
                                            alt={selectedProduct.display_name}
                                            width={100}
                                            height={100}
                                            style={{ objectFit: 'cover', borderRadius: 16, flexShrink: 0, border: `1px solid ${orderDetailColors.borderLight}` }} 
                                        />
                                    ) : (
                                        <div style={{ width: 100, height: 100, background: orderDetailColors.backgroundSecondary, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <ShoppingCartOutlined style={{ fontSize: 32, opacity: 0.2 }} />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Title level={4} style={{ margin: '0 0 8px 0', fontSize: 20, lineHeight: 1.3 }}>{selectedProduct.display_name}</Title>
                                        <Text style={{ fontSize: 20, fontWeight: 700, color: orderDetailColors.primary, lineHeight: 1.2 }}>
                                            ฿{Number(selectedProduct.price).toLocaleString()}
                                        </Text>
                                        {selectedProduct.category?.display_name && (
                                            <div style={{ marginTop: 8 }}>
                                                <Tag color="cyan" bordered={false}>{selectedProduct.category.display_name}</Tag>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Divider style={{ margin: '0' }} />

                                {/* Quantity Control - Enhanced */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>จำนวน</Text>
                                        <Text type="secondary">{quantity} หน่วย</Text>
                                    </div>
                                    <div style={modalStyles.quantityControl} className="quantity-control">
                                        <Button
                                            type="primary"
                                            icon={<MinusOutlined />}
                                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                            disabled={quantity <= 1}
                                            style={{
                                                ...modalStyles.quantityButton, 
                                                background: orderDetailColors.white, 
                                                color: orderDetailColors.text, 
                                                border: `1px solid ${orderDetailColors.border}`,
                                            }}
                                            className="scale-hover quantity-button"
                                        />
                                        <div style={modalStyles.quantityDisplay} className="quantity-display">{quantity}</div>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => setQuantity(prev => prev + 1)}
                                            style={{
                                                ...modalStyles.quantityButton,
                                                background: `linear-gradient(135deg, ${orderDetailColors.primary} 0%, ${orderDetailColors.primaryDark} 100%)`,
                                                border: 'none',
                                            }}
                                            className="scale-hover quantity-button"
                                        />
                                    </div>
                                </div>

                                {/* Extras Section */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 16 }}>เพิ่มเติม (Topping)</Text>
                                        <Button 
                                            size="small" 
                                            type="dashed" 
                                            onClick={addDetail} 
                                            icon={<PlusOutlined />}
                                            style={{ borderColor: orderDetailColors.primary, color: orderDetailColors.primary }}
                                        >
                                            เพิ่มรายการ
                                        </Button>
                                    </div>
                                    
                                    {details.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', background: orderDetailColors.backgroundSecondary, borderRadius: 12, border: `1px dashed ${orderDetailColors.border}` }}>
                                            <Text type="secondary" style={{ fontSize: 13 }}>ไม่มีรายการเพิ่มเติม</Text>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {details.map((detail) => (
                                                <div key={detail.id} style={{
                                                    display: 'flex',
                                                    gap: 10,
                                                    alignItems: 'center',
                                                    padding: '8px',
                                                    background: orderDetailColors.white,
                                                    borderRadius: 12,
                                                    border: `1px solid ${orderDetailColors.border}`,
                                                }} className="detail-item-row">
                                                    <Input 
                                                        placeholder="ชื่อท็อปปิ้ง..." 
                                                        value={detail.name} 
                                                        onChange={e => updateDetail(detail.id, 'name', e.target.value)}
                                                        bordered={false}
                                                        style={{ flex: 1, fontSize: 14, padding: '4px 8px' }}
                                                    />
                                                    <Divider type="vertical" />
                                                    <InputNumber<number> 
                                                        placeholder="ราคา" 
                                                        value={detail.price} 
                                                        onChange={v => updateDetail(detail.id, 'price', v || 0)}
                                                        bordered={false}
                                                        style={{ width: 80, fontSize: 14 }}
                                                        inputMode="decimal"
                                                        controls={false}
                                                        min={0}
                                    />
                                                    <Button 
                                                        type="text" 
                                                        danger 
                                                        icon={<DeleteOutlined />} 
                                                        onClick={() => removeDetail(detail.id)}
                                                        size="small"
                                                        style={{ background: '#FFF1F2', color: '#E11D48', borderRadius: 8, width: 32, height: 32, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                        className="scale-hover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 16, color: orderDetailColors.text }}>หมายเหตุ</Text>
                                    <Input.TextArea 
                                        rows={3} 
                                        value={notes} 
                                        onChange={(e) => setNotes(e.target.value)} 
                                        placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย..."
                                        style={{ 
                                            borderRadius: 12, 
                                            fontSize: 14, 
                                            padding: '12px 14px', 
                                            lineHeight: 1.5 ,
                                            border: `1px solid ${orderDetailColors.border}`,
                                            background: orderDetailColors.background
                                        }}
                                    />
                                </div>

                                <div style={{ height: 20 }}></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Total & Action Bar - Sticky Bottom (Flex Item) */}
                    <div className="action-buttons" style={{ marginTop: 'auto', background: orderDetailColors.white, borderTop: `1px solid ${orderDetailColors.borderLight}`, flexShrink: 0, zIndex: 10 }}>
                        <div style={{ padding: '16px 20px', background: orderDetailColors.white }}>
                             <div style={modalStyles.priceCard}>
                                <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>รวมทั้งหมด</Text>
                                <Title level={4} style={{ margin: 0, color: orderDetailColors.priceTotal, fontSize: 24 }}>
                                    {formatCurrency(calculateTotalPrice())}
                                </Title>
                            </div>
                        </div>
                        
                        <div style={modalStyles.actionButtons} className="action-buttons">
                            <Button
                                onClick={() => setSelectedProduct(null)}
                                style={modalStyles.secondaryButton}
                                className="scale-hover secondary-button"
                            >
                                ย้อนกลับ
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleConfirmAdd}
                                icon={<PlusOutlined />}
                                style={modalStyles.primaryButton}
                                className="scale-hover primary-button"
                            >
                                เพิ่มรายการนี้
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Modal>
    );
};
