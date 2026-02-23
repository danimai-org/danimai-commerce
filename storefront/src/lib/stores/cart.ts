import { writable } from 'svelte/store';

export interface CartLineItem {
	key: string;
	href: string;
	name: string;
	priceDisplay: string;
	priceValue: number;
	image: string | null;
	quantity: number;
	variant: string;
}

function createCartStore() {
	const { subscribe, set, update } = writable<{
		open: boolean;
		items: CartLineItem[];
	}>({ open: false, items: [] });

	return {
		subscribe,
		open: () => update((s) => ({ ...s, open: true })),
		close: () => update((s) => ({ ...s, open: false })),
		toggle: () => update((s) => ({ ...s, open: !s.open })),
		addItem: (item: Omit<CartLineItem, 'key' | 'quantity'> & { quantity?: number }) => {
			const key = item.href || `${item.name}-${item.variant}`;
			update((s) => {
				const existing = s.items.find((i) => i.key === key);
				const items = existing
					? s.items.map((i) =>
							i.key === key ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i
						)
					: [
							...s.items,
							{
								...item,
								key,
								href: item.href ?? '',
								quantity: item.quantity ?? 1
							} as CartLineItem
						];
				return { ...s, items, open: true };
			});
		},
		updateQuantity: (key: string, delta: number) => {
			update((s) => {
				const items = s.items
					.map((i) =>
						i.key === key ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
					)
					.filter((i) => i.quantity > 0);
				return { ...s, items };
			});
		},
		removeItem: (key: string) => {
			update((s) => ({
				...s,
				items: s.items.filter((i) => i.key !== key)
			}));
		}
	};
}

export const cart = createCartStore();
