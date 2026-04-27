import { createPaginationQuery } from '$lib/api/pagination.svelte';
import type { PageLoad } from './$types';
import { client } from '$lib/client';
import { createPaginationResponse } from '$lib/api/pagination';
export const load: PageLoad = async ({ url, data }) => {
	const paginationQuery = createPaginationQuery(url.searchParams);
	const attributesgroup = await client['product-attribute-groups'].get({ query: paginationQuery });
	return {
		...data,
		attributesgroup: attributesgroup?.data ? createPaginationResponse(attributesgroup.data) : null
	};
};
