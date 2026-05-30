import { client, type PaginatedRow } from './helpers';

export type CustomerAddressRow = PaginatedRow<
	(typeof client)['storefront']['customers']['me']['addresses']['get']
>;

export type CustomerMe = NonNullable<
	Awaited<ReturnType<(typeof client)['storefront']['auth']['me']['get']>>['data']
>;

export type CustomerAuthTokens = NonNullable<
	Awaited<
		ReturnType<(typeof client)['storefront']['auth']['refresh']['post']>
	>['data']
>;
