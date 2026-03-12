<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Search from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';

	type Product = {
		id: string;
		title: string;
		handle: string;
		status: string;
		thumbnail: string | null;
		category_id: string | null;
		created_at: string;
		updated_at: string;
		collection: { id: string; title: string; handle: string } | null;
		variants: Array<{ id: string }>;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	interface Props {
		products?: Product[];
		pagination?: Pagination | null;
		loading?: boolean;
		onPageChange?: (page: number) => void;
	}

	let { products = [], pagination = null, loading = false, onPageChange = () => {} }: Props = $props();

	let productSearch = $state('');

	const filteredProducts = $derived.by(() => {
		const query = productSearch.trim().toLowerCase();
		if (!query) return products;
		return products.filter((product) => {
			return (
				product.title.toLowerCase().includes(query) ||
				product.handle.toLowerCase().includes(query) ||
				(product.collection?.title ?? '').toLowerCase().includes(query)
			);
		});
	});

	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0);
</script>

<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
	<div class="flex flex-wrap items-center justify-between gap-4 border-b bg-card px-6 py-4 rounded-t-lg">
		<h2 class="text-base font-semibold">Products</h2>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" class="rounded-md">
				<SlidersHorizontal class="mr-1.5 size-4" />
				Add filter
			</Button>
			<div class="relative w-48">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input type="search" placeholder="Search" bind:value={productSearch} class="h-9 rounded-md pl-9" />
			</div>
		</div>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead class="border-b bg-muted/50">
				<tr>
					<th class="px-4 py-3 text-left font-medium">Product</th>
					<th class="px-4 py-3 text-left font-medium">Collection</th>
					<th class="px-4 py-3 text-left font-medium">Sales Channels</th>
					<th class="px-4 py-3 text-left font-medium">Variants</th>
					<th class="px-4 py-3 text-left font-medium">Status</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">Loading products…</td>
					</tr>
				{:else if filteredProducts.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
							No products with this attribute.
						</td>
					</tr>
				{:else}
					{#each filteredProducts as product (product.id)}
						<tr class="border-b last:border-0">
							<td class="px-4 py-3">
								<a href="/products/{product.id}" class="flex items-center gap-3 hover:opacity-80">
									{#if product.thumbnail}
										<img
											src={product.thumbnail}
											alt=""
											class="size-10 shrink-0 rounded-md object-cover"
										/>
									{:else}
										<div
											class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
										>
											<ImageIcon class="size-5" />
										</div>
									{/if}
									<span class="font-medium">{product.title}</span>
								</a>
							</td>
							<td class="px-4 py-3 font-medium">
								{#if product.collection}
									<a
										href="/products/collections/{product.collection.id}"
										class="text-primary hover:underline"
									>
										{product.collection.title}
									</a>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-muted-foreground">—</td>
							<td class="px-4 py-3 text-muted-foreground">
								{product.variants?.length ?? 0} variant{product.variants?.length === 1 ? '' : 's'}
							</td>
							<td class="px-4 py-3">
								<span
									class={cn(
										'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
										product.status === 'published' &&
											'bg-green-500/10 text-green-700 dark:text-green-400',
										product.status === 'draft' && 'bg-muted text-muted-foreground',
										product.status === 'proposed' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
										product.status === 'rejected' && 'bg-destructive/10 text-destructive'
									)}
								>
									<span
										class={cn(
											'size-1.5 rounded-full',
											product.status === 'published' && 'bg-green-600',
											product.status === 'draft' && 'bg-muted-foreground/60',
											product.status === 'proposed' && 'bg-amber-600',
											product.status === 'rejected' && 'bg-destructive'
										)}
									></span>
									{product.status}
								</span>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if pagination && pagination.total > 0}
		<div class="mt-4 flex items-center justify-between border-t px-[5px] pt-[5px] pb-[5px]">
			<p class="text-sm text-muted-foreground">
				{start} – {end} of {pagination.total} results
			</p>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={!pagination.has_previous_page}
					onclick={() => onPageChange(Math.max(1, pagination.page - 1))}
				>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">
					{pagination.page} of {pagination.total_pages} pages
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={!pagination.has_next_page}
					onclick={() => onPageChange(Math.min(pagination.total_pages, pagination.page + 1))}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</section>
