import type { client } from '$lib/client';

export type Attribute =
	| Awaited<ReturnType<ReturnType<(typeof client)['product-attributes']>['get']>>['data']
	| null;
