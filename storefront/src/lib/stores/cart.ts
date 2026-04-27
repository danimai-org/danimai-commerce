import { writable } from "svelte/store";

function createCartStore() {
  const { subscribe, update } = writable<{ open: boolean }>({ open: false });

  return {
    subscribe,
    open: () => update((s) => ({ ...s, open: true })),
    close: () => update((s) => ({ ...s, open: false })),
    toggle: () => update((s) => ({ ...s, open: !s.open })),
  };
}
export const cart = createCartStore();
