export const servingBoardStyles = `
.sb-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
    #0a0f1a;
  padding-bottom: 100px;
  color: #f8fafc;
  font-family: var(--font-sans), "Sarabun", sans-serif;
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
}

.sb-page,
.sb-page * {
  box-sizing: border-box;
}

.sb-hero {
  background: linear-gradient(145deg, rgba(249, 115, 22, 0.2) 0%, rgba(15, 23, 42, 0.96) 50%, rgba(16, 185, 129, 0.1) 100%);
  padding: 16px;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
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
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.sb-fire-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
  flex-shrink: 0;
}

.sb-title-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sb-title.ant-typography {
  font-size: 20px !important;
  font-weight: 700 !important;
  margin: 0 !important;
  color: #fff !important;
  white-space: nowrap;
}

.sb-subtitle.ant-typography {
  display: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.sb-live-tag.ant-tag {
  margin: 0;
  border-radius: 10px;
  font-size: 11px;
  padding: 2px 8px;
  font-weight: 700;
  border: none;
}

.sb-live-tag.online.ant-tag {
  background: #10b981;
  color: #fff;
}

.sb-live-tag.offline.ant-tag {
  background: #ef4444;
  color: #fff;
}

.sb-action-btns {
  display: flex;
  gap: 8px;
}

.sb-action-btn.ant-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: none;
}

.sb-action-btn-settings.ant-btn {
  width: auto;
  padding-inline: 14px;
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}

.sb-action-btn-refresh.ant-btn {
  background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
  color: white;
}

.sb-stats-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 8px;
}

.sb-stats-toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sb-stats-toggle-text.ant-typography {
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.sb-toggle-btn.ant-btn {
  color: rgba(255, 255, 255, 0.5);
}

.sb-stats-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 0 8px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.sb-stats-row::-webkit-scrollbar,
.sb-filter-row::-webkit-scrollbar {
  display: none;
}

.sb-stat-card {
  flex-shrink: 0;
  min-width: 96px;
  padding: 12px 16px;
  border-radius: 14px;
  text-align: center;
  scroll-snap-align: start;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sb-stat-value {
  display: block;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

.sb-stat-label {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.sb-filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px;
  border-radius: 14px;
  background: linear-gradient(132deg, rgba(15, 23, 42, 0.92) 0%, rgba(14, 38, 58, 0.86) 58%, rgba(10, 52, 64, 0.78) 100%);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 5px 14px rgba(2, 6, 23, 0.24);
  scrollbar-width: none;
}

.sb-filter-btn.ant-btn {
  flex-shrink: 0;
  min-width: 118px;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #b8c4d4 !important;
  background: linear-gradient(180deg, rgba(32, 43, 60, 0.96) 0%, rgba(24, 34, 49, 0.98) 100%) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.16s ease;
}

.sb-filter-btn-icon {
  font-size: 11px;
  color: #8ea0b6;
}

.sb-filter-btn.ant-btn:hover {
  color: #e2e8f0 !important;
  border-color: rgba(163, 186, 212, 0.34) !important;
  background: linear-gradient(180deg, rgba(44, 58, 78, 0.96) 0%, rgba(28, 40, 58, 0.98) 100%) !important;
}

.sb-filter-btn.ant-btn:active {
  transform: translateY(1px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.sb-filter-btn.sb-filter-btn-pending.active.ant-btn,
.sb-filter-btn.sb-filter-btn-pending.active.ant-btn:hover {
  color: #1a1f2e !important;
  border-color: #e49900 !important;
  background: linear-gradient(180deg, #f5b200 0%, #e89a00 100%) !important;
  box-shadow: 0 5px 12px rgba(232, 154, 0, 0.3), inset 0 1px 0 rgba(255, 239, 194, 0.5);
}

.sb-filter-btn.sb-filter-btn-pending.active .sb-filter-btn-icon,
.sb-filter-btn.sb-filter-btn-pending.active.ant-btn:hover .sb-filter-btn-icon {
  color: #475569;
}

.sb-filter-btn.sb-filter-btn-received.active.ant-btn,
.sb-filter-btn.sb-filter-btn-received.active.ant-btn:hover {
  color: #062b21 !important;
  border-color: #0ea271 !important;
  background: linear-gradient(180deg, #29d39a 0%, #11b981 100%) !important;
  box-shadow: 0 5px 12px rgba(17, 185, 129, 0.28), inset 0 1px 0 rgba(207, 250, 234, 0.52);
}

.sb-filter-btn.sb-filter-btn-received.active .sb-filter-btn-icon,
.sb-filter-btn.sb-filter-btn-received.active.ant-btn:hover .sb-filter-btn-icon {
  color: #0f3f33;
}

.sb-filter-btn.active.ant-btn:active {
  transform: translateY(1px);
}

.sb-filter-btn.sb-filter-btn-pending.active.ant-btn:active {
  box-shadow: 0 2px 8px rgba(232, 154, 0, 0.24), inset 0 1px 0 rgba(255, 239, 194, 0.4);
}

.sb-filter-btn.sb-filter-btn-received.active.ant-btn:active {
  box-shadow: 0 2px 8px rgba(17, 185, 129, 0.24), inset 0 1px 0 rgba(207, 250, 234, 0.4);
}

.sb-content {
  padding: 16px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.sb-hero-search {
  margin-top: 14px;
  width: 100%;
}

.sb-search-glass-input.ant-input-affix-wrapper {
  height: 52px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  padding-inline: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sb-search-glass-input.ant-input-affix-wrapper-focused {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.15), 0 8px 24px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.sb-search-glass-input .ant-input {
  background: transparent !important;
  color: #fff !important;
  font-size: 16px;
  font-weight: 500;
}

.sb-search-glass-input .ant-input::placeholder {
  color: rgba(148, 163, 184, 0.7);
}

.sb-search-icon {
  font-size: 18px;
  color: #38bdf8;
  margin-right: 8px;
}

.sb-search-glass-input .ant-input-clear-icon {
  color: rgba(255, 255, 255, 0.4);
}

.sb-search-glass-input .ant-input-clear-icon:hover {
  color: #fff;
}

.sb-columns {
  display: grid;
  gap: 18px;
  align-items: start;
  min-width: 0;
  width: 100%;
  overflow-x: clip;
}

.sb-column-shell {
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.sb-column-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}

.sb-column-title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.sb-column-title-group {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.sb-column-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.sb-column-icon.pending {
  background: rgba(249, 115, 22, 0.18);
  color: #f59e0b;
}

.sb-column-icon.served {
  background: rgba(16, 185, 129, 0.18);
  color: #10b981;
}

.sb-column-title.ant-typography {
  margin: 0 !important;
  color: #fff !important;
  font-size: 19px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  white-space: nowrap;
}

.sb-column-hint.ant-typography {
  color: #94a3b8;
  font-size: 13px;
}

.sb-column-count {
  padding: 4px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.sb-column-count strong {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.sb-column-count span {
  color: #94a3b8;
  font-size: 12px;
}

.sb-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  min-width: 0;
  width: 100%;
}

.sb-order-card {
  background: linear-gradient(180deg, rgba(26, 38, 56, 0.96) 0%, rgba(15, 23, 42, 0.99) 100%);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 10px 28px rgba(2, 6, 23, 0.32);
  width: 100%;
  min-width: 0;
}

.sb-order-card.urgent {
  border-color: rgba(248, 113, 113, 0.78);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.24), 0 10px 28px rgba(239, 68, 68, 0.12);
}

/* ── Theme: DineIn (White-Gray, Most Prominent) ── */
.sb-order-card.theme-dinein {
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 50%, #e8ecf1 100%);
  border: 2px solid rgba(100, 116, 139, 0.28);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
}

.sb-order-card.theme-dinein .sb-order-header {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.sb-order-card.theme-dinein .sb-order-source-wrap,
.sb-order-card.theme-dinein .sb-order-source-wrap.dinein {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #dce3ea 100%);
  border: 2px solid rgba(100, 116, 139, 0.32);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 2px 8px rgba(100, 116, 139, 0.15);
}

.sb-order-card.theme-dinein .sb-order-source-emphasis,
.sb-order-card.theme-dinein .sb-order-source-emphasis.dinein {
  color: #1e293b;
  text-shadow: none;
  font-weight: 900;
}

.sb-order-card.theme-dinein .sb-order-subtitle-inline {
  color: #475569;
}

.sb-order-card.theme-dinein .sb-items-list .sb-item-row {
  background: rgba(100, 116, 139, 0.07);
  border-left-color: #94a3b8;
}

.sb-order-card.theme-dinein .sb-items-list .sb-item-row.served {
  background: rgba(16, 185, 129, 0.08);
  border-left-color: #10b981;
}

.sb-order-card.theme-dinein .sb-item-qty {
  background: rgba(100, 116, 139, 0.16);
  color: #1e293b;
}

.sb-order-card.theme-dinein .sb-item-name {
  color: #1e293b;
}



.sb-order-card.theme-dinein .sb-order-footer {
  background: rgba(241, 245, 249, 0.85);
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.sb-order-card.theme-dinein .sb-progress-track {
  background: rgba(148, 163, 184, 0.2);
}

.sb-order-card.theme-dinein .sb-order-meta-right .sb-order-urgency {
  background: rgba(245, 158, 11, 0.12);
}

.sb-order-card.theme-dinein .sb-order-meta-right .sb-order-fresh {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

/* ── Theme: TakeAway (Deep Yellow Background + Soft Orange Details) ── */
.sb-order-card.theme-takeaway {
  background: #fde68a; /* Deeper Yellow Background */
  border: 1.5px solid rgba(251, 146, 60, 0.3);
  box-shadow: 0 8px 24px rgba(251, 146, 60, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
}

.sb-order-card.theme-takeaway .sb-order-header {
  background: linear-gradient(180deg, #fde68a 0%, #fcd34d 100%);
  border-bottom: 1px solid rgba(251, 146, 60, 0.2);
}

.sb-order-card.theme-takeaway .sb-order-source-wrap {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%); /* Softer Orange Gradient */
  border: 2px solid rgba(249, 115, 22, 0.3);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 4px 12px rgba(249, 115, 22, 0.15);
}

.sb-order-card.theme-takeaway .sb-order-source-emphasis {
  color: #7c2d12; /* Deep Burnt Orange for emphasis readability */
  text-shadow: none;
  font-weight: 900;
}

.sb-order-card.theme-takeaway .sb-order-subtitle-inline {
  color: #9a3412;
  opacity: 0.9;
}

.sb-order-card.theme-takeaway .sb-items-list .sb-item-row {
  background: rgba(255, 237, 213, 0.4); /* Softer Pale Orange BG */
  border-left-color: #fdba74;
}

.sb-order-card.theme-takeaway .sb-items-list .sb-item-row.served {
  background: rgba(16, 185, 129, 0.08);
  border-left-color: #10b981;
}

.sb-order-card.theme-takeaway .sb-item-qty {
  background: rgba(251, 146, 60, 0.2);
  color: #7c2d12;
}

.sb-order-card.theme-takeaway .sb-item-name {
  color: #431407;
}



.sb-order-card.theme-takeaway .sb-order-footer {
  background: rgba(254, 243, 199, 0.9);
  border-top: 1px solid rgba(251, 146, 60, 0.16);
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

/* ── Theme: Delivery (Light Pink) ── */
.sb-order-card.theme-delivery {
  background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%);
  border: 1.5px solid rgba(236, 72, 153, 0.28);
  box-shadow: 0 8px 28px rgba(219, 39, 119, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
}

.sb-order-card.theme-delivery .sb-order-header {
  background: linear-gradient(180deg, #fdf2f8 0%, #faeaf3 100%);
  border-bottom: 1px solid rgba(236, 72, 153, 0.16);
}

.sb-order-card.theme-delivery .sb-order-source-wrap {
  background: linear-gradient(135deg, #fce7f3 0%, #f9a8d4 40%, #f0abce 100%);
  border: 1.5px solid rgba(236, 72, 153, 0.34);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 2px 6px rgba(236, 72, 153, 0.1);
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
  background: rgba(236, 72, 153, 0.05);
  border-left-color: #f9a8d4;
}

.sb-order-card.theme-delivery .sb-items-list .sb-item-row.served {
  background: rgba(16, 185, 129, 0.08);
  border-left-color: #10b981;
}

.sb-order-card.theme-delivery .sb-item-qty {
  background: rgba(236, 72, 153, 0.12);
  color: #831843;
}

.sb-order-card.theme-delivery .sb-item-name {
  color: #0f172a;
}



.sb-order-card.theme-delivery .sb-order-footer {
  background: rgba(253, 242, 248, 0.85);
  border-top: 1px solid rgba(236, 72, 153, 0.14);
}

.sb-order-card.theme-delivery .sb-progress-track {
  background: rgba(236, 72, 153, 0.12);
}

.sb-order-card.theme-delivery .sb-order-meta-right .sb-order-urgency {
  background: rgba(245, 158, 11, 0.1);
}

.sb-order-card.theme-delivery .sb-order-meta-right .sb-order-fresh {
  background: rgba(22, 163, 74, 0.1);
  color: #15803d;
}

.sb-order-header {
  padding: 16px 16px 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%);
  border: 1px solid rgba(252, 211, 77, 0.42);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  overflow: hidden;
}

.sb-order-source-wrap.dinein {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.34) 0%, rgba(245, 158, 11, 0.2) 55%, rgba(180, 83, 9, 0.16) 100%);
  border: 1px solid rgba(253, 224, 71, 0.74);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 6px 18px rgba(245, 158, 11, 0.26);
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

.sb-order-source-emphasis {
  color: #fef3c7;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 900;
  min-width: 0;
  line-height: 1.15;
  letter-spacing: 0.01em;
  word-break: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
}

.sb-order-source-emphasis.dinein {
  color: #ffffff;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 900;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.65);
}

.sb-order-delivery-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.sb-order-delivery-line .sb-order-source-emphasis {
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 900;
  flex: 1;
  min-width: 0;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

.sb-order-delivery-provider {
  color: #fde68a;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
  align-self: center;
}

.sb-order-subtitle-inline {
  color: #fde68a;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
}

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
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.sb-order-fresh,
.sb-order-urgency {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 999px;
  padding: 4px 8px;
  line-height: 1;
}

.sb-order-fresh {
  color: #86efac;
  background: rgba(22, 163, 74, 0.18);
}

.sb-order-urgency {
  background: rgba(245, 158, 11, 0.15);
}

.sb-progress-track {
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.18);
}

.sb-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
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

.sb-items-list {
  padding: 12px;
  display: grid;
  gap: 8px;
}

.sb-item-row {
  display: flex !important;
  flex-direction: row !important;
  align-items: flex-start !important; /* Keep start for details to flow down */
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.045);
  border-radius: 12px;
  border-left: 4px solid transparent;
  width: 100%;
}

.sb-item-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 2px;
}

.sb-item-row.pending {
  border-left-color: #f59e0b;
}

.sb-item-row.served {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.sb-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sb-item-name-and-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sb-item-name {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.3;
  min-height: 48px;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  display: flex;
  align-items: center;
}

.sb-item-quantity-text {
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin-top: -8px; /* Pull it closer to the name since name has fixed height */
  margin-bottom: 4px;
  margin-left: 8px;
}

.sb-item-status {
  font-size: 11px;
  color: #9db0c7;
  margin-top: 0;
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
  margin-top: 8px;
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  padding: 6px 14px;
  border-radius: 4px 12px 12px 4px;
  border-left: 4px solid #ef4444;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
  letter-spacing: 0.01em;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;
}

.sb-item-action {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 48px; /* Match image height */
  min-width: 104px;
}

.sb-item-action .ant-btn {
  width: auto;
  min-width: 104px;
  height: 38px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}

.sb-item-action-btn.ant-btn {
  min-width: 104px;
  height: 38px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}

.sb-item-action-btn.serve.ant-btn {
  background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
  border: none;
}

.sb-action-btn.ant-btn:focus-visible,
.sb-filter-btn.ant-btn:focus-visible,
.sb-item-action-btn.ant-btn:focus-visible,
.sb-serve-all-btn.ant-btn:focus-visible,
.sb-reset-btn.ant-btn:focus-visible,
.sb-toggle-btn.ant-btn:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.2) !important;
}

.sb-search-input.ant-input-affix-wrapper:focus-within {
  border-color: rgba(56, 189, 248, 0.8);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.22);
}

.sb-item-action-btn.undo.ant-btn {
  background: linear-gradient(180deg, #f43f5e 0%, #e11d48 100%) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
    0 2px 4px -1px rgba(0, 0, 0, 0.06), 
    0 10px 15px -3px rgba(225, 29, 72, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.02em;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.sb-item-action-btn.undo.ant-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  pointer-events: none;
}

.sb-item-action-btn.undo.ant-btn:hover {
  background: linear-gradient(180deg, #fb7185 0%, #f43f5e 100%) !important;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 20px -3px rgba(225, 29, 72, 0.45);
  filter: brightness(1.1);
}

.sb-order-footer {
  padding: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  background: rgba(15, 23, 42, 0.55);
}

.sb-serve-all-btn.ant-btn,
.sb-reset-btn.ant-btn {
  height: 42px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 700;
}

.sb-serve-all-btn.ant-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.sb-reset-btn.ant-btn {
  background: linear-gradient(180deg, #f43f5e 0%, #e11d48 100%) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
    0 2px 4px -1px rgba(0, 0, 0, 0.06), 
    0 10px 15px -3px rgba(225, 29, 72, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.02em;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.sb-reset-btn.ant-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  pointer-events: none;
}

.sb-reset-btn.ant-btn:hover {
  background: linear-gradient(180deg, #fb7185 0%, #f43f5e 100%) !important;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 20px -3px rgba(225, 29, 72, 0.45);
  filter: brightness(1.1);
}

.sb-empty-card,
.sb-empty-state,
.sb-loading-state {
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.sb-empty-card {
  padding: 30px 16px;
}

.sb-empty-state,
.sb-loading-state {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.sb-sound-popover {
  width: min(340px, 82vw);
  display: grid;
  gap: 14px;
}

.sb-sound-section {
  display: grid;
  gap: 8px;
}

.sb-sound-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #334155;
  font-weight: 700;
}

.sb-inline-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sb-mini-chip.ant-btn {
  border-radius: 10px;
}

.sb-sound-hint.ant-typography {
  margin: 0 !important;
  color: #64748b;
  font-size: 12px;
}

@media (min-width: 768px) {
  .sb-page {
    padding-bottom: 40px;
  }

  .sb-hero {
    padding: 20px 24px;
    border-radius: 0 0 28px 28px;
    position: relative;
  }

  .sb-fire-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }

  .sb-title.ant-typography {
    font-size: 26px !important;
  }

  .sb-subtitle.ant-typography {
    display: block;
  }

  .sb-stat-card {
    min-width: 110px;
    padding: 14px 20px;
  }

  .sb-stat-value {
    font-size: 28px;
  }

  .sb-content {
    padding: 24px;
  }

  .sb-search-card-grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
    align-items: end;
  }

  .sb-columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (min-width: 1024px) {
  .sb-hero {
    padding: 24px 32px;
  }

  .sb-fire-icon {
    width: 64px;
    height: 64px;
  }

  .sb-title.ant-typography {
    font-size: 30px !important;
  }

  .sb-order-card:hover {
    transform: translateY(-2px);
    border-color: rgba(148, 163, 184, 0.28);
    box-shadow: 0 12px 28px rgba(2, 6, 23, 0.36);
  }

  .sb-item-row:hover {
    background: rgba(148, 163, 184, 0.12);
  }

  .sb-item-row.served:hover {
    background: rgba(16, 185, 129, 0.14);
  }
}

@media (max-width: 767px) {
  html,
  body {
    overflow-x: hidden;
  }

  .sb-page {
    overflow-x: hidden;
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
    gap: 12px;
  }

  .sb-filter-row {
    gap: 6px;
    padding: 6px;
    border-radius: 12px;
    overflow-x: hidden;
  }

  .sb-filter-btn.ant-btn {
    flex: 1;
    min-width: 0;
    height: 39px;
    padding: 0 8px;
    font-size: 13.5px;
    border-radius: 9px;
    gap: 6px;
  }

  .sb-filter-btn-icon {
    font-size: 10.5px;
  }

  .sb-hero-top,
  .sb-order-header-top,
  .sb-column-header {
    flex-direction: column;
    align-items: stretch;
  }

  .sb-order-header-meta {
    align-items: center;
  }

  .sb-action-btns {
    align-self: flex-start;
  }

  .sb-order-id-wrap {
    flex-wrap: wrap;
  }

  .sb-order-source-wrap {
    max-width: 100%;
    padding: 8px 10px;
  }

  .sb-order-source-wrap.dinein {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 4px 12px rgba(245, 158, 11, 0.22);
  }

  .sb-order-source-emphasis,
  .sb-order-subtitle-inline,
  .sb-item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
  }

  .sb-order-source-emphasis {
    font-size: clamp(19px, 6.5vw, 25px);
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  .sb-order-source-emphasis.dinein {
    font-size: clamp(19px, 6.5vw, 25px);
    color: #ffffff;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
  }

  .sb-order-delivery-line .sb-order-source-emphasis {
    font-size: clamp(19px, 6.5vw, 25px);
    color: #ffffff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  .sb-order-delivery-provider {
    font-size: 13px;
  }

  .sb-order-subtitle-inline,
  .sb-item-name {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .sb-order-time {
    max-width: 100%;
  }

  .sb-order-time span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sb-order-summary-row,
  .sb-order-footer {
    grid-template-columns: 1fr;
  }

  .sb-item-row {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    gap: 12px;
    padding: 12px;
  }

  .sb-item-action {
    flex-shrink: 0;
    min-width: auto;
    display: flex;
    align-items: center;
    height: 44px; /* Match mobile image height */
  }

  .sb-item-action .ant-btn {
    min-width: 80px;
    height: 34px;
    font-size: 12px;
  }
}
`;
