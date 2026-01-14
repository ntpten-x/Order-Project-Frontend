import React, { useState, useEffect } from 'react';
import { Modal, List, Avatar, Button, Input, message, InputNumber, Row, Col, Typography, Card } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { productsService } from '../../../../../services/pos/products.service';
import { Products } from '../../../../../types/api/pos/products';

const { Text, Title } = Typography;

interface AddItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItem: (product: Products, quantity: number, notes: string) => Promise<void>;
}

export const AddItemsModal: React.FC<AddItemsModalProps> = ({ isOpen, onClose, onAddItem }) => {
    const [products, setProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Simple state for selected product to add details
    const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            setQuantity(1);
            setNotes('');
            setSelectedProduct(null);
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await productsService.findAll(1, 100); // Fetch reasonable amount
            setProducts(res.data);
            setFilteredProducts(res.data);
        } catch (error) {
            message.error("ไม่สามารถโหลดรายการสินค้าได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchText(value);
        const filtered = products.filter(p => 
            p.display_name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProducts(filtered);
    };

    const handleSelectProduct = (product: Products) => {
        setSelectedProduct(product);
        setQuantity(1);
        setNotes('');
    };

    const handleConfirmAdd = async () => {
        if (!selectedProduct) return;
        try {
            setAdding(true);
            await onAddItem(selectedProduct, quantity, notes);
            message.success("เพิ่มรายการเรียบร้อย");
            setSelectedProduct(null); // Reset to list
            // Optionally close modal or keep open for more adds
        } catch (error) {
           // Error handled by parent mostly
        } finally {
            setAdding(false);
        }
    };

    return (
        <Modal
            title="เพิ่มรายการสินค้า"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={700}
            destroyOnClose
        >
            {!selectedProduct ? (
                <>
                    <Input 
                        placeholder="ค้นหาสินค้า (ชื่อ, รหัส)" 
                        prefix={<SearchOutlined />} 
                        onChange={handleSearch} 
                        style={{ marginBottom: 16 }} 
                    />
                    <List
                        loading={loading}
                        grid={{ gutter: 16, column: 3 }}
                        dataSource={filteredProducts}
                        renderItem={item => (
                            <List.Item>
                                <Card 
                                    hoverable 
                                    size="small"
                                    cover={
                                        item.img_url ? (
                                            <img alt={item.display_name} src={item.img_url} style={{ height: 100, objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ height: 100, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                                        )
                                    }
                                    onClick={() => handleSelectProduct(item)}
                                >
                                    <div style={{ height: 40, overflow: 'hidden' }}>
                                        <Text strong style={{ fontSize: 13 }}>{item.display_name}</Text>
                                    </div>
                                    <Text type="secondary">฿{Number(item.price).toLocaleString()}</Text>
                                </Card>
                            </List.Item>
                        )}
                        style={{ maxHeight: 400, overflowY: 'auto' }}
                    />
                </>
            ) : (
                <div style={{ padding: 16 }}>
                    <Button type="link" onClick={() => setSelectedProduct(null)} style={{ paddingLeft: 0, marginBottom: 16 }}>&lt; กลับไปเลือกสินค้า</Button>
                    <Row gutter={24}>
                        <Col span={8}>
                             {selectedProduct.img_url ? (
                                <img src={selectedProduct.img_url} style={{ width: '100%', borderRadius: 8 }} />
                             ) : (
                                <div style={{ width: '100%', height: 150, background: '#eee', borderRadius: 8 }} />
                             )}
                        </Col>
                        <Col span={16}>
                            <Title level={4}>{selectedProduct.display_name}</Title>
                            <Text type="secondary" style={{ fontSize: 16 }}>ราคา: ฿{Number(selectedProduct.price).toLocaleString()}</Text>
                            
                            <div style={{ marginTop: 24 }}>
                                <Text style={{ display: 'block', marginBottom: 8 }}>จำนวน</Text>
                                <InputNumber min={1} value={quantity} onChange={(v) => setQuantity(v || 1)} size="large" />
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <Text style={{ display: 'block', marginBottom: 8 }}>หมายเหตุ</Text>
                                <Input.TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="เช่น ไม่ใส่ผัก, หวานน้อย" />
                            </div>

                            <div style={{ marginTop: 24, textAlign: 'right' }}>
                                <Button onClick={() => setSelectedProduct(null)} style={{ marginRight: 8 }}>ยกเลิก</Button>
                                <Button type="primary" size="large" onClick={handleConfirmAdd} loading={adding} icon={<PlusOutlined />}>เพิ่มลงออเดอร์</Button>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}
        </Modal>
    );
};
