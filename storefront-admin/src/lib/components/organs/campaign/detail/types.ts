export type CampaignDetail = {
	id: string;
	name: string;
	description: string | null;
	identifier: string;
	start_date: string | null;
	end_date: string | null;
	budget_type?: 'usage' | 'spend' | null;
	budget_limit?: number | null;
	budget_limit_per?: number | null;
};
