"use client";

import React from "react";
import { Button, Input, InputNumber, Modal, Space, Tag, Typography } from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined, PictureOutlined, PlusOutlined } from "@ant-design/icons";
import { makeSelectCartItem, useCartStore } from "../../../store/useCartStore";
import { posColors, posComponentStyles } from "./style";
import { OrderType } from "../../../types/api/pos/salesOrder";
import type { Products } from "../../../types/api/pos/products";
import {
  createCustomOrderDetailDraft,
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
import { resolveImageSource } from "../../../utils/image/source";

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
  allowCustomDetails?: boolean;
  toppingCatalog?: Topping[] | null;
}

export function CartItemDetailModal({
  item,
  isOpen,
  onClose,
  onSave,
  orderType,
  allowCustomDetails = true,
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

    setDetails(item.details ? item.details.map((detail) => createOrderDetailDraftFromEntity({ ...detail, id: `${detail.topping_id || detail.detail_name}-${detail.extra_price}` })) : []);
    setSelectedToppingIds([]);
  }, [item, isOpen]);

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
      label: (
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 10, width: '100%' }}>
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
              background: resolveImageSource(topping.img) ? '#fff' : '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{topping.display_name}</span>
            <span style={{ color: posColors.success, fontWeight: 700 }}>
              (+{formatPrice(getToppingDisplayPrice(topping, effectiveOrderType))})
            </span>
          </div>
        </div>
      ),
      value: topping.id,
      searchLabel: topping.display_name
    })),
    [selectableToppings, effectiveOrderType]
  );

  const handleAddDetail = React.useCallback(() => {
    if (!allowCustomDetails) {
      return;
    }
    setDetails((prev) => [...prev, createCustomOrderDetailDraft()]);
  }, [allowCustomDetails]);

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

  const handleUpdateDetail = React.useCallback((id: string, field: "detail_name" | "extra_price", value: unknown) => {
    setDetails((prev) =>
      prev.map((detail) => {
        if (detail.id !== id) {
          return detail;
        }

        return {
          ...detail,
          [field]: field === "extra_price" ? Number(value || 0) : String(value || ""),
        };
      }),
    );
  }, []);

  const handleSave = React.useCallback(() => {
    const nextDetails = details
      .map((detail) => {
        if (detail.topping_id) {
          return {
            detail_name: detail.detail_name,
            extra_price: Number(detail.extra_price || 0),
            topping_id: detail.topping_id,
          };
        }

        if (!allowCustomDetails) {
          return null;
        }

        const detailName = detail.detail_name.trim();
        if (!detailName) {
          return null;
        }

        return {
          detail_name: detailName,
          extra_price: Number(detail.extra_price || 0),
        };
      })
      .filter((detail): detail is { detail_name: string; extra_price: number; topping_id?: string } => detail !== null);

    onSave(nextDetails);
    onClose();
  }, [allowCustomDetails, details, onClose, onSave]);

  return (
    <Modal
      title={
        <div style={posComponentStyles.modalTitleRow}>
          <div style={{ ...posComponentStyles.modalIconBase, background: posColors.successLight }}>
            <PlusOutlined style={{ color: posColors.success, fontSize: 16 }} />
          </div>
          <span>รายละเอียดเพิ่มเติม: {item?.name}</span>
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
      <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            padding: 16,
            background: "#F8FAFC",
            borderRadius: 12,
            border: "1px solid #E2E8F0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Text strong style={{ color: posColors.textSecondary }}>เลือกท็อปปิ้ง</Text>
            {selectedToppingIds.length > 0 ? (
              <Space size={8}>
                <Button 
                  danger 
                  size="small"
                  icon={<CloseOutlined style={{ fontSize: 12 }} />} 
                  onClick={() => setSelectedToppingIds([])} 
                  style={{ borderRadius: 6, background: "#FEF2F2", fontSize: 13, height: 32 }}
                >
                  ล้าง
                </Button>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<CheckOutlined style={{ fontSize: 12 }} />} 
                  onClick={handleAddTopping} 
                  style={{ borderRadius: 6, background: posColors.success, border: "none", fontSize: 13, height: 32 }}
                >
                  ยืนยัน ({selectedToppingIds.length})
                </Button>
              </Space>
            ) : null}
          </div>
          <ModalSelector<string>
            value={selectedToppingIds}
            onChange={(value) => setSelectedToppingIds(value)}
            title="เลือกท็อปปิ้ง"
            placeholder={availableToppings.length > 0 ? "เลือก" : "ไม่มีท็อปปิ้งที่ตรงกับหมวดสินค้า"}
            disabled={selectableToppings.length === 0}
            style={{ width: "100%", height: 44 }}
            showSearch
            multiple
            options={toppingOptions}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text strong style={{ color: posColors.textSecondary }}>รายการเพิ่มเติม</Text>
          {allowCustomDetails ? (
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddDetail} style={{ borderRadius: 8 }}>
              เพิ่มข้อความเอง
            </Button>
          ) : null}
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
            <div>ยังไม่มีรายการเพิ่มเติม</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {details.map((detail) => (
              <div key={detail.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {detail.topping_id ? (
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
                        src={detail.img}
                        alt={detail.detail_name}
                        size={32}
                        shape="square"
                        icon={<PictureOutlined style={{ fontSize: 14 }} />}
                        imageStyle={{ objectFit: 'contain' }}
                        style={{
                          borderRadius: 8,
                          flexShrink: 0,
                          background: resolveImageSource(detail.img) ? '#fff' : '#fff',
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
                ) : (
                  <>
                    <Input
                      placeholder="ชื่อรายการ"
                      value={detail.detail_name}
                      onChange={(e) => handleUpdateDetail(detail.id, "detail_name", e.target.value)}
                      style={{ flex: 2, borderRadius: 8, height: 42 }}
                    />
                    <InputNumber<number>
                      placeholder="ราคา"
                      value={detail.extra_price}
                      onChange={(val: number | null) => handleUpdateDetail(detail.id, "extra_price", val || 0)}
                      style={{ flex: 1, height: 42 }}
                      inputMode="decimal"
                      controls={false}
                      min={0}
                      precision={2}
                    />
                  </>
                )}
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
