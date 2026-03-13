import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from '../../../../../components/ui/image/SmartImage';
import { App, Button, Divider, Empty, Input, InputNumber, Modal, Select, Space, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, MinusOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
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
import { createCustomOrderDetailDraft, createToppingOrderDetailDraft, getEligibleProductToppings, getToppingDisplayPrice, loadActiveOrderToppings, OrderItemDetailDraft, OrderItemDetailInput, toOrderItemDetailInputs } from '../../../../../utils/pos/orderToppings';

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
    const [selectedToppingId, setSelectedToppingId] = useState<string | undefined>();
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [details, setDetails] = useState<OrderItemDetailDraft[]>([]);

    const resetForm = useCallback(() => {
        setSelectedCategoryId(null);
        setSearchText('');
        setSelectedProduct(null);
        setSelectedToppingId(undefined);
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
    const total = useMemo(() => selectedProduct ? calculateItemTotal(getDisplayPrice(selectedProduct), quantity, toOrderItemDetailInputs(details)) : 0, [details, getDisplayPrice, quantity, selectedProduct]);

    const updateDetail = useCallback((id: string, field: 'detail_name' | 'extra_price', value: string | number) => {
        setDetails((prev) => prev.map((detail) => detail.id !== id ? detail : {
            ...detail,
            [field]: field === 'extra_price' ? (typeof value === 'number' ? value : Number(value) || 0) : String(value),
        }));
    }, []);

    const addSelectedTopping = useCallback(() => {
        if (!selectedToppingId) return;
        const topping = selectableToppings.find((item) => item.id === selectedToppingId);
        if (!topping) {
            message.warning('ท็อปปิ้งนี้ถูกเลือกแล้วหรือไม่พร้อมใช้งาน');
            return;
        }
        setDetails((prev) => [...prev, createToppingOrderDetailDraft(topping, orderType)]);
        setSelectedToppingId(undefined);
    }, [message, orderType, selectableToppings, selectedToppingId]);

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
        <div key={detail.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, background: orderDetailColors.backgroundSecondary, borderRadius: 12, border: `1px solid ${orderDetailColors.border}` }}>
            {detail.source === 'topping' ? (
                <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Space size={8} wrap>
                            <Tag color="gold" style={{ margin: 0, borderRadius: 999 }}>Topping</Tag>
                            <Text strong>{detail.detail_name}</Text>
                        </Space>
                    </div>
                    <Text style={{ color: orderDetailColors.primary, fontWeight: 600 }}>{formatCurrency(detail.extra_price)}</Text>
                </>
            ) : (
                <>
                    <Input placeholder="รายการ" value={detail.detail_name} onChange={(event) => updateDetail(detail.id, 'detail_name', event.target.value)} style={{ flex: 1, borderRadius: 10 }} />
                    <InputNumber<number> placeholder="0.00" value={detail.extra_price} onChange={(value) => updateDetail(detail.id, 'extra_price', value || 0)} style={{ width: 140 }} min={0} controls={false} precision={2} />
                </>
            )}
            <Button danger type="text" icon={<DeleteOutlined />} onClick={() => setDetails((prev) => prev.filter((item) => item.id !== detail.id))} />
        </div>
    );

    return (
        <Modal className="mobile-fullscreen-modal" title={null} open={isOpen} onCancel={onClose} footer={null} width={850} destroyOnHidden centered styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '90vh', maxHeight: '90vh', overflow: 'hidden', borderRadius: 16 } }}>
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
                                <div key={product.id} style={addItemsModalStyles.productCard} onClick={() => { setSelectedProduct(product); setSelectedToppingId(undefined); setQuantity(1); setNotes(''); setDetails([]); }}>
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
                            <Text strong style={{ display: 'block', marginBottom: 10 }}>เลือกท็อปปิ้ง</Text>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: 16, background: orderDetailColors.backgroundSecondary, borderRadius: 14 }}>
                                <Select placeholder={availableToppings.length > 0 ? 'เลือกท็อปปิ้งสำหรับสินค้านี้' : 'ไม่มีท็อปปิ้งที่ตรงกับหมวดสินค้า'} value={selectedToppingId} onChange={(value) => setSelectedToppingId(value)} disabled={selectableToppings.length === 0} style={{ flex: 1, minWidth: 220 }} options={selectableToppings.map((topping) => ({ value: topping.id, label: `${topping.display_name} (${formatCurrency(getToppingDisplayPrice(topping, orderType))})` }))} showSearch optionFilterProp="label" />
                                <Button type="primary" icon={<PlusOutlined />} onClick={addSelectedTopping} disabled={!selectedToppingId}>เพิ่มท็อปปิ้ง</Button>
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <Text strong>รายละเอียดเพิ่มเติม</Text>
                                <Button type="text" icon={<PlusOutlined />} onClick={() => setDetails((prev) => [...prev, createCustomOrderDetailDraft()])}>เพิ่มข้อความเอง</Button>
                            </div>
                            {details.length === 0 ? <div style={{ textAlign: 'center', padding: 16, background: orderDetailColors.backgroundSecondary, borderRadius: 12, border: `1px dashed ${orderDetailColors.border}` }}><Text type="secondary">ยังไม่มีรายการเพิ่มเติม</Text></div> : <Space direction="vertical" style={{ width: '100%' }} size={12}>{details.map(renderDetailRow)}</Space>}
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
