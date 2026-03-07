"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useCartStore } from "../../store/useCartStore";

type POSHotkeysOptions = {
  enabled?: boolean;
  onCheckout: () => void;
  onFocusSearch: () => void;
  onCloseTopLayer: () => boolean;
  onOpenCart?: () => void;
  allowClearCartShortcut?: boolean;
};

export function usePOSHotkeys({
  enabled = true,
  onCheckout,
  onFocusSearch,
  onCloseTopLayer,
  onOpenCart,
  allowClearCartShortcut = false,
}: POSHotkeysOptions) {
  useHotkeys(
    "f2",
    (event) => {
      // Read from Zustand at keypress time so the shortcut always uses the latest cart snapshot.
      if (useCartStore.getState().getTotalItems() === 0) {
        return;
      }

      event.preventDefault();
      onCheckout();
    },
    {
      enabled,
      keydown: true,
      preventDefault: true,
      description: "Open checkout",
    },
    [enabled, onCheckout]
  );

  useHotkeys(
    "f3",
    (event) => {
      event.preventDefault();
      onFocusSearch();
    },
    {
      enabled,
      keydown: true,
      preventDefault: true,
      enableOnFormTags: true,
      description: "Focus product search",
    },
    [enabled, onFocusSearch]
  );

  useHotkeys(
    "f4",
    (event) => {
      if (!onOpenCart || useCartStore.getState().getTotalItems() === 0) {
        return;
      }

      event.preventDefault();
      onOpenCart();
    },
    {
      enabled,
      keydown: true,
      preventDefault: true,
      description: "Open cart",
    },
    [enabled, onOpenCart]
  );

  useHotkeys(
    "esc",
    (event) => {
      const didCloseLayer = onCloseTopLayer();

      if (didCloseLayer) {
        event.preventDefault();
      }
    },
    {
      enabled,
      keydown: true,
      enableOnFormTags: true,
      description: "Close the active POS modal or drawer",
    },
    [enabled, onCloseTopLayer]
  );

  useHotkeys(
    "shift+f8",
    (event) => {
      const cartStore = useCartStore.getState();
      if (cartStore.cartItems.length === 0) {
        return;
      }

      event.preventDefault();
      cartStore.clearCart();
    },
    {
      enabled: enabled && allowClearCartShortcut,
      keydown: true,
      preventDefault: true,
      description: "Clear cart via Zustand",
    },
    [allowClearCartShortcut, enabled]
  );
}
