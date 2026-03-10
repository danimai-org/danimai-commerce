import { createQuery } from '@tanstack/svelte-query';
import { client } from '$lib/client';
import type { CreateQueryResult } from '@tanstack/svelte-query';
type ProductDetailResponse = Awaited<ReturnType<ReturnType<typeof client.products>['get']>>['data'] | null;


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