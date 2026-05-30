import { client, type DetailById, type PaginatedRow } from '$lib/client';
import type { ShippingAddressValue } from '../shipping-address.js';

export type OrderFulfillmentStatus = DetailById<typeof client.orders>['fulfillment_status'];

export type OrderDetailOrder = DetailById<typeof client.orders>;

export type OrderItem = {
	id: string;
	title: string;
	price: number;
	quantity: number;
	currency: string;
	thumbnail?: string | null;
	sku?: string | null;
};

export type OrderAddress = {
	first_name?: string | null;
	last_name?: string | null;
	company?: string | null;
	address_1?: string | null;
	address_2?: string | null;
	city?: string | null;
	state?: string | null;
	postal_code?: string | null;
	country?: string | null;
	phone_code?: string | null;
	phone?: string | null;
};

export type OrderMetadata = {
	notes?: string | null;
	tags?: string | null;
	items?: unknown;
	subtotal?: number;
	discount_amount?: number;
	shipping_amount?: number;
	tax_amount?: number;
	total?: number;
	billing_address?: string | OrderAddress | null;
	shipping_address?: string | OrderAddress | null;
};

export function getOrderMetadata(order: OrderDetailOrder | null): OrderMetadata {
	const meta = order?.metadata;
	if (!meta || typeof meta !== 'object' || meta === null) return {};
	return meta as OrderMetadata;
}

export function normalizeMetaItem(raw: unknown, index: number, currencyCode: string): OrderItem | null {
	if (!raw || typeof raw !== 'object') return null;
	const o = raw as Record<string, unknown>;
	const id = (o.id as string) ?? (o.variant_id as string) ?? `item-${index}`;
	const title = (o.title as string) ?? (o.product_title as string) ?? 'Unknown';
	let price = 0;
	if (typeof o.price === 'number' && !Number.isNaN(o.price)) price = o.price;
	else if (typeof o.unit_price === 'string') price = Number.parseFloat(o.unit_price) || 0;
	else if (typeof o.unit_price === 'number') price = o.unit_price;
	const quantity = Math.max(0, Math.floor(Number(o.quantity) || 0));
	const currency = (o.currency as string) ?? currencyCode;
	const thumbnail = (o.thumbnail as string | null) ?? null;
	const sku = (o.sku as string | null) ?? (o.variant_sku as string | null) ?? null;
	if (quantity <= 0) return null;
	return { id: String(id), title, price, quantity, currency, thumbnail, sku };
}

export function getOrderItems(order: OrderDetailOrder | null): OrderItem[] {
	if (!order) return [];
	const meta = getOrderMetadata(order);
	let rawItems: unknown = meta.items;
	if (typeof rawItems === 'string') {
		try {
			rawItems = JSON.parse(rawItems) as unknown;
		} catch {
			return [];
		}
	}
	if (!Array.isArray(rawItems)) return [];
	return rawItems
		.map((item, i) => normalizeMetaItem(item, i, order.currency_code))
		.filter((item): item is OrderItem => item !== null);
}

export function parseMetadataAddress(
	raw: string | OrderAddress | null | undefined
): OrderAddress | null {
	if (raw == null) return null;
	if (typeof raw === 'string') {
		try {
			return JSON.parse(raw) as OrderAddress;
		} catch {
			return null;
		}
	}
	return raw;
}

export function hasOrderAddress(addr: OrderAddress | null): boolean {
	return Boolean(addr && (addr.first_name || addr.last_name || addr.address_1));
}

export function toShippingAddressValue(addr: OrderAddress | null): ShippingAddressValue {
	return {
		country: addr?.country ?? 'India',
		first_name: addr?.first_name ?? '',
		last_name: addr?.last_name ?? '',
		company: addr?.company ?? '',
		address_1: addr?.address_1 ?? '',
		address_2: addr?.address_2 ?? '',
		city: addr?.city ?? '',
		state: addr?.state ?? '',
		postal_code: addr?.postal_code ?? '',
		phone_code: addr?.phone_code ?? '+91',
		phone: addr?.phone ?? ''
	};
}

export function formatOrderCurrency(amount: number): string {
	return `₹${amount.toFixed(2)}`;
}

export function formatOrderDateTime(value: string | Date): string {
	try {
		return new Date(value).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	} catch {
		return String(value);
	}
}

export function fulfillmentStatusLabel(status: string): string {
	switch (status) {
		case 'not_fulfilled':
			return 'Unfulfilled';
		case 'partially_fulfilled':
			return 'In progress';
		case 'fulfilled':
			return 'Fulfilled';
		default:
			return status.replace(/_/g, ' ');
	}
}

export function statusBadgeClass(status: string): string {
	const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
	switch (status) {
		case 'completed':
		case 'fulfilled':
		case 'captured':
			return `${base} bg-emerald-500/15 text-emerald-700 dark:text-emerald-400`;
		case 'partially_fulfilled':
			return `${base} bg-blue-500/15 text-blue-700 dark:text-blue-400`;
		case 'pending':
		case 'not_fulfilled':
		case 'not_paid':
		case 'awaiting':
			return `${base} bg-amber-500/15 text-amber-700 dark:text-amber-400`;
		case 'canceled':
		case 'archived':
		case 'refunded':
		case 'returned':
			return `${base} bg-muted text-muted-foreground`;
		case 'requires_action':
			return `${base} bg-destructive/15 text-destructive`;
		default:
			return `${base} bg-muted text-muted-foreground`;
	}
}

export type OrderListRow = PaginatedRow<typeof client.orders.get>;
