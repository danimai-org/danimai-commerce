<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';

	const API_BASE = 'http://localhost:8000/admin';

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
	let page = $state(1);
	let limit = $state(10);
	let levelsData = $state<{ data: InventoryLevel[]; pagination: Pagination } | null>(null);
	let levelsLoading = $state(true);
	let levelsError = $state<string | null>(null);

	async function fetchLevels() {
		levelsLoading = true;
		levelsError = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			if (searchQuery.trim()) {
				params.append('search', searchQuery.trim());
			}
			const res = await fetch(`${API_BASE}/inventory/levels?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			levelsData = (await res.json()) as { data: InventoryLevel[]; pagination: Pagination };
		} catch (e) {
			levelsError = e instanceof Error ? e.message : String(e);
			levelsData = null;
		} finally {
			levelsLoading = false;
		}
	}

	$effect(() => {
		page;
		limit;
		searchQuery;
		fetchLevels();
	});

	const levels = $derived(levelsData?.data ?? []);
	const levelsPagination = $derived(levelsData?.pagination ?? null);
	const levelsStart = $derived(
		levelsPagination ? (levelsPagination.page - 1) * levelsPagination.limit + 1 : 0
	);
	const levelsEnd = $derived(
		levelsPagination ? Math.min(levelsPagination.page * levelsPagination.limit, levelsPagination.total) : 0
	);

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function handleSearch() {
		page = 1;
		fetchLevels();
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
						onkeydown={(e) => {
							if (e.key === 'Enter') handleSearch();
						}}
					/>
				</div>
				<Button variant="outline" onclick={handleSearch}>Search</Button>
			</div>
		</div>

		{#if levelsError}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{levelsError}
			</div>
		{:else if levelsLoading}
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
						{#if levels.length === 0}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
									No inventory levels found.
								</td>
							</tr>
						{:else}
							{#each levels as level (level.id)}
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
					{#if levelsPagination && levelsPagination.total > 0}
						{levelsStart} – {levelsEnd} of {levelsPagination.total} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!levelsPagination?.has_previous_page}
						onclick={() => (page = page - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{levelsPagination?.page ?? 1} of {levelsPagination?.total_pages ?? 1} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!levelsPagination?.has_next_page}
						onclick={() => (page = page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
