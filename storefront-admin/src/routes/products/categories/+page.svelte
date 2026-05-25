<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn,
		CategoryFormSheet
	} from '$lib/components/organs/index.js';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import { client } from '$lib/client.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { createPaginationQuery, createPagination, type PaginationMeta } from '$lib/api';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();

	const SEARCH_DEBOUNCE_MS = 300;

	type CategoryRow = {
		id: string;
		value: string;
		handle?: string;
		status?: string;
		visibility?: string;
	};
	
	const paginateState = createPagination(
		async ({ queryKey }) => {
			const qs = String(queryKey[2] ?? '');
			const res = await client['product-categories'].get({
				query: createPaginationQuery(new URLSearchParams(qs))
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err.value?.message ?? 'Failed to load categories');
			}
			return res;
		},
		['product-categories'],
		undefined,
		{
			keySuffix: () => [page.url.searchParams.toString()]
		}
	);

	const rawRows = $derived((paginateState.query.data?.data?.rows ?? []) as CategoryRow[]);
	const rowsForTable = $derived(
		rawRows.map((c) => ({
			...c,
			handle_display: getHandle(c)
		}))
	);
	const pagination = $derived(
		(paginateState.query.data?.data?.pagination ?? null) as PaginationMeta | null
	);
	const start = $derived(
		pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	let createSheetOpen = $state(false);

	function getHandle(category: CategoryRow): string {
		const h = category.handle;
		if (h) return h.startsWith('/') ? h : `/${h}`;
		return `/${category.value.toLowerCase().replace(/\s+/g, '-')}`;
	}

	function goWithParams(params: Record<string, string>) {
		const searchParams = untrack(() => new SvelteURLSearchParams(page.url.searchParams));
		for (const [key, value] of Object.entries(params)) {
			searchParams.set(key, value);
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`?${searchParams.toString()}`, { replaceState: true, keepFocus: true });
	}

	function applySearchToUrl(search: string) {
		const searchParams = untrack(() => new SvelteURLSearchParams(page.url.searchParams));
		if (search.trim()) {
			searchParams.set('search', search.trim());
		} else {
			searchParams.delete('search');
		}
		searchParams.set('page', '1');
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`?${searchParams.toString()}`, { replaceState: true, keepFocus: true });
	}

	$effect(() => {
		paginateState.searchText = page.url.searchParams.get('search') ?? '';
	});

	$effect(() => {
		const s = paginateState.searchText;
		const tid = setTimeout(() => {
			const wanted = s ?? '';
			const currentSearch = untrack(() => page.url.searchParams.get('search') ?? '');
			if (wanted === currentSearch) return;
			applySearchToUrl(wanted);
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(tid);
	});

	const tableColumns: TableColumn<CategoryRow>[] = [
		{
			label: 'Name',
			key: 'value',
			type: 'link',
			cellHref: (row) => resolve(`/products/categories/${String(row.id ?? '')}`, {}),
			textKey: 'value'
		},
		{ label: 'Handle', key: 'handle_display', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{ label: 'Visibility', key: 'visibility', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => goto(resolve(`/products/categories/${item.id}`, {}))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => paginateState.openDeleteConfirm(item as CategoryRow)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Categories | Products | Danimai Store</title>
	<meta name="description" content="Manage product categories." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<FolderTree class="size-4" />
				<span class="font-semibold">Categories</span>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<Button size="sm" onclick={() => (createSheetOpen = true)}>Create</Button>
			</div>
		</div>

		<PaginationTable
			bind:searchQuery={paginateState.searchText}
			searchPlaceholder="Search categories"
			showFilter={false}
		>
			{#if paginateState.error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{paginateState.error}
				</div>
			{:else if paginateState.loading}
				<div class="flex min-h-[12rem] items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading categories…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={rowsForTable}
							columns={tableColumns as TableColumn[]}
							emptyMessage="No categories found."
						/>
					</table>
				</div>

				<TablePagination
					{pagination}
					{start}
					{end}
					onPageChange={(p) => goWithParams({ page: String(p) })}
				/>
			{/if}
		</PaginationTable>
	</div>
</div>

<CategoryFormSheet
	bind:open={createSheetOpen}
	onSuccess={() => {
		void paginateState.refetch();
	}}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="category"
	entityTitle={(paginateState.deleteItem as CategoryRow | null)?.value ??
		(paginateState.deleteItem as CategoryRow | null)?.id ??
		''}
	customMessage="Delete this category? This action cannot be undone."
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as CategoryRow;
			await client['product-categories'].delete({ category_ids: [row.id] });
			toast.success('Category deleted successfully');
		})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
	error={paginateState.deleteError}
/>
