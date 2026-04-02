export type PromotionDetail = {
	id: string;
	code: string;
	method: 'Automatic' | 'Manual';
	status: 'Active' | 'Inactive' | 'Draft';
	campaign_id: string | null;
	campaign_name?: string | null;
};
