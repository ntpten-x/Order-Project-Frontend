import React from 'react';
import { Card, Typography, Button, message } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Ingredients } from '../types/api/ingredients';
import { useCart } from '../contexts/CartContext';

const { Title, Paragraph } = Typography;

interface IngredientCardProps {
  ingredient: Ingredients;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(ingredient);
    message.success(`Added ${ingredient.display_name} to cart`);
  };

  return (
    <Card
      hoverable
      cover={
        <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
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
            }}
            />
        </div>
      }
      style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
      bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}
      actions={[
        <Button 
            key="add" 
            type="primary" 
            icon={<ShoppingCartOutlined />} 
            onClick={handleAddToCart}
            block
            style={{ margin: '0 16px' }}
        >
            เพิ่มลงตะกร้า
        </Button>
      ]}
    >
      <div style={{ marginBottom: 8, flexGrow: 1 }}>
        <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
            {ingredient.display_name}
        </Title>
        {ingredient.ingredient_name && (
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                {ingredient.ingredient_name}
            </Typography.Text>
        )}
      
        <Paragraph 
            ellipsis={{ rows: 2, expandable: false, symbol: '...' }} 
            style={{ marginTop: 8, marginBottom: 0, minHeight: '44px', color: '#666' }}
        >
            {ingredient.description || '-'}
        </Paragraph>
      </div>
    </Card>
  );
};

export default IngredientCard;
