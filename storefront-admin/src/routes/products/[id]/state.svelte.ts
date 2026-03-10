const state = createStore<{
	product: Product | null;
	variants: ProductVariant[];
	options: ProductOption[];
	category: ProductCategory | null;
	allSalesChannels: SalesChannel[];
	productSalesChannelIds: Set<string>;
}>({
	product: null,
	variants: [],
	options: [],
	category: null,
	allSalesChannels: [],
});