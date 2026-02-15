<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Bell from '@lucide/svelte/icons/bell';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileText from '@lucide/svelte/icons/file-text';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Info from '@lucide/svelte/icons/info';
	import Plus from '@lucide/svelte/icons/plus';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type ProductCollection = {
		id: string;
		title: string;
		handle: string;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type SalesChannel = {
		id: string;
		name: string;
		description: string | null;
		is_default: boolean;
		metadata: unknown;
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
		variants: Array<{ id: string }>;
		collection: { id: string; title: string; handle: string } | null;
		sales_channels: SalesChannel[];
	};

	type ProductsResponse = {
		products: Product[];
		count: number;
		offset: number;
		limit: number;
	};

	const collectionId = $derived($page.params.id);

	let collection = $state<ProductCollection | null>(null);
	let productsData = $state<ProductsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let productPage = $state(1);
	let productLimit = $state(20);
	let productSearch = $state('');

	let editOpen = $state(false);
	let editTitle = $state('');
	let editHandle = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	let metadataOpen = $state(false);
	let metadataRows = $state<Array<{ key: string; value: string }>>([]);
	let metadataError = $state<string | null>(null);
	let metadataSubmitting = $state(false);

	let jsonOpen = $state(false);

	// Add products sheet
	let addProductsSheetOpen = $state(false);
	let addProductsData = $state<ProductsResponse | null>(null);
	let addProductsPage = $state(1);
	let addProductsLimit = $state(20);
	let addProductsSearch = $state('');
	let addProductsSelectedIds = $state<Set<string>>(new Set());
	let addProductsSubmitting = $state(false);
	let addProductsError = $state<string | null>(null);
	const addProductsList = $derived(addProductsData?.products ?? []);
	const addProductsCount = $derived(addProductsData?.count ?? 0);
	const addProductsOffset = $derived(addProductsData?.offset ?? 0);
	const addProductsTotalPages = $derived(
		addProductsLimit > 0 ? Math.ceil(addProductsCount / addProductsLimit) : 1
	);
	const addProductsStart = $derived(addProductsOffset + 1);
	const addProductsEnd = $derived(
		Math.min(addProductsOffset + addProductsList.length, addProductsCount)
	);
	const addProductsFiltered = $derived(
		addProductsSearch.trim()
			? addProductsList.filter((p) =>
					p.title.toLowerCase().includes(addProductsSearch.trim().toLowerCase())
				)
			: addProductsList
	);

	async function loadAddProductsList() {
		try {
			const params = new URLSearchParams({
				page: String(addProductsPage),
				limit: String(addProductsLimit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/products?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			addProductsData = (await res.json()) as ProductsResponse;
		} catch (e) {
			addProductsData = null;
		}
	}

	$effect(() => {
		if (addProductsSheetOpen) {
			addProductsPage;
			addProductsLimit;
			loadAddProductsList();
		}
	});

	function openAddProductsSheet() {
		addProductsSheetOpen = true;
		addProductsSelectedIds = new Set();
		addProductsPage = 1;
		addProductsSearch = '';
		addProductsError = null;
	}

	function closeAddProductsSheet() {
		addProductsSheetOpen = false;
		addProductsError = null;
	}

	function toggleAddProductSelection(id: string) {
		addProductsSelectedIds = new Set(addProductsSelectedIds);
		if (addProductsSelectedIds.has(id)) addProductsSelectedIds.delete(id);
		else addProductsSelectedIds.add(id);
		addProductsSelectedIds = new Set(addProductsSelectedIds);
	}

	function toggleAddProductsSelectAll() {
		if (addProductsSelectedIds.size === addProductsFiltered.length) {
			addProductsSelectedIds = new Set();
		} else {
			addProductsSelectedIds = new Set(addProductsFiltered.map((p) => p.id));
		}
	}

	async function submitAddProducts() {
		if (!collectionId || !collection) return;
		const ids = Array.from(addProductsSelectedIds);
		if (ids.length === 0) {
			addProductsError = 'Select at least one product';
			return;
		}
		addProductsError = null;
		addProductsSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/collections/${collectionId}/products`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ product_ids: ids })
			});
			if (!res.ok) throw new Error(await res.text());
			closeAddProductsSheet();
			loadProducts();
		} catch (e) {
			addProductsError = e instanceof Error ? e.message : String(e);
		} finally {
			addProductsSubmitting = false;
		}
	}

	async function loadCollection() {
		if (!collectionId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/collections/${collectionId}`, { cache: 'no-store' });
			if (!res.ok) {
				if (res.status === 404) {
					error = 'Collection not found';
					return;
				}
				throw new Error(await res.text());
			}
			collection = (await res.json()) as ProductCollection;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			collection = null;
		} finally {
			loading = false;
		}
	}

	async function loadProducts() {
		if (!collectionId) return;
		try {
			const params = new URLSearchParams({
				page: String(productPage),
				limit: String(productLimit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/collections/${collectionId}/products?${params}`, {
				cache: 'no-store'
			});
			if (!res.ok) throw new Error(await res.text());
			productsData = (await res.json()) as ProductsResponse;
		} catch (e) {
			productsData = null;
		}
	}

	$effect(() => {
		collectionId;
		loadCollection();
	});

	$effect(() => {
		if (collectionId) {
			productPage;
			productLimit;
			loadProducts();
		} else {
			productsData = null;
		}
	});

	const products = $derived(productsData?.products ?? []);
	const count = $derived(productsData?.count ?? 0);
	const limit = $derived(productsData?.limit ?? productLimit);
	const offset = $derived(productsData?.offset ?? 0);
	const totalPages = $derived(limit > 0 ? Math.ceil(count / limit) : 1);
	const start = $derived(offset + 1);
	const end = $derived(Math.min(offset + products.length, count));

	function getHandle(c: ProductCollection | null): string {
		if (!c) return '';
		return c.handle.startsWith('/') ? c.handle : `/${c.handle}`;
	}

	function openEdit() {
		if (!collection) return;
		editOpen = true;
		editTitle = collection.title;
		editHandle = collection.handle.replace(/^\//, '') || '';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editError = null;
	}

	async function submitEdit() {
		if (!collection) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const handle =
				editHandle.trim() ||
				editTitle
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, '');
			const res = await fetch(`${API_BASE}/collections/${collection.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: editTitle.trim(), handle })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			loadCollection();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	function openMetadataEdit() {
		if (!collection) return;
		const meta =
			collection.metadata && typeof collection.metadata === 'object'
				? (collection.metadata as Record<string, unknown>)
				: {};
		metadataRows = Object.entries(meta).map(([k, v]) => ({ key: k, value: String(v ?? '') }));
		if (metadataRows.length === 0) metadataRows = [{ key: '', value: '' }];
		metadataOpen = true;
		metadataError = null;
	}

	function closeMetadataEdit() {
		metadataOpen = false;
		metadataError = null;
	}

	function addMetadataRow() {
		metadataRows = [...metadataRows, { key: '', value: '' }];
	}

	function removeMetadataRow(index: number) {
		metadataRows = metadataRows.filter((_, i) => i !== index);
	}

	async function submitMetadata() {
		if (!collection) return;
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
			const res = await fetch(`${API_BASE}/collections/${collection.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata: meta })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeMetadataEdit();
			loadCollection();
		} catch (e) {
			metadataError = e instanceof Error ? e.message : String(e);
		} finally {
			metadataSubmitting = false;
		}
	}

	const metadataKeys = $derived(
		collection?.metadata && typeof collection.metadata === 'object'
			? Object.keys(collection.metadata as object).length
			: 0
	);
	const jsonKeys = $derived(
		collection ? ['id', 'title', 'handle', 'metadata', 'created_at', 'updated_at'].length : 0
	);

	function goToProductEdit(productId: string) {
		goto(`/products/${productId}`);
	}

	async function removeProductFromCollection(productId: string) {
		if (!collectionId || !collection) return;
		try {
			const res = await fetch(`${API_BASE}/collections/${collectionId}/products`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ product_ids: [productId] })
			});
			if (!res.ok) throw new Error(await res.text());
			loadProducts();
		} catch {
			// could set error state
		}
	}
</script>

<svelte:head>
	<title>{collection ? collection.title : 'Collection'} | Collections | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Breadcrumb + actions -->
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4">
		<nav class="flex items-center gap-2 text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/collections')}
			>
				<FileText class="size-4 shrink-0" />
				<span>Collections</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{collection?.title ?? collectionId ?? '…'}</span>
		</nav>
		<div class="flex items-center gap-1">
			<Button variant="ghost" size="icon" class="size-9">
				<Bell class="size-4" />
				<span class="sr-only">Notifications</span>
			</Button>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !collection}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Collection not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/collections')}>
				Back to Collections
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<!-- Collection details section: title bar (title left, actions right) + Handle below -->
				<section class="flex flex-col gap-6 border-b pb-8">
					<div class="flex items-center justify-between gap-4">
						<h1 class="text-2xl font-semibold tracking-tight">{collection.title}</h1>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
							>
								<MoreHorizontal class="size-4" />
								<span class="sr-only">Actions</span>
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
									sideOffset={4}
								>
									<DropdownMenu.Item
										textValue="Edit"
										class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
										onSelect={openEdit}
									>
										<Pencil class="size-4" />
										Edit
									</DropdownMenu.Item>
									<DropdownMenu.Item
										textValue="Delete"
										class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
										onSelect={() => {}}
									>
										<Trash2 class="size-4" />
										Delete
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					</div>
					<div class="flex items-center gap-3">
						<label
							for="collection-handle"
							class="shrink-0 text-sm font-medium text-muted-foreground">Handle</label
						>
						<Input
							id="collection-handle"
							type="text"
							value={getHandle(collection)}
							readonly
							class="h-9 max-w-xs rounded-md border border-input bg-background px-3 font-mono text-sm"
						/>
					</div>
				</section>

				<!-- Products section -->
				<section class="rounded-lg border bg-card">
					<div class="flex flex-wrap items-center justify-between gap-4 border-b bg-card px-6 py-4">
						<div class="flex items-center gap-2">
							<h2 class="text-base font-semibold">Products</h2>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">Products actions</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Add products"
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={openAddProductsSheet}
										>
											Add products
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						<div class="flex items-center gap-2">
							<Button type="button" size="sm" class="rounded-md" onclick={openAddProductsSheet}>
								<Plus class="mr-1.5 size-4" />
								Add
							</Button>
							<Button variant="outline" size="sm" class="rounded-md">
								<SlidersHorizontal class="mr-1.5 size-4" />
								Sort
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
							<button
								type="button"
								class="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<SlidersHorizontal class="size-4" />
								<span class="sr-only">Sort</span>
							</button>
						</div>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="sticky top-0 z-10 border-b bg-muted/50">
								<tr>
									<th class="w-10 px-4 py-3 text-left font-medium">
										<input
											type="checkbox"
											class="rounded border-muted-foreground/50"
											aria-label="Select all"
										/>
									</th>
									<th class="px-4 py-3 text-left font-medium">Product</th>
									<th class="px-4 py-3 text-left font-medium">Collection</th>
									<th class="px-4 py-3 text-left font-medium">Sales Channels</th>
									<th class="px-4 py-3 text-left font-medium">Variants</th>
									<th class="px-4 py-3 text-left font-medium">Status</th>
									<th class="w-10 px-4 py-3"></th>
								</tr>
							</thead>
							<tbody>
								{#if products.length === 0}
									<tr>
										<td colspan="7" class="px-4 py-8 text-center text-muted-foreground">
											No products in this collection.
										</td>
									</tr>
								{:else}
									{#each products as product (product.id)}
										<tr class="border-b last:border-0">
											<td class="px-4 py-3">
												<input
													type="checkbox"
													class="rounded border-muted-foreground/50"
													aria-label="Select row"
												/>
											</td>
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
											<td class="px-4 py-3 text-muted-foreground">
												{product.collection?.title ?? '—'}
											</td>
											<td class="px-4 py-3 text-muted-foreground">
												{product.sales_channels?.length
													? product.sales_channels.map((sc) => sc.name).join(', ')
													: '—'}
											</td>
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
											<td class="px-4 py-3">
												<DropdownMenu.Root>
													<DropdownMenu.Trigger
														class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
													>
														<MoreHorizontal class="size-4" />
														<span class="sr-only">Actions</span>
													</DropdownMenu.Trigger>
													<DropdownMenu.Portal>
														<DropdownMenu.Content
															class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
															sideOffset={4}
														>
															<DropdownMenu.Item
																textValue="Edit"
																class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
																onSelect={() => goToProductEdit(product.id)}
															>
																<Pencil class="size-4" />
																Edit
															</DropdownMenu.Item>
															<DropdownMenu.Item
																textValue="Remove"
																class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
																onSelect={() => removeProductFromCollection(product.id)}
															>
																<Trash2 class="size-4" />
																Remove
															</DropdownMenu.Item>
														</DropdownMenu.Content>
													</DropdownMenu.Portal>
												</DropdownMenu.Root>
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
					{#if count > 0}
						<div class="flex items-center justify-between gap-4 border-t px-6 py-4">
							<p class="text-sm text-muted-foreground">
								{start} – {end} of {count} results
							</p>
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={productPage <= 1}
									onclick={() => (productPage = Math.max(1, productPage - 1))}
								>
									Prev
								</Button>
								<span class="text-sm text-muted-foreground">
									{productPage} of {totalPages} pages
								</span>
								<Button
									variant="outline"
									size="sm"
									disabled={productPage >= totalPages}
									onclick={() => (productPage = Math.min(totalPages, productPage + 1))}
								>
									Next
								</Button>
							</div>
						</div>
					{/if}
				</section>

				<!-- Metadata & JSON -->
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-lg border bg-card p-4">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-medium">Metadata</h3>
							<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{metadataKeys} keys
							</span>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={openMetadataEdit}
							>
								<ExternalLink class="size-4" />
								<span class="sr-only">Open</span>
							</Button>
						</div>
					</div>
					<div class="rounded-lg border bg-card p-4">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-medium">JSON</h3>
							<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{jsonKeys} keys
							</span>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={() => (jsonOpen = true)}
							>
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

<!-- Edit Collection modal -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<div>
						<h2 class="text-lg font-semibold">Edit Collection</h2>
						<p class="mt-1 text-sm text-muted-foreground">Update collection details.</p>
					</div>

					{#if editError}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{editError}
						</div>
					{/if}
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-title" class="text-sm font-medium">Title</label>
							<Input
								id="edit-title"
								bind:value={editTitle}
								placeholder="Enter collection title"
								class={cn('h-9', editError && !editTitle.trim() && 'border-destructive')}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-1.5">
								<label for="edit-handle" class="text-sm font-medium">Handle</label>
								<Tooltip.Root>
									<Tooltip.Trigger
										class="rounded-full text-muted-foreground hover:text-foreground"
										aria-label="Handle info"
									>
										<Info class="size-3.5" />
									</Tooltip.Trigger>
									<Tooltip.Content>Leave empty to auto-generate from title.</Tooltip.Content>
								</Tooltip.Root>
							</div>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span
								>
								<Input
									id="edit-handle"
									bind:value={editHandle}
									placeholder="handle"
									class="h-9 pl-6"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Metadata modal -->
<Sheet.Root bind:open={metadataOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
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
				<Button variant="outline" onclick={closeMetadataEdit}>Cancel</Button>
				<Button onclick={submitMetadata} disabled={metadataSubmitting}>
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
				{#if collection}
					<pre
						class="rounded-md border bg-zinc-900 p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-300"><code
							>{JSON.stringify(collection, null, 2)}</code
						></pre>
				{:else}
					<p class="text-sm text-muted-foreground">No data</p>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Add products sheet -->
<Sheet.Root bind:open={addProductsSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-4xl sm:max-w-4xl">
		<div class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Add products</h2>
				<p class="mt-1 text-sm text-muted-foreground">Select products to add to this collection.</p>
			</div>
			<div class="flex min-h-0 flex-1 flex-col">
				<div class="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
					<Button variant="outline" size="sm" class="rounded-md" type="button">
						<SlidersHorizontal class="mr-1.5 size-4" />
						Sort
					</Button>
					<div class="relative w-48">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={addProductsSearch}
							class="h-9 rounded-md pl-9"
						/>
					</div>
				</div>
				<div class="min-h-0 flex-1 overflow-auto px-6">
					<table class="w-full text-sm">
						<thead class="sticky top-0 z-10 border-b bg-muted/50">
							<tr>
								<th class="w-10 px-4 py-3 text-left font-medium">
									<input
										type="checkbox"
										class="rounded border-muted-foreground/50"
										aria-label="Select all"
										checked={addProductsFiltered.length > 0 &&
											addProductsSelectedIds.size === addProductsFiltered.length}
										onchange={toggleAddProductsSelectAll}
									/>
								</th>
								<th class="px-4 py-3 text-left font-medium">Product</th>
								<th class="px-4 py-3 text-left font-medium">Collection</th>
								<th class="px-4 py-3 text-left font-medium">Sales Channels</th>
								<th class="px-4 py-3 text-left font-medium">Variants</th>
								<th class="px-4 py-3 text-left font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{#if addProductsFiltered.length === 0}
								<tr>
									<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
										No products to show.
									</td>
								</tr>
							{:else}
								{#each addProductsFiltered as p (p.id)}
									<tr class="border-b last:border-0">
										<td class="px-4 py-3">
											<input
												type="checkbox"
												class="rounded border-muted-foreground/50"
												aria-label="Select row"
												checked={addProductsSelectedIds.has(p.id)}
												onchange={() => toggleAddProductSelection(p.id)}
											/>
										</td>
										<td class="px-4 py-3">
											<div class="flex items-center gap-3">
												{#if p.thumbnail}
													<img
														src={p.thumbnail}
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
												<span class="font-medium">{p.title}</span>
											</div>
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{p.collection?.title ?? '—'}
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{p.sales_channels?.length
												? p.sales_channels.map((sc) => sc.name).join(', ')
												: '—'}
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{p.variants?.length ?? 0} variant{(p.variants?.length ?? 0) === 1 ? '' : 's'}
										</td>
										<td class="px-4 py-3">
											<span
												class={cn(
													'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
													p.status === 'published' &&
														'bg-green-500/10 text-green-700 dark:text-green-400',
													p.status === 'draft' && 'bg-muted text-muted-foreground',
													p.status === 'proposed' &&
														'bg-amber-500/10 text-amber-700 dark:text-amber-400',
													p.status === 'rejected' && 'bg-destructive/10 text-destructive'
												)}
											>
												<span
													class={cn(
														'size-1.5 rounded-full',
														p.status === 'published' && 'bg-green-600',
														p.status === 'draft' && 'bg-muted-foreground/60',
														p.status === 'proposed' && 'bg-amber-600',
														p.status === 'rejected' && 'bg-destructive'
													)}
												></span>
												{p.status}
											</span>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
				{#if addProductsCount > 0}
					<div class="flex items-center justify-between gap-4 border-t px-6 py-4">
						<p class="text-sm text-muted-foreground">
							{addProductsStart} – {addProductsEnd} of {addProductsCount} results
						</p>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={addProductsPage <= 1}
								onclick={() => (addProductsPage = Math.max(1, addProductsPage - 1))}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{addProductsPage} of {addProductsTotalPages} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={addProductsPage >= addProductsTotalPages}
								onclick={() =>
									(addProductsPage = Math.min(addProductsTotalPages, addProductsPage + 1))}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			</div>
			{#if addProductsError}
				<p class="px-6 pb-2 text-sm text-destructive">{addProductsError}</p>
			{/if}
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeAddProductsSheet}>Cancel</Button>
				<Button onclick={submitAddProducts} disabled={addProductsSubmitting}>
					{addProductsSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
