import { createPaginationQuery } from '$lib/api/pagination.svelte';
import type { PageLoad } from './$types';
import { client } from '$lib/client';
import { createPaginationResponse } from '$lib/api/pagination';

export const load: PageLoad = async ({ url }) => {
    const paginationQuery = createPaginationQuery(url.searchParams);
    const salesChannels = await client['sales-channels'].get({ query: paginationQuery });

    if (!salesChannels || !salesChannels.data) {
        return {
            salesChannels: null,
        }
    }

    return {
        salesChannels: createPaginationResponse(salesChannels.data),
    }
}