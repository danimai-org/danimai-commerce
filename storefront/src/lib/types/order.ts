import { client } from './helpers';

export type StorefrontOrder = NonNullable<
	Awaited<
		ReturnType<ReturnType<(typeof client)['storefront']['orders']>['get']>
	>['data']
>;

/** Metadata enriched by retrieve-order (see order-detail-response.util). */
export type StorefrontOrderDetailMetadata = {
	items?: Array<{
		id?: string;
		productName?: string;
		productImage?: string | null;
		title?: string;
		thumbnail?: string | null;
		selectedVariant?: string | null;
		variant?: string | null;
		price?: number;
		quantity?: number;
		productHandle?: string | null;
	}>;
	totals?: {
		subtotal?: number;
		shipping?: number;
		discount?: number;
		tax?: number;
		total?: number;
		currency_code?: string;
	};
	customer?: { email?: string };
	shipping_address?: unknown;
	billing_address?: unknown;
	shipping_method?: string;
	shippingMethod?: string;
	payment_method?: string;
	paymentMethod?: string;
	email?: string;
};

const emptyOrderMetadata: StorefrontOrderDetailMetadata = {};

export function parseStorefrontOrderMetadata(
	metadata: unknown,
): StorefrontOrderDetailMetadata {
	if (typeof metadata !== 'object' || metadata === null) {
		return emptyOrderMetadata;
	}
	return metadata as StorefrontOrderDetailMetadata;
}
