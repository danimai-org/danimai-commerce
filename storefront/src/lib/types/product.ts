import { client, type PaginatedRow, type TreatyData } from './helpers';

export type StorefrontProductListData = TreatyData<
	(typeof client)['storefront']['products']['get']
>;

export type StorefrontProductListRow = PaginatedRow<
	(typeof client)['storefront']['products']['get']
>;

export type StorefrontProductDetail = NonNullable<
	Awaited<
		ReturnType<ReturnType<(typeof client)['storefront']['products']>['get']>
	>['data']
>;

export type StorefrontProductVariant = NonNullable<
	StorefrontProductDetail['variants']
>[number];

export type StorefrontProductMedia = NonNullable<
	StorefrontProductDetail['media']
>[number];

export type StorefrontProductListVariant = NonNullable<
	StorefrontProductListRow['variant']
>;

/** @deprecated Use StorefrontProductListData */
export type PaginatedProduct = StorefrontProductListData;

/** @deprecated Use StorefrontProductDetail */
export type RetrieveProduct = StorefrontProductDetail;
