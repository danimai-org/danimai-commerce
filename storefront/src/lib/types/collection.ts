import { client, type PaginatedRow } from './helpers';

export type AdminCollectionRow = PaginatedRow<
	(typeof client)['admin']['collections']['get']
>;

/** @deprecated Use AdminCollectionRow */
export type PaginatedCollection = AdminCollectionRow;

/** @deprecated Use AdminCollectionRow */
export type RetrieveCollection = AdminCollectionRow;
