"use client";

import React from "react";
import { Button, Input } from "antd";
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
  onSearchChange: (value: string) => void;
  onSelectCategory: (categoryId?: string) => void;
};

export function POSCategoryFilterBar({
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onSelectCategory,
}: POSCategoryFilterBarProps) {
  return (
    <nav
      style={posLayoutStyles.categoryBar}
      className="pos-category-bar pos-category-bar-mobile"
      role="navigation"
      aria-label="ตัวกรองหมวดหมู่"
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <Input
          value={searchQuery}
          allowClear
          prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
          placeholder="ค้นหาสินค้า..."
          aria-label="ค้นหาสินค้า"
          onChange={(e) => onSearchChange(e.target.value)}
          className="pos-product-search"
          style={{ borderRadius: 16, height: 44 }}
        />

        <div style={posLayoutStyles.categoryScroll} className="pos-category-scroll-row">
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
