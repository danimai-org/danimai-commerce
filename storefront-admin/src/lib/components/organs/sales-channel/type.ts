import type { client } from '$lib/client';

export type SalesChannel = Awaited<
	ReturnType<ReturnType<(typeof client)['sales-channels']>['get']>
>['data'];
