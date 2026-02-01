/**
 * Centralized dynamic imports for code-splitting
 * Following: bundle-dynamic-imports, bundle-preload
 * 
 * Use these lazy-loaded components instead of direct imports
 * for heavy third-party libraries and infrequently used components
 */

import dynamic from 'next/dynamic';
import { ComponentType, ForwardRefExoticComponent } from 'react';

// Utility type for dynamic component options
interface DynamicOptions {
  ssr?: boolean;
  loading?: () => JSX.Element | null;
}

// Default loading placeholder
const DefaultLoading = () => null;

/**
 * Create a dynamically imported component with consistent defaults
 * Supports both ComponentType and ForwardRefExoticComponent
 */
export function createDynamicComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> | ForwardRefExoticComponent<P> }>,
  options: DynamicOptions = {}
) {
  return dynamic(importFn, {
    ssr: options.ssr ?? false,
    loading: options.loading ?? DefaultLoading,
  });
}

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
 * Chart components - load on demand for dashboard
 */
export const DynamicChart = {
  // Add chart library imports here when needed
};

// ============================================
// Heavy Internal Components
// ============================================

/**
 * PDF Export utilities - only load when user initiates export
 */
export const loadPdfExport = () => import('jspdf');
export const loadPdfAutoTable = () => import('jspdf-autotable');

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
      loadPdfAutoTable();
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

/**
 * Create hover handler for preloading
 * Usage: <Button onMouseEnter={createPreloadHandler('pdf')}>Export PDF</Button>
 */
export function createPreloadHandler(module: PreloadModules) {
  return () => preloadModule(module);
}
