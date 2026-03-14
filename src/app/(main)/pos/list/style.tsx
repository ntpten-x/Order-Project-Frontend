export const servingBoardStyles = `
/* ═══════════════════════════════════════════════════════════
   Serving Board – Clean Modern Redesign
   Focus: simplicity, readability, touch-friendly, responsive
   ═══════════════════════════════════════════════════════════ */

/* ── Base Page ── */
.sb-page {
  min-height: 100dvh;
  background: #101318;
  padding-bottom: 100px;
  color: #e8ecf1;
  font-family: var(--font-sans), "Sarabun", -apple-system, sans-serif;
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
  -webkit-font-smoothing: antialiased;
}

.sb-page,
.sb-page * {
  box-sizing: border-box;
}

/* ── Sticky Header ── */
.sb-hero {
  background: rgba(16, 19, 24, 0.92);
  padding: 14px 16px 12px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  width: 100%;
  max-width: 100%;
}

.sb-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.sb-title-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.sb-fire-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sb-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sb-title.ant-typography {
  font-size: 18px !important;
  font-weight: 700 !important;
  margin: 0 !important;
  color: #fff !important;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.sb-live-tag.ant-tag {
  margin: 0;
  border-radius: 6px;
  font-size: 10px;
  padding: 1px 7px;
  font-weight: 700;
  border: none;
  letter-spacing: 0.04em;
}

.sb-live-tag.online.ant-tag {
  background: #10b981;
  color: #fff;
}

.sb-live-tag.offline.ant-tag {
  background: #ef4444;
  color: #fff;
}

/* ── Action Buttons ── */
.sb-action-btns {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.sb-action-btn.ant-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  transition: all 0.2s ease;
}

.sb-action-btn.ant-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.sb-action-btn-settings.ant-btn {
  width: auto;
  padding-inline: 12px;
  font-size: 13px;
  font-weight: 600;
}

.sb-action-btn-refresh.ant-btn {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

.sb-action-btn-refresh.ant-btn:hover {
  background: rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
}

/* ── Stats Toggle ── */
.sb-stats-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 6px 0;
  margin-bottom: 4px;
}

.sb-stats-toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sb-stats-toggle-text.ant-typography {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.sb-toggle-btn.ant-btn {
  color: rgba(255, 255, 255, 0.3);
}

/* ── Stats Row ── */
.sb-stats-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 10px;
  scrollbar-width: none;
}

.sb-stats-row::-webkit-scrollbar {
  display: none;
}

.sb-stat-card {
  flex: 1;
  min-width: 80px;
  padding: 10px 14px;
  border-radius: 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.sb-stat-value {
  display: block;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}

.sb-stat-label {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 500;
}

/* ── Filter Tabs (Pill Style) ── */
.sb-filter-row {
  display: flex;
  gap: 0;
  padding: 3px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.sb-filter-row::-webkit-scrollbar {
  display: none;
}

.sb-filter-btn.ant-btn {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  border: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #737d8c !important;
  background: transparent !important;
  box-shadow: none !important;
  transition: all 0.2s ease;
}

.sb-filter-btn-icon {
  font-size: 11px;
}

.sb-filter-btn.ant-btn:hover {
  color: #b8c4d4 !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

.sb-filter-btn.ant-btn:active {
  transform: scale(0.98);
}

/* Active: Pending */
.sb-filter-btn.sb-filter-btn-pending.active.ant-btn,
.sb-filter-btn.sb-filter-btn-pending.active.ant-btn:hover {
  color: #fff !important;
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.3) !important;
}

.sb-filter-btn.sb-filter-btn-pending.active .sb-filter-btn-icon {
  color: rgba(255, 255, 255, 0.7);
}

/* Active: Received */
.sb-filter-btn.sb-filter-btn-received.active.ant-btn,
.sb-filter-btn.sb-filter-btn-received.active.ant-btn:hover {
  color: #fff !important;
  background: linear-gradient(135deg, #10b981, #059669) !important;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.3) !important;
}

.sb-filter-btn.sb-filter-btn-received.active .sb-filter-btn-icon {
  color: rgba(255, 255, 255, 0.7);
}

/* ── Search ── */
.sb-hero-search {
  margin-top: 10px;
  width: 100%;
}

.sb-search-glass-input.ant-input-affix-wrapper {
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding-inline: 14px;
  transition: all 0.25s ease;
}

.sb-search-glass-input.ant-input-affix-wrapper-focused {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.sb-search-glass-input .ant-input {
  background: transparent !important;
  color: #fff !important;
  font-size: 15px;
  font-weight: 500;
}

.sb-search-glass-input .ant-input::placeholder {
  color: rgba(148, 163, 184, 0.5);
}

.sb-search-icon {
  font-size: 16px;
  color: rgba(148, 163, 184, 0.6);
  margin-right: 6px;
}

.sb-search-glass-input .ant-input-clear-icon {
  color: rgba(255, 255, 255, 0.3);
}

.sb-search-glass-input .ant-input-clear-icon:hover {
  color: #fff;
}

/* ── Content Area ── */
.sb-content {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-width: 0;
}

.sb-columns {
  display: grid;
  gap: 16px;
  align-items: start;
  min-width: 0;
  width: 100%;
}

/* ── Column Header ── */
.sb-column-shell {
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.sb-column-header {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  width: 100%;
}

.sb-column-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.sb-column-title-group {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.sb-column-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.sb-column-icon.pending {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.sb-column-icon.served {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.sb-column-title.ant-typography {
  margin: 0 !important;
  color: #e2e8f0 !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  white-space: nowrap;
}

.sb-column-count {
  padding: 3px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sb-column-count strong {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

/* ── Card Grid ── */
.sb-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  min-width: 0;
  width: 100%;
}

/* ── Order Card (Base - Dark) ── */
.sb-order-card {
  background: #181d25;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  width: 100%;
  min-width: 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.sb-order-card.urgent {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
}

/* ── Theme: DineIn (Clean White) ── */
.sb-order-card.theme-dinein {
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.sb-order-card.theme-dinein .sb-order-header {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.sb-order-card.theme-dinein .sb-order-source-wrap,
.sb-order-card.theme-dinein .sb-order-source-wrap.dinein {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  border: 1.5px solid #cbd5e1;
}

.sb-order-card.theme-dinein .sb-order-source-emphasis,
.sb-order-card.theme-dinein .sb-order-source-emphasis.dinein {
  color: #1e293b;
  text-shadow: none;
  font-weight: 800;
}

.sb-order-card.theme-dinein .sb-order-subtitle-inline {
  color: #64748b;
}

.sb-order-card.theme-dinein .sb-items-list .sb-item-row {
  background: #f8fafc;
  border-left-color: #cbd5e1;
}

.sb-order-card.theme-dinein .sb-items-list .sb-item-row.served {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.sb-order-card.theme-dinein .sb-item-image {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.sb-order-card.theme-dinein .sb-item-image-placeholder {
  color: #64748b;
}

.sb-order-card.theme-dinein .sb-item-name {
  color: #1e293b;
}

.sb-order-card.theme-dinein .sb-item-quantity-text {
  color: #475569;
}

.sb-order-card.theme-dinein .sb-order-footer {
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.sb-order-card.theme-dinein .sb-progress-track {
  background: #e2e8f0;
}

.sb-order-card.theme-dinein .sb-order-meta-right .sb-order-urgency {
  background: rgba(245, 158, 11, 0.1);
}

.sb-order-card.theme-dinein .sb-order-meta-right .sb-order-fresh {
  background: rgba(16, 163, 74, 0.1);
  color: #15803d;
}

/* ── Theme: TakeAway (Warm Amber) ── */
.sb-order-card.theme-takeaway {
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.sb-order-card.theme-takeaway .sb-order-header {
  background: linear-gradient(180deg, #fef3c7, #fde68a);
  border-bottom: 1px solid rgba(251, 191, 36, 0.3);
}

.sb-order-card.theme-takeaway .sb-order-source-wrap {
  background: linear-gradient(135deg, #fed7aa, #fb923c);
  border: 1.5px solid rgba(249, 115, 22, 0.3);
}

.sb-order-card.theme-takeaway .sb-order-source-emphasis {
  color: #7c2d12;
  text-shadow: none;
  font-weight: 800;
}

.sb-order-card.theme-takeaway .sb-order-subtitle-inline {
  color: #9a3412;
}

.sb-order-card.theme-takeaway .sb-items-list .sb-item-row {
  background: rgba(255, 237, 213, 0.5);
  border-left-color: #fdba74;
}

.sb-order-card.theme-takeaway .sb-items-list .sb-item-row.served {
  background: rgba(16, 185, 129, 0.08);
  border-left-color: #10b981;
}

.sb-order-card.theme-takeaway .sb-item-image {
  background: rgba(251, 146, 60, 0.2);
  border-color: rgba(249, 115, 22, 0.2);
}

.sb-order-card.theme-takeaway .sb-item-image-placeholder {
  color: rgba(194, 65, 12, 0.6);
}

.sb-order-card.theme-takeaway .sb-item-name {
  color: #431407;
}

.sb-order-card.theme-takeaway .sb-item-quantity-text {
  color: #78350f;
}

.sb-order-card.theme-takeaway .sb-order-footer {
  background: rgba(254, 243, 199, 0.9);
  border-top: 1px solid rgba(251, 191, 36, 0.2);
}

.sb-order-card.theme-takeaway .sb-progress-track {
  background: rgba(251, 146, 60, 0.15);
}

.sb-order-card.theme-takeaway .sb-order-meta-right .sb-order-urgency {
  background: rgba(251, 146, 60, 0.1);
  color: #9a3412 !important;
}

.sb-order-card.theme-takeaway .sb-order-meta-right .sb-order-fresh {
  background: rgba(22, 163, 74, 0.1);
  color: #15803d;
}

/* ── Theme: Delivery (Soft Rose) ── */
.sb-order-card.theme-delivery {
  background: linear-gradient(180deg, #fdf2f8, #fce7f3);
  border: 1px solid rgba(236, 72, 153, 0.2);
}

.sb-order-card.theme-delivery .sb-order-header {
  background: #fdf2f8;
  border-bottom: 1px solid rgba(236, 72, 153, 0.1);
}

.sb-order-card.theme-delivery .sb-order-source-wrap {
  background: linear-gradient(135deg, #fce7f3, #f9a8d4);
  border: 1.5px solid rgba(236, 72, 153, 0.25);
}

.sb-order-card.theme-delivery .sb-order-source-emphasis {
  color: #831843;
  text-shadow: none;
  font-weight: 800;
}

.sb-order-card.theme-delivery .sb-order-delivery-provider {
  color: #9d174d;
}

.sb-order-card.theme-delivery .sb-order-subtitle-inline {
  color: #9d174d;
}

.sb-order-card.theme-delivery .sb-items-list .sb-item-row {
  background: rgba(236, 72, 153, 0.04);
  border-left-color: #f9a8d4;
}

.sb-order-card.theme-delivery .sb-items-list .sb-item-row.served {
  background: rgba(16, 185, 129, 0.06);
  border-left-color: #10b981;
}

.sb-order-card.theme-delivery .sb-item-image {
  background: rgba(236, 72, 153, 0.1);
  border-color: rgba(219, 39, 119, 0.1);
}

.sb-order-card.theme-delivery .sb-item-image-placeholder {
  color: rgba(157, 23, 77, 0.5);
}

.sb-order-card.theme-delivery .sb-item-name {
  color: #1e293b;
}

.sb-order-card.theme-delivery .sb-item-quantity-text {
  color: #831843;
}

.sb-order-card.theme-delivery .sb-order-footer {
  background: rgba(253, 242, 248, 0.9);
  border-top: 1px solid rgba(236, 72, 153, 0.1);
}

.sb-order-card.theme-delivery .sb-progress-track {
  background: rgba(236, 72, 153, 0.1);
}

.sb-order-card.theme-delivery .sb-order-meta-right .sb-order-urgency {
  background: rgba(245, 158, 11, 0.08);
}

.sb-order-card.theme-delivery .sb-order-meta-right .sb-order-fresh {
  background: rgba(22, 163, 74, 0.08);
  color: #15803d;
}

/* ── Order Header ── */
.sb-order-header {
  padding: 14px 14px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sb-order-header-top,
.sb-order-header-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.sb-order-header-top > *,
.sb-order-header-meta > * {
  min-width: 0;
}

.sb-order-id-wrap {
  display: flex;
  align-items: stretch;
  gap: 0;
  min-width: 0;
  flex: 1;
}

.sb-order-source-wrap {
  display: grid;
  gap: 4px;
  min-width: 0;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.08));
  border: 1px solid rgba(252, 211, 77, 0.3);
  overflow: hidden;
}

.sb-order-source-wrap.dinein {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(245, 158, 11, 0.12));
  border: 1px solid rgba(253, 224, 71, 0.5);
}

.sb-order-source-emphasis {
  color: #fef3c7;
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 800;
  min-width: 0;
  line-height: 1.2;
  letter-spacing: -0.01em;
  word-break: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.sb-order-source-emphasis.dinein {
  color: #ffffff;
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 800;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.sb-order-delivery-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.sb-order-delivery-line .sb-order-source-emphasis {
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 800;
  flex: 1;
  min-width: 0;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.sb-order-delivery-provider {
  color: #fde68a;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
}

.sb-order-subtitle-inline {
  color: #fde68a;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
}

.sb-order-number {
  background: rgba(255, 255, 255, 0.92);
  color: #0b1222;
  font-weight: 800;
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 15px;
  flex-shrink: 0;
  line-height: 1.1;
}

/* ── Order Meta (Urgency / Fresh) ── */
.sb-order-type-tag.ant-tag {
  margin: 0;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 12px;
  border-radius: 999px;
  padding: 4px 10px;
}

.sb-order-type-tag.dinein.ant-tag {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

.sb-order-type-tag.takeaway.ant-tag {
  background: rgba(56, 189, 248, 0.18);
  color: #38bdf8;
}

.sb-order-type-tag.delivery.ant-tag {
  background: rgba(167, 139, 250, 0.18);
  color: #c4b5fd;
}

.sb-order-meta-right {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.sb-order-fresh,
.sb-order-urgency {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 6px;
  padding: 3px 7px;
  line-height: 1;
}

.sb-order-fresh {
  color: #86efac;
  background: rgba(22, 163, 74, 0.15);
}

.sb-order-urgency {
  background: rgba(245, 158, 11, 0.12);
}

/* ── Progress Bar ── */
.sb-progress-track {
  height: 3px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.12);
}

.sb-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* ── Items List ── */
.sb-items-list {
  padding: 10px;
  display: grid;
  gap: 6px;
}

.sb-item-row {
  display: flex !important;
  flex-direction: row !important;
  align-items: flex-start !important;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border-left: 3px solid transparent;
  width: 100%;
  transition: background 0.15s ease;
}

.sb-item-image {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.sb-item-image-placeholder {
  font-size: 20px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
}

.sb-item-row.pending {
  border-left-color: #f59e0b;
}

.sb-item-row.served {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.06);
}

.sb-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sb-item-name {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.3;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

.sb-item-quantity-text {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 1px;
}

.sb-item-detail-row {
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;
}

.sb-item-note {
  display: inline-block;
  align-self: flex-start;
  margin-top: 6px;
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  padding: 5px 12px;
  border-radius: 3px 8px 8px 3px;
  border-left: 3px solid #ef4444;
  font-weight: 600;
  font-size: 12px;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;
}

/* ── Item Action Button ── */
.sb-item-action {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding-top: 2px;
  min-width: 90px;
}

.sb-item-action .ant-btn {
  width: auto;
  min-width: 90px;
  height: 34px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.sb-item-action-btn.ant-btn {
  min-width: 90px;
  height: 34px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.sb-item-action-btn.serve.ant-btn {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: none;
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.sb-item-action-btn.serve.ant-btn:hover {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.sb-item-action-btn.undo.ant-btn {
  background: #ef4444 !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
  transition: all 0.2s ease !important;
}

.sb-item-action-btn.undo.ant-btn:hover {
  background: #f87171 !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

/* ── Order Footer ── */
.sb-order-footer {
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.15);
}

.sb-serve-all-btn.ant-btn,
.sb-reset-btn.ant-btn {
  flex: 1;
  height: 40px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}

.sb-serve-all-btn.ant-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #fff;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.25);
}

.sb-serve-all-btn.ant-btn:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.sb-reset-btn.ant-btn {
  background: #ef4444 !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  transition: all 0.2s ease !important;
}

.sb-reset-btn.ant-btn:hover {
  background: #f87171 !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* ── Empty / Loading ── */
.sb-empty-card,
.sb-empty-state,
.sb-loading-state {
  border-radius: 14px;
  background: #181d25;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.sb-empty-card {
  padding: 30px 16px;
}

.sb-empty-state,
.sb-loading-state {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

/* ── Sound Popover ── */
.sb-sound-popover {
  width: min(320px, 82vw);
  display: grid;
  gap: 12px;
}

.sb-sound-section {
  display: grid;
  gap: 6px;
}

.sb-sound-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #334155;
  font-weight: 600;
  font-size: 14px;
}

.sb-inline-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sb-mini-chip.ant-btn {
  border-radius: 8px;
  font-size: 13px;
}

.sb-sound-hint.ant-typography {
  margin: 0 !important;
  color: #64748b;
  font-size: 12px;
}

/* ── Focus Outline ── */
.sb-action-btn.ant-btn:focus-visible,
.sb-filter-btn.ant-btn:focus-visible,
.sb-item-action-btn.ant-btn:focus-visible,
.sb-serve-all-btn.ant-btn:focus-visible,
.sb-reset-btn.ant-btn:focus-visible,
.sb-toggle-btn.ant-btn:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15) !important;
}

.sb-search-input.ant-input-affix-wrapper:focus-within {
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* ── Order Time ── */
.sb-order-time {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
  min-width: 0;
  max-width: 100%;
}

.sb-order-time span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sb-order-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.sb-order-summary-box {
  padding: 9px 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.42);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.sb-order-summary-box span {
  display: block;
  color: #9fb1c9;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sb-order-summary-box strong {
  display: block;
  color: #f8fafc;
  font-size: 17px;
  margin-top: 2px;
}

.sb-item-qty {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  font-weight: 700;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.sb-item-status {
  font-size: 11px;
  color: #9db0c7;
  margin-top: 0;
}

.sb-item-name-and-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* ═══════════════════════════════════════════
   RESPONSIVE – TABLET (≥ 768px)
   ═══════════════════════════════════════════ */
@media (min-width: 768px) {
  .sb-page {
    padding-bottom: 40px;
  }

  .sb-hero {
    padding: 16px 24px 14px;
  }

  .sb-fire-icon {
    width: 44px;
    height: 44px;
  }

  .sb-title.ant-typography {
    font-size: 22px !important;
  }

  .sb-stat-card {
    min-width: 100px;
  }

  .sb-content {
    padding: 20px 24px;
  }

  .sb-columns {
    grid-template-columns: minmax(0, 1fr);
  }

  .sb-card-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 14px;
  }

  .sb-search-glass-input.ant-input-affix-wrapper {
    height: 46px;
  }
}

/* ═══════════════════════════════════════════
   RESPONSIVE – DESKTOP (≥ 1024px)
   ═══════════════════════════════════════════ */
@media (min-width: 1024px) {
  .sb-hero {
    padding: 18px 32px 14px;
  }

  .sb-fire-icon {
    width: 48px;
    height: 48px;
  }

  .sb-title.ant-typography {
    font-size: 24px !important;
  }

  .sb-content {
    padding: 24px 32px;
  }

  .sb-card-grid {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }

  .sb-order-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .sb-item-row:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .sb-item-row.served:hover {
    background: rgba(16, 185, 129, 0.1);
  }
}

/* ═══════════════════════════════════════════
   RESPONSIVE – LARGE DESKTOP (≥ 1440px)
   ═══════════════════════════════════════════ */
@media (min-width: 1440px) {
  .sb-card-grid {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 16px;
  }
}

/* ═══════════════════════════════════════════
   RESPONSIVE – MOBILE (< 768px)
   ═══════════════════════════════════════════ */
@media (max-width: 767px) {
  html,
  body {
    overflow-x: hidden;
  }

  .sb-page {
    overflow-x: hidden;
  }

  .sb-hero {
    padding: 12px 14px 10px;
  }

  .sb-content {
    padding: 12px;
  }

  .sb-search-card.ant-card,
  .sb-empty-card,
  .sb-empty-state,
  .sb-loading-state,
  .sb-column-shell,
  .sb-order-card,
  .sb-filter-row {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .sb-card-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .sb-filter-row {
    border-radius: 10px;
  }

  .sb-filter-btn.ant-btn {
    height: 36px;
    font-size: 13px;
    border-radius: 8px;
  }

  .sb-hero-top {
    gap: 8px;
  }

  .sb-action-btns {
    gap: 4px;
  }

  .sb-action-btn.ant-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }

  .sb-action-btn-settings.ant-btn {
    padding-inline: 10px;
    font-size: 12px;
  }

  .sb-order-source-wrap {
    max-width: 100%;
    padding: 8px 10px;
  }

  .sb-order-source-emphasis {
    font-size: clamp(17px, 5.5vw, 22px);
  }

  .sb-order-source-emphasis.dinein {
    font-size: clamp(17px, 5.5vw, 22px);
  }

  .sb-order-delivery-line .sb-order-source-emphasis {
    font-size: clamp(17px, 5.5vw, 22px);
  }

  .sb-order-delivery-provider {
    font-size: 12px;
  }

  .sb-item-row {
    gap: 10px;
    padding: 10px;
  }

  .sb-item-image {
    width: 40px;
    height: 40px;
  }

  .sb-item-name {
    font-size: 14px;
  }

  .sb-item-action {
    min-width: auto;
  }

  .sb-item-action .ant-btn {
    min-width: 76px;
    height: 32px;
    font-size: 11px;
  }

  .sb-order-footer {
    padding: 8px;
  }

  .sb-serve-all-btn.ant-btn,
  .sb-reset-btn.ant-btn {
    height: 38px;
    font-size: 12px;
  }

  .sb-order-summary-row,
  .sb-order-footer {
    grid-template-columns: 1fr;
  }

  .sb-column-header {
    margin-bottom: 10px;
  }

  .sb-search-glass-input.ant-input-affix-wrapper {
    height: 40px;
    border-radius: 10px;
    padding-inline: 12px;
  }

  .sb-search-glass-input .ant-input {
    font-size: 14px;
  }

  .sb-search-icon {
    font-size: 14px;
  }

  .sb-stat-card {
    padding: 8px 10px;
  }

  .sb-stat-value {
    font-size: 20px;
  }
}
`;
