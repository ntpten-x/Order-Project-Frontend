import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { Ingredients } from '@/types/api/ingredients';

const { Meta } = Card;
const { Title, Paragraph } = Typography;

interface IngredientCardProps {
  ingredient: Ingredients;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient }) => {
  return (
    <Card
      hoverable
      cover={
        <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
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
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ marginBottom: 8 }}>
        <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
            {ingredient.display_name}
        </Title>
        {ingredient.ingredient_name && (
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                {ingredient.ingredient_name}
            </Typography.Text>
        )}
      </div>
      
      <Paragraph 
        ellipsis={{ rows: 2, expandable: false, symbol: '...' }} 
        style={{ marginBottom: 0, minHeight: '44px', color: '#666' }}
      >
        {ingredient.description || 'No description available'}
      </Paragraph>
    </Card>
  );
};

export default IngredientCard;
