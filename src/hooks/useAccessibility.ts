import { useEffect, useCallback, useRef } from 'react';

/**
 * Accessibility Hooks and Utilities
 * Following ui-ux-pro-max accessibility guidelines:
 * - focus-states: Visible focus rings on interactive elements
 * - keyboard-nav: Tab order matches visual order
 * - aria-labels: Proper labeling for assistive technologies
 * - reduced-motion: Respect user preference
 */

/**
 * Hook to manage focus trap within a container
 * Useful for modals, dropdowns, and other overlay components
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to detect user's motion preference
 * Returns true if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const mediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  // Use simple boolean - SSR safe
  return mediaQuery?.matches ?? false;
}

/**
 * Hook for keyboard navigation in lists
 * Supports arrow key navigation and home/end keys
 */
export function useListKeyboardNav<T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical';
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const activeIndex = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const upKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const downKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

    let newIndex = activeIndex.current;

    switch (e.key) {
      case upKey:
        e.preventDefault();
        newIndex = activeIndex.current - 1;
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0;
        }
        break;
      case downKey:
        e.preventDefault();
        newIndex = activeIndex.current + 1;
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1;
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(activeIndex.current);
        return;
      default:
        return;
    }

    activeIndex.current = newIndex;
    items[newIndex]?.focus();
  }, [items, orientation, loop, onSelect]);

  return { handleKeyDown, activeIndex };
}

/**
 * Hook for managing skip links
 * Allows keyboard users to skip repetitive content
 */
export function useSkipLink(targetId: string) {
  const handleSkip = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.removeAttribute('tabindex');
    }
  }, [targetId]);

  return handleSkip;
}

/**
 * Announce message to screen readers
 * Creates an aria-live region for dynamic announcements
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
  
  document.body.appendChild(announcement);
  
  // Delay to ensure screen reader picks up the change
  setTimeout(() => {
    announcement.textContent = message;
  }, 100);

  // Clean up after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate accessible ID for form elements
 */
let idCounter = 0;
export function useAccessibleId(prefix: string = 'accessible'): string {
  const idRef = useRef<string>();
  
  if (!idRef.current) {
    idRef.current = `${prefix}-${++idCounter}`;
  }
  
  return idRef.current;
}

/**
 * CSS class for screen reader only content
 * Add to globals.css:
 * .sr-only {
 *   position: absolute;
 *   width: 1px;
 *   height: 1px;
 *   padding: 0;
 *   margin: -1px;
 *   overflow: hidden;
 *   clip: rect(0, 0, 0, 0);
 *   white-space: nowrap;
 *   border: 0;
 * }
 */
export const SR_ONLY_CLASS = 'sr-only';

/**
 * Common ARIA attributes helper
 */
export const ariaHelpers = {
  // For buttons that open menus
  menuButton: (isOpen: boolean, menuId: string) => ({
    'aria-haspopup': true as const,
    'aria-expanded': isOpen,
    'aria-controls': menuId,
  }),

  // For menu items
  menuItem: (isSelected: boolean) => ({
    role: 'menuitem' as const,
    'aria-selected': isSelected,
  }),

  // For tabs
  tab: (isSelected: boolean, panelId: string) => ({
    role: 'tab' as const,
    'aria-selected': isSelected,
    'aria-controls': panelId,
    tabIndex: isSelected ? 0 : -1,
  }),

  // For tab panels
  tabPanel: (tabId: string, isHidden: boolean) => ({
    role: 'tabpanel' as const,
    'aria-labelledby': tabId,
    hidden: isHidden,
    tabIndex: 0,
  }),

  // For loading states
  loading: (isLoading: boolean, label?: string) => ({
    'aria-busy': isLoading,
    'aria-label': label || (isLoading ? 'กำลังโหลด' : undefined),
  }),

  // For error states
  error: (hasError: boolean, errorId?: string) => ({
    'aria-invalid': hasError,
    'aria-describedby': hasError ? errorId : undefined,
  }),
};
