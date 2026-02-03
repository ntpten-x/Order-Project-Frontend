// ... imports
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Input, Button, Typography, Space, Divider, InputNumber, Tag, message, Grid } from 'antd';
import Image from 'next/image';
import { PlusOutlined, MinusOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { SalesOrderItem } from '../../../../../types/api/pos/salesOrderItem';
import { orderDetailColors, modalStyles, ordersResponsiveStyles } from '../../../../../theme/pos/orders/style';
import { calculateItemTotal, formatCurrency } from '../../../../../utils/orders';
import { useGlobalLoading } from '../../../../../contexts/pos/GlobalLoadingContext';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

interface EditItemModalProps {
    item: SalesOrderItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemId: string, quantity: number, notes: string, details: { detail_name: string; extra_price: number }[]) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, isOpen, onClose, onSave }) => {
    const screens = useBreakpoint();
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [details, setDetails] = useState<{ detail_name: string; extra_price: number }[]>([]);
    const initializedItemIdRef = useRef<string | null>(null);
    const { showLoading, hideLoading } = useGlobalLoading();

    // Initialize state when modal opens with a new item
    useEffect(() => {
        if (item && isOpen) {
            const currentItemId = item.id;
            // Only initialize if it's a different item (different ID) or if we want to reset on every open (which we usually don't if it's the same item, but here we might want to ensure freshness)
            // Actually, for edit modal, we probably want to reset if the item ID changes OR simply blindly set it if isOpen changes to true.
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
            initializedItemIdRef.current = null;
            // Delay reset slightly to avoid visual flicker during close animation
            const timer = setTimeout(() => {
                setQuantity(1);
                setNotes('');
                setDetails([]);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSave = useCallback(async () => {
        if (!item) return;
        try {
            showLoading("กำลังบันทึกแก้ไข...");
            // Filter out empty details before saving
            const validDetails = details.filter(d => d.detail_name && d.detail_name.trim() !== '');
            await onSave(item.id, quantity, notes, validDetails);
            // Don't close immediately - let parent handle it after successful save
        } catch (error: unknown) {
            console.error(error);
            message.error("บันทึกรายการไม่สำเร็จ");
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
            maskClosable={true}
            style={{ paddingBottom: 0 }}
            styles={{ body: { padding: 0 } }}
        >
            <style jsx global>{ordersResponsiveStyles}</style>
            
            {/* Custom Header */}
            <div style={modalStyles.modalHeader} className="modal-header">
                <Text strong style={{ fontSize: 18, flex: 1, color: orderDetailColors.text, lineHeight: 1.4 }}>
                    แก้ไขรายการ
                </Text>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        // Add delete functionality if needed, for now just a placeholder or could be "Reset"
                        style={{
                            height: 40,
                            width: 40,
                            borderRadius: 12,
                            color: orderDetailColors.danger,
                            background: orderDetailColors.dangerLight,
                            border: 'none',
                        }}
                        className="scale-hover"
                        onClick={() => {
                             setQuantity(1);
                             setNotes('');
                             setDetails([]);
                        }}
                    >
                    </Button>
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={onClose}
                        aria-label="ปิด"
                        style={{
                            height: 40,
                            width: 40,
                            borderRadius: 12,
                            color: orderDetailColors.textSecondary,
                            background: orderDetailColors.backgroundSecondary,
                            border: `1px solid ${orderDetailColors.border}`,
                        }}
                        className="scale-hover"
                    />
                </div>
            </div>

            <div style={{ padding: '0 20px 20px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }} className="custom-scrollbar">
                {/* Product Section with Image */}
                <div style={{
                    display: 'flex',
                    gap: 16,
                    margin: '20px 0 24px',
                    alignItems: 'flex-start',
                    background: orderDetailColors.background,
                    padding: 16,
                    borderRadius: 16,
                    border: `1px solid ${orderDetailColors.borderLight}`
                }}>
                    <div style={{ flexShrink: 0 }}>
                        {item.product?.img_url ? (
                            <Image
                                src={item.product.img_url}
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
                        <Paragraph 
                            ellipsis={{ rows: 2 }}
                            strong
                            style={{ margin: 0, fontSize: 16, color: orderDetailColors.text, lineHeight: 1.3 }}
                        >
                            {item.product?.display_name || 'ไม่ระบุ'}
                        </Paragraph>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {item.product?.category?.display_name && (
                                <Tag color="blue" bordered={false} style={{ fontSize: 11, margin: 0, borderRadius: 6 }}>
                                    {item.product.category.display_name}
                                </Tag>
                            )}
                            <Text style={{ fontSize: 15, fontWeight: 600, color: orderDetailColors.primary }}>
                                {formatCurrency(item.price)}
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Compact Quantity Adjustment */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>
                            จำนวน
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {quantity} หน่วย
                        </Text>
                    </div>
                    
                    <div style={modalStyles.quantityControl} className="quantity-control">
                        <Button
                            type="primary"
                            icon={<MinusOutlined />}
                            onClick={handleDecrement}
                            disabled={quantity <= 1}
                            style={{
                                ...modalStyles.quantityButton, 
                                background: orderDetailColors.white, 
                                color: orderDetailColors.text, // Changed to text color for better contrast when disabled default handles it
                                border: `1px solid ${orderDetailColors.border}`,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
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
                                boxShadow: `0 4px 12px ${orderDetailColors.primary}40`
                            }}
                            className="scale-hover quantity-button"
                        />
                    </div>
                </div>

                <Divider style={{ margin: '0 0 24px 0' }} />

                {/* Toppings / Details Section */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>เพิ่มเติม / Topping</Text>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined style={{ fontSize: 12 }} />}
                            onClick={handleAddDetail}
                            size="small"
                            style={{
                                borderRadius: 8,
                                color: orderDetailColors.primary,
                                borderColor: orderDetailColors.primary,
                                fontSize: 12,
                                fontWeight: 500,
                            }}
                        >
                            เพิ่มรายการ
                        </Button>
                    </div>

                    {details.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '24px',
                            background: orderDetailColors.backgroundSecondary,
                            borderRadius: 16,
                            border: `1px dashed ${orderDetailColors.border}`,
                        }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>ไม่มีรายการเพิ่มเติม</Text>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {details.map((detail, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'center',
                                    padding: '8px',
                                    background: orderDetailColors.white,
                                    borderRadius: 12,
                                    border: `1px solid ${orderDetailColors.border}`,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                }}>
                                    <Input
                                        placeholder="ชื่อรายการ (เช่น เพิ่มไข่ดาว)"
                                        value={detail.detail_name}
                                        onChange={(e) => handleUpdateDetail(index, 'detail_name', e.target.value)}
                                        bordered={false}
                                        style={{ flex: 1, fontSize: 14, padding: '4px 8px' }}
                                    />
                                    <Divider type="vertical" style={{ height: 24, margin: 0 }} />
                                    <InputNumber<number>
                                        placeholder="ราคา"
                                        value={detail.extra_price}
                                        onChange={(val) => handleUpdateDetail(index, 'extra_price', val || 0)}
                                        bordered={false}
                                        style={{ width: 80, fontSize: 14 }}
                                        inputMode="decimal"
                                        controls={false}
                                        min={0}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        className="scale-hover"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveDetail(index)}
                                        size="small"
                                        style={{ 
                                            background: '#FFF1F2', 
                                            color: '#E11D48',
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Compact Notes */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 16, color: orderDetailColors.text }}>
                        หมายเหตุ
                    </Text>
                    <TextArea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ระบุรายละเอียดเพิ่มเติม..."
                        rows={3}
                        style={{ 
                            borderRadius: 14, 
                            padding: '12px 14px', 
                            fontSize: 14, 
                            lineHeight: 1.5,
                            border: `1px solid ${orderDetailColors.border}`,
                            background: orderDetailColors.background
                        }}
                    />
                </div>

                {/* Compact Total Price Card */}
                <div style={modalStyles.priceCard}>
                    <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>รวมทั้งหมด</Text>
                    <Title level={4} style={{ margin: 0, color: orderDetailColors.priceTotal, fontSize: 22 }}>
                        ฿{calculateItemTotal(Number(item.price), quantity, details).toLocaleString()}
                    </Title>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={modalStyles.actionButtons} className="action-buttons">
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
                    บันทึก
                </Button>
            </div>
        </Modal>
    );
};
