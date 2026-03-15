"use client";

import React from "react";
import { Button, Input, InputRef, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { posColors, posLayoutStyles } from "./style";

type CategoryOption = {
  id: string;
  display_name: string;
};

type POSCategoryFilterBarProps = {
  searchQuery: string;
  selectedCategory?: string;
  categories: CategoryOption[];
  isPending?: boolean;
  searchInputRef?: React.Ref<InputRef>;
  onSearchChange: (value: string) => void;
  onSelectCategory: (categoryId?: string) => void;
  showSearch?: boolean;
};

export function POSCategoryFilterBar({
  searchQuery,
  selectedCategory,
  categories,
  isPending = false,
  searchInputRef,
  onSearchChange,
  onSelectCategory,
  showSearch = true,
}: POSCategoryFilterBarProps) {
  return (
    <nav
      style={{ ...posLayoutStyles.categoryBar, padding: showSearch ? "14px 24px" : "10px 24px" }}
      className="pos-category-bar pos-category-bar-mobile"
      role="navigation"
      aria-busy={isPending}
      aria-label="ตัวกรองหมวดหมู่"
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: showSearch ? 12 : 0 }}>
        {/* Controlled by the parent so the input always reflects the URL-backed search state. */}
        {showSearch && (
          <Input
            ref={searchInputRef}
            value={searchQuery}
            allowClear
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="ค้นหาสินค้า..."
            aria-label="ค้นหาสินค้า"
            onChange={(e) => onSearchChange(e.target.value)}
            className="pos-product-search"
            style={{ borderRadius: 16, height: 44 }}
          />
        )}

        {(showSearch || isPending) && (
          <div
            style={{
              minHeight: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              color: "#64748B",
              fontSize: 12,
            }}
          >
            {isPending ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Spin size="small" />
                Updating products...
              </span>
            ) : null}
          </div>
        )}

        <div
          style={{
            ...posLayoutStyles.categoryScroll,
            opacity: isPending ? 0.72 : 1,
            transition: "opacity 0.18s ease",
            alignItems: "center",
          }}
          className="pos-category-scroll-row"
        >
          {/* The active category comes from props so refresh/back restores the same selected chip. */}
          <Button
            type={!selectedCategory ? "primary" : "text"}
            onClick={() => onSelectCategory(undefined)}
            className="pos-category-btn"
            style={{
              background: !selectedCategory ? posColors.primary : "white",
              borderColor: !selectedCategory ? posColors.primary : "#E2E8F0",
              color: !selectedCategory ? "#fff" : "#64748B",
              border: !selectedCategory ? `1px solid ${posColors.primary}` : "1px solid #E2E8F0",
              fontWeight: !selectedCategory ? 600 : 400,
              boxShadow: !selectedCategory ? "0 4px 12px rgba(79, 70, 229, 0.2)" : "none",
              height: 36,
              padding: "0 20px",
              borderRadius: 18,
              transition: "all 0.3s ease",
            }}
          >
            ทั้งหมด
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              type={selectedCategory === cat.id ? "primary" : "text"}
              onClick={() => onSelectCategory(cat.id)}
              className="pos-category-btn"
              style={{
                background: selectedCategory === cat.id ? posColors.primary : "white",
                borderColor: selectedCategory === cat.id ? posColors.primary : "#E2E8F0",
                color: selectedCategory === cat.id ? "#fff" : "#64748B",
                border: selectedCategory === cat.id ? `1px solid ${posColors.primary}` : "1px solid #E2E8F0",
                fontWeight: selectedCategory === cat.id ? 600 : 400,
                boxShadow: selectedCategory === cat.id ? "0 4px 12px rgba(79, 70, 229, 0.2)" : "none",
                height: 36,
                padding: "0 20px",
                borderRadius: 18,
                transition: "all 0.3s ease",
              }}
            >
              {cat.display_name}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
