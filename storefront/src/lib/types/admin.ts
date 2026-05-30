import { client, type PaginatedRow, type TreatyData } from './helpers';

export type AdminProductRow = PaginatedRow<(typeof client)['admin']['products']['get']>;

export type AdminProductVariantRow = PaginatedRow<
	(typeof client)['admin']['product-variants']['get']
>;

export type AdminProductVariantDetail = NonNullable<
	Awaited<
		ReturnType<
			ReturnType<(typeof client)['admin']['product-variants']>['get']
		>
	>['data']
>;

export type AdminProductVariantPrice = NonNullable<
	AdminProductVariantDetail['prices']
>[number];

export type AdminProductListData = TreatyData<(typeof client)['admin']['products']['get']>;
