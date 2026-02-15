<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ImageIcon from '@lucide/svelte/icons/image';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type ProductAttribute = {
		id: string;
		title: string;
		type: string;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

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

	const attributeId = $derived($page.params.id);

	let attribute = $state<ProductAttribute | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let productsData = $state<{ data: Product[]; pagination: Pagination } | null>(null);
	let productPage = $state(1);
	let productLimit = $state(10);
	let productSearch = $state('');

	async function loadAttribute() {
		if (!attributeId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/product-attributes/${attributeId}`, {
				cache: 'no-store'
			});
			if (!res.ok) {
				if (res.status === 404) {
					error = 'Attribute not found';
					return;
				}
				throw new Error(await res.text());
			}
			attribute = (await res.json()) as ProductAttribute;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			attribute = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!attributeId) return;
		productPage;
		productLimit;
		loadProducts();
	});

	async function loadProducts() {
		if (!attributeId) return;
		try {
			const params = new URLSearchParams({
				page: String(productPage),
				limit: String(productLimit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/product-attributes/${attributeId}/products?${params}`, {
				cache: 'no-store'
			});
			if (!res.ok) throw new Error(await res.text());
			productsData = (await res.json()) as { data: Product[]; pagination: Pagination };
		} catch (e) {
			productsData = null;
		}
	}

	$effect(() => {
		attributeId;
		loadAttribute();
	});

	const metadataKeys = $derived(
		attribute?.metadata && typeof attribute.metadata === 'object'
			? Object.keys(attribute.metadata as object).length
			: 0
	);
	const jsonKeys = $derived(attribute ? Object.keys(attribute).length : 0);

	const products = $derived(productsData?.data ?? []);
	const pagination = $derived(productsData?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	let metadataOpen = $state(false);
	let jsonOpen = $state(false);
	let metadataRows = $state<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
	let metadataError = $state<string | null>(null);
	let metadataSubmitting = $state(false);

	function openMetadataSheet() {
		if (!attribute) return;
		const meta =
			attribute.metadata && typeof attribute.metadata === 'object'
				? (attribute.metadata as Record<string, unknown>)
				: {};
		metadataRows = Object.entries(meta).map(([k, v]) => ({ key: k, value: String(v ?? '') }));
		if (metadataRows.length === 0) metadataRows = [{ key: '', value: '' }];
		metadataOpen = true;
		metadataError = null;
	}

	function closeMetadataSheet() {
		metadataOpen = false;
		metadataError = null;
	}

	function addMetadataRow() {
		metadataRows = [...metadataRows, { key: '', value: '' }];
	}

	function removeMetadataRow(index: number) {
		metadataRows = metadataRows.filter((_, i) => i !== index);
	}

	async function submitAttributeMetadata() {
		if (!attributeId || !attribute) return;
		metadataError = null;
		metadataSubmitting = true;
		try {
			const meta: Record<string, string | number> = {};
			for (const row of metadataRows) {
				const k = row.key.trim();
				if (!k) continue;
				const num = Number(row.value);
				meta[k] = Number.isNaN(num) ? row.value : num;
			}
			const res = await fetch(`${API_BASE}/product-attributes/${attributeId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata: meta })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeMetadataSheet();
			loadAttribute();
		} catch (e) {
			metadataError = e instanceof Error ? e.message : String(e);
		} finally {
			metadataSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{attribute ? attribute.title : 'Attribute'} | Attributes | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4">
		<nav class="flex items-center gap-2 text-sm">
			<button
				type="button"
				class="flex items-center gap-1 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products')}
			>
				<ChevronLeft class="size-4" />
				Products
			</button>
			<span class="text-muted-foreground">/</span>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/attributes')}
			>
				Attributes
			</button>
			<span class="text-muted-foreground">/</span>
			<span class="font-medium">{attribute?.title ?? attributeId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !attribute}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Attribute not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/attributes')}
				>Back to Attributes</Button
			>
		</div>
	{:else}
		<div class="flex-1 overflow-auto p-6">
			<div class="mx-auto max-w-4xl space-y-6">
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-center gap-2">
						<ListFilter class="size-5 text-muted-foreground" />
						<h1 class="text-xl font-semibold">{attribute.title}</h1>
					</div>
					<Button variant="ghost" size="icon" class="size-8 shrink-0">
						<MoreHorizontal class="size-4" />
						<span class="sr-only">Actions</span>
					</Button>
				</div>

				<dl class="grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-2">
					<div>
						<dt class="font-medium text-muted-foreground">Type</dt>
						<dd class="mt-1 font-medium">{attribute.type}</dd>
					</div>
					<div>
						<dt class="font-medium text-muted-foreground">Created</dt>
						<dd class="mt-1 text-sm">
							{new Date(attribute.created_at).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</dd>
					</div>
					<div>
						<dt class="font-medium text-muted-foreground">Updated</dt>
						<dd class="mt-1 text-sm">
							{new Date(attribute.updated_at).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</dd>
					</div>
				</dl>

				<div class="rounded-lg border bg-card p-6">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<h2 class="font-semibold">Products</h2>
						<div class="flex items-center gap-2">
							<Button variant="outline" size="sm" class="rounded-md">
								<SlidersHorizontal class="mr-1.5 size-4" />
								Add filter
							</Button>
							<div class="relative w-48">
								<Search
									class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									type="search"
									placeholder="Search"
									bind:value={productSearch}
									class="h-9 rounded-md pl-9"
								/>
							</div>
						</div>
					</div>
					<div class="mt-4 overflow-hidden rounded-md border">
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
								{#if products.length === 0}
									<tr>
										<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
											No products with this attribute.
										</td>
									</tr>
								{:else}
									{#each products as product (product.id)}
										<tr class="border-b last:border-0">
											<td class="px-4 py-3">
												<a
													href="/products/{product.id}"
													class="flex items-center gap-3 hover:opacity-80"
												>
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
												{product.variants?.length ?? 0} variant{product.variants?.length === 1
													? ''
													: 's'}
											</td>
											<td class="px-4 py-3">
												<span
													class={cn(
														'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
														product.status === 'published' &&
															'bg-green-500/10 text-green-700 dark:text-green-400',
														product.status === 'draft' && 'bg-muted text-muted-foreground',
														product.status === 'proposed' &&
															'bg-amber-500/10 text-amber-700 dark:text-amber-400',
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
						<div class="mt-4 flex items-center justify-between border-t pt-4">
							<p class="text-sm text-muted-foreground">
								{start} – {end} of {pagination.total} results
							</p>
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={!pagination.has_previous_page}
									onclick={() => (productPage = Math.max(1, productPage - 1))}
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
									onclick={() => (productPage = Math.min(pagination.total_pages, productPage + 1))}
								>
									Next
								</Button>
							</div>
						</div>
					{/if}
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-lg border bg-card p-4">
						<div class="flex items-center justify-between">
							<h3 class="font-medium">Metadata</h3>
							<span class="text-xs text-muted-foreground">{metadataKeys} keys</span>
							<Button variant="ghost" size="icon" class="size-8" onclick={openMetadataSheet}>
								<ExternalLink class="size-4" />
								<span class="sr-only">Open</span>
							</Button>
						</div>
					</div>
					<div class="rounded-lg border bg-card p-4">
						<div class="flex items-center justify-between">
							<h3 class="font-medium">JSON</h3>
							<span class="text-xs text-muted-foreground">{jsonKeys} keys</span>
							<Button variant="ghost" size="icon" class="size-8" onclick={() => (jsonOpen = true)}>
								<ExternalLink class="size-4" />
								<span class="sr-only">Open</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Edit Metadata sheet -->
<Sheet.Root bind:open={metadataOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="min-h-0 flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<h2 class="text-lg font-semibold">Edit Metadata</h2>

					{#if metadataError}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{metadataError}
						</div>
					{/if}

					<div class="overflow-hidden rounded-md border">
						<table class="w-full text-sm">
							<thead class="border-b bg-muted/50">
								<tr>
									<th class="px-4 py-3 text-left font-medium">Key</th>
									<th class="px-4 py-3 text-left font-medium">Value</th>
									<th class="w-10 px-4 py-3"></th>
								</tr>
							</thead>
							<tbody>
								{#each metadataRows as row, i}
									<tr class="border-b last:border-0">
										<td class="px-4 py-2">
											<Input bind:value={row.key} placeholder="Key" class="h-9 w-full" />
										</td>
										<td class="px-4 py-2">
											<Input bind:value={row.value} placeholder="Value" class="h-9 w-full" />
										</td>
										<td class="px-4 py-2">
											<Button
												variant="ghost"
												size="icon"
												class="size-8 shrink-0 text-destructive hover:bg-destructive/10"
												onclick={() => removeMetadataRow(i)}
												aria-label="Remove row"
											>
												<Trash2 class="size-4" />
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<Button variant="outline" size="sm" onclick={addMetadataRow}>Add row</Button>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeMetadataSheet}>Cancel</Button>
				<Button onclick={submitAttributeMetadata} disabled={metadataSubmitting}>
					{metadataSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- JSON view sheet -->
<Sheet.Root bind:open={jsonOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">JSON {jsonKeys} keys</h2>
			</div>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if attribute}
					<pre
						class="rounded-md border bg-zinc-900 p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-300"><code
							>{JSON.stringify(attribute, null, 2)}</code
						></pre>
				{:else}
					<p class="text-sm text-muted-foreground">No data</p>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
