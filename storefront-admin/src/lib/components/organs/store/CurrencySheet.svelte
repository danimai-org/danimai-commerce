<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { client } from '$lib/client.js';
	import type { CurrenciesListResponse } from '$lib/currencies/types.js';
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

	const listPayload = $derived(
		(paginateState.query.data?.data ?? null) as CurrenciesListResponse | null
	);
	const rows = $derived(listPayload?.rows ?? []);

	let selectedIds = new SvelteSet<string>();
	const allVisibleSelected = $derived(rows.length > 0 && rows.every((r) => selectedIds.has(r.id)));

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
			rows.forEach((r) => selectedIds.delete(r.id));
		} else {
			rows.forEach((r) => selectedIds.add(r.id));
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
					<th class="px-4 py-3 text-right font-medium">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.id)}
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
						<td class="px-4 py-3">{row.tax_inclusive_pricing ? 'Yes' : 'No'}</td>
						<td class="px-4 py-3 text-right"> </td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<AddCurrenciesSheet bind:open={addOpen} onSuccess={() => void paginateState.refetch()} />
