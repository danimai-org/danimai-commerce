import { browser } from '$app/environment';
import { formatStoreMoney } from '$lib/money';
import {
	ACCOUNT_STORAGE_KEY,
	ORDERS_STORAGE_KEY_PREFIX,
	parseStoredAccount,
	storageKeyForEmail
} from '$lib/account/storage';

export const ORDER_CACHE_KEY_PREFIX = 'dm_sf_order_';

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

const loadFromCache = (cacheId: string): OrderDetail | null => {
	if (!browser || !cacheId) return null;
	try {
		const raw = sessionStorage.getItem(`${ORDER_CACHE_KEY_PREFIX}${cacheId}`);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Omit<OrderDetail, 'date'> & { date: string };
		return { ...parsed, date: new Date(parsed.date) };
	} catch {
		return null;
	}
};

export const loadOrderDetails = (summary: OrderSummary): OrderDetail => {
	if (summary.orderId) {
		const cached = loadFromCache(summary.orderId);
		if (cached) return cached;
	}
	const cachedById = loadFromCache(summary.id);
	if (cachedById) return cachedById;
	return placeholderFromSummary(summary);
};

export const resolveOrderDetail = (orderRef: string): OrderDetail | null => {
	if (!browser || !orderRef.trim()) return null;

	const ref = orderRef.trim();
	const fromCache = loadFromCache(ref);
	if (fromCache) return fromCache;

	const orders = loadOrdersForAccount();
	const summary =
		orders.find((entry) => entry.orderId === ref) ??
		orders.find((entry) => entry.id === ref);

	if (!summary) return null;

	if (summary.orderId) {
		const cached = loadFromCache(summary.orderId);
		if (cached) return cached;
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
