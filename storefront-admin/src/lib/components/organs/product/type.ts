import type { client } from '$lib/client';

export type Product = Awaited<ReturnType<ReturnType<typeof client.products>['get']>>['data'] | null;
