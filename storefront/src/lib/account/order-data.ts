import { browser } from '$app/environment';
import { client } from '$lib/api/client';
import { formatStoreMoney } from '$lib/money';
import {
	ACCOUNT_STORAGE_KEY,
	ORDERS_STORAGE_KEY_PREFIX,
	parseStoredAccount,
	storageKeyForEmail
} from '$lib/account/storage';

export const ORDER_CACHE_KEY_PREFIX = 'dm_sf_order_';
const ORDER_DETAIL_CACHE_PREFIX = 'dm_sf_order_detail_';

export type OrderSummary = {
	id: string;
	orderId: string;
	date: string;
	total: number;
	status: string;
	payment: string;
};

export type OrderDetail = {
	id: string;
	number: string;
	date: Date;
	status: string;
	email: string;
	items: Array<{
		image: string;
		imageAlt: string;
		title: string;
		variant: string;
		quantity: number;
		price: string;
		productHandle?: string;
	}>;
	shippingAddress: string[];
	shippingMethod: string;
	billingAddress: string[];
	paymentMethod: string;
	totals: {
		subtotal: string;
		shipping: string;
		discount: string;
		tax: string;
		total: string;
	};
};

const defaultEmail = 'guest@denimai.com';

type ApiOrder = {
	id: string;
	display_id?: number;
	status?: string;
	email?: string | null;
	currency_code?: string;
	metadata?: Record<string, unknown> | null;
	created_at?: string | Date;
};

type ApiOrderItem = {
	title?: string;
	productName?: string;
	thumbnail?: string | null;
	productImage?: string | null;
	variant?: string | null;
	selectedVariant?: string | null;
	quantity?: number;
	price?: number;
	productHandle?: string | null;
};

function readString(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function addressLinesFromSnapshot(value: unknown): string[] {
	if (!value || typeof value !== 'object') return [];
	const row = value as Record<string, unknown>;
	if (Array.isArray(row.lines)) {
		return row.lines.map((line) => String(line));
	}
	const parts = [
		[row.firstName, row.lastName].filter(Boolean).join(' '),
		row.address1,
		row.address2,
		[row.city, row.state, row.postalCode].filter(Boolean).join(', '),
		row.country,
		row.phone
	]
		.map((part) => (part == null ? '' : String(part).trim()))
		.filter(Boolean);
	return parts.length > 0 ? parts : [];
}

export function orderDetailFromApi(order: ApiOrder): OrderDetail {
	const meta =
		typeof order.metadata === 'object' && order.metadata !== null
			? order.metadata
			: {};
	const items = Array.isArray(meta.items) ? (meta.items as ApiOrderItem[]) : [];
	const totals =
		typeof meta.totals === 'object' && meta.totals !== null
			? (meta.totals as Record<string, unknown>)
			: {};
	const customer =
		typeof meta.customer === 'object' && meta.customer !== null
			? (meta.customer as Record<string, unknown>)
			: {};

	const subtotalNum = Number(totals.subtotal) || 0;
	const shippingNum = Number(totals.shipping) || 0;
	const discountNum = Number(totals.discount) || 0;
	const taxNum = Number(totals.tax) || 0;
	const totalNum =
		Number(totals.total) || subtotalNum + shippingNum + taxNum - discountNum;

	return {
		id: order.id,
		number:
			typeof order.display_id === 'number'
				? String(order.display_id)
				: order.id,
		date: order.created_at ? new Date(order.created_at) : new Date(),
		status: order.status ?? 'pending',
		email:
			readString(customer.email) ??
			readString(order.email) ??
			readString(meta.email) ??
			'—',
		items: items.map((item) => {
			const title = item.productName ?? item.title ?? 'Item';
			const variant = item.variant ?? item.selectedVariant ?? '';
			const priceValue = Number(item.price) || 0;
			return {
				image: item.productImage ?? item.thumbnail ?? '',
				imageAlt: title,
				title,
				variant: variant ?? '',
				quantity: Math.max(1, Number(item.quantity) || 1),
				price: formatStoreMoney(priceValue),
				productHandle: item.productHandle ?? undefined
			};
		}),
		shippingAddress: addressLinesFromSnapshot(meta.shipping_address),
		shippingMethod:
			readString(meta.shipping_method) ?? readString(meta.shippingMethod) ?? '—',
		billingAddress: addressLinesFromSnapshot(meta.billing_address),
		paymentMethod:
			readString(meta.payment_method) ?? readString(meta.paymentMethod) ?? '—',
		totals: {
			subtotal: formatStoreMoney(subtotalNum),
			shipping: formatStoreMoney(shippingNum),
			discount: formatStoreMoney(discountNum),
			tax: formatStoreMoney(taxNum),
			total: formatStoreMoney(totalNum)
		}
	};
}

export const parseStoredOrders = (raw: string | null): OrderSummary[] => {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map((item) => ({
				id: String(item?.id ?? ''),
				orderId: String(item?.orderId ?? ''),
				date: String(item?.date ?? ''),
				total: Number(item?.total ?? 0),
				status: String(item?.status ?? ''),
				payment: String(item?.payment ?? '')
			}))
			.filter((order) => order.id && order.date);
	} catch {
		return [];
	}
};

