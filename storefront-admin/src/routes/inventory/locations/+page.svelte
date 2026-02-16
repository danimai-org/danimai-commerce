<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import Plus from '@lucide/svelte/icons/plus';

	const API_BASE = 'http://localhost:8000';

	type StockLocation = {
		id: string;
		name: string | null;
		address_id: string | null;
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
	let locationsData = $state<{ data: StockLocation[]; pagination: Pagination } | null>(null);
	let locationsLoading = $state(true);
	let locationsError = $state<string | null>(null);

	async function fetchLocations() {
		locationsLoading = true;
		locationsError = null;
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
			const res = await fetch(`${API_BASE}/stock-locations?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			locationsData = (await res.json()) as { data: StockLocation[]; pagination: Pagination };
		} catch (e) {
			locationsError = e instanceof Error ? e.message : String(e);
			locationsData = null;
		} finally {
			locationsLoading = false;
		}
	}

	$effect(() => {
		page;
		limit;
		searchQuery;
		fetchLocations();
	});

	const locations = $derived(locationsData?.data ?? []);
	const locationsPagination = $derived(locationsData?.pagination ?? null);
	const locationsStart = $derived(
		locationsPagination ? (locationsPagination.page - 1) * locationsPagination.limit + 1 : 0
	);
	const locationsEnd = $derived(
		locationsPagination ? Math.min(locationsPagination.page * locationsPagination.limit, locationsPagination.total) : 0
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
		fetchLocations();
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-foreground">Inventory</span>
				<span>/</span>
				<span>Location</span>
			</div>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-lg font-semibold leading-none">Location</h1>
					<p class="mt-1 text-sm text-muted-foreground">
						Manage stock locations and warehouses.
					</p>
				</div>
				<Button>
					<Plus class="mr-2 size-4" />
					Add Location
				</Button>
			</div>
			<div class="flex items-center gap-2">
				<div class="relative flex-1 max-w-sm">
					<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by name..."
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

		{#if locationsError}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{locationsError}
			</div>
		{:else if locationsLoading}
			<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else}
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Address ID</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
						</tr>
					</thead>
					<tbody>
						{#if locations.length === 0}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
									No locations found.
								</td>
							</tr>
						{:else}
							{#each locations as location (location.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">{location.name ?? '–'}</td>
									<td class="px-4 py-3 font-mono text-xs text-muted-foreground">
										{location.address_id ?? '–'}
									</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(location.created_at)}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(location.updated_at)}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
				<p class="text-sm text-muted-foreground">
					{#if locationsPagination && locationsPagination.total > 0}
						{locationsStart} – {locationsEnd} of {locationsPagination.total} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!locationsPagination?.has_previous_page}
						onclick={() => (page = page - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{locationsPagination?.page ?? 1} of {locationsPagination?.total_pages ?? 1} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!locationsPagination?.has_next_page}
						onclick={() => (page = page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
