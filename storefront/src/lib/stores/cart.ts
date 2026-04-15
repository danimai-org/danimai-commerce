import { writable } from "svelte/store";

function createCartStore() {
  const isBrowser = typeof window !== "undefined";
  const CART_ITEMS_STORAGE_KEY = "dm_sf_local_cart_items";
  const initialItems = (() => {
    if (!isBrowser) return [];
    const raw = window.localStorage.getItem(CART_ITEMS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const { subscribe, update } = writable<{
    open: boolean;
    items: any[];
  }>({ open: false, items: initialItems });
  const persistItems = (items: any[]) => {
    if (!isBrowser) return;
    window.localStorage.setItem(CART_ITEMS_STORAGE_KEY, JSON.stringify(items));
  };
  return {
    subscribe,
    open: () => update((s) => ({ ...s, open: true })),
    close: () => update((s) => ({ ...s, open: false })),
    toggle: () => update((s) => ({ ...s, open: !s.open })),
    addItem: (item: Omit<any, "key" | "quantity"> & { quantity?: number }) => {
      const variantKey = item.variantId ?? item.variant ?? "default";
      const key = `${item.href || item.name}-${variantKey}`;
      update((s) => {
        const existing = s.items.find((i) => i.key === key);
        const items = existing
          ? s.items.map((i) =>
              i.key === key
                ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                : i,
            )
          : [
              ...s.items,
              {
                ...item,
                key,
                href: item.href ?? "",
                quantity: item.quantity ?? 1,
              } as any,
            ];
        persistItems(items);
        return { ...s, items, open: true };
      });
    },
    updateQuantity: (key: string, delta: number) => {
      update((s) => {
        const items = s.items
          .map((i) =>
            i.key === key
              ? { ...i, quantity: Math.max(0, i.quantity + delta) }
              : i,
          )
          .filter((i) => i.quantity > 0);
        persistItems(items);
        return { ...s, items };
      });
    },
    removeItem: (key: string) => {
      update((s) => {
        const items = s.items.filter((i) => i.key !== key);
        persistItems(items);
        return {
          ...s,
          items,
        };
      });
    },
  };
}
export const cart = createCartStore();
