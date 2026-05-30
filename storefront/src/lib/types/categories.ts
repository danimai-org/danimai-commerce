import { client, type PaginatedRow } from './helpers';

export type AdminCategoryRow = PaginatedRow<
	(typeof client)['admin']['product-categories']['get']
>;

/** @deprecated Use AdminCategoryRow */
export type PaginatedCategories = AdminCategoryRow;

/** @deprecated Use AdminCategoryRow */
export type RetrieveCategory = AdminCategoryRow;
