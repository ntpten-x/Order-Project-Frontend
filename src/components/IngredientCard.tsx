"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Button, message, Tag, Modal } from 'antd';
import Image from 'next/image';
import { ShoppingCartOutlined, CheckOutlined, ZoomInOutlined, CloseOutlined } from '@ant-design/icons';
import { Ingredients } from '../types/api/ingredients';
import { useCart } from '../contexts/CartContext';

const { Title, Paragraph, Text } = Typography;

interface IngredientCardProps {
  ingredient: Ingredients;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(ingredient);
    setIsAdded(true);
    message.success(`เพิ่ม ${ingredient.display_name} ลงตะกร้าแล้ว`);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const openImageModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeImageModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeImageModal]);

  const imageUrl = ingredient.img_url || 'https://placehold.co/600x400?text=No+Image';

  return (
    <>
      <Card
        hoverable
        cover={
          <div 
            onClick={openImageModal}
            style={{ 
              position: 'relative', 
              overflow: 'hidden',
              borderRadius: '16px 16px 0 0',
              cursor: 'pointer',
              background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
            }}
          >
            {/* Image Container with natural aspect ratio */}
            <div style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200,
              maxHeight: 280,
              padding: 16,
            }}>
              {/* Loading placeholder */}
              {!imageLoaded && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)',
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                </div>
              )}
              
              {/* Next.js Image Component */}
              <div style={{ position: 'relative', width: '100%', height: '250px' }}>
                <Image
                  alt={ingredient.display_name}
                  src={imageUrl}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{
                    objectFit: 'contain',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease',
                    opacity: imageLoaded ? 1 : 0,
                    borderRadius: 8,
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
                  }}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    // Fallback handled by parent or custom loader if needed, 
                    // but next/image onError is limited. 
                    // For now, ensure valid URL or placeholder.
                    setImageLoaded(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </div>
            </div>
            
            {/* Zoom Icon Overlay */}
            <div 
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                padding: '8px 14px',
                borderRadius: 20,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                opacity: 0.8,
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ZoomInOutlined style={{ fontSize: 14 }} />
              <span>ดูรูปขยาย</span>
            </div>
            
            {/* Unit Badge */}
            {ingredient.unit && (
              <Tag 
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  margin: 0,
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                }}
              >
                {ingredient.unit.display_name}
              </Tag>
            )}
          </div>
        }
        style={{ 
          width: '100%', 
          borderRadius: 20, 
          overflow: 'hidden',
          border: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#fff',
        }}
        styles={{
          body: { 
            padding: '20px 24px 24px', 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#fff'
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-10px)';
          e.currentTarget.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)';
        }}
      >
        <div style={{ marginBottom: 16, flexGrow: 1 }}>
          <Title 
            level={4} 
            style={{ 
              margin: 0, 
              marginBottom: 6,
              lineHeight: 1.3,
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e293b',
              letterSpacing: '-0.02em',
            }}
          >
            {ingredient.display_name}
          </Title>
          
          {ingredient.ingredient_name && (
            <Text 
              style={{ 
                fontSize: '14px',
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              {ingredient.ingredient_name}
            </Text>
          )}
        
          <Paragraph 
            ellipsis={{ rows: 2, expandable: false }} 
            style={{ 
              marginTop: 14, 
              marginBottom: 0, 
              minHeight: '48px', 
              color: '#64748b',
              fontSize: '14px',
              lineHeight: 1.7
            }}
          >
            {ingredient.description || 'ไม่มีคำอธิบาย'}
          </Paragraph>
        </div>

        <Button 
          type="primary"
          icon={isAdded ? <CheckOutlined /> : <ShoppingCartOutlined />}
          onClick={handleAddToCart}
          block
          size="large"
          style={{ 
            height: 52,
            borderRadius: 14,
            fontSize: '15px',
            fontWeight: 600,
            background: isAdded 
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              : 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
            border: 'none',
            boxShadow: isAdded 
              ? '0 4px 20px rgba(34, 197, 94, 0.4)'
              : '0 4px 20px rgba(5, 150, 105, 0.35)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isAdded ? 'scale(0.98)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!isAdded) {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(5, 150, 105, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = isAdded 
              ? '0 4px 20px rgba(34, 197, 94, 0.4)'
              : '0 4px 20px rgba(5, 150, 105, 0.35)';
          }}
        >
          {isAdded ? 'เพิ่มแล้ว ✓' : 'เพิ่มลงตะกร้า'}
        </Button>
      </Card>

      {/* Image Preview Modal */}
      <Modal
        open={isModalOpen}
        onCancel={closeImageModal}
        footer={null}
        centered
        width="auto"
        style={{ maxWidth: '95vw' }}
        styles={{
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
          },
          wrapper: {
            background: 'transparent',
          },
          body: {
            padding: 0,
            background: 'transparent',
          }
        }}
        closeIcon={
          <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <CloseOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
        }
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          animation: 'modalFadeIn 0.3s ease-out',
        }}>
          {/* Image Container */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: 20,
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={ingredient.display_name}
              src={imageUrl}
              style={{
                maxWidth: '85vw',
                maxHeight: '75vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 12,
                display: 'block',
              }}
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image';
              }}
            />
          </div>
          
          {/* Image Info */}
          <div style={{
            textAlign: 'center',
            color: '#fff',
            maxWidth: '80vw',
          }}>
            <Title 
              level={3} 
              style={{ 
                color: '#fff', 
                margin: 0, 
                marginBottom: 8,
                fontWeight: 700,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {ingredient.display_name}
            </Title>
            {ingredient.ingredient_name && (
              <Text style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: 16,
              }}>
                {ingredient.ingredient_name}
              </Text>
            )}
            {ingredient.unit && (
              <Tag 
                style={{
                  marginLeft: 12,
                  padding: '4px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {ingredient.unit.display_name}
              </Tag>
            )}
          </div>
        </div>
      </Modal>

      {/* CSS Animation Keyframes */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default IngredientCard;

