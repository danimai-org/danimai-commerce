import { createPaginationQuery } from '$lib/api/pagination.svelte';
import type { PageLoad } from './$types';
import { client } from '$lib/client';
import { createPaginationResponse } from '$lib/api/pagination';

export const load: PageLoad = async ({ url, data }) => {
	const paginationQuery = createPaginationQuery(url.searchParams);
	const regions = await client['regions'].get({ query: paginationQuery });

	if (!regions || !regions.data) {
		return {
			...data,
			regions: null
		};
	}
	return {
		...data,
		regions: createPaginationResponse(regions.data)
	};
};
