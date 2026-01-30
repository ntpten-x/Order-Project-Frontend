import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Modal, Input, Button, List, Typography, Space, Tag, Empty, Grid, Divider, message, InputNumber } from 'antd';
import { 
    SearchOutlined, 
    PlusOutlined, 
    MinusOutlined, 
    ShoppingCartOutlined,
    ArrowLeftOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { categoryService } from '@/services/pos/category.service';
import { productsService } from '@/services/pos/products.service';
import { Category } from '@/types/api/pos/category';
import { Products } from '@/types/api/pos/products';
import { orderDetailStyles, orderDetailColors, modalStyles, addItemsModalStyles, ordersResponsiveStyles } from '@/theme/pos/orders/style';
import { formatCurrency, calculateItemTotal } from "@/utils/orders";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";

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
            setCategories(categoriesRes);
        } catch {
            message.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            hideLoading();
        }
    }, [showLoading, hideLoading]);

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
            destroyOnClose
            centered
        >
            <style jsx global>{ordersResponsiveStyles}</style>
            
            {/* Modal Header */}
            <div style={modalStyles.modalHeader}>
                {selectedProduct ? (
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => setSelectedProduct(null)}
                        style={{ height: 40, width: 40, borderRadius: '50%' }}
                    />
                ) : (
                    <Button 
                        type="text" 
                        icon={<CloseOutlined />} 
                        onClick={onClose}
                        style={{ height: 40, width: 40, borderRadius: '50%' }}
                    />
                )}
                <Text strong style={{ fontSize: 20, flex: 1 }}>
                    {selectedProduct ? 'ระบุรายละเอียด' : 'เลือกสินค้า'}
                </Text>
            </div>

            {!selectedProduct ? (
                <>
                    {/* Sticky Search & Filter Bar */}
                    <div style={{...addItemsModalStyles.searchBar, paddingBottom: 8}}>
                        <Input 
                            placeholder="ค้นหาสินค้าหรือรหัส..." 
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
                            paddingBottom: 4,
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
                                    minWidth: 70,
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
                                        border: selectedCategoryId === cat.id ? 'none' : `1px solid ${orderDetailColors.border}`
                                    }}
                                >
                                    {cat.display_name || cat.category_name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="order-detail-content" style={{ maxHeight: 'calc(100vh - 130px)', overflowY: 'auto' }}>
                        <div className="product-grid" style={addItemsModalStyles.productGrid}>
                                {filteredProducts.map(item => (
                                    <div 
                                        key={item.id}
                                        className="product-card-hoverable scale-in"
                                        style={addItemsModalStyles.productCard}
                                        onClick={() => handleSelectProduct(item)}
                                    >
                                        <div style={{ position: 'relative', width: '100%', height: 120 }}>
                                            {item.img_url ? (
                                                <>
                                                    <Image 
                                                        alt={item.display_name} 
                                                        src={item.img_url} 
                                                        fill
                                                        style={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />
                                                </>
                                            ) : (
                                                <div style={addItemsModalStyles.productPlaceholder}>
                                                    <ShoppingCartOutlined style={{ fontSize: 24, opacity: 0.3 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={addItemsModalStyles.productInfo}>
                                            <div style={{...addItemsModalStyles.productName, fontSize: 18, lineHeight: 1.3 }}>
                                                {item.display_name}
                                            </div>
                                            <Text style={{...addItemsModalStyles.productPrice, fontSize: 16 }}>
                                                {formatCurrency(item.price)}
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        
                        {filteredProducts.length === 0 && (
                            <Empty description="ไม่พบสินค้าที่คุณต้องการ" style={{ marginTop: 60 }} />
                        )}
                    </div>
                </>
            ) : (
                <div style={addItemsModalStyles.detailSection}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Product Large Info */}
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            {selectedProduct.img_url ? (
                                <>
                                    <Image 
                                        src={selectedProduct.img_url} 
                                        alt={selectedProduct.display_name}
                                        width={100}
                                        height={100}
                                        style={{ objectFit: 'cover', borderRadius: 12 }} 
                                    />
                                </>
                            ) : (
                                <div style={{ width: 100, height: 100, background: orderDetailColors.backgroundSecondary, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ShoppingCartOutlined style={{ fontSize: 32, opacity: 0.2 }} />
                                </div>
                            )}
                            <div>
                                <Title level={4} style={{ margin: '0 0 4px 0', fontSize: 22 }}>{selectedProduct.display_name}</Title>
                                <Text style={{ fontSize: 22, fontWeight: 700, color: orderDetailColors.primary }}>
                                    ฿{Number(selectedProduct.price).toLocaleString()}
                                </Text>
                            </div>
                        </div>

                        <Divider style={{ margin: '0' }} />

                        {/* Quantity Control */}
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>จำนวน</Text>
                            <div style={modalStyles.quantityControl}>
                                <Button
                                    type="primary"
                                    icon={<MinusOutlined />}
                                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                    disabled={quantity <= 1}
                                    style={{...modalStyles.quantityButton, background: orderDetailColors.white, color: orderDetailColors.primary, border: `1px solid ${orderDetailColors.primary}`}}
                                />
                                <div style={modalStyles.quantityDisplay}>{quantity}</div>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setQuantity(prev => prev + 1)}
                                    style={modalStyles.quantityButton}
                                />
                            </div>
                        </div>

                        {/* Extras Section */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text strong style={{ fontSize: 16 }}>ตัวเลือกเพิ่มเติม (Optional)</Text>
                                <Button 
                                    size="small" 
                                    type="dashed" 
                                    onClick={addDetail} 
                                    icon={<PlusOutlined />}
                                >
                                    เพิ่ม
                                </Button>
                            </div>
                            {details.map((detail) => (
                                <div key={detail.id} style={addItemsModalStyles.detailItemRow}>
                                    <Input 
                                        placeholder="ไข่ดาว, พิเศษ..." 
                                        value={detail.name} 
                                        onChange={e => updateDetail(detail.id, 'name', e.target.value)}
                                        style={{ flex: 1, borderRadius: 8 }}
                                    />
                                    <InputNumber<number> 
                                        placeholder="0.00" 
                                        value={detail.price} 
                                        onChange={v => updateDetail(detail.id, 'price', v || 0)}
                                        style={{ width: 100, borderRadius: 8, height: 40 }}
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
                                        type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={() => removeDetail(detail.id)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>หมายเหตุ</Text>
                            <Input.TextArea 
                                rows={2} 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย..."
                                style={{ borderRadius: 12, fontSize: 16, padding: '10px' }}
                            />
                        </div>

                        {/* Total & Action Bar */}
                        <div style={{ marginTop: 20 }}>
                            <div style={{...modalStyles.priceCard, marginBottom: 16, padding: '16px'}}>
                                <Text strong style={{ fontSize: 16 }}>ยอดรวมรายการนี้</Text>
                                <Text style={{...modalStyles.priceValue, fontSize: 24}}>
                                    {formatCurrency(calculateTotalPrice())}
                                </Text>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button
                                    onClick={() => setSelectedProduct(null)}
                                    style={modalStyles.secondaryButton}
                                >
                                    ย้อนกลับ
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleConfirmAdd}
                                    icon={<PlusOutlined />}
                                    style={modalStyles.primaryButton}
                                >
                                    เพิ่มลงออเดอร์
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};
