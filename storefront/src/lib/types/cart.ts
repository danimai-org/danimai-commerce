import { client } from './helpers';

export type Cart = NonNullable<
	Awaited<
		ReturnType<ReturnType<(typeof client)['storefront']['carts']>['get']>
	>['data']
>;

export type CartLineItem = Cart['line_items'][number];

export type CartShippingAddress = Cart['shipping_address'];

export type CartLineVariantRef = Pick<CartLineItem, 'variant_id' | 'product_id'>;
