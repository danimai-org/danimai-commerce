export type CartRowViewBase = {
	key: string;
	lineId: string;
	href: string;
	name: string;
	priceValue: number;
	image: string | null;
	quantity: number;
	variant: string;
};

export type CartRowView = CartRowViewBase & {
	source: 'api' | 'local';
	priceDisplay: string;
};
