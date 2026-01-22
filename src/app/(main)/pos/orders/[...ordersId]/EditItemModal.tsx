import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, Typography, Divider } from 'antd';
import { PlusOutlined, MinusOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { SalesOrderItem } from '@/types/api/pos/salesOrderItem';
import { orderDetailColors, modalStyles } from './style';
import { calculateItemTotal } from '@/utils/orders';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface EditItemModalProps {
    item: SalesOrderItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemId: string, quantity: number, notes: string) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, isOpen, onClose, onSave }) => {
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item && isOpen) {
            setQuantity(item.quantity);
            setNotes(item.notes || '');
        }
    }, [item, isOpen]);

    const handleSave = async () => {
        if (!item) return;
        try {
            setSaving(true);
            await onSave(item.id, quantity, notes);
            onClose();
        } catch (error) {
            // Error handled by parent
        } finally {
            setSaving(false);
        }
    };

    const handleIncrement = () => {
        setQuantity(prev => prev + 1);
    };

    const handleDecrement = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    if (!item) return null;

    return (
        <Modal
            className="mobile-fullscreen-modal"
            title={null}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={450}
            destroyOnClose
            centered
            closable={false}
        >
            {/* Custom Header */}
            <div style={{...modalStyles.modalHeader, padding: '12px 16px'}}>
                <Text strong style={{ fontSize: 16, flex: 1 }}>แก้ไขรายการ</Text>
                <Button 
                    type="text" 
                    icon={<CloseOutlined />} 
                    onClick={onClose}
                    style={{ 
                        height: 32, 
                        width: 32, 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: -8 // Adjust to not overlap with potential scrollbar
                    }}
                />
            </div>

            <div style={{ padding: '16px' }}>
                {/* Product Section with Image */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
                    <div style={{ flexShrink: 0 }}>
                        {item.product?.img_url ? (
                            <img src={item.product.img_url} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: `1px solid ${orderDetailColors.border}` }} />
                        ) : (
                            <div style={{ width: 80, height: 80, borderRadius: 12, background: orderDetailColors.backgroundSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <InfoCircleOutlined style={{ fontSize: 24, color: orderDetailColors.textSecondary }} />
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                            {item.product?.display_name || 'ไม่ระบุ'}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            ฿{Number(item.price).toLocaleString()} ต่อชิ้น
                        </Text>
                        {item.details && item.details.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {item.details.map(d => `+ ${d.detail_name}`).join(', ')}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compact Quantity Adjustment */}
                <div style={{ marginBottom: 20 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                        ปรับจำนวน
                    </Text>
                    <div style={{...modalStyles.quantityControl, padding: '10px', borderRadius: 12}}>
                        <Button
                            type="primary"
                            icon={<MinusOutlined />}
                            onClick={handleDecrement}
                            disabled={quantity <= 1}
                            style={{...modalStyles.quantityButton, background: orderDetailColors.white, color: orderDetailColors.primary, border: `1px solid ${orderDetailColors.primary}`}}
                        />
                        <div style={modalStyles.quantityDisplay}>
                            {quantity}
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleIncrement}
                            style={modalStyles.quantityButton}
                        />
                    </div>
                </div>

                {/* Compact Notes */}
                <div style={{ marginBottom: 20 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                        หมายเหตุ / คำแนะนำพิเศษ
                    </Text>
                    <TextArea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="เช่น หวานน้อย, ไม่ใส่น้ำตาล..."
                        rows={2}
                        style={{ borderRadius: 10, padding: '8px 12px', fontSize: 14 }}
                    />
                </div>

                {/* Compact Total Price Card */}
                <div style={{...modalStyles.priceCard, padding: '12px 16px'}}>
                    <Text strong style={{ fontSize: 14 }}>ยอดรวมรายการนี้</Text>
                    <Text style={modalStyles.priceValue}>
                        ฿{calculateItemTotal(item.price, quantity, item.details).toLocaleString()}
                    </Text>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{...modalStyles.actionButtons, padding: '12px 16px'}}>
                <Button
                    onClick={onClose}
                    style={modalStyles.secondaryButton}
                >
                    ยกเลิก
                </Button>
                <Button
                    type="primary"
                    onClick={handleSave}
                    loading={saving}
                    icon={<SaveOutlined />}
                    style={modalStyles.primaryButton}
                >
                    บันทึกแก้ไข
                </Button>
            </div>
        </Modal>
    );
};
