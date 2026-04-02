<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';

	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { createPagination, createPaginationQuery } from '$lib/api';
	import { client } from '$lib/client.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const paginateState = createPagination(
		async () =>
			client['product-attributes'].get({
				query: createPaginationQuery(page.url.searchParams)
			}),
		['product-attributes'],
		createPaginationQuery(page.url.searchParams)
	);
	const { query } = paginateState;
	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);
	const rows = $derived(query.data?.data?.rows ?? []);
	type AttributeRow = (typeof rows)[number];

	const pagination = $derived(query.data?.data?.pagination ?? null);
	const start = $derived(
		pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}
	const tableColumns: TableColumn<AttributeRow>[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'text'
		},
		{ label: 'Type', key: 'type', type: 'text' }
	];
</script>

<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
	<div class="border-b bg-card px-6 py-4">
		<h2 class="flex items-center gap-2 text-base font-semibold">
			<SlidersHorizontal class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			Attributes
		</h2>
	</div>
	<div class="p-4 sm:p-6">
		<PaginationTable searchPlaceholder="Search attributes">
			{#if error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{error}
				</div>
			{:else if loading}
				<div class="flex min-h-[12rem] items-center justify-center rounded-lg border bg-muted/30">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							{rows}
							columns={tableColumns as TableColumn[]}
							emptyMessage="No attributes found."
						/>
					</table>
				</div>
				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</section>
