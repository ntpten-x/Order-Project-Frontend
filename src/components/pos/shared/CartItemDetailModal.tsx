"use client";

import React from "react";
import { Button, Modal, Space, Typography } from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined, PictureOutlined, PlusOutlined } from "@ant-design/icons";
import { makeSelectCartItem, useCartStore } from "../../../store/useCartStore";
import { posColors, posComponentStyles, POSSharedStyles } from "./style";
import { ordersResponsiveStyles } from "../../../theme/pos/orders/style";
import { OrderType } from "../../../types/api/pos/salesOrder";
import type { Products } from "../../../types/api/pos/products";
import {
  createOrderDetailDraftFromEntity,
  createToppingOrderDetailDraft,
  getEligibleProductToppings,
  getToppingDisplayPrice,
  loadActiveOrderToppings,
  OrderItemDetailDraft,
} from "../../../utils/pos/orderToppings";
import type { Topping } from "../../../types/api/pos/topping";
import { formatPrice } from "../../../utils/products/productDisplay.utils";
import { ModalSelector } from "../../ui/select/ModalSelector";
import SmartAvatar from "../../ui/image/SmartAvatar";

const { Text } = Typography;

export interface CartItemDetailModalProps {
  item: {
    id: string;
    name: string;
    details: { detail_name: string; extra_price: number; topping_id?: string }[];
    product?: Products | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { detail_name: string; extra_price: number; topping_id?: string }[]) => void;
  orderType?: OrderType;
  toppingCatalog?: Topping[] | null;
}

