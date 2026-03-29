import type { client } from '$lib/client';

export type Collection =
	| Awaited<ReturnType<ReturnType<typeof client.collections>['get']>>['data']
	| null;
