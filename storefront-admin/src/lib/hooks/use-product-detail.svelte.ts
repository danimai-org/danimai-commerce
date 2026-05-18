import { createQuery } from '@tanstack/svelte-query';
import { client } from '$lib/client';
import type { CreateQueryResult } from '@tanstack/svelte-query';

export type ProductDetail = Awaited<
	ReturnType<ReturnType<typeof client.products>['get']>
>['data'];

export type ProductVariant = NonNullable<
	NonNullable<Awaited<ReturnType<typeof client['product-variants']['get']>>['data']>['rows']
>[number];

export type ProductOption = {
	id: string;
	title: string;
	product_id: string | null;
	values?: Array<{ id?: string; value?: string }>;
};

type ProductDetailResponse = ProductDetail | null;


let productDetailQuery = $state<CreateQueryResult<ProductDetailResponse> | null>(null);


export const loadProductDetail = (id: string) => {
	productDetailQuery = createQuery(() => ({
		queryKey: ['product-detail', id],
		queryFn: async () => {
			const res = await client.products({id}).get();
			return res.data;
		}
	}));
	return productDetailQuery;
};

export const getProductDetail = () => {
	return productDetailQuery!;
};