import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    fontSize: 16,
    colorPrimary: '#4F46E5', // Indigo-600 to match current vibe but consistent
    borderRadius: 12,
    controlHeight: 44, // Larger touch targets for mobile
    fontFamily: 'var(--font-inter), sans-serif',
    colorTextHeading: '#111827', // Gray-900
    colorText: '#374151', // Gray-700
  },
  components: {
    Button: {
      controlHeight: 48, // Even larger for main actions
      borderRadius: 12,
      algorithm: true, // Enable automatic derivation of states
      fontSize: 16,
      fontWeight: 600,
    },
    Input: {
      controlHeight: 48,
      borderRadius: 12,
    },
    Card: {
      borderRadiusLG: 20, // Softer corners
      boxShadowTertiary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Tailwind shadow-md approximation
    },
    Typography: {
      lineHeightHeading1: 1.2,
      lineHeightHeading2: 1.3,
    },
    Layout: {
      colorBgHeader: 'rgba(255, 255, 255, 0.8)',
      colorBgBody: '#ffffff',
    }
  },
};

export default theme;