export function CartItemDetailModal({
  item,
  isOpen,
  onClose,
  onSave,
  orderType,
  toppingCatalog,
}: CartItemDetailModalProps) {
  const itemSelector = React.useMemo(() => makeSelectCartItem(item?.id || "__missing__"), [item?.id]);
  const cartItem = useCartStore(itemSelector);
  const orderMode = useCartStore((state) => state.orderMode);
  const [details, setDetails] = React.useState<OrderItemDetailDraft[]>([]);
  const [catalogToppings, setCatalogToppings] = React.useState<Topping[]>([]);
  const [selectedToppingIds, setSelectedToppingIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!item || !isOpen) {
      return;
    }

    const initialDetails = item.details
      ? item.details.map((detail) => {
          const draft = createOrderDetailDraftFromEntity({
            ...detail,
            id: `${detail.topping_id || detail.detail_name}-${detail.extra_price}`,
          });
          // Try to enrich with image from catalog if available locally
          if (!draft.img && detail.topping_id && catalogToppings.length > 0) {
            const topping = catalogToppings.find((t) => t.id === detail.topping_id);
            if (topping?.img) {
              draft.img = topping.img;
            }
          }
          return draft;
        })
      : [];
    setDetails(initialDetails);
    setSelectedToppingIds([]);
  }, [item, isOpen, catalogToppings]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (Array.isArray(toppingCatalog)) {
      setCatalogToppings(toppingCatalog);
      return;
    }

    void loadActiveOrderToppings()
      .then((items) => setCatalogToppings(items))
      .catch(() => setCatalogToppings([]));
  }, [isOpen, toppingCatalog]);

  const effectiveProduct = React.useMemo(
    () => item?.product ?? cartItem?.product,
    [cartItem?.product, item?.product],
  );

  const availableToppings = React.useMemo(
    () => getEligibleProductToppings(catalogToppings, effectiveProduct),
    [catalogToppings, effectiveProduct],
  );

  const selectableToppings = React.useMemo(
    () => availableToppings.filter((topping) => !details.some((detail) => detail.topping_id === topping.id)),
    [availableToppings, details],
  );

  const effectiveOrderType = React.useMemo<OrderType | undefined>(() => {
    if (orderType) {
      return orderType;
    }
    if (orderMode === "DELIVERY") {
      return OrderType.Delivery;
    }
    if (orderMode === "TAKEAWAY") {
      return OrderType.TakeAway;
    }
    if (orderMode === "DINE_IN") {
      return OrderType.DineIn;
    }
    return undefined;
  }, [orderMode, orderType]);

  const toppingOptions = React.useMemo(() =>
    selectableToppings.map(topping => ({
      value: topping.id,
      label: (
        <Space size={12}>
          <SmartAvatar
            src={topping.img}
            alt={topping.display_name}
            size={32}
            shape="square"
            icon={<PictureOutlined style={{ fontSize: 14 }} />}
            imageStyle={{ objectFit: 'contain' }}
            style={{
              borderRadius: 8,
              flexShrink: 0,
              background: '#fff',
              border: '1px solid #E5E7EB',
            }}
          />
          <Text>{topping.display_name} (+{formatPrice(getToppingDisplayPrice(topping, effectiveOrderType))})</Text>
        </Space>
      ),
      searchLabel: topping.display_name
    })),
    [selectableToppings, effectiveOrderType]
  );


  const handleAddTopping = React.useCallback(() => {
    if (selectedToppingIds.length === 0) {
      return;
    }

    const toppingsToAdd = selectableToppings.filter((item) => selectedToppingIds.includes(item.id));
    if (toppingsToAdd.length === 0) {
      return;
    }

    setDetails((prev) => [
      ...prev,
      ...toppingsToAdd.map(topping => createToppingOrderDetailDraft(topping, effectiveOrderType))
    ]);
    setSelectedToppingIds([]);
  }, [effectiveOrderType, selectableToppings, selectedToppingIds]);

  const handleRemoveDetail = React.useCallback((id: string) => {
    setDetails((prev) => prev.filter((detail) => detail.id !== id));
  }, []);


  const handleSave = React.useCallback(() => {
    const nextDetails = details
      .filter((detail) => !!detail.topping_id)
      .map((detail) => ({
        detail_name: detail.detail_name,
        extra_price: Number(detail.extra_price || 0),
        topping_id: detail.topping_id as string,
      }));

    onSave(nextDetails);
    onClose();
  }, [details, onClose, onSave]);

  return (
    <Modal
      title={
        <div style={posComponentStyles.modalTitleRow}>
          <div style={{ ...posComponentStyles.modalIconBase, background: posColors.successLight }}>
            <PlusOutlined style={{ color: posColors.success, fontSize: 16 }} />
          </div>
          <span>เพิ่มเติม : {item?.name}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} style={{ borderRadius: 10, height: 42 }}>ยกเลิก</Button>,
        <Button key="save" type="primary" onClick={handleSave} style={{ background: posColors.success, borderRadius: 10, height: 42 }}>บันทึก</Button>,
      ]}
      width={560}
      centered
    >
      <POSSharedStyles />
      <style jsx global>{ordersResponsiveStyles}</style>
      <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            padding: 16,
            background: "#F8FAFC",
            borderRadius: 12,
            border: "1px solid #E2E8F0",
          }}
        >
          <div className="topping-selection-header" style={{ marginBottom: 12 }}>
            <Text strong className="topping-selection-label" style={{ color: posColors.textSecondary }}>เลือกท็อปปิ้ง</Text>
          </div>
          <ModalSelector<string>
            value={selectedToppingIds}
            onChange={(value) => setSelectedToppingIds(Array.isArray(value) ? value : [value])}
            title="เลือกท็อปปิ้ง"
            placeholder={availableToppings.length > 0 ? "เลือก" : "ไม่มีท็อปปิ้ง"}
            disabled={selectableToppings.length === 0}
            style={{ width: "100%", height: 44 }}
            showSearch
            multiple
            options={toppingOptions}
          />
          {selectedToppingIds.length > 0 ? (
            <div className="topping-selection-actions">
              <Space size={12}>
                <Button 
                  danger 
                  className="topping-selection-btn btn-clear"
                  icon={<CloseOutlined style={{ fontSize: 12 }} />} 
                  onClick={() => setSelectedToppingIds([])} 
                >
                  ล้าง
                </Button>
                <Button 
                  type="primary" 
                  className="topping-selection-btn btn-confirm"
                  icon={<CheckOutlined style={{ fontSize: 12 }} />} 
                  onClick={handleAddTopping} 
                >
                  ยืนยัน ({selectedToppingIds.length})
                </Button>
              </Space>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text strong style={{ color: posColors.textSecondary }}>รายการท็อปปิ้ง</Text>
        </div>

        {details.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px",
              background: "#F8FAFC",
              borderRadius: 12,
              color: posColors.textSecondary,
            }}
          >
            <PlusOutlined style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }} />
            <div>ยังไม่มีรายการท็อปปิ้ง</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {details.map((detail) => (
              <div key={detail.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    flex: 1,
                    minHeight: 54,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "#F0FDF4",
                    border: "1px solid #DCFCE7",
                  }}
                >
                  <Space size={10} wrap>
                    <SmartAvatar
                      src={detail.img || catalogToppings.find(t => t.id === detail.topping_id)?.img}
                      alt={detail.detail_name}
                      size={32}
                      shape="square"
                      icon={<PictureOutlined style={{ fontSize: 14 }} />}
                      imageStyle={{ objectFit: 'contain' }}
                      style={{
                        borderRadius: 8,
                        flexShrink: 0,
                        background: '#fff',
                        border: '1px solid #A7F3D0',
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text strong>{detail.detail_name}</Text>
                      </div>
                    </div>
                  </Space>
                  <Text style={{ color: posColors.success, fontWeight: 700 }}>
                    +{formatPrice(Number(detail.extra_price || 0))}
                  </Text>
                </div>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveDetail(detail.id)}
                  style={{ borderRadius: 8, height: 42, width: 42 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
