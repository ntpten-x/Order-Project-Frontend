/**
 * Centralized dynamic imports for code-splitting
 * Following: bundle-dynamic-imports, bundle-preload
 * 
 * Use these lazy-loaded components instead of direct imports
 * for heavy third-party libraries and infrequently used components
 */

import dynamic from 'next/dynamic';

// Default loading placeholder
const DefaultLoading = () => null;

// ============================================
// Heavy Third-Party Components
// ============================================

/**
 * QRCode component - only load when needed
 * Used in: Payment flows, PromptPay
 */
export const DynamicQRCode = dynamic(
  () => import('qrcode.react').then(mod => ({ default: mod.QRCodeSVG })),
  {
    ssr: false,
    loading: DefaultLoading,
  }
);

/**
 * QRCode canvas variant - useful when exporting images/PDFs
 */
export const DynamicQRCodeCanvas = dynamic(
  () => import('qrcode.react').then(mod => ({ default: mod.QRCodeCanvas })),
  {
    ssr: false,
    loading: DefaultLoading,
  }
);

/**
 * PDF Export utilities - only load when user initiates export
 */
export const loadPdfExport = () => import('jspdf');

/**
 * Excel Export - only load when user initiates export
 */
export const loadXlsx = () => import('xlsx');

// ============================================
// Preload utilities for anticipated navigation
// ============================================

type PreloadModules = 'pdf' | 'xlsx' | 'qrcode';

const preloadCache = new Set<PreloadModules>();

/**
 * Preload modules on hover/focus for perceived performance
 * Following: bundle-preload
 */
export function preloadModule(module: PreloadModules) {
  if (preloadCache.has(module)) return;
  
  switch (module) {
    case 'pdf':
      loadPdfExport();
      break;
    case 'xlsx':
      loadXlsx();
      break;
    case 'qrcode':
      import('qrcode.react');
      break;
  }
  
  preloadCache.add(module);
}