export const loadOrdersForAccount = (): OrderSummary[] => {
	if (!browser) return [];
	const email =
		parseStoredAccount(localStorage.getItem(ACCOUNT_STORAGE_KEY))?.email ?? defaultEmail;
	const key = storageKeyForEmail(ORDERS_STORAGE_KEY_PREFIX, email, defaultEmail);
	return parseStoredOrders(localStorage.getItem(key));
};

const placeholderFromSummary = (summary: OrderSummary): OrderDetail => ({
	id: summary.orderId || summary.id,
	number: summary.id,
	date: new Date(summary.date),
	status: summary.status || 'pending',
	email: '—',
	items: [],
	shippingAddress: [],
	shippingMethod: '—',
	billingAddress: [],
	paymentMethod: summary.payment || '—',
	totals: {
		subtotal: formatStoreMoney(summary.total),
		shipping: formatStoreMoney(0),
		discount: formatStoreMoney(0),
		tax: formatStoreMoney(0),
		total: formatStoreMoney(summary.total)
	}
});

const persistOrderDetail = (detail: OrderDetail): void => {
	if (!browser) return;
	const payload = { ...detail, date: detail.date.toISOString() };
	const serialized = JSON.stringify(payload);
	localStorage.setItem(`${ORDER_DETAIL_CACHE_PREFIX}${detail.id}`, serialized);
	sessionStorage.setItem(`${ORDER_CACHE_KEY_PREFIX}${detail.id}`, serialized);
};

const loadFromPersistentCache = (cacheId: string): OrderDetail | null => {
	if (!browser || !cacheId) return null;
	for (const storage of [localStorage, sessionStorage]) {
		for (const prefix of [ORDER_DETAIL_CACHE_PREFIX, ORDER_CACHE_KEY_PREFIX]) {
			try {
				const raw = storage.getItem(`${prefix}${cacheId}`);
				if (!raw) continue;
				const parsed = JSON.parse(raw) as Omit<OrderDetail, 'date'> & { date: string };
				return { ...parsed, date: new Date(parsed.date) };
			} catch {
				// try next storage key
			}
		}
	}
	return null;
};

export async function fetchOrderDetailFromApi(orderId: string): Promise<OrderDetail | null> {
	if (!orderId.trim()) return null;
	try {
		const res = await client.storefront.orders({ id: orderId }).get();
		if (res.error || !res.data) return null;
		const detail = orderDetailFromApi(res.data as ApiOrder);
		persistOrderDetail(detail);
		return detail;
	} catch {
		return null;
	}
}

export const loadOrderDetails = (summary: OrderSummary): OrderDetail => {
	const ref = summary.orderId || summary.id;
	const cached = loadFromPersistentCache(ref);
	if (cached) return cached;
	return placeholderFromSummary(summary);
};

export const resolveOrderDetail = async (orderRef: string): Promise<OrderDetail | null> => {
	if (!browser || !orderRef.trim()) return null;

	const ref = orderRef.trim();
	const fromCache = loadFromPersistentCache(ref);
	if (fromCache) return fromCache;

	const fromApi = await fetchOrderDetailFromApi(ref);
	if (fromApi) return fromApi;

	const orders = loadOrdersForAccount();
	const summary =
		orders.find((entry) => entry.orderId === ref) ??
		orders.find((entry) => entry.id === ref);

	if (!summary) return null;

	if (summary.orderId) {
		const cachedByOrderId = loadFromPersistentCache(summary.orderId);
		if (cachedByOrderId) return cachedByOrderId;
		const apiByOrderId = await fetchOrderDetailFromApi(summary.orderId);
		if (apiByOrderId) return apiByOrderId;
	}

	return placeholderFromSummary(summary);
};

export const displayOrderNumber = (detail: OrderDetail, summary?: OrderSummary | null): string => {
	const isUuid = (value: string): boolean =>
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

	const display = detail.number?.trim() || summary?.id?.trim();
	if (display && !isUuid(display)) return display;

	const reference = summary?.orderId?.trim() || detail.id?.trim();
	if (reference && isUuid(reference)) return reference.slice(-12).toUpperCase();

	return display || reference || '—';
};

export const orderDetailsHref = (summary: OrderSummary): string => {
	const ref = summary.orderId || summary.id;
	return `/account/order/orderdetails?order=${encodeURIComponent(ref)}`;
};

/** Save a checkout-time snapshot to durable browser storage. */
export const cacheOrderDetail = (detail: OrderDetail): void => {
	persistOrderDetail(detail);
};
