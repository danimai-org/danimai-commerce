import type { client } from '$lib/client';

export type Tag =
	| Awaited<ReturnType<ReturnType<(typeof client)['product-tags']>['get']>>['data']
	| null;
