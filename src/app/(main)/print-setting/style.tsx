'use client';

import React from 'react';

/* ─── CSS-in-JS style wrapper ───────────────────────────────────────────── */
/* All styles for the print-setting page are centralised here.              */
/* Usage: wrap with <PrintSettingStyles> in page.tsx.                        */

const STYLES = `
/* ─── Foundations ──────────────────────────────────────── */
.ps-page {
    min-height: 100dvh;
    background: #f5f7fa;
    padding-bottom: 40px;
}

/* ─── Status bar (top banner) ─────────────────────────── */
.ps-status-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
}
.ps-status-bar--synced {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
}
.ps-status-bar--dirty {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
}
.ps-status-bar--update {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
}
.ps-status-bar__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}
.ps-status-bar--synced .ps-status-bar__dot { background: #22c55e; }
.ps-status-bar--dirty  .ps-status-bar__dot { background: #f59e0b; }
.ps-status-bar--update .ps-status-bar__dot { background: #ef4444; }

/* ─── Summary chips row ──────────────────────────────── */
.ps-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
.ps-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #334155;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.ps-chip:hover {
    border-color: #94a3b8;
}
.ps-chip__icon {
    font-size: 15px;
    color: #64748b;
}
.ps-chip__value {
    font-weight: 700;
    color: #0f172a;
}

/* ─── Document tabs (horizontal scrollable) ──────────── */
.ps-doc-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.ps-doc-tabs::-webkit-scrollbar { display: none; }

.ps-doc-tab {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    color: #64748b;
    background: transparent;
    border: 1.5px solid transparent;
    transition: all 0.2s ease;
    user-select: none;
}
.ps-doc-tab:hover {
    color: #334155;
    background: #f1f5f9;
}
.ps-doc-tab--active {
    color: #0f766e;
    background: #f0fdfa;
    border-color: #0f766e;
}
.ps-doc-tab__badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    line-height: 1.3;
}
.ps-doc-tab__badge--on {
    background: #dcfce7;
    color: #15803d;
}
.ps-doc-tab__badge--off {
    background: #f1f5f9;
    color: #94a3b8;
}

/* ─── Main two-column layout ─────────────────────────── */
.ps-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 20px;
    align-items: start;
}
@media (max-width: 1100px) {
    .ps-layout {
        grid-template-columns: 1fr;
    }
}

/* ─── Setting card ───────────────────────────────────── */
.ps-card {
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    overflow: hidden;
}
.ps-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    flex-wrap: wrap;
}
.ps-card__title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
}
.ps-card__body {
    padding: 20px;
}
.ps-card__body--compact {
    padding: 16px;
}

/* ─── Section divider inside card ────────────────────── */
.ps-section {
    margin-bottom: 24px;
}
.ps-section:last-child {
    margin-bottom: 0;
}
.ps-section__label {
    font-size: 13px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.ps-section__label::before {
    content: '';
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: #0f766e;
    flex-shrink: 0;
}

/* ─── Preset grid ────────────────────────────────────── */
.ps-presets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
}
.ps-preset {
    all: unset;
    cursor: pointer;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    transition: all 0.2s ease;
    user-select: none;
}
.ps-preset:hover {
    border-color: #0f766e;
    box-shadow: 0 2px 8px rgba(15, 118, 110, 0.08);
}
.ps-preset--active {
    border-color: #0f766e;
    background: #f0fdfa;
    box-shadow: inset 0 0 0 1px rgba(15, 118, 110, 0.15);
}
.ps-preset__name {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
}
.ps-preset__size {
    font-size: 12px;
    color: #64748b;
}
.ps-preset:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

/* ─── Settings row (label + control) ─────────────────── */
.ps-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.ps-field__label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

/* ─── Toggle row ─────────────────────────────────────── */
.ps-toggle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
}
.ps-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #f1f5f9;
    background: #fafbfc;
    transition: border-color 0.15s;
}
.ps-toggle:hover {
    border-color: #e2e8f0;
}
.ps-toggle__label {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
}

/* ─── Automation card items ──────────────────────────── */
.ps-auto-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid #f1f5f9;
}
.ps-auto-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}
.ps-auto-item:first-child {
    padding-top: 0;
}
.ps-auto-item__title {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 2px;
}
.ps-auto-item__desc {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.5;
}

/* ─── Preview shell (paper mockup) ───────────────────── */
.ps-preview-shell {
    border-radius: 16px;
    background: #1e293b;
    padding: 16px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
}
.ps-preview-paper {
    background: #fffef9;
    border-radius: 8px;
    color: #0f172a;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
    position: relative;
    overflow: hidden;
}
.ps-preview-paper::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.03), transparent 20%);
    pointer-events: none;
}

/* ─── Preview detail summary ─────────────────────────── */
.ps-preview-info {
    display: grid;
    gap: 8px;
}
.ps-preview-info__row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
    padding: 6px 0;
    border-bottom: 1px solid #f8fafc;
}
.ps-preview-info__row:last-child { border-bottom: none; }
.ps-preview-info__label { color: #94a3b8; }
.ps-preview-info__value { font-weight: 600; color: #334155; }

/* ─── Branch settings grid ───────────────────────────── */
.ps-branch-grid {
    display: grid;
    gap: 14px;
}
.ps-branch-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.ps-branch-item__label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

/* ─── Sticky save bar (bottom) ───────────────────────── */
.ps-save-bar {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 0px);
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0px));
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.08);
    transform: translateY(100%);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.25s ease;
    pointer-events: none;
}
.ps-save-bar--visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
}

/* ─── Margins mini grid ──────────────────────────────── */
.ps-margin-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

/* ─── Responsive helpers ─────────────────────────────── */
@media (max-width: 768px) {
    .ps-presets {
        grid-template-columns: repeat(2, 1fr);
    }
    .ps-toggle-grid {
        grid-template-columns: 1fr;
    }
    .ps-card__body {
        padding: 16px;
    }
    .ps-card__header {
        padding: 14px 16px;
    }
    .ps-margin-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .ps-presets {
        grid-template-columns: 1fr;
    }
}
`;

/**
 * Style wrapper that injects scoped CSS into the print-settings page.
 * Import in page.tsx:
 *   import { PrintSettingStyles } from './style';
 *   <PrintSettingStyles />
 */
export function PrintSettingStyles() {
    return <style>{STYLES}</style>;
}

export default PrintSettingStyles;
