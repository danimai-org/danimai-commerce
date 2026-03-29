import { createQuery } from '@tanstack/svelte-query';
import type { CreateQueryResult } from '@tanstack/svelte-query';
import { client } from '$lib/client';

/* eslint-disable @typescript-eslint/no-explicit-any -- distributive conditional matches backend client segments */
/** Segments with `(params) => { get }` where `{ id }` is a valid first argument (excludes `uploads`/etc.). */
type ClientDetailKey = {
	[K in keyof typeof client]: (typeof client)[K] extends (...args: any) => {
		get: (...args: any) => any;
	}
		? { id: string } extends Parameters<(typeof client)[K]>[0]
			? K
			: never
		: never;
}[keyof typeof client];

export const loadDetailResource = <T extends ClientDetailKey>(
	id: string | (() => string),
	entity: T
): CreateQueryResult<Awaited<ReturnType<ReturnType<(typeof client)[T]>['get']>>['data']> => {
	const resolveId = () => (typeof id === 'function' ? id() : id);
	return createQuery(() => {
		const resolvedId = resolveId();
		return {
			queryKey: [entity, resolvedId],
			queryFn: async () => {
				const res = await client[entity]({ id: resolvedId }).get();
				if (res?.error) {
					const err = res.error as { status?: number; value?: { message?: string } };
					if (err?.status === 404) {
						throw new Error(String(err?.value?.message ?? 'Not found'));
					}
					throw new Error(String(err?.value?.message ?? res.error));
				}
				return res.data;
			},
			enabled: !!resolvedId,
			refetchOnWindowFocus: false
		};
	});
};
export const getDetailResource = loadDetailResource;
