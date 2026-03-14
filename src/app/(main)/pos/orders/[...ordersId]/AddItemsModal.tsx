import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from '../../../../../components/ui/image/SmartImage';
import { App, Button, Divider, Empty, Modal, Space, Tag, Typography, Input } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, DeleteOutlined, MinusOutlined, PictureOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { categoryService } from '../../../../../services/pos/category.service';
import { productsService } from '../../../../../services/pos/products.service';
import { Category } from '../../../../../types/api/pos/category';
import { Products } from '../../../../../types/api/pos/products';
import { Topping } from '../../../../../types/api/pos/topping';
import { addItemsModalStyles, modalStyles, orderDetailColors, ordersResponsiveStyles } from '../../../../../theme/pos/orders/style';
import { calculateItemTotal, formatCurrency } from '../../../../../utils/orders';
import { useGlobalLoading } from '../../../../../contexts/pos/GlobalLoadingContext';
import { OrderType } from '../../../../../types/api/pos/salesOrder';
import { resolveImageSource } from '../../../../../utils/image/source';
import { createToppingOrderDetailDraft, getEligibleProductToppings, getToppingDisplayPrice, loadActiveOrderToppings, OrderItemDetailDraft, OrderItemDetailInput, toOrderItemDetailInputs } from '../../../../../utils/pos/orderToppings';
import { ModalSelector } from '../../../../../components/ui/select/ModalSelector';
import SmartAvatar from '../../../../../components/ui/image/SmartAvatar';
import { posColors, POSSharedStyles } from '../../../../../components/pos/shared/style';
import { formatPrice } from '../../../../../utils/products/productDisplay.utils';

const { Text, Title } = Typography;

interface AddItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItem: (product: Products, quantity: number, notes: string, details: OrderItemDetailInput[]) => Promise<void>;
    orderType?: OrderType;
}

const CACHE_TTL_MS = 60_000;

let catalogCache: { fetchedAt: number; products: Products[]; categories: Category[]; toppings: Topping[] } | null = null;

