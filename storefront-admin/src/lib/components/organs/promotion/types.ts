export type Promotion = {
	id: string;
	code: string;
	method: 'Automatic' | 'Manual';
	status: 'Active' | 'Inactive' | 'Draft';
	campaign_id?: string | null;
};

export type PromotionTypeId =
	| 'amount_off_products'
	| 'amount_off_order'
	| 'percentage_off_product'
	| 'percentage_off_order'
	| 'buy_x_get_y'
	| 'free_shipping';

export type Campaign = {
	id: string;
	name: string;
	description: string | null;
	identifier: string;
	start_date: string | null;
	end_date: string | null;
};

export type CodeCondition = { id: string; field: string; op: string; value: string };

export const PROMOTION_TYPES: { id: PromotionTypeId; label: string; description: string }[] = [
	{ id: 'amount_off_products', label: 'Amount off products', description: 'Discount specific products or collection of products.' },
	{ id: 'amount_off_order', label: 'Amount off order', description: 'Discounts the total order amount.' },
	{ id: 'percentage_off_product', label: 'Percentage off product', description: 'Discounts a percentage off selected products.' },
	{ id: 'percentage_off_order', label: 'Percentage off order', description: 'Discounts a percentage of the total order amount.' },
	{ id: 'buy_x_get_y', label: 'Buy X Get Y', description: 'Buy X product(s), get Y product(s).' },
	{ id: 'free_shipping', label: 'Free shipping', description: 'Applies a 100% discount to shipping fees.' }
];

export const CURRENCIES = [
	{ code: 'USD', name: 'US Dollar', symbol: '$' },
	{ code: 'INR', name: 'Indian Rupee', symbol: '₹' },
	{ code: 'EUR', name: 'Euro', symbol: '€' },
	{ code: 'GBP', name: 'British Pound', symbol: '£' }
] as const;
