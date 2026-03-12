"use client";

import { CSSProperties } from "react";

export const pageStyles = {
    container: {
        minHeight: "100dvh",
        backgroundColor: "#f8fafc",
        width: "100%",
        overflowX: "hidden",
        paddingBottom: 100,
    } as CSSProperties,
    unitCard: (isActive: boolean): CSSProperties => ({
        marginBottom: 12,
        borderRadius: 16,
        border: `1px solid ${isActive ? "#d1fae5" : "#e2e8f0"}`,
        boxShadow: isActive ? "0 4px 12px rgba(15, 23, 42, 0.06)" : "none",
        overflow: "hidden",
        transition: "all 0.2s ease",
        background: "#ffffff",
        opacity: isActive ? 1 : 0.72,
        cursor: "pointer",
    }),
    unitCardInner: {
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
    } as CSSProperties,
};

export const globalStyles = `
  .stock-ingredients-unit-list-page .stock-ingredients-unit-card {
    animation: fadeSlideIn 0.3s ease both;
  }

  .stock-ingredients-unit-list-page .stock-ingredients-unit-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08) !important;
  }

  .stock-ingredients-unit-list-page *::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  .stock-ingredients-unit-list-page *::-webkit-scrollbar-track {
    background: transparent;
  }

  .stock-ingredients-unit-list-page *::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

export default function IngredientsUnitPageStyle() {
    return (
        <style jsx global>{`
            @media (max-width: 768px) {
                .stock-ingredients-unit-list-page .stock-ingredients-unit-card > div {
                    align-items: flex-start;
                }
            }

            @media (max-width: 640px) {
                .stock-ingredients-unit-list-page .stock-ingredients-unit-card > div {
                    flex-direction: column;
                }
            }
        `}</style>
    );
}
