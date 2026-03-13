import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Divider, Input, InputNumber, Modal, Select, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import Image from '../../../../../components/ui/image/SmartImage';
import { SalesOrderItem } from '../../../../../types/api/pos/salesOrderItem';
import { orderDetailColors, modalStyles } from '../../../../../theme/pos/orders/style';
import { calculateItemTotal, formatCurrency } from '../../../../../utils/orders';
import { useGlobalLoadingDispatch } from '../../../../../contexts/pos/GlobalLoadingContext';
import { resolveImageSource } from '../../../../../utils/image/source';
import { OrderType } from '../../../../../types/api/pos/salesOrder';
import { Topping } from '../../../../../types/api/pos/topping';
import { createCustomOrderDetailDraft, createOrderDetailDraftFromEntity, createToppingOrderDetailDraft, getEligibleProductToppings, getToppingDisplayPrice, loadActiveOrderToppings, OrderItemDetailDraft, OrderItemDetailInput, toOrderItemDetailInputs } from '../../../../../utils/pos/orderToppings';

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
    const [selectedToppingId, setSelectedToppingId] = useState<string | undefined>();

    useEffect(() => {
        if (!isOpen) {
            initializedItemIdRef.current = null;
            setQuantity(1);
            setNotes('');
            setDetails([]);
            setSelectedToppingId(undefined);
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
        setSelectedToppingId(undefined);
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

    return (
        <Modal className="mobile-fullscreen-modal" title={null} open={isOpen} onCancel={onClose} footer={null} width={500} destroyOnHidden centered styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '80vh', maxHeight: '80vh', overflow: 'hidden', borderRadius: 16 } }}>
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
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        {details.length === 0 ? <div style={{ textAlign: 'center', padding: 16, background: orderDetailColors.backgroundSecondary, borderRadius: 12, border: `1px dashed ${orderDetailColors.border}` }}><Text type="secondary">ยังไม่มีรายการเพิ่มเติม</Text></div> : null}
                        {details.map((detail) => (
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
                                <Button danger type="text" icon={<DeleteOutlined />} onClick={() => setDetails((prev) => prev.filter((itemDetail) => itemDetail.id !== detail.id))} />
                            </div>
                        ))}
                    </Space>
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
