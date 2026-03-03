<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { client } from '$lib/client.js';
	import { page } from '$app/state';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));
	const paginateState = createPagination(
		async () => {
			return client.inventory.levels.get({ query: paginationQuery });
		},
		['inventory-levels']
	);

	type InventoryLevel = {
		id: string;	
		inventory_item_id: string;
		location_id: string;
		stocked_quantity: number;
		reserved_quantity: number;
		available_quantity: number;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	let searchQuery = $state('');

	$effect(() => {
		paginationQuery;
		paginateState.refetch();
	});
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const rows = $derived((paginateState.query.data?.data?.rows ?? []) as unknown as InventoryLevel[]);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: '2-digit'
		});
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-foreground">Inventory</span>
				<span>/</span>
				<span>Stock levels</span>
			</div>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div>
				<h1 class="text-lg font-semibold leading-none">Stock levels</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					View and manage stock levels by location.
				</p>
			</div>
			<div class="flex items-center gap-2">
				<div class="relative flex-1 max-w-sm">
					<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by Item ID or Location ID..."
						bind:value={searchQuery}
						class="pl-9"
					/>
				</div>
			</div>
		</div>

		{#if paginateState.error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{paginateState.error}
			</div>
		{:else if paginateState.loading}
			<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else}
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium">Item ID</th>
							<th class="px-4 py-3 text-left font-medium">Location ID</th>
							<th class="px-4 py-3 text-left font-medium">Stocked</th>
							<th class="px-4 py-3 text-left font-medium">Reserved</th>
							<th class="px-4 py-3 text-left font-medium">Available</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
						</tr>
					</thead>
					<tbody>
						{#if rows.length === 0}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
									No inventory levels found.
								</td>
							</tr>
						{:else}
							{#each rows as level (level.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-mono text-xs">{level.inventory_item_id}</td>
									<td class="px-4 py-3 font-mono text-xs">{level.location_id}</td>
									<td class="px-4 py-3 font-medium">{level.stocked_quantity}</td>
									<td class="px-4 py-3 text-muted-foreground">{level.reserved_quantity}</td>
									<td class="px-4 py-3 font-medium">{level.available_quantity}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(level.updated_at)}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
				<p class="text-sm text-muted-foreground">
					{#if pagination && pagination.total > 0}
						{start} – {end} of {pagination?.total ?? 0} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_previous_page}
						onclick={() => paginateState.query.refetch()}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{pagination?.page ?? 1} of {pagination?.total_pages ?? 1} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_next_page}
						onclick={() => paginateState.query.refetch()}
					>	
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
