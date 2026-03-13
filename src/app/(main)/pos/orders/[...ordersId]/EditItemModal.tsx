import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Divider, Input, Modal, Space, Tag, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, InfoCircleOutlined, MinusOutlined, PictureOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import Image from '../../../../../components/ui/image/SmartImage';
import { SalesOrderItem } from '../../../../../types/api/pos/salesOrderItem';
import { orderDetailColors, modalStyles, ordersResponsiveStyles } from '../../../../../theme/pos/orders/style';
import { calculateItemTotal, formatCurrency } from '../../../../../utils/orders';
import { useGlobalLoadingDispatch } from '../../../../../contexts/pos/GlobalLoadingContext';
import { resolveImageSource } from '../../../../../utils/image/source';
import { OrderType } from '../../../../../types/api/pos/salesOrder';
import { Topping } from '../../../../../types/api/pos/topping';
import { createOrderDetailDraftFromEntity, createToppingOrderDetailDraft, getEligibleProductToppings, getToppingDisplayPrice, loadActiveOrderToppings, OrderItemDetailDraft, OrderItemDetailInput, toOrderItemDetailInputs } from '../../../../../utils/pos/orderToppings';
import { ModalSelector } from '../../../../../components/ui/select/ModalSelector';
import SmartAvatar from '../../../../../components/ui/image/SmartAvatar';
import { posColors, POSSharedStyles } from '../../../../../components/pos/shared/style';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface EditItemModalProps {
    item: SalesOrderItem | null;
    isOpen: boolean;
    orderType?: OrderType;
    onClose: () => void;
    onSave: (itemId: string, quantity: number, notes: string, details: OrderItemDetailInput[]) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, isOpen, orderType, onClose, onSave }) => {
    const { message } = App.useApp();
    const { showLoading, hideLoading } = useGlobalLoadingDispatch();
    const initializedItemIdRef = useRef<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [details, setDetails] = useState<OrderItemDetailDraft[]>([]);
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) {
            initializedItemIdRef.current = null;
            setQuantity(1);
            setNotes('');
            setDetails([]);
            setSelectedToppingIds([]);
            return;
        }

        void loadActiveOrderToppings()
            .then((items) => setToppings(items))
            .catch(() => setToppings([]));
    }, [isOpen]);

    useEffect(() => {
        if (!item || !isOpen) return;
        if (initializedItemIdRef.current === item.id) return;

        setQuantity(item.quantity);
        setNotes(item.notes || '');
        setDetails(Array.isArray(item.details) ? item.details.map((detail) => createOrderDetailDraftFromEntity(detail)) : []);
        setSelectedToppingIds([]);
        initializedItemIdRef.current = item.id;
    }, [isOpen, item]);

    const availableToppings = useMemo(
        () => getEligibleProductToppings(toppings, item?.product),
        [item?.product, toppings],
    );

    const selectableToppings = useMemo(
        () => availableToppings.filter((topping) => !details.some((detail) => detail.topping_id === topping.id)),
        [availableToppings, details],
    );

    const total = useMemo(
        () => calculateItemTotal(Number(item?.price || 0), quantity, toOrderItemDetailInputs(details)),
        [details, item?.price, quantity],
    );


    const handleAddTopping = useCallback(() => {
        if (selectedToppingIds.length === 0) return;
        
        const toppingsToAdd = availableToppings.filter(t => selectedToppingIds.includes(t.id));
        
        setDetails(prev => [
            ...prev,
            ...toppingsToAdd.map(topping => createToppingOrderDetailDraft(topping, orderType))
        ]);
        setSelectedToppingIds([]);
    }, [orderType, availableToppings, selectedToppingIds]);

    const save = useCallback(async () => {
        if (!item) return;
        try {
            showLoading('กำลังบันทึกการเปลี่ยนแปลง...');
            await onSave(item.id, quantity, notes, toOrderItemDetailInputs(details));
        } catch {
            message.error('บันทึกการเปลี่ยนแปลงไม่สำเร็จ');
        } finally {
            hideLoading();
        }
    }, [details, hideLoading, item, message, notes, onSave, quantity, showLoading]);

    if (!item) return null;

    const toppingOptions = selectableToppings.map(topping => ({
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
    }));

    return (
        <Modal className="mobile-fullscreen-modal" title={null} open={isOpen} onCancel={onClose} footer={null} width={500} destroyOnHidden centered styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '80vh', maxHeight: '80vh', overflow: 'hidden', borderRadius: 16 } }}>
            <POSSharedStyles />
            <style jsx global>{ordersResponsiveStyles}</style>
            <div style={{ ...modalStyles.modalHeader, flexShrink: 0 }} className="modal-header">
                <Text strong style={{ fontSize: 18, flex: 1, color: orderDetailColors.text }}>แก้ไขรายการสินค้า</Text>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', background: orderDetailColors.backgroundSecondary, padding: 16, borderRadius: 16 }}>
                    {item.product?.img_url ? <Image src={resolveImageSource(item.product.img_url) || undefined} alt={item.product?.display_name ?? 'สินค้า'} width={80} height={80} style={{ borderRadius: 14, objectFit: 'cover' }} /> : <div style={{ width: 80, height: 80, borderRadius: 14, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><InfoCircleOutlined style={{ fontSize: 28, color: orderDetailColors.primary }} /></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{ margin: 0 }}>{item.product?.display_name || 'ไม่มีข้อมูลสินค้า'}</Title>
                        <Space size={8} style={{ marginTop: 6 }} wrap>
                            {item.product?.category?.display_name ? <Tag color="cyan" style={{ margin: 0 }}>{item.product.category.display_name}</Tag> : null}
                            <Text style={{ color: orderDetailColors.primary, fontWeight: 600 }}>{formatCurrency(item.price)}</Text>
                        </Space>
                    </div>
                </div>

                <div 
                    style={{ 
                        marginBottom: 16,
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
                        placeholder={availableToppings.length > 0 ? "เลือก" : "ไม่มีท็อปปิ้งสำหรับการสินค้านี้"}
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
                            {details.map((detail) => (
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
                                                <Text strong>{detail.detail_name}</Text>
                                            </div>
                                        </Space>
                                        <Text style={{ color: posColors.success, fontWeight: 700 }}>
                                            +{formatCurrency(detail.extra_price)}
                                        </Text>
                                    </div>
                                    <Button 
                                        danger 
                                        type="text" 
                                        icon={<DeleteOutlined />} 
                                        onClick={() => setDetails((prev) => prev.filter((itemDetail) => itemDetail.id !== detail.id))} 
                                        style={{ borderRadius: 8, height: 42, width: 42 }}
                                    />
                                </div>
                            ))}
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
                    <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="เช่น ไม่หวาน, แยกน้ำ, ไม่ใส่ผัก..." rows={3} style={{ borderRadius: 12 }} />
                </div>
                <div style={modalStyles.priceCard}>
                    <Text strong>ราคารวมทั้งหมด</Text>
                    <Title level={4} style={{ margin: 0, color: orderDetailColors.priceTotal }}>{formatCurrency(total)}</Title>
                </div>
            </div>
            <div style={{ ...modalStyles.actionButtons, flexShrink: 0 }} className="action-buttons">
                <Button onClick={onClose} style={modalStyles.secondaryButton}>ยกเลิก</Button>
                <Button type="primary" onClick={save} icon={<SaveOutlined />} style={modalStyles.primaryButton}>บันทึกการเปลี่ยนแปลง</Button>
            </div>
        </Modal>
    );
};
