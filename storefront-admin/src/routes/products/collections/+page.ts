import { createPaginationQuery } from '$lib/api/pagination.svelte';
import type { PageLoad } from './$types';
import { client } from '$lib/client';
import { createPaginationResponse } from '$lib/api/pagination';

export const load: PageLoad = async ({ url, data }) => {
	const paginationQuery = createPaginationQuery(url.searchParams);
	const collections = await client['collections'].get({ query: paginationQuery });

	return {
		...data,
		collections: collections?.data ? createPaginationResponse(collections.data) : null
	};
};
