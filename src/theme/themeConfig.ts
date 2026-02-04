import type { ThemeConfig } from 'antd';

/**
 * POS Theme Configuration
 * Modern Minimal Design - สะอาด สบายตา เน้น mobile-first
 */
const theme: ThemeConfig = {
  token: {
    // Typography
    fontSize: 15,
    fontFamily:
      "var(--font-sans), 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyCode:
      "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",

    // Colors - Soft Modern Clarity Palette
    colorPrimary: '#6366F1',      // Indigo-500 - primary actions
    colorSuccess: '#10B981',      // Emerald-500 - success states
    colorWarning: '#F59E0B',      // Amber-500 - warnings
    colorError: '#EF4444',        // Red-500 - errors
    colorInfo: '#3B82F6',         // Blue-500 - info

    // Text Colors
    colorTextHeading: '#1E293B',  // Slate-800
    colorText: '#1E293B',         // Slate-800 (darkened for contrast)
    colorTextSecondary: '#64748B', // Slate-500
    colorTextDescription: '#94A3B8', // Slate-400

    // Background & Border
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F8FAFC',     // Slate-50 - main background
    colorBorder: '#E2E8F0',       // Slate-200
    colorBorderSecondary: '#F1F5F9', // Slate-100

    // Spacing & Sizing
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    controlHeight: 44,            // Touch-friendly
    controlHeightLG: 52,
    controlHeightSM: 36,

    // Shadows
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  components: {
    Button: {
      controlHeight: 48,
      controlHeightLG: 56,
      controlHeightSM: 40,
      borderRadius: 12,
      algorithm: true,
      fontSize: 15,
      fontWeight: 600,
      paddingInline: 20,
    },
    Input: {
      controlHeight: 48,
      borderRadius: 12,
      paddingInline: 16,
    },
    Select: {
      controlHeight: 48,
      borderRadius: 12,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 20,
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    Modal: {
      borderRadiusLG: 20,
      paddingContentHorizontalLG: 24,
    },
    Table: {
      borderRadius: 12,
      headerBg: '#F8FAFC',
      rowHoverBg: '#F1F5F9',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Typography: {
      lineHeightHeading1: 1.2,
      lineHeightHeading2: 1.3,
      lineHeightHeading3: 1.4,
    },
    Layout: {
      headerBg: '#FFFFFF',
      bodyBg: '#F8FAFC',
      siderBg: '#FFFFFF',
    },
    Menu: {
      itemBorderRadius: 10,
      itemMarginInline: 8,
    },
    Tabs: {
      itemActiveColor: '#6366F1',
      inkBarColor: '#6366F1',
    },
    Divider: {
      colorSplit: '#E2E8F0',
    },
  },
};

export default theme;