export const AddItemsModal: React.FC<AddItemsModalProps> = ({ isOpen, onClose, onAddItem, orderType }) => {
    const { message } = App.useApp();
    const { showLoading, hideLoading } = useGlobalLoading();
    const [products, setProducts] = useState<Products[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
    const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [details, setDetails] = useState<OrderItemDetailDraft[]>([]);

    const resetForm = useCallback(() => {
        setSelectedCategoryId(null);
        setSearchText('');
        setSelectedProduct(null);
        setSelectedToppingIds([]);
        setQuantity(1);
        setNotes('');
        setDetails([]);
    }, []);

    const fetchCatalog = useCallback(async () => {
        if (catalogCache && Date.now() - catalogCache.fetchedAt < CACHE_TTL_MS) {
            setProducts(catalogCache.products);
            setCategories(catalogCache.categories);
            setToppings(catalogCache.toppings);
            return;
        }

        try {
            showLoading('กำลังโหลดข้อมูลสินค้า...');
            const [productsRes, categoriesRes, toppingsRes] = await Promise.all([
                productsService.findAll(1, 100),
                categoryService.findAll(),
                loadActiveOrderToppings(),
            ]);
            catalogCache = {
                fetchedAt: Date.now(),
                products: productsRes.data,
                categories: Array.isArray(categoriesRes) ? categoriesRes : [],
                toppings: Array.isArray(toppingsRes) ? toppingsRes : [],
            };
            setProducts(catalogCache.products);
            setCategories(catalogCache.categories);
            setToppings(catalogCache.toppings);
        } catch {
            message.error('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            hideLoading();
        }
    }, [hideLoading, message, showLoading]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
            void fetchCatalog();
        }
    }, [fetchCatalog, isOpen, resetForm]);

    const filteredProducts = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        return products.filter((product) => {
            if (selectedCategoryId && product.category_id !== selectedCategoryId) return false;
            if (!q) return true;
            return product.display_name.toLowerCase().includes(q);
        });
    }, [products, searchText, selectedCategoryId]);

    const getDisplayPrice = useCallback((product: Products) => Number(orderType === OrderType.Delivery ? (product.price_delivery ?? product.price) : product.price), [orderType]);
    const availableToppings = useMemo(() => getEligibleProductToppings(toppings, selectedProduct), [selectedProduct, toppings]);
    const selectableToppings = useMemo(() => availableToppings.filter((topping) => !details.some((detail) => detail.topping_id === topping.id)), [availableToppings, details]);
    
    const toppingOptions = useMemo(
        () => selectableToppings.map(topping => ({
            value: topping.id,
            label: (
                <Space size={12}>
                    <SmartAvatar
                        src={topping.img}
                        alt={topping.display_name}
                        size={32}
                        shape="square"
                        icon={<PictureOutlined style={{ fontSize: 14 }} />}
                        imageStyle={{ objectFit: 'contain' }}
                        style={{
                            borderRadius: 8,
                            flexShrink: 0,
                            background: '#fff',
                            border: '1px solid #E5E7EB',
                        }}
                    />
                    <Text>{topping.display_name} ({formatCurrency(getToppingDisplayPrice(topping, orderType))})</Text>
                </Space>
            ),
            searchLabel: topping.display_name
        })),
        [selectableToppings, orderType]
    );

    const total = useMemo(() => selectedProduct ? calculateItemTotal(getDisplayPrice(selectedProduct), quantity, toOrderItemDetailInputs(details)) : 0, [details, getDisplayPrice, quantity, selectedProduct]);

    const handleAddTopping = useCallback(() => {
        if (selectedToppingIds.length === 0) return;
        const toppingsToAdd = selectableToppings.filter((item) => selectedToppingIds.includes(item.id));
        if (toppingsToAdd.length === 0) return;
        
        setDetails((prev) => [
            ...prev,
            ...toppingsToAdd.map(topping => createToppingOrderDetailDraft(topping, orderType))
        ]);
        setSelectedToppingIds([]);
    }, [orderType, selectableToppings, selectedToppingIds]);

    const confirmAdd = useCallback(async () => {
        if (!selectedProduct) return;
        try {
            showLoading('กำลังเพิ่มรายการ...');
            await onAddItem(selectedProduct, quantity, notes, toOrderItemDetailInputs(details));
            message.success('เพิ่มรายการเรียบร้อย');
            onClose();
        } finally {
            hideLoading();
        }
    }, [details, hideLoading, message, notes, onAddItem, onClose, quantity, selectedProduct, showLoading]);

    const renderDetailRow = (detail: OrderItemDetailDraft) => (
        <div key={detail.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
                style={{
                    flex: 1,
                    minHeight: 54,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: '#F0FDF4',
                    border: '1px solid #DCFCE7',
                }}
            >
                <Space size={10} wrap>
                    <SmartAvatar
                        src={detail.img || toppings.find(t => t.id === detail.topping_id)?.img}
                        alt={detail.detail_name}
                        size={32}
                        shape="square"
                        icon={<PictureOutlined style={{ fontSize: 14 }} />}
                        imageStyle={{ objectFit: 'contain' }}
                        style={{
                            borderRadius: 8,
                            flexShrink: 0,
                            background: '#fff',
                            border: '1px solid #A7F3D0',
                        }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Text strong>{detail.detail_name}</Text>
                        </div>
                    </div>
                </Space>
                <Text style={{ color: posColors.success, fontWeight: 700 }}>
                    +{formatPrice(Number(detail.extra_price || 0))}
                </Text>
            </div>
            <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => setDetails((prev) => prev.filter((item) => item.id !== detail.id))}
                style={{ borderRadius: 8, height: 42, width: 42 }}
            />
        </div>
    );

    return (
        <Modal className="mobile-fullscreen-modal" title={null} open={isOpen} onCancel={onClose} footer={null} width={850} destroyOnHidden centered styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '90vh', maxHeight: '90vh', overflow: 'hidden', borderRadius: 16 } }}>
            <POSSharedStyles />
            <style jsx global>{ordersResponsiveStyles}</style>
            <div style={{ ...modalStyles.modalHeader, flexShrink: 0 }} className="modal-header">
                {selectedProduct ? <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setSelectedProduct(null)} style={{ marginRight: 12 }} /> : null}
                <Text strong style={{ fontSize: 18, flex: 1 }}>{selectedProduct ? 'รายละเอียดสินค้า' : 'เลือกสินค้า'}</Text>
            </div>

            {!selectedProduct ? (
                <>
                    <div style={{ ...addItemsModalStyles.searchBar, paddingBottom: 8, flexShrink: 0 }}>
                        <Input placeholder="ค้นหาสินค้า" prefix={<SearchOutlined />} value={searchText} onChange={(event) => setSearchText(event.target.value)} allowClear style={{ ...addItemsModalStyles.searchInput, marginBottom: 12 }} />
                        <div style={{ display: 'flex', overflowX: 'auto', gap: 8 }}>
                            <Button type={selectedCategoryId === null ? 'primary' : 'default'} onClick={() => setSelectedCategoryId(null)}>ทั้งหมด</Button>
                            {categories.map((category) => <Button key={category.id} type={selectedCategoryId === category.id ? 'primary' : 'default'} onClick={() => setSelectedCategoryId(category.id)}>{category.display_name}</Button>)}
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
                        <div className="product-grid" style={addItemsModalStyles.productGrid}>
                            {filteredProducts.map((product) => (
                                <div key={product.id} style={addItemsModalStyles.productCard} onClick={() => { setSelectedProduct(product); setSelectedToppingIds([]); setQuantity(1); setNotes(''); setDetails([]); }}>
                                    <div style={{ position: 'relative', width: '100%', height: 130, background: orderDetailColors.backgroundSecondary }}>
                                        {product.img_url ? <Image alt={product.display_name} src={resolveImageSource(product.img_url) || undefined} fill style={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }} sizes="(max-width: 768px) 50vw, 25vw" /> : <div style={addItemsModalStyles.productPlaceholder}><ShoppingCartOutlined style={{ fontSize: 28, opacity: 0.3 }} /></div>}
                                    </div>
                                    <div style={addItemsModalStyles.productInfo}>
                                        <div style={addItemsModalStyles.productName}>{product.display_name}</div>
                                        <Text style={addItemsModalStyles.productPrice}>{formatCurrency(getDisplayPrice(product))}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredProducts.length === 0 ? <Empty description="ไม่พบสินค้าที่ต้องการ" style={{ marginTop: 60 }} /> : null}
                    </div>
                </>
            ) : (
                <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', background: orderDetailColors.backgroundSecondary, padding: 16, borderRadius: 16 }}>
                            {selectedProduct.img_url ? <Image src={resolveImageSource(selectedProduct.img_url) || undefined} alt={selectedProduct.display_name} width={80} height={80} style={{ borderRadius: 14, objectFit: 'cover' }} /> : <div style={{ width: 80, height: 80, borderRadius: 14, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCartOutlined style={{ fontSize: 28, color: orderDetailColors.primary }} /></div>}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Title level={5} style={{ margin: 0 }}>{selectedProduct.display_name}</Title>
                                <Space size={8} style={{ marginTop: 6 }} wrap>
                                    {selectedProduct.category?.display_name ? <Tag color="cyan" style={{ margin: 0 }}>{selectedProduct.category.display_name}</Tag> : null}
                                    <Text style={{ color: orderDetailColors.primary, fontWeight: 600 }}>{formatCurrency(getDisplayPrice(selectedProduct))}</Text>
                                </Space>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div
                                style={{
                                    padding: 16,
                                    background: "#F8FAFC",
                                    borderRadius: 12,
                                    border: "1px solid #E2E8F0",
                                }}
                            >
                                <div className="topping-selection-header" style={{ marginBottom: 12 }}>
                                    <Text strong className="topping-selection-label" style={{ color: orderDetailColors.textSecondary }}>เลือกท็อปปิ้ง</Text>
                                </div>
                                <ModalSelector<string>
                                    value={selectedToppingIds}
                                    onChange={(value) => setSelectedToppingIds(value)}
                                    title="เลือกท็อปปิ้ง"
                                    placeholder={availableToppings.length > 0 ? "เลือก" : "ไม่มีท็อปปิ้ง"}
                                    disabled={selectableToppings.length === 0}
                                    style={{ width: "100%", height: 44 }}
                                    showSearch
                                    multiple
                                    options={toppingOptions}
                                />
                                {selectedToppingIds.length > 0 ? (
                                    <div className="topping-selection-actions">
                                        <Space size={12}>
                                            <Button
                                                danger
                                                className="topping-selection-btn btn-clear"
                                                icon={<CloseOutlined style={{ fontSize: 12 }} />}
                                                onClick={() => setSelectedToppingIds([])}
                                            >
                                                ล้าง
                                            </Button>
                                            <Button
                                                type="primary"
                                                className="topping-selection-btn btn-confirm"
                                                icon={<CheckOutlined style={{ fontSize: 12 }} />}
                                                onClick={handleAddTopping}
                                            >
                                                ยืนยัน ({selectedToppingIds.length})
                                            </Button>
                                        </Space>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <Text strong style={{ color: posColors.textSecondary }}>รายการท็อปปิ้ง</Text>
                            </div>
                            {details.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32, background: "#F8FAFC", borderRadius: 12, border: `1px dashed ${orderDetailColors.border}` }}>
                                    <PlusOutlined style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }} />
                                    <div style={{ color: posColors.textSecondary }}>ยังไม่มีรายการท็อปปิ้ง</div>
                                </div>
                            ) : (
                                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                    {details.map(renderDetailRow)}
                                </Space>
                            )}
                        </div>

                        <Divider style={{ margin: '0 0 20px 0' }} />
                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 14 }}>จำนวน</Text>
                            <div style={modalStyles.quantityControl} className="quantity-control">
                                <Button type="primary" icon={<MinusOutlined />} onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} disabled={quantity <= 1} style={{ ...modalStyles.quantityButton, background: orderDetailColors.white, color: orderDetailColors.primary, border: `2px solid ${orderDetailColors.primary}` }} />
                                <div style={modalStyles.quantityDisplay} className="quantity-display">{quantity}</div>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setQuantity((prev) => prev + 1)} style={{ ...modalStyles.quantityButton, background: `linear-gradient(135deg, ${orderDetailColors.primary} 0%, ${orderDetailColors.primaryDark} 100%)`, border: 'none' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 10 }}>หมายเหตุ</Text>
                            <Input.TextArea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="เช่น ไม่หวาน, แยกน้ำ, ไม่ใส่ผัก..." style={{ borderRadius: 12 }} />
                        </div>
                        <div style={{ ...modalStyles.priceCard, marginBottom: 0 }}>
                            <Text strong>ยอดรวมรายการนี้</Text>
                            <Title level={4} style={{ margin: 0, color: orderDetailColors.priceTotal }}>{formatCurrency(total)}</Title>
                        </div>
                    </div>
                    <div style={{ ...modalStyles.actionButtons, flexShrink: 0 }} className="action-buttons">
                        <Button onClick={() => setSelectedProduct(null)} style={modalStyles.secondaryButton}>ย้อนกลับ</Button>
                        <Button type="primary" onClick={confirmAdd} icon={<PlusOutlined />} style={modalStyles.primaryButton}>เพิ่มลงออเดอร์</Button>
                    </div>
                </>
            )}
        </Modal>
    );
};
