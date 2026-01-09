"use client";

import React, { useState } from 'react';
import { Card, Typography, Button, message, Badge, Tag } from 'antd';
import { ShoppingCartOutlined, CheckOutlined } from '@ant-design/icons';
import { Ingredients } from '../types/api/ingredients';
import { useCart } from '../contexts/CartContext';

const { Title, Paragraph, Text } = Typography;

interface IngredientCardProps {
  ingredient: Ingredients;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(ingredient);
    setIsAdded(true);
    message.success(`เพิ่ม ${ingredient.display_name} ลงตะกร้าแล้ว`);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <Card
      hoverable
      cover={
        <div 
          style={{ 
            position: 'relative', 
            paddingTop: '65%', 
            overflow: 'hidden',
            borderRadius: '12px 12px 0 0'
          }}
        >
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={ingredient.display_name}
            src={ingredient.img_url || 'https://placehold.co/600x400?text=No+Image'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image';
            }}
          />
          
          {/* Gradient Overlay */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
              pointerEvents: 'none',
            }}
          />
          
          {/* Unit Badge */}
          {ingredient.unit && (
            <Tag 
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                margin: 0,
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '20px',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {ingredient.unit.display_name}
            </Tag>
          )}
        </div>
      }
      style={{ 
        width: '100%', 
        borderRadius: 16, 
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      styles={{
        body: { 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          background: '#fff'
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{ marginBottom: 16, flexGrow: 1 }}>
        <Title 
          level={4} 
          style={{ 
            margin: 0, 
            marginBottom: 4,
            lineHeight: 1.3,
            fontSize: '18px',
            color: '#1a1a2e'
          }}
        >
          {ingredient.display_name}
        </Title>
        
        {ingredient.ingredient_name && (
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '13px',
              color: '#8b8b9a'
            }}
          >
            {ingredient.ingredient_name}
          </Text>
        )}
      
        <Paragraph 
          ellipsis={{ rows: 2, expandable: false }} 
          style={{ 
            marginTop: 12, 
            marginBottom: 0, 
            minHeight: '44px', 
            color: '#666',
            fontSize: '14px',
            lineHeight: 1.6
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
          height: 48,
          borderRadius: 12,
          fontSize: '15px',
          fontWeight: 600,
          background: isAdded 
            ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
            : 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
          border: 'none',
          boxShadow: isAdded 
            ? '0 4px 16px rgba(82, 196, 26, 0.4)'
            : '0 4px 16px rgba(5, 150, 105, 0.4)',
          transition: 'all 0.3s ease',
          transform: isAdded ? 'scale(0.98)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!isAdded) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = isAdded 
            ? '0 4px 16px rgba(82, 196, 26, 0.4)'
            : '0 4px 16px rgba(5, 150, 105, 0.4)';
        }}
      >
        {isAdded ? 'เพิ่มแล้ว ✓' : 'เพิ่มลงตะกร้า'}
      </Button>
    </Card>
  );
};

export default IngredientCard;

