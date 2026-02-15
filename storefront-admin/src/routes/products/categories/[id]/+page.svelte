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
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Info from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type ProductCategory = {
		id: string;
		value: string;
		handle: string;
		metadata: unknown | null;
		parent_id: string | null;
		status: string;
		visibility: string;
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

	const categoryId = $derived($page.params.id);

	let category = $state<ProductCategory | null>(null);
	let productsData = $state<ProductsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let productPage = $state(1);
	let productLimit = $state(20);

	async function loadCategory() {
		if (!categoryId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/product-categories/${categoryId}`, {
				cache: 'no-store'
			});
			if (!res.ok) {
				if (res.status === 404) {
					error = 'Category not found';
					return;
				}
				throw new Error(await res.text());
			}
			category = (await res.json()) as ProductCategory;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			category = null;
		} finally {
			loading = false;
		}
	}

	async function loadProducts() {
		if (!categoryId) return;
		try {
			const params = new URLSearchParams({
				page: String(productPage),
				limit: String(productLimit),
				sorting_field: 'created_at',
				sorting_direction: 'desc',
				category_id: categoryId
			});
			const res = await fetch(`${API_BASE}/products?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			productsData = (await res.json()) as ProductsResponse;
		} catch (e) {
			productsData = null;
		}
	}

	$effect(() => {
		categoryId;
		loadCategory();
	});

	$effect(() => {
		if (categoryId) {
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

	function getHandle(c: ProductCategory | null): string {
		if (!c) return '';
		return c.handle?.startsWith('/') ? c.handle : `/${c.handle ?? ''}`;
	}

	function getDescription(c: ProductCategory | null): string {
		if (!c?.metadata || typeof c.metadata !== 'object') return '—';
		const desc = (c.metadata as { description?: string }).description;
		return desc != null && desc !== '' ? String(desc) : '—';
	}

	let editSheetOpen = $state(false);
	let editTitle = $state('');
	let editHandle = $state('');
	let editDescription = $state('');
	let editStatus = $state<'active' | 'inactive'>('active');
	let editVisibility = $state<'public' | 'private'>('public');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEditSheet() {
		if (!category) return;
		editSheetOpen = true;
		editTitle = category.value;
		editHandle = category.handle?.replace(/^\//, '') ?? '';
		editDescription =
			typeof category.metadata === 'object' &&
			category.metadata !== null &&
			'description' in category.metadata
				? String((category.metadata as { description?: string }).description ?? '')
				: '';
		editStatus = (category.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive';
		editVisibility = (category.visibility === 'private' ? 'private' : 'public') as
			| 'public'
			| 'private';
		editError = null;
	}

	function closeEditSheet() {
		editSheetOpen = false;
		editError = null;
	}

	async function submitEditCategory() {
		if (!category) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const body: {
				value: string;
				parent_id?: string;
				status?: string;
				visibility?: string;
				metadata?: Record<string, string | number>;
			} = {
				value: editTitle.trim(),
				status: editStatus,
				visibility: editVisibility
			};
			if (category.parent_id) body.parent_id = category.parent_id;
			if (editDescription.trim()) body.metadata = { description: editDescription.trim() };
			const res = await fetch(`${API_BASE}/product-categories/${category.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEditSheet();
			loadCategory();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	let jsonOpen = $state(false);
	let metadataOpen = $state(false);
	let metadataRows = $state<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
	let metadataError = $state<string | null>(null);
	let metadataSubmitting = $state(false);

	function openMetadataSheet() {
		if (!category) return;
		const meta =
			category.metadata && typeof category.metadata === 'object'
				? (category.metadata as Record<string, unknown>)
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

	async function submitCategoryMetadata() {
		if (!categoryId || !category) return;
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
			const res = await fetch(`${API_BASE}/product-categories/${categoryId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata: meta })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeMetadataSheet();
			loadCategory();
		} catch (e) {
			metadataError = e instanceof Error ? e.message : String(e);
		} finally {
			metadataSubmitting = false;
		}
	}

	const jsonKeys = $derived(
		category
			? [
					'id',
					'value',
					'handle',
					'metadata',
					'parent_id',
					'status',
					'visibility',
					'created_at',
					'updated_at'
				].length
			: 0
	);
	const metadataKeys = $derived(
		category?.metadata && typeof category.metadata === 'object'
			? Object.keys(category.metadata as object).length
			: 0
	);

	function goToProductEdit(productId: string) {
		goto(`/products/${productId}`);
	}
</script>

<svelte:head>
	<title>{category ? category.value : 'Category'} | Categories | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4">
		<nav class="flex items-center gap-2 text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/categories')}
			>
				<FolderTree class="size-4 shrink-0" />
				<span>Categories</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{category?.value ?? categoryId ?? '…'}</span>
		</nav>
		<Button variant="ghost" size="icon" class="size-9">
			<Bell class="size-4" />
			<span class="sr-only">Notifications</span>
		</Button>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !category}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Category not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/categories')}>
				Back to Categories
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<!-- Header: title + status pills + dropdown -->
				<section class="flex flex-col gap-6 border-b pb-8">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="text-2xl font-semibold tracking-tight">{category.value}</h1>
						<span
							class={cn(
								'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
								category.status === 'active' &&
									'bg-green-500/10 text-green-700 dark:text-green-400',
								category.status === 'inactive' && 'bg-muted text-muted-foreground'
							)}
						>
							<span
								class={cn(
									'size-1.5 shrink-0 rounded-sm bg-current opacity-70',
									category.status === 'active' && 'bg-green-600',
									category.status === 'inactive' && 'bg-muted-foreground'
								)}
							></span>
							{category.status === 'active' ? 'Active' : 'Inactive'}
						</span>
						<span
							class={cn(
								'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
								category.visibility === 'public' &&
									'bg-green-500/10 text-green-700 dark:text-green-400',
								category.visibility === 'private' && 'bg-muted text-muted-foreground'
							)}
						>
							<span
								class={cn(
									'size-1.5 shrink-0 rounded-sm bg-current opacity-70',
									category.visibility === 'public' && 'bg-green-600',
									category.visibility === 'private' && 'bg-muted-foreground'
								)}
							></span>
							{category.visibility === 'public' ? 'Public' : 'Private'}
						</span>
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
										onSelect={openEditSheet}
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
				</section>

				<div class="grid gap-6 lg:grid-cols-3">
					<!-- Left: Details card -->
					<div class="rounded-lg border bg-card p-6 lg:col-span-2">
						<h2 class="font-semibold">{category.value}</h2>
						<dl class="mt-4 grid gap-3 text-sm">
							<div class="flex justify-between gap-4">
								<dt class="shrink-0 font-medium text-muted-foreground">Description</dt>
								<dd class="text-right">{getDescription(category)}</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="shrink-0 font-medium text-muted-foreground">Handle</dt>
								<dd class="text-right">{getHandle(category)}</dd>
							</div>
						</dl>
					</div>

					<!-- Right: Organize card -->
					<div class="rounded-lg border bg-card p-6">
						<div class="flex items-center justify-between">
							<h2 class="font-semibold">Organize</h2>
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
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={openEditSheet}
										>
											<Pencil class="size-4" />
											Edit
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						<dl class="mt-4 space-y-3 text-sm">
							<div>
								<dt class="font-medium text-muted-foreground">Path</dt>
								<dd>{category.value}</dd>
							</div>
							<div>
								<dt class="font-medium text-muted-foreground">Children</dt>
								<dd>—</dd>
							</div>
						</dl>
					</div>
				</div>

				<!-- Products section -->
				<section class="rounded-lg border bg-card">
					<div class="flex flex-wrap items-center justify-between gap-4 border-b bg-card px-6 py-4">
						<h2 class="text-base font-semibold">Products</h2>
						<div class="flex items-center gap-2">
							<Button variant="outline" size="sm" class="rounded-md" type="button">
								<SlidersHorizontal class="mr-1.5 size-4" />
								Sort
							</Button>
							<div class="relative w-48">
								<Search
									class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input type="search" placeholder="Search" class="h-9 rounded-md pl-9" />
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
											No products in this category.
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
												{product.variants?.length ?? 0} variant{(product.variants?.length ?? 0) ===
												1
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
																class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
																onSelect={() => goToProductEdit(product.id)}
															>
																<Pencil class="size-4" />
																Edit
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
								onclick={openMetadataSheet}
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

<!-- Edit Category sheet -->
<Sheet.Root bind:open={editSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<div>
						<h2 class="text-lg font-semibold">Edit Category</h2>
						<p class="mt-1 text-sm text-muted-foreground">Update category details.</p>
					</div>

					{#if editError}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{editError}
						</div>
					{/if}
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-cat-title" class="text-sm font-medium">Title</label>
							<Input
								id="edit-cat-title"
								bind:value={editTitle}
								placeholder="Enter category title"
								class={cn('h-9', editError && !editTitle.trim() && 'border-destructive')}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-cat-handle" class="flex items-center gap-1.5 text-sm font-medium">
								Handle
								<span class="font-normal text-muted-foreground">(Optional)</span>
								<Tooltip.Root>
									<Tooltip.Trigger
										class="rounded-full text-muted-foreground hover:text-foreground"
										aria-label="Handle info"
									>
										<Info class="size-3.5" />
									</Tooltip.Trigger>
									<Tooltip.Content>Leave empty to auto-generate from title.</Tooltip.Content>
								</Tooltip.Root>
							</label>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span
								>
								<Input
									id="edit-cat-handle"
									bind:value={editHandle}
									placeholder="handle"
									class="h-9 pl-6"
								/>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-cat-description" class="text-sm font-medium">
								Description
								<span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<textarea
								id="edit-cat-description"
								bind:value={editDescription}
								placeholder="Enter description"
								rows="4"
								class="flex w-full min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							></textarea>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-cat-status" class="text-sm font-medium">Status</label>
							<select
								id="edit-cat-status"
								bind:value={editStatus}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-cat-visibility" class="text-sm font-medium">Visibility</label>
							<select
								id="edit-cat-visibility"
								bind:value={editVisibility}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="public">Public</option>
								<option value="private">Private</option>
							</select>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEditSheet} disabled={editSubmitting}>Cancel</Button>
				<Button onclick={submitEditCategory} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

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
				<Button onclick={submitCategoryMetadata} disabled={metadataSubmitting}>
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
				{#if category}
					<pre
						class="rounded-md border bg-zinc-900 p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-300"><code
							>{JSON.stringify(category, null, 2)}</code
						></pre>
				{:else}
					<p class="text-sm text-muted-foreground">No data</p>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
