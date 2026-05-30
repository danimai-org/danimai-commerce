import { client, type DetailById } from '$lib/client';

export type CampaignDetail = DetailById<(typeof client)['campaigns']> & {
	budget_limit?: number | null;
	budget_limit_per?: number | null;
};
