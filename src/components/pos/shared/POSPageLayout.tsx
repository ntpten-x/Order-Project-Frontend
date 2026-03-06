"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Typography, Button, Spin, Badge, message, Pagination } from "antd";
import { 
  ShoppingCartOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCart, CartItem } from "../../../contexts/pos/CartContext";
import { useGlobalLoading } from "../../../contexts/pos/GlobalLoadingContext";
import { useProducts } from "../../../hooks/pos/useProducts";
import { useCategories } from "../../../hooks/pos/useCategories";
import { Products } from "../../../types/api/pos/products";
import { 
  posLayoutStyles, 
  posColors, 
  POSSharedStyles
} from "./style";
import { groupOrderItems } from "../../../utils/orderGrouping";
import PageState from "../../ui/states/PageState";
import { CartItemRow } from "./CartItemRow";
import { CartItemDetailModal } from "./CartItemDetailModal";
import { POSCategoryFilterBar } from "./POSCategoryFilterBar";
import { POSProductCard } from "./POSProductCard";
import { POSHeaderBar } from "./POSHeaderBar";
import { POSProductsEmptyState } from "./POSProductsEmptyState";
import { POSCartDrawer } from "./POSCartDrawer";
import { POSCheckoutDrawer } from "./POSCheckoutDrawer";
import { POSNoteModal } from "./POSNoteModal";
import { POSProductDetailModal } from "./POSProductDetailModal";

const { Text } = Typography;

interface POSPageLayoutProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  onConfirmOrder: () => Promise<void>;
  subtitlePosition?: 'below' | 'aside';
}

export default function POSPageLayout({ 
  title, 
  subtitle, 
  icon, 
  onConfirmOrder,
  subtitlePosition = 'below'
}: POSPageLayoutProps) {
  const { isLoading: isGlobalLoading } = useGlobalLoading();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  
  // Category State
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { data: categories = [] } = useCategories();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const deferredSearchQuery = React.useDeferredValue(searchQuery);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(deferredSearchQuery.trim());
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [deferredSearchQuery]);

  const {
    products,
    isLoading,
    isError: productsError,
    mutate: refetchProducts,
    total,
  } = useProducts(page, LIMIT, selectedCategory, debouncedQuery);

  // UI State
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);

  // Context State
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    updateItemNote,
    clearCart,
    updateItemDetails,
    orderMode,
    getTotalItems,
    getSubtotal,
    getDiscountAmount,
    getFinalPrice,
  } = useCart();

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const finalPrice = getFinalPrice();

  const getProductUnitPrice = useCallback(
    (product: Products): number => {
      return orderMode === "DELIVERY"
        ? Number(product.price_delivery ?? product.price)
        : Number(product.price);
    },
    [orderMode]
  );

  // Clear cart when leaving the specific page (navigation) but NOT on refresh
  React.useEffect(() => {
    const originalPath = window.location.pathname;
    
    return () => {
       if (window.location.pathname !== originalPath) {
           clearCart();
       }
    };
  }, [clearCart]);

  // Note Editing State
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [currentNoteItem, setCurrentNoteItem] = useState<{ id: string; name: string; note: string } | null>(null);
  const [noteInput, setNoteInput] = useState("");

  // Detail/Topping Management State
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentDetailItem, setCurrentDetailItem] = useState<{ id: string; name: string; details: { detail_name: string; extra_price: number }[] } | null>(null);

  const openDetailModal = useCallback(
    (id: string, name: string, details?: { detail_name: string; extra_price: number }[]) => {
      setCurrentDetailItem({ id, name, details: details || [] });
      setIsDetailModalVisible(true);
    },
    []
  );

  const openNoteModal = useCallback((id: string, name: string, note: string) => {
    setCurrentNoteItem({ id, name, note });
    setNoteInput(note || "");
    setIsNoteModalVisible(true);
  }, []);

  const handleSaveNote = useCallback(() => {
    if (currentNoteItem) {
      updateItemNote(currentNoteItem.id, noteInput);
      setIsNoteModalVisible(false);
      setCurrentNoteItem(null);
      message.success("บันทึกโน้ตเรียบร้อยแล้ว");
    }
  }, [currentNoteItem, noteInput, updateItemNote]);

  const handleAddToCart = useCallback((product: Products) => {
    const cartItemId = addToCart(product);
    const productName = product.display_name || product.product_name || "สินค้า";
    message.open({
      type: "success",
      content: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span>เพิ่ม {productName} ลงตะกร้าแล้ว</span>
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              removeFromCart(cartItemId);
              message.destroy("cart-add");
            }}
            style={{ padding: 0, height: "auto" }}
          >
            Undo
          </Button>
        </span>
      ),
      key: "cart-add",
      duration: 2.5,
    });
  }, [addToCart, removeFromCart]);

  const openProductModal = useCallback((product: Products) => {
    setSelectedProduct(product);
    setIsProductModalVisible(true);
  }, []);

  const closeProductModal = useCallback(() => {
    setIsProductModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const closeNoteModal = useCallback(() => {
    setIsNoteModalVisible(false);
    setCurrentNoteItem(null);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalVisible(false);
    setCurrentDetailItem(null);
  }, []);

  const handleSaveDetails = useCallback(
    (details: { detail_name: string; extra_price: number }[]) => {
      if (currentDetailItem) {
        updateItemDetails(currentDetailItem.id, details);
      }
    },
    [currentDetailItem, updateItemDetails]
  );

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      message.warning("กรุณาเพิ่มสินค้าลงตะกร้าก่อน");
      return;
    }
    setCheckoutVisible(true);
  }, [cartItems.length]);

  const handleConfirm = useCallback(async () => {
    try {
      setIsProcessing(true);
      await onConfirmOrder();
      setCheckoutVisible(false);
      setCartVisible(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Unable to confirm order");
    } finally {
      setIsProcessing(false);
    }
  }, [onConfirmOrder]);

  const groupedCartItems = useMemo(() => groupOrderItems(cartItems), [cartItems]);

  const categorySummary = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    cartItems.forEach((item) => {
      const catName = item.product.category?.display_name || "อื่นๆ";
      categoriesMap[catName] = (categoriesMap[catName] || 0) + item.quantity;
    });
    return Object.entries(categoriesMap).map(([name, count]) => ({ name, count }));
  }, [cartItems]);

  // ==================== RENDER HELPERS ====================
  const renderCartItem = useCallback(
    (item: CartItem) => (
      <CartItemRow
        item={item}
        getProductUnitPrice={getProductUnitPrice}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onOpenNote={openNoteModal}
        onOpenDetail={openDetailModal}
      />
    ),
    [getProductUnitPrice, updateQuantity, removeFromCart, openNoteModal, openDetailModal]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setPage(1);
  }, []);

  const handleGoManageProducts = useCallback(() => {
    router.push("/pos/products");
  }, [router]);

  return (
    <>
      <POSSharedStyles />

      <div style={posLayoutStyles.container}>
        <POSHeaderBar 
          title={title} 
          subtitle={subtitle} 
          icon={icon} 
          onBack={handleBack} 
          subtitlePosition={subtitlePosition}
        />
        <POSCategoryFilterBar
          categories={categories}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          onSelectCategory={(categoryId) => {
            setSelectedCategory(categoryId);
            setPage(1);
          }}
        />

        {/* Content */}
        <main style={posLayoutStyles.content} className="pos-content-mobile" role="main">
          {isLoading && !isGlobalLoading ? (
            <div style={posLayoutStyles.loadingContainer}>
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 16, color: posColors.textSecondary }}>
                กำลังโหลดสินค้า...
              </Text>
            </div>
          ) : productsError ? (
            <PageState
              status="error"
              title="โหลดข้อมูลสินค้าไม่สำเร็จ"
              error={productsError}
              onRetry={() => refetchProducts()}
            />
          ) : products.length > 0 ? (
            <>
              <div style={posLayoutStyles.productGrid} className="pos-product-grid pos-product-grid-mobile">
                {products.map((product, index) => (
                  <POSProductCard
                    key={product.id}
                    index={index}
                    product={product}
                    onOpenProductModal={openProductModal}
                    onAddToCart={handleAddToCart}
                    getProductUnitPrice={getProductUnitPrice}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              <div className="pos-pagination-container" style={{ ...posLayoutStyles.paginationContainer, position: 'relative' }}>
                <div className="pos-pagination-total" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
                   <Text type="secondary" style={{ fontSize: 13 }}>
                      ทั้งหมด {total} รายการ
                   </Text>
                </div>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={LIMIT}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                />
              </div>
            </>
                    ) : (
            <POSProductsEmptyState
              query={debouncedQuery}
              onClearSearch={handleClearSearch}
              onGoManageProducts={handleGoManageProducts}
            />
          )}
        </main>

        {/* Floating Cart Button */}
        <div className="pos-floating-btn-container">
          <Badge count={totalItems} size="default" offset={[-5, 5]}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<ShoppingCartOutlined style={{ fontSize: 26 }} />}
              onClick={() => setCartVisible(true)}
              style={posLayoutStyles.floatingCartButton}
              className={totalItems > 0 ? 'pos-cart-pulse' : ''}
              aria-label={`ตะกร้าสินค้า ${totalItems} รายการ`}
            />
          </Badge>
        </div>
        <POSCartDrawer
          open={cartVisible}
          onClose={() => setCartVisible(false)}
          totalItems={totalItems}
          subtotal={subtotal}
          discountAmount={discountAmount}
          finalPrice={finalPrice}
          cartItems={cartItems}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
          renderCartItem={renderCartItem}
        />
        {cartVisible && (
          <POSCheckoutDrawer
            open={checkoutVisible}
            onClose={() => setCheckoutVisible(false)}
            isProcessing={isProcessing}
            onConfirm={handleConfirm}
            groupedCartItems={groupedCartItems}
            categorySummary={categorySummary}
            totalItems={totalItems}
            discountAmount={discountAmount}
            finalPrice={finalPrice}
            getProductUnitPrice={getProductUnitPrice}
          />
        )}
        <POSNoteModal
          open={isNoteModalVisible}
          itemName={currentNoteItem?.name}
          value={noteInput}
          onChange={setNoteInput}
          onSave={handleSaveNote}
          onCancel={closeNoteModal}
        />
        <POSProductDetailModal
          open={isProductModalVisible}
          product={selectedProduct}
          onClose={closeProductModal}
          onAddToCart={handleAddToCart}
          getProductUnitPrice={getProductUnitPrice}
        />

          {/* Detail/Topping Modal */}
        <CartItemDetailModal
          item={currentDetailItem}
          isOpen={isDetailModalVisible}
          onClose={closeDetailModal}
          onSave={handleSaveDetails}
        />
      </div>
    </>
  );
}







