import { client } from "$lib/api/client";

export { client };

export type TreatyData<M extends (...args: never[]) => Promise<unknown>> =
	NonNullable<Awaited<ReturnType<M>>['data']>;

export type PaginatedRow<M extends (...args: never[]) => Promise<unknown>> =
	NonNullable<NonNullable<TreatyData<M>>['rows']>[number];
