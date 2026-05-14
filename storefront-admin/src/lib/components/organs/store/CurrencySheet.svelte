<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client.js';

	import AddCurrenciesSheet from '$lib/components/organs/store/add-currencies-sheet.svelte';
	import { createPagination } from '$lib/api/pagination.svelte.js';
	import { SvelteSet } from 'svelte/reactivity';

	let pageNum = $state(1);
	let limit = $state(10);
	let search = $state('');
	let debouncedSearch = $state('');
	$effect(() => {
		const q = search;
		if (debouncedSearch === q) return;
		const t = setTimeout(() => {
			debouncedSearch = q;
		}, 300);
		return () => clearTimeout(t);
	});

	const paginateState = createPagination(
		async () => {
			const res = await client.currencies.get({
				query: {
					page: pageNum,
					limit,
					...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {})
				}
			});
			return res;
		},
		['currencies'],
		undefined,
		{ keySuffix: () => [pageNum, limit, debouncedSearch] }
	);

	const listPayload = $derived(paginateState.query.data?.data ?? null);
	const rows = $derived(listPayload?.rows ?? []);
	const searchStale = $derived(search.trim() !== debouncedSearch.trim());
	const displayRows = $derived(searchStale ? [] : rows);

	const paginationMeta = $derived(listPayload?.pagination ?? null);
	const count = $derived(paginationMeta?.total ?? 0);
	const currentPage = $derived(paginationMeta?.page ?? pageNum);
	const totalPages = $derived(Math.max(1, paginationMeta?.total_pages ?? 1));
	const rangeStart = $derived(
		paginationMeta ? (paginationMeta.page - 1) * paginationMeta.limit + 1 : 0
	);
	const rangeEnd = $derived(
		paginationMeta ? Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total) : 0
	);
	const tableFetching = $derived(
		searchStale || paginateState.query.isPending || paginateState.query.isFetching
	);
	const error = $derived(paginateState.error);

	const searchingNoResults = $derived(
		debouncedSearch.trim().length > 0 && !tableFetching && displayRows.length === 0 && !error
	);

	function goToPage(next: number) {
		pageNum = Math.max(1, Math.min(next, totalPages));
	}

	let selectedIds = new SvelteSet<string>();
	const allVisibleSelected = $derived(
		displayRows.length > 0 && displayRows.every((r) => selectedIds.has(r.id))
	);

	async function removeSelected() {
		if (selectedIds.size === 0) return;
		try {
			await client.currencies.delete({ ids: Array.from(selectedIds) });
			selectedIds.clear();
			void paginateState.refetch();
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			console.error(error.message);
		}
	}

	function toggleSelectAll() {
		if (allVisibleSelected) {
			displayRows.forEach((r) => selectedIds.delete(r.id));
		} else {
			displayRows.forEach((r) => selectedIds.add(r.id));
		}
	}

	let addOpen = $state(false);
	function openAdd() {
		addOpen = true;
	}
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b p-4">
		<h2 class="font-semibold">Currencies</h2>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={openAdd}>Add</Button>
			<div class="relative">
				<Search
					class="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					class="h-9 w-56 pl-8"
					placeholder="Search"
					bind:value={search}
					oninput={() => (pageNum = 1)}
				/>
			</div>
		</div>
	</div>

	{#if selectedIds.size > 0}
		<div class="flex items-center gap-2 border-b bg-muted/10 px-4 py-2">
			<Button
				variant="outline"
				size="sm"
				class="text-destructive hover:bg-destructive/10"
				onclick={removeSelected}
			>
				<Trash2 class="mr-1.5 size-4" /> Remove ({selectedIds.size})
			</Button>
		</div>
	{/if}

	<div class="overflow-auto p-4">
		<table class="w-full text-left text-sm">
			<thead class="border-b bg-muted/20">
				<tr>
					<th class="w-10 px-4 py-3">
						<input
							type="checkbox"
							checked={allVisibleSelected}
							onchange={toggleSelectAll}
							class="cursor-pointer"
						/>
					</th>
					<th class="px-4 py-3 font-medium">Code</th>
					<th class="px-4 py-3 font-medium">Name</th>
					<th class="px-4 py-3 font-medium">Tax Inclusive</th>
				</tr>
			</thead>
			<tbody>
				{#if error}
					<tr>
						<td colspan={4} class="px-4 py-8 text-center text-destructive">{error}</td>
					</tr>
				{:else if tableFetching && displayRows.length === 0}
					<tr>
						<td colspan={4} class="px-4 py-8 text-center text-muted-foreground">Loading…</td>
					</tr>
				{:else if displayRows.length === 0}
					{#if !searchingNoResults}
						<tr>
							<td colspan={4} class="px-4 py-8 text-center text-muted-foreground">
								No currencies found.
							</td>
						</tr>
					{/if}
				{:else}
					{#each displayRows as row (row.id)}
						<tr class="border-b last:border-b-0 hover:bg-muted/30">
							<td class="px-4 py-3">
								<input
									type="checkbox"
									checked={selectedIds.has(row.id)}
									onchange={() =>
										selectedIds.has(row.id) ? selectedIds.delete(row.id) : selectedIds.add(row.id)}
									class="cursor-pointer"
								/>
							</td>
							<td class="px-4 py-3 font-medium">{row.code}</td>
							<td class="px-4 py-3 text-muted-foreground">{row.name}</td>
							<td class="px-4 py-3">
								<span
									class={cn(
										'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight',
										row.tax_inclusive_pricing
											? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
											: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300'
									)}
								>
									{row.tax_inclusive_pricing ? 'Yes' : 'No'}
								</span>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if count > 0 && !searchStale}
		<div class="flex items-center justify-between gap-4 border-t px-4 py-3">
			<p class="text-sm text-muted-foreground">{rangeStart} - {rangeEnd} of {count} results</p>
			<div class="flex items-center gap-2">
				<Button
					size="sm"
					variant="outline"
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage <= 1 || tableFetching}
				>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">{currentPage} of {totalPages}</span>
				<Button
					size="sm"
					variant="outline"
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage >= totalPages || tableFetching}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</div>

<AddCurrenciesSheet bind:open={addOpen} onSuccess={() => void paginateState.refetch()} />
