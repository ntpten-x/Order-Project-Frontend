import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Space, Divider, InputNumber, Tag } from 'antd';
import Image from 'next/image';
import { PlusOutlined, MinusOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { SalesOrderItem } from '../../../../../types/api/pos/salesOrderItem';
import { orderDetailColors, modalStyles } from '../../../../../theme/pos/orders/style';
import { calculateItemTotal, formatCurrency } from '../../../../../utils/orders';
import { useGlobalLoading } from '../../../../../contexts/pos/GlobalLoadingContext';

const { Text, Title } = Typography;
const { TextArea } = Input;

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
    const { showLoading, hideLoading } = useGlobalLoading();

    useEffect(() => {
        if (item && isOpen) {
            setQuantity(item.quantity);
            setNotes(item.notes || '');
            setDetails(item.details ? [...item.details.map(d => ({ ...d }))] : []);
        }
    }, [item, isOpen]);

    const handleSave = async () => {
        if (!item) return;
        try {
            showLoading("กำลังบันทึกแก้ไข...");
            await onSave(item.id, quantity, notes, details);
            onClose();
        } catch {
            // Error handled by parent
        } finally {
            hideLoading();
        }
    };

    const handleIncrement = () => {
        setQuantity(prev => prev + 1);
    };

    const handleDecrement = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    const handleAddDetail = () => {
        setDetails([...details, { detail_name: '', extra_price: 0 }]);
    };

    const handleRemoveDetail = (index: number) => {
        setDetails(details.filter((_, i) => i !== index));
    };

    const handleUpdateDetail = (index: number, field: string, value: string | number) => {
        const newDetails = [...details];
        newDetails[index] = { ...newDetails[index], [field]: value };
        setDetails(newDetails);
    };

    if (!item) return null;

    return (
        <Modal
            className="mobile-fullscreen-modal"
            title={null}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={500}
            destroyOnClose
            centered
            closable={false}
        >
            {/* Custom Header */}
            <div style={modalStyles.modalHeader}>
                <Text strong style={{ fontSize: 20, flex: 1, color: orderDetailColors.text }}>
                    แก้ไขรายการ
                </Text>
                <Button 
                    type="text" 
                    icon={<CloseOutlined />} 
                    onClick={onClose}
                    aria-label="ปิด"
                    style={{ 
                        height: 36, 
                        width: 36, 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        color: orderDetailColors.textSecondary,
                    }}
                    className="scale-hover"
                />
            </div>

            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
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
                        <Title level={5} style={{ margin: 0, fontSize: 18, color: orderDetailColors.text }}>
                            {item.product?.display_name || 'ไม่ระบุ'}
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
                        <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>รายการเพิ่มเติม (Topping)</Text>
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
                            เพิ่มรายการ
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
                            <Text type="secondary" style={{ fontSize: 13 }}>ไม่มีรายการเพิ่มเติม</Text>
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
                                        style={{ flex: 2, borderRadius: 10, height: 40 }}
                                    />
                                    <InputNumber<number>
                                        placeholder="ราคา"
                                        value={detail.extra_price}
                                        onChange={(val) => handleUpdateDetail(index, 'extra_price', val || 0)}
                                        style={{ flex: 1, borderRadius: 10, height: 40 }}
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
                                            width: 40,
                                            height: 40,
                                        }}
                                    />
                                </div>
                            ))}
                        </Space>
                    )}
                </div>

                <Divider style={{ margin: '0 0 20px 0' }} />

                {/* Compact Quantity Adjustment */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 16, color: orderDetailColors.text }}>
                        ปรับจำนวน
                    </Text>
                    <div style={modalStyles.quantityControl}>
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
                            className="scale-hover"
                        />
                        <div style={modalStyles.quantityDisplay}>
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
                            className="scale-hover"
                        />
                    </div>
                </div>

                {/* Compact Notes */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 16, color: orderDetailColors.text }}>
                        หมายเหตุ / คำแนะนำพิเศษ
                    </Text>
                    <TextArea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="เช่น หวานน้อย, ไม่ใส่น้ำตาล..."
                        rows={2}
                        style={{ borderRadius: 14, padding: '12px 16px', fontSize: 15 }}
                    />
                </div>

                {/* Compact Total Price Card */}
                <div style={modalStyles.priceCard}>
                    <Text strong style={{ fontSize: 16, color: orderDetailColors.text }}>ยอดรวมรายการนี้</Text>
                    <Title level={4} style={{ margin: 0, color: orderDetailColors.priceTotal, fontSize: 22 }}>
                        ฿{calculateItemTotal(Number(item.price), quantity, details).toLocaleString()}
                    </Title>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={modalStyles.actionButtons}>
                <Button
                    onClick={onClose}
                    style={modalStyles.secondaryButton}
                    className="scale-hover"
                >
                    ยกเลิก
                </Button>
                <Button
                    type="primary"
                    onClick={handleSave}
                    icon={<SaveOutlined />}
                    style={modalStyles.primaryButton}
                    className="scale-hover"
                >
                    บันทึกแก้ไข
                </Button>
            </div>
        </Modal>
    );
};
