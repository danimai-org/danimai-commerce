import { client, type DetailById } from '$lib/client';

export type Product = DetailById<typeof client.products> & {
	media?: Array<{ id: string; url: string; rank: number }>;
};
