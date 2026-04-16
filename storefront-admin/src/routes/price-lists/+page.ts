import { createPaginationQuery } from '$lib/api/pagination.svelte';
import type { PageLoad } from './$types';
import { client } from '$lib/client';
import { createPaginationResponse } from '$lib/api/pagination';
export const load: PageLoad = async ({ url }) => {
	const paginationQuery = createPaginationQuery(url.searchParams);
	const priceLists = await client['price-lists'].get({ query: paginationQuery });

	if (!priceLists || !priceLists.data) {
		return {
			priceLists: null
		};
	}
	return {
		priceLists: createPaginationResponse(priceLists.data)
	};
};
