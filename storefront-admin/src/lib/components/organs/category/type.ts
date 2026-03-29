import type { client } from '$lib/client';

export type Category =
	| Awaited<ReturnType<ReturnType<(typeof client)['product-categories']>['get']>>['data']
	| null;
