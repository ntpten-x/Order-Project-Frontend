import React, { useState, useEffect, useCallback } from 'react';
import Image from '../../../../../components/ui/image/SmartImage';
import { Modal, Input, Button, Typography, Empty, Divider, InputNumber, App, Tag, Space } from 'antd';
import { 
    SearchOutlined, 
    PlusOutlined, 
    MinusOutlined, 
    ShoppingCartOutlined,
    ArrowLeftOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { categoryService } from '../../../../../services/pos/category.service';
import { productsService } from '../../../../../services/pos/products.service';
import { Category } from '../../../../../types/api/pos/category';
import { Products } from '../../../../../types/api/pos/products';
import { orderDetailColors, modalStyles, addItemsModalStyles, ordersResponsiveStyles } from '../../../../../theme/pos/orders/style';
import { formatCurrency, calculateItemTotal } from "../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import { OrderType } from "../../../../../types/api/pos/salesOrder";
import { resolveImageSource } from "../../../../../utils/image/source";

const { Text, Title } = Typography;


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
    orderType?: OrderType;
}

export const AddItemsModal: React.FC<AddItemsModalProps> = ({ isOpen, onClose, onAddItem, orderType }) => {
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

    const getDisplayPrice = useCallback((product: Products): number => {
        return orderType === OrderType.Delivery
            ? (product.price_delivery ?? product.price)
            : product.price;
    }, [orderType]);

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
        const basePrice = getDisplayPrice(selectedProduct);
        const formattedDetails = details.map(d => ({
            detail_name: d.name,
            extra_price: d.price
        }));
        return calculateItemTotal(basePrice, quantity, formattedDetails);
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
            styles={{ 
                body: {
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '90vh',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    borderRadius: 16,
                }
            }}
        >
            <style jsx global>{ordersResponsiveStyles}</style>
            
            {/* Modal Header - Enhanced */}
            <div style={{ ...modalStyles.modalHeader, flexShrink: 0 }} className="modal-header">
                {selectedProduct && (
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => setSelectedProduct(null)}
                        aria-label="กลับ"
                        style={{ 
                            height: 44, 
                            width: 44, 
                            borderRadius: 12,
                            background: orderDetailColors.backgroundSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${orderDetailColors.border}`,
                            marginRight: 12
                        }}
                        className="scale-hover"
                    />
                )}
                <Text strong style={{ fontSize: 18, flex: 1, color: orderDetailColors.text, lineHeight: 1.4 }}>
                    {selectedProduct ? 'ระบุรายละเอียด' : 'เลือกสินค้า'}
                </Text>
            </div>

            {!selectedProduct ? (
                <>
                    {/* Sticky Search & Filter Bar */}
                    <div style={{...addItemsModalStyles.searchBar, paddingBottom: 8, flexShrink: 0}}>
                        <Input 
                            placeholder="ค้นหา" 
                            prefix={<SearchOutlined style={{ color: orderDetailColors.textSecondary }} />} 
                            value={searchText}
                            onChange={handleSearch} 
                            allowClear
                            style={{...addItemsModalStyles.searchInput, marginBottom: 12}}
                        />
                        
                        {/* Categories Scrollable Bar */}
                        <div style={{ 
                            display: 'flex', 
                            overflowX: 'auto', 
                            gap: 8, 
                            paddingBottom: 6,
                            scrollBehavior: 'smooth',
                            scrollbarWidth: 'none', // For Firefox
                            msOverflowStyle: 'none' // For IE/Edge
                        }} className="hide-scrollbar">
                            <Button 
                                size="middle"
                                type={selectedCategoryId === null ? 'primary' : 'default'}
                                onClick={() => handleCategoryClick(null)}
                                style={{ 
                                    borderRadius: 20, 
                                    minWidth: 'max-content',
                                    height: 36,
                                    padding: '0 14px',
                                    whiteSpace: 'nowrap',
                                    flex: '0 0 auto',
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
                                    style={{ 
                                        borderRadius: 20,
                                        minWidth: 'max-content',
                                        height: 36,
                                        padding: '0 14px',
                                        whiteSpace: 'nowrap',
                                        flex: '0 0 auto',
                                        border: selectedCategoryId === cat.id ? 'none' : `1px solid ${orderDetailColors.border}`
                                    }}
                                >
                                    {cat.display_name || cat.category_name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid - Scrollable */}
                    <div className="order-detail-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
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
                                                <>
                                                    <Image 
                                                        alt={item.display_name} 
                                                        src={resolveImageSource(item.img_url) || undefined}
                                                        fill
                                                        style={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                                    />
                                                </>
                                            ) : (
                                                <div style={addItemsModalStyles.productPlaceholder}>
                                                    <ShoppingCartOutlined style={{ fontSize: 28, opacity: 0.3 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={addItemsModalStyles.productInfo} className="product-info">
                                            <div style={{...addItemsModalStyles.productName}} className="product-name">
                                                {item.display_name}
                                            </div>
                                            <Text style={{...addItemsModalStyles.productPrice}} className="product-price">
                                                {formatCurrency(getDisplayPrice(item))}
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        
                        {filteredProducts.length === 0 && (
                            <Empty description="ไม่พบสินค้าที่คุณต้องการ" style={{ marginTop: 60, padding: '40px 20px' }} />
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Detail View - Scrollable Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        {/* Product Section with Image - Styled like EditItemModal */}
                        <div style={{
                            display: 'flex',
                            gap: 16,
                            marginBottom: 24,
                            alignItems: 'center',
                            background: orderDetailColors.backgroundSecondary,
                            padding: 16,
                            borderRadius: 16,
                        }}>
                            <div style={{ flexShrink: 0 }}>
                                {selectedProduct.img_url ? (
                                    <Image 
                                        src={resolveImageSource(selectedProduct.img_url) || undefined}
                                        alt={selectedProduct.display_name}
                                        width={80}
                                        height={80}
                                        style={{ borderRadius: 14, objectFit: 'cover', border: `1px solid ${orderDetailColors.borderLight}` }} 
                                    />
                                ) : (
                                    <div style={{ 
                                        width: 80, 
                                        height: 80, 
                                        background: `linear-gradient(135deg, ${orderDetailColors.primaryLight} 0%, #DBEAFE 100%)`, 
                                        borderRadius: 14, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        flexShrink: 0 
                                    }}>
                                        <ShoppingCartOutlined style={{ fontSize: 28, color: orderDetailColors.primary, opacity: 0.5 }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Title level={5} style={{ margin: 0, fontSize: 18, color: orderDetailColors.text }}>
                                    {selectedProduct.display_name}
                                </Title>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                    {selectedProduct.category?.display_name && (
                                        <Tag color="cyan" style={{ fontSize: 11, margin: 0, borderRadius: 6, fontWeight: 500 }}>
                                            {selectedProduct.category.display_name}
                                        </Tag>
                                    )}
                                    <Text style={{ fontSize: 16, fontWeight: 600, color: orderDetailColors.primary }}>
                                        {formatCurrency(getDisplayPrice(selectedProduct))}
                                    </Text>
                                </div>
                            </div>
                        </div>

                        {/* Additional Options (เพิ่มเติม) - Styled like EditItemModal */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>เพิ่มเติม</Text>
                                <Button 
                                    type="text"
                                    icon={<PlusOutlined style={{ fontSize: 12 }} />}
                                    onClick={addDetail}
                                    style={{
                                        borderRadius: 12,
                                        background: orderDetailColors.primaryLight,
                                        color: orderDetailColors.primary,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        height: 36,
                                        padding: '0 16px',
                                        border: `1px solid ${orderDetailColors.primary}30`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    className="scale-hover"
                                >
                                    เพิ่ม
                                </Button>
                            </div>
                            
                            {details.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '16px',
                                    background: orderDetailColors.backgroundSecondary,
                                    borderRadius: 12,
                                    border: `1px dashed ${orderDetailColors.border}`,
                                }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>ยังไม่มีตัวเลือกเพิ่มเติม</Text>
                                </div>
                            ) : (
                                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                    {details.map((detail) => (
                                        <div key={detail.id} style={{
                                            display: 'flex',
                                            gap: 10,
                                            alignItems: 'center',
                                            padding: '12px 14px',
                                            background: orderDetailColors.backgroundSecondary,
                                            borderRadius: 12,
                                            border: `1px solid ${orderDetailColors.border}`,
                                        }} className="detail-item-row">
                                            <Input 
                                                placeholder="รายการ" 
                                                value={detail.name} 
                                                onChange={e => updateDetail(detail.id, 'name', e.target.value)}
                                                style={{ flex: 2, borderRadius: 10, height: 44, fontSize: 15 }}
                                            />
                                            <InputNumber<number> 
                                                placeholder="0.00" 
                                                value={detail.price} 
                                                onChange={v => updateDetail(detail.id, 'price', v || 0)}
                                                style={{ flex: 1, borderRadius: 10, height: 44, fontSize: 15 }}
                                                inputMode="decimal"
                                                controls={false}
                                                min={0}
                                                precision={2}
                                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as unknown as number}
                                                onKeyDown={(e) => {
                                                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.'];
                                                    if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                    if (e.key === '.' && detail.price.toString().includes('.')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <Button 
                                                danger 
                                                type="text" 
                                                icon={<DeleteOutlined />} 
                                                onClick={() => removeDetail(detail.id)}
                                                style={{ 
                                                    color: orderDetailColors.danger,
                                                    borderRadius: 10,
                                                    width: 44, 
                                                    height: 44 
                                                }}
                                                className="scale-hover"
                                            />
                                        </div>
                                    ))}
                                </Space>
                            )}
                        </div>

                        <Divider style={{ margin: '0 0 20px 0' }} />

                        {/* Quantity Control */}
                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 14, fontSize: 16, color: orderDetailColors.text }}>จำนวน</Text>
                            <div style={modalStyles.quantityControl} className="quantity-control">
                                <Button
                                    type="primary"
                                    icon={<MinusOutlined />}
                                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                    disabled={quantity <= 1}
                                    style={{
                                        ...modalStyles.quantityButton, 
                                        background: orderDetailColors.white, 
                                        color: orderDetailColors.primary, 
                                        border: `2px solid ${orderDetailColors.primary}`,
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

                        {/* Notes */}
                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 16, color: orderDetailColors.text }}>หมายเหตุ</Text>
                            <Input.TextArea 
                                rows={3} 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย..."
                                style={{ borderRadius: 12, fontSize: 15, padding: '12px 14px', lineHeight: 1.5 }}
                            />
                        </div>

                        {/* Total Price Card Summary */}
                        <div style={{...modalStyles.priceCard, marginBottom: 0}}>
                            <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>ยอดรวมรายการนี้</Text>
                            <Title level={4} style={{ margin: 0, color: orderDetailColors.priceTotal, fontSize: 22 }}>
                                {formatCurrency(calculateTotalPrice())}
                            </Title>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ ...modalStyles.actionButtons, flexShrink: 0 }} className="action-buttons">
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
                            เพิ่มลงออเดอร์
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
};
