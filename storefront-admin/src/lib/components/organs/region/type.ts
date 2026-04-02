import type { client } from '$lib/client';

export type Region = Awaited<ReturnType<ReturnType<typeof client.regions>['get']>>['data'] | null;
