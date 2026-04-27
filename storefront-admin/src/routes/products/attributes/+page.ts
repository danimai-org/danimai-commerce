import { createPaginationQuery } from '$lib/api/pagination.svelte';
import type { PageLoad } from './$types';
import { client } from '$lib/client';
import { createPaginationResponse } from '$lib/api/pagination';

export const load: PageLoad = async ({ url, data }) => {
	const paginationQuery = createPaginationQuery(url.searchParams);
	const attributes = await client['product-attributes'].get({ query: paginationQuery });

	if (!attributes || !attributes.data) {
		return {
			attributes: null
		};
	}
	return {
		...data,
		attributes: createPaginationResponse(attributes.data)
	};
};
