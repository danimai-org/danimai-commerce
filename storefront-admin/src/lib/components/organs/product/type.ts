import type { client } from '$lib/client';

type ProductResponse = Awaited<ReturnType<ReturnType<typeof client.products>['get']>>['data'];

export type Product =
	| (ProductResponse & {
			media?: Array<{ id: string; url: string; rank: number }>;
	  })
	| null;
