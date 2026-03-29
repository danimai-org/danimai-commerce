import { createQuery, type CreateQueryResult, type QueryFunction } from '@tanstack/svelte-query';
import { getContext, setContext } from 'svelte';

const QUERY_KEY = Symbol('detail_query');

export function setDetailContext<T>(query: T) {
	setContext(QUERY_KEY, query);
}

export function getDetailContext<T>() {
	return getContext<CreateQueryResult<T>>(QUERY_KEY);
}

export const useDetailQuery = <T>(queryFn: QueryFunction<T>, queryKey: string[]) => {
	const detailState = createQuery(() => ({
		queryKey,
		queryFn,
		refetchOnWindowFocus: false
	}));

	return detailState;
};
