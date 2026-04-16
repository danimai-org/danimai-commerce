import { createPaginationQuery } from '$lib/api/pagination.svelte';
import type { PageLoad } from './$types';
import { client } from '$lib/client';
import { createPaginationResponse } from '$lib/api/pagination';

export const load: PageLoad = async ({ url, data }) => {
	const paginationQuery = createPaginationQuery(url.searchParams);
	const categories = await client['product-categories'].get({ query: paginationQuery });

	return {
		...data,
		categories: categories?.data ? createPaginationResponse(categories.data) : null
	};
};
