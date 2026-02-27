import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Input, Button, Typography, Space, Divider, InputNumber, Tag, message } from 'antd';
import Image from '../../../../../components/ui/image/SmartImage';
import { PlusOutlined, MinusOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { SalesOrderItem } from '../../../../../types/api/pos/salesOrderItem';
import { orderDetailColors, modalStyles } from '../../../../../theme/pos/orders/style';
import { calculateItemTotal, formatCurrency } from '../../../../../utils/orders';
import { useGlobalLoadingDispatch } from '../../../../../contexts/pos/GlobalLoadingContext';
import { resolveImageSource } from '../../../../../utils/image/source';

const { Text, Title } = Typography;
const { TextArea } = Input;

const ALLOWED_KEYS = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.'];

interface EditItemModalProps {
    item: SalesOrderItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemId: string, quantity: number, notes: string, details: { detail_name: string; extra_price: number }[]) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, isOpen, onClose, onSave }) => {
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [details, setDetails] = useState<{ detail_name: string; extra_price: number }[]>([]);
    const initializedItemIdRef = useRef<string | null>(null);
    const { showLoading, hideLoading } = useGlobalLoadingDispatch();

    // Initialize state when modal opens with a new item
    useEffect(() => {
        if (item && isOpen) {
            const currentItemId = item.id;
            // Only initialize if it's a different item (different ID)
            if (currentItemId !== initializedItemIdRef.current) {
                setQuantity(item.quantity);
                setNotes(item.notes || '');
                setDetails(item.details ? [...item.details.map(d => ({ detail_name: d.detail_name, extra_price: d.extra_price }))] : []);
                initializedItemIdRef.current = currentItemId;
            }
        }
    }, [item, isOpen]);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            initializedItemIdRef.current = null;
            setQuantity(1);
            setNotes('');
            setDetails([]);
        }
    }, [isOpen]);

    const handleSave = useCallback(async () => {
        if (!item) return;
        try {
            showLoading("กำลังบันทึกการเปลี่ยนแปลง...");
            // Filter out empty details before saving
            const validDetails = details.filter(d => d.detail_name && d.detail_name.trim() !== '');
            await onSave(item.id, quantity, notes, validDetails);
            // Don't close immediately - let parent handle it after successful save
        } catch {
            // console.error(error);
            message.error("บันทึกการเปลี่ยนแปลงไม่สำเร็จ");
        } finally {
            hideLoading();
        }
    }, [item, quantity, notes, details, onSave, showLoading, hideLoading]);

    const handleIncrement = useCallback(() => {
        setQuantity(prev => prev + 1);
    }, []);

    const handleDecrement = useCallback(() => {
        setQuantity(prev => Math.max(1, prev - 1));
    }, []);

    const handleAddDetail = useCallback(() => {
        setDetails(prevDetails => [...prevDetails, { detail_name: '', extra_price: 0 }]);
    }, []);

    const handleRemoveDetail = useCallback((index: number) => {
        setDetails(prevDetails => prevDetails.filter((_, i) => i !== index));
    }, []);

    const handleUpdateDetail = useCallback((index: number, field: string, value: string | number) => {
        setDetails(prevDetails => {
            const newDetails = [...prevDetails];
            newDetails[index] = { ...newDetails[index], [field]: value };
            return newDetails;
        });
    }, []);

    if (!item) return null;

    return (
        <Modal
            className="mobile-fullscreen-modal"
            title={null}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={500}
            destroyOnHidden
            centered
            closable={false}
            key={item?.id || 'edit-modal'}
            styles={{ 
                body: {
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '80vh',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    borderRadius: 16,
                }
            }}
        >
            {/* Custom Header */}
            <div style={{ ...modalStyles.modalHeader, flexShrink: 0 }} className="modal-header">
                <Text strong style={{ fontSize: 18, flex: 1, color: orderDetailColors.text, lineHeight: 1.4 }}>
                    แก้ไขรายการสินค้า
                </Text>
                <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={onClose}
                    aria-label="ปิด"
                    style={{
                        height: 44,
                        width: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        color: orderDetailColors.textSecondary,
                        background: orderDetailColors.backgroundSecondary,
                        border: `1px solid ${orderDetailColors.border}`,
                    }}
                    className="scale-hover"
                />
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {/* Product Section with Image */}
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
                        {item.product?.img_url ? (
                            <Image
                                src={resolveImageSource(item.product.img_url) || undefined}
                                alt={item.product?.display_name ?? "สินค้า"}
                                width={80}
                                height={80}
                                style={{ borderRadius: 14, objectFit: 'cover', border: `1px solid ${orderDetailColors.borderLight}` }}
                            />
                        ) : (
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: 14,
                                background: `linear-gradient(135deg, ${orderDetailColors.primaryLight} 0%, #DBEAFE 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <InfoCircleOutlined style={{ fontSize: 28, color: orderDetailColors.primary, opacity: 0.5 }} />
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{ margin: 0, fontSize: 18, color: orderDetailColors.text }}>
                            {item.product?.display_name || 'ไม่มีข้อมูลสินค้า'}
                        </Title>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            {item.product?.category?.display_name && (
                                <Tag color="cyan" style={{ fontSize: 11, margin: 0, borderRadius: 6, fontWeight: 500 }}>
                                    {item.product.category.display_name}
                                </Tag>
                            )}
                            <Text style={{ fontSize: 16, fontWeight: 600, color: orderDetailColors.primary }}>
                                {formatCurrency(item.price)}
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Toppings / Details Section */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>เพิ่มเติม</Text>
                        <Button
                            type="text"
                            icon={<PlusOutlined style={{ fontSize: 12 }} />}
                            onClick={handleAddDetail}
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
                            {details.map((detail, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'center',
                                    padding: '12px 14px',
                                    background: orderDetailColors.backgroundSecondary,
                                    borderRadius: 12,
                                    border: `1px solid ${orderDetailColors.border}`,
                                }}>
                                    <Input
                                        placeholder="รายการ"
                                        value={detail.detail_name}
                                        onChange={(e) => handleUpdateDetail(index, 'detail_name', e.target.value)}
                                        style={{ flex: 2, borderRadius: 10, height: 44, fontSize: 15 }}
                                    />
                                    <InputNumber<number>
                                        placeholder="ราคาเพิ่ม"
                                        value={detail.extra_price}
                                        onChange={(val) => handleUpdateDetail(index, 'extra_price', val || 0)}
                                        style={{ flex: 1, borderRadius: 10, height: 44, fontSize: 15 }}
                                        inputMode="decimal"
                                        controls={false}
                                        min={0}
                                        precision={2}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => {
                                            const parsed = value!.replace(/\$\s?|(,*)/g, '');
                                            return parsed as unknown as number;
                                        }}
                                        onKeyDown={(e) => {
                                            if (!/^[0-9]$/.test(e.key) && !ALLOWED_KEYS.includes(e.key)) {
                                                e.preventDefault();
                                            }
                                            if (e.key === '.' && detail.extra_price.toString().includes('.')) {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    <Button
                                        danger
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveDetail(index)}
                                        style={{
                                            color: orderDetailColors.danger,
                                            borderRadius: 10,
                                            width: 44,
                                            height: 44,
                                        }}
                                        className="scale-hover"
                                    />
                                </div>
                            ))}
                        </Space>
                    )}
                </div>

                <Divider style={{ margin: '0 0 20px 0' }} />

                {/* Compact Quantity Adjustment */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 14, fontSize: 16, color: orderDetailColors.text }}>
                        จำนวน
                    </Text>
                    <div style={modalStyles.quantityControl} className="quantity-control">
                        <Button
                            type="primary"
                            icon={<MinusOutlined />}
                            onClick={handleDecrement}
                            disabled={quantity <= 1}
                            style={{
                                ...modalStyles.quantityButton, 
                                background: orderDetailColors.white, 
                                color: orderDetailColors.primary, 
                                border: `2px solid ${orderDetailColors.primary}`,
                            }}
                            className="scale-hover quantity-button"
                        />
                        <div style={modalStyles.quantityDisplay} className="quantity-display">
                            {quantity}
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleIncrement}
                            style={{
                                ...modalStyles.quantityButton,
                                background: `linear-gradient(135deg, ${orderDetailColors.primary} 0%, ${orderDetailColors.primaryDark} 100%)`,
                                border: 'none',
                            }}
                            className="scale-hover quantity-button"
                        />
                    </div>
                </div>

                {/* Compact Notes */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 16, color: orderDetailColors.text }}>
                        หมายเหตุ
                    </Text>
                    <TextArea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="เช่น ไม่หวาน, แยกน้ำ, ไม่ใส่ผัก..."
                        rows={3}
                        style={{ borderRadius: 12, padding: '12px 14px', fontSize: 15, lineHeight: 1.5 }}
                    />
                </div>

                {/* Compact Total Price Card */}
                <div style={{...modalStyles.priceCard, marginBottom: 0}}>
                    <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>ราคารวมทั้งหมด</Text>
                    <Title level={4} style={{ margin: 0, color: orderDetailColors.priceTotal, fontSize: 22 }}>
                        ฿{calculateItemTotal(Number(item.price), quantity, details).toLocaleString()}
                    </Title>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ ...modalStyles.actionButtons, flexShrink: 0 }} className="action-buttons">
                <Button
                    onClick={onClose}
                    style={modalStyles.secondaryButton}
                    className="scale-hover secondary-button"
                >
                    ยกเลิก
                </Button>
                <Button
                    type="primary"
                    onClick={handleSave}
                    icon={<SaveOutlined />}
                    style={modalStyles.primaryButton}
                    className="scale-hover primary-button"
                >
                    บันทึกการเปลี่ยนแปลง
                </Button>
            </div>
        </Modal>
    );
};
