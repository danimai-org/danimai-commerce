
<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import type { PaginationMeta, Product } from '../create/types.js';

	type ProductFilter = Record<string, string | number | boolean | string[] | null | undefined>;
	interface Props {
		filter?: ProductFilter;
		selectedIds?: Set<string>;
		title?: string;
		emptyText?: string;
	}

	let {
		filter = {},
		selectedIds = $bindable(new Set<string>()),
		title = 'Products',
		emptyText = 'No products to show.'
	}: Props = $props();

	let rows = $state<Product[]>([]);
	let pagination = $state<PaginationMeta | null>(null);
	let pageNum = $state(1);
	let limit = $state(10);
	let search = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	const normalizedFilter = $derived.by(() => {
		const entries = Object.entries(filter ?? {}).filter(([, value]) => {
			if (value == null) return false;
			if (Array.isArray(value)) return value.length > 0;
			if (typeof value === 'string') return value.trim().length > 0;
			return true;
		});
		return Object.fromEntries(entries) as ProductFilter;
	});
	const queryFilter = $derived.by(() => {
		const next = { ...normalizedFilter } as ProductFilter;

		const categoryId =
			typeof next.category_id === 'string' && next.category_id.trim().length > 0
				? next.category_id
				: undefined;
		if (categoryId && !Array.isArray(next.category_ids)) {
			next.category_ids = [categoryId];
		}

		const collectionId =
			typeof next.collection_id === 'string' && next.collection_id.trim().length > 0
				? next.collection_id
				: undefined;
		if (collectionId && !Array.isArray(next.collection_ids)) {
			next.collection_ids = [collectionId];
		}

		return next;
	});

	const filterKey = $derived.by(() => JSON.stringify(normalizedFilter));
	const count = $derived(pagination?.total ?? 0);
	const totalPages = $derived(Math.max(1, pagination?.total_pages ?? 1));
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(pagination ? Math.min(pagination.page * pagination.limit, count) : 0);
	const allVisibleSelected = $derived(rows.length > 0 && rows.every((row) => selectedIds.has(row.id)));

	$effect(() => {
		filterKey;
		pageNum = 1;
	});

	$effect(() => {
		filterKey;
		pageNum;
		limit;
		search;
		void loadProducts();
	});

	async function loadProducts() {
		loading = true;
		error = null;
		try {
			const res = await client.products.get({
				query: {
					...queryFilter,
					page: pageNum,
					limit,
					search: search.trim() || undefined,
					sorting_field: 'created_at',
					sorting_direction: 'desc'
				} as Record<string, string | number | boolean | string[] | undefined>
			});
			const payload = res.data as
				| {
						data?:
							| {
									rows?: Product[];
									products?: Product[];
									pagination?: PaginationMeta;
							  }
							| Product[];
						rows?: Product[];
						products?: Product[];
						pagination?: PaginationMeta;
				  }
				| undefined;

			const dataNode = payload?.data;
			const dataObject = !Array.isArray(dataNode) ? dataNode : undefined;
			const resolvedRows =
				(Array.isArray(dataNode) ? dataNode : undefined) ??
				(Array.isArray(dataObject?.rows) ? dataObject.rows : undefined) ??
				(Array.isArray(dataObject?.products) ? dataObject.products : undefined) ??
				(Array.isArray(payload?.rows) ? payload.rows : undefined) ??
				(Array.isArray(payload?.products) ? payload.products : undefined) ??
				[];

			rows = applyLocalRelationFilter(resolvedRows, normalizedFilter);
			pagination =
				(Array.isArray(dataNode) ? null : dataObject?.pagination) ?? payload?.pagination ?? null;
		} catch (e) {
			rows = [];
			pagination = null;
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function toggleRowSelection(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}


	function toggleSelectAllVisible() {
		if (allVisibleSelected) {
			const next = new Set(selectedIds);
			for (const row of rows) next.delete(row.id);
			selectedIds = next;
			return;
		}
		const next = new Set(selectedIds);
		for (const row of rows) next.add(row.id);
		selectedIds = next;
	}

	function goToPage(nextPage: number) {
		pageNum = Math.min(totalPages, Math.max(1, nextPage));
	}

	function applyLocalRelationFilter(items: Product[], activeFilter: ProductFilter): Product[] {
		let next = items;

		const apiHandledKeys = new Set(Object.keys(queryFilter));

		const categoryId =
			typeof activeFilter.category_id === 'string' && activeFilter.category_id.trim().length > 0
				? activeFilter.category_id
				: undefined;
		if (categoryId && !apiHandledKeys.has('category_ids')) {
			next = next.filter((item) => {
				const candidate = item as Product & {
					category?: { id?: string | null } | null;
				};
				return candidate.category_id === categoryId || candidate.category?.id === categoryId;
			});
		}

		const collectionId =
			typeof activeFilter.collection_id === 'string' && activeFilter.collection_id.trim().length > 0
				? activeFilter.collection_id
				: undefined;
		if (collectionId && !apiHandledKeys.has('collection_ids')) {
			next = next.filter((item) => {
				const candidate = item as Product & {
					collection_id?: string | null;
					collection?: { id?: string | null } | null;
				};
				return (
					candidate.collection_id === collectionId || candidate.collection?.id === collectionId
				);
			});
		}

		return next;
	}
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b p-4">
		<h2 class="font-semibold">{title}</h2>
		<div class="flex items-center gap-2">
			<Button size="sm">Add</Button>
			<Button size="sm" variant="outline">
				<SlidersHorizontal class="mr-2 size-4" />
				Sort
			</Button>
			<div class="relative">
				<Search
					class="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input class="h-9 w-56 pl-8" placeholder="Search" bind:value={search} />
			</div>
			<Button size="icon" variant="outline" class="size-9">
				<SlidersHorizontal class="size-4" />
			</Button>
		</div>
	</div>

	<div class="overflow-auto p-4">
		<table class="w-full text-sm">
			<thead class="border-b bg-muted/20 text-left">
				<tr>
					<th class="w-10 px-4 py-3">
						<input
							type="checkbox"
							class="rounded border-muted-foreground/50"
							aria-label="Select all visible products"
							checked={allVisibleSelected}
							onchange={toggleSelectAllVisible}
						/>
					</th>
					<th class="px-4 py-3 font-medium">Product</th>
					<th class="px-4 py-3 font-medium">Collection</th>
					<th class="px-4 py-3 font-medium">Sales Channels</th>
					<th class="px-4 py-3 font-medium">Variants</th>
					<th class="px-4 py-3 font-medium">Status</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-muted-foreground">Loading…</td>
					</tr>
				{:else if error}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-destructive">{error}</td>
					</tr>
				{:else if rows.length === 0}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-muted-foreground">{emptyText}</td>
					</tr>
				{:else}
					{#each rows as row (row.id)}
						<tr class="border-b last:border-b-0">
							<td class="px-4 py-3">
								<input
									type="checkbox"
									class="rounded border-muted-foreground/50"
									aria-label={`Select ${row.title}`}
									checked={selectedIds.has(row.id)}
									onchange={() => toggleRowSelection(row.id)}
								/>
							</td>
							<td class="px-4 py-3">
								<a href={`/products/${row.id}`} class="flex items-center gap-3 hover:opacity-90">
									{#if row.thumbnail}
										<img src={row.thumbnail} alt="" class="size-10 rounded-md object-cover" />
									{:else}
										<div
											class="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground"
										>
											<ImageIcon class="size-5" />
										</div>
									{/if}
									<span class="font-medium">{row.title}</span>
								</a>
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{(row as Product & { collection?: { title?: string | null } | null }).collection
									?.title ?? '—'}
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.sales_channels?.length
									? row.sales_channels.map((channel) => channel.name).join(', ')
									: '—'}
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.variant_count ?? row.variants?.length ?? 0}
							</td>
							<td class="px-4 py-3">
								<span
									class={cn(
										'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
										row.status === 'published' &&
											'bg-green-500/10 text-green-700 dark:text-green-400',
										row.status === 'draft' && 'bg-muted text-muted-foreground',
										row.status === 'proposed' &&
											'bg-amber-500/10 text-amber-700 dark:text-amber-400',
										row.status === 'rejected' && 'bg-destructive/10 text-destructive'
									)}
								>
									<span
										class={cn(
											'size-1.5 rounded-full',
											row.status === 'published' && 'bg-green-600',
											row.status === 'draft' && 'bg-muted-foreground/60',
											row.status === 'proposed' && 'bg-amber-600',
											row.status === 'rejected' && 'bg-destructive'
										)}
									></span>
									{row.status}
								</span>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if count > 0}
		<div class="flex items-center justify-between gap-4 border-t px-4 py-3">
			<p class="text-sm text-muted-foreground">{start} - {end} of {count} results</p>
			<div class="flex items-center gap-2">
				<Button size="sm" variant="outline" onclick={() => goToPage(pageNum - 1)} disabled={pageNum <= 1}>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">{pageNum} of {totalPages}</span>
				<Button
					size="sm"
					variant="outline"
					onclick={() => goToPage(pageNum + 1)}
					disabled={pageNum >= totalPages}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</div> 

