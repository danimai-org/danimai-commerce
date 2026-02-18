<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import Package from '@lucide/svelte/icons/package';
	import Bell from '@lucide/svelte/icons/bell';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ImageIcon from '@lucide/svelte/icons/image';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Info from '@lucide/svelte/icons/info';
	import Check from '@lucide/svelte/icons/check';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import X from '@lucide/svelte/icons/x';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
	import { DropdownMenu } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type Product = {
		id: string;
		title: string;
		handle: string;
		subtitle?: string | null;
		description?: string | null;
		status: string;
		thumbnail: string | null;
		category_id?: string | null;
		category?: { id: string; value: string; handle: string } | null;
		created_at?: string;
		updated_at?: string;
		sales_channels?: Array<{ id: string; name: string }>;
		variants?: Array<{ id: string }>;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	type ProductsResponse = {
		data: Product[];
		pagination: Pagination;
	};

	type ProductOption = { title: string; values: string[] };
	type ProductVariantForm = {
		title: string;
		options: Record<string, string>;
		sku: string;
		availableCount: string;
		allow_backorder: boolean;
		variant_rank: number;
		priceAmount: string;
	};

	function cartesian<T>(arrays: T[][]): T[][] {
		if (arrays.length === 0) return [[]];
		const [first, ...rest] = arrays;
		const restProduct = cartesian(rest);
		return first.flatMap((item) => restProduct.map((combo) => [item, ...combo]));
	}

	function generateVariantsFromOptions(options: ProductOption[]): ProductVariantForm[] {
		if (options.length === 0 || options.some((o) => o.values.length === 0)) return [];
		const valueArrays = options.map((o) => o.values);
		const combinations = cartesian(valueArrays);
		return combinations.map((combo, i) => {
			const optionsRecord: Record<string, string> = {};
			const parts: string[] = [];
			options.forEach((opt, j) => {
				optionsRecord[opt.title] = combo[j] as string;
				parts.push(combo[j] as string);
			});
			return {
				title: parts.join(' / '),
				options: optionsRecord,
				sku: '',
				availableCount: '',
				allow_backorder: false,
				variant_rank: i,
				priceAmount: ''
			};
		});
	}

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let sortingField = $state('created_at');
	let sortingDirection = $state<'asc' | 'desc'>('desc');

	let data = $state<ProductsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let deleteConfirmOpen = $state(false);
	let productToDelete = $state<Product | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteConfirm(product: Product) {
		productToDelete = product;
		deleteConfirmOpen = true;
	}

	let selectedProducts = $state<Set<string>>(new Set());

	async function fetchProducts() {
		loading = true;
		error = null;
		data = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: sortingField,
				sorting_direction: sortingDirection
			});
			if (searchQuery.trim()) {
				params.append('search', searchQuery.trim());
			}
			const res = await fetch(`${API_BASE}/products?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			const raw = (await res.json()) as {
				products?: Product[];
				count?: number;
				offset?: number;
				limit?: number;
			};
			const limitNum = raw.limit ?? 10;
			const total = raw.count ?? 0;
			const offsetVal = raw.offset ?? 0;
			const pageNum = limitNum > 0 ? Math.floor(offsetVal / limitNum) + 1 : 1;
			const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 1;
			data = {
				data: raw.products ?? [],
				pagination: {
					total,
					page: pageNum,
					limit: limitNum,
					total_pages: totalPages,
					has_next_page: pageNum < totalPages,
					has_previous_page: pageNum > 1
				}
			} as ProductsResponse;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			data = null;
		} finally {
			loading = false;
		}
	}

	let previousSearchQuery = $state('');
	$effect(() => {
		if (searchQuery !== previousSearchQuery) {
			previousSearchQuery = searchQuery;
			page = 1;
		}
	});

	$effect(() => {
		page;
		limit;
		sortingField;
		sortingDirection;
		searchQuery;
		fetchProducts();
	});

	$effect(() => {
		const handler = () => {
			if (document.visibilityState === 'visible') fetchProducts();
		};
		document.addEventListener('visibilitychange', handler);
		return () => document.removeEventListener('visibilitychange', handler);
	});

	const products = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	// --- Create product flow ---
	let createOpen = $state(false);
	let createStep = $state(1);
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	// Details
	let createTitle = $state('');
	let createSubtitle = $state('');
	let createHandle = $state('');
	let createDescription = $state('');
	let createHasVariants = $state(true);

	// Organize
	let createDiscountable = $state(true);
	let createCollectionId = $state('');
	let createCategoryId = $state('');
	let createTagIds = $state<string[]>([]);
	let createSalesChannels = $state<{ id: string; name: string }[]>([]);
	let createSalesChannelInput = $state('');

	// Options & variants (when hasVariants)
	let createOptions = $state<ProductOption[]>([]);
	let createVariants = $state<ProductVariantForm[]>([]);

	function syncVariantsFromOptions() {
		const newV = generateVariantsFromOptions(createOptions);
		const oldByTitle = new Map(createVariants.map((v) => [v.title, v]));
		createVariants = newV.map((v) => {
			const ex = oldByTitle.get(v.title);
			return ex
				? {
						...v,
						sku: ex.sku,
						availableCount: ex.availableCount,
						allow_backorder: ex.allow_backorder,
						priceAmount: ex.priceAmount
					}
				: v;
		});
	}

	// Lookup data for Organize
	let collectionsList = $state<{ id: string; title: string; handle: string }[]>([]);
	let categoriesList = $state<{ id: string; value: string; handle: string }[]>([]);
	let tagsList = $state<{ id: string; value: string }[]>([]);
	let attributesList = $state<{ id: string; title: string; type: string }[]>([]);
	let salesChannelsList = $state<{ id: string; name: string }[]>([]);

	// Step 2: Attributes
	type CreateAttributeEntry = { attributeId: string; attributeTitle: string; value: string };
	let createAttributeEntries = $state<CreateAttributeEntry[]>([]);

	function addAttributeEntry() {
		createAttributeEntries = [...createAttributeEntries, { attributeId: '', attributeTitle: '', value: '' }];
	}

	function removeAttributeEntry(index: number) {
		createAttributeEntries = createAttributeEntries.filter((_, i) => i !== index);
	}

	function setAttributeEntryAttribute(index: number, attributeId: string) {
		const attr = attributesList.find((a) => a.id === attributeId);
		createAttributeEntries = createAttributeEntries.map((e, i) =>
			i === index ? { ...e, attributeId: attributeId, attributeTitle: attr?.title ?? '' } : e
		);
	}

	function setAttributeEntryValue(entryIndex: number, value: string) {
		createAttributeEntries = createAttributeEntries.map((e, i) =>
			i === entryIndex ? { ...e, value } : e
		);
	}

	function openCreate() {
		createOpen = true;
		createStep = 1;
		createTitle = '';
		createSubtitle = '';
		createHandle = '';
		createDescription = '';
		createHasVariants = true;
		createDiscountable = true;
		createCollectionId = '';
		createCategoryId = '';
		createTagIds = [];
		createSalesChannels = [];
		createSalesChannelInput = '';
		createOptions = [];
		createAttributeEntries = [];
		createError = null;
		syncVariantsFromOptions();
		// Fetch collections, categories, attributes
		fetch(`${API_BASE}/collections?limit=100`)
			.then((r) => (r.ok ? r.json() : { data: [] }))
			.then((j) => {
				collectionsList = j.data ?? [];
			})
			.catch(() => {
				collectionsList = [];
			});
		fetch(`${API_BASE}/product-categories?limit=100`)
			.then((r) => (r.ok ? r.json() : { data: [] }))
			.then((j) => {
				categoriesList = j.data ?? [];
			})
			.catch(() => {
				categoriesList = [];
			});
		fetch(`${API_BASE}/product-tags?limit=100`)
			.then((r) => (r.ok ? r.json() : { data: [] }))
			.then((j) => {
				tagsList = j.data ?? [];
			})
			.catch(() => {
				tagsList = [];
			});
		fetch(`${API_BASE}/product-attributes?limit=100`)
			.then((r) => (r.ok ? r.json() : { data: [] }))
			.then((j) => {
				attributesList = j.data ?? [];
			})
			.catch(() => {
				attributesList = [];
			});
		// Fetch sales channels and set defaults
		fetch(`${API_BASE}/sales-channels?limit=100`)
			.then((r) => (r.ok ? r.json() : { data: [] }))
			.then((j) => {
				const salesChannels = j.data ?? [];
				salesChannelsList = salesChannels.map((ch: { id: string; name: string }) => ({
					id: ch.id,
					name: ch.name
				}));
				const defaultChannels = salesChannels.filter((ch: { is_default: boolean }) => ch.is_default);
				if (defaultChannels.length > 0) {
					createSalesChannels = defaultChannels.map((ch: { id: string; name: string }) => ({
						id: ch.id,
						name: ch.name
					}));
				}
			})
			.catch(() => {
				// Ignore error, leave createSalesChannels empty
			});
	}

	function closeCreate() {
		createOpen = false;
	}

	async function confirmDeleteProduct() {
		if (!productToDelete) return;
		deleteSubmitting = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/products`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ product_ids: [productToDelete.id] })
			});
			if (res.ok) {
				deleteConfirmOpen = false;
				productToDelete = null;
				fetchProducts();
			} else {
				const text = await res.text();
				error = text || 'Failed to delete product';
			}
		} catch {
			error = 'Failed to delete product';
		} finally {
			deleteSubmitting = false;
		}
	}

	function handleDeleteCancel() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			productToDelete = null;
		}
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			productToDelete = null;
		}
	}

	function isDetailsStepValid() {
		return createTitle.trim().length > 0;
	}

	function goToStep2() {
		if (!isDetailsStepValid()) {
			createError = 'Title is required';
			return;
		}
		createError = null;
		createStep = 2;
		if (createAttributeEntries.length === 0) {
			addAttributeEntry();
		}
	}

	function goToStep3() {
		if (!isDetailsStepValid()) {
			createError = 'Title is required';
			return;
		}
		createError = null;
		createStep = 3;
	}

	function goToStep4() {
		if (!isDetailsStepValid()) {
			createError = 'Title is required';
			return;
		}
		createError = null;
		createStep = 4;
	}

	function addOption() {
		createOptions = [...createOptions, { title: '', values: [] }];
	}

	function removeOption(index: number) {
		createOptions = createOptions.filter((_, i) => i !== index);
		syncVariantsFromOptions();
	}

	function addOptionValue(optIndex: number, value: string) {
		if (!value.trim()) return;
		const opt = createOptions[optIndex];
		if (opt.values.includes(value.trim())) return;
		createOptions = createOptions.map((o, i) =>
			i === optIndex ? { ...o, values: [...o.values, value.trim()] } : o
		);
		syncVariantsFromOptions();
	}

	function removeOptionValue(optIndex: number, valIndex: number) {
		createOptions = createOptions.map((o, i) =>
			i === optIndex ? { ...o, values: o.values.filter((_, j) => j !== valIndex) } : o
		);
		syncVariantsFromOptions();
	}

	function updateOptionTitle(optIndex: number, title: string) {
		createOptions = createOptions.map((o, i) => (i === optIndex ? { ...o, title } : o));
		syncVariantsFromOptions();
	}

	function addSalesChannel() {
		const id = createSalesChannelInput.trim();
		if (id && !createSalesChannels.some((s) => s.id === id)) {
			const channel = salesChannelsList.find((ch) => ch.id === id);
			if (channel) {
				createSalesChannels = [...createSalesChannels, { id: channel.id, name: channel.name }];
				createSalesChannelInput = '';
			}
		}
	}

	function removeSalesChannel(id: string) {
		createSalesChannels = createSalesChannels.filter((s) => s.id !== id);
	}

	function addTag(tagId: string) {
		if (tagId && !createTagIds.includes(tagId)) {
			createTagIds = [...createTagIds, tagId];
		}
	}

	function removeTag(tagId: string) {
		createTagIds = createTagIds.filter((id) => id !== tagId);
	}

	function buildPayload(status: 'draft' | 'published') {
		const optionTitles = createOptions.map((o) => o.title).filter(Boolean);
		const optionsForApi = createOptions
			.filter((o) => o.title.trim() && o.values.length > 0)
			.map((o) => ({ title: o.title.trim(), values: o.values }));

		const variantsForApi = createVariants.map((v, i) => {
			const prices = v.priceAmount.trim()
				? [{ amount: Math.round(parseFloat(v.priceAmount) * 100), currency_code: 'eur' }]
				: [];
			const availableCountStr = String(v.availableCount || '').trim();
			const availableCountNum = availableCountStr ? parseInt(availableCountStr, 10) : null;
			return {
				title: v.title,
				options: v.options,
				sku: v.sku || undefined,
				manage_inventory: availableCountNum !== null && availableCountNum >= 0,
				allow_backorder: v.allow_backorder,
				variant_rank: i,
				prices,
				available_count: availableCountNum !== null ? availableCountNum : undefined
			};
		});

		const attributesForApi =
			createAttributeEntries
				.filter((e) => e.attributeId && e.value.trim())
				.map((e) => ({ id: e.attributeId, value: e.value.trim() }));

		return {
			title: createTitle.trim(),
			handle: createHandle.trim() || undefined,
			subtitle: createSubtitle.trim() || undefined,
			description: createDescription.trim() || undefined,
			status,
			is_giftcard: false,
			discountable: createDiscountable,
			category_id: createCategoryId || undefined,
			tag_ids: createTagIds.length > 0 ? createTagIds : undefined,
			options: createHasVariants ? optionsForApi : undefined,
			variants: createHasVariants && variantsForApi.length > 0 ? variantsForApi : undefined,
			sales_channels: createSalesChannels.length > 0 ? createSalesChannels.map((ch) => ({ id: ch.id })) : undefined,
			attributes: attributesForApi.length > 0 ? attributesForApi : undefined
		};
	}

	async function submitCreate(status: 'draft' | 'published') {
		createError = null;
		if (!createTitle.trim()) {
			createError = 'Title is required';
			return;
		}
		// Validate that SKU is provided if available count is set, and available count is non-negative
		if (createHasVariants) {
			for (const variant of createVariants) {
				const availableCountStr = String(variant.availableCount || '').trim();
				if (availableCountStr) {
					if (!variant.sku.trim()) {
						createError = 'SKU is required when available count is provided';
						return;
					}
					const count = parseInt(availableCountStr, 10);
					if (isNaN(count) || count < 0) {
						createError = 'Available count must be a non-negative number';
						return;
					}
				}
			}
			// Validate that at least one variant has a price > 0 (only for published products)
			if (status === 'published') {
				const hasValidPrice = createVariants.some((variant) => {
					const priceStr = variant.priceAmount.trim();
					if (!priceStr) return false;
					const price = parseFloat(priceStr);
					return !isNaN(price) && price > 0;
				});
				if (!hasValidPrice) {
					createError = 'At least one variant must have a price greater than 0';
					return;
				}
			}
		}
		createSubmitting = true;
		try {
			const body = buildPayload(status);
			const res = await fetch(`${API_BASE}/products`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			const product = (await res.json()) as Product;
			if (createCollectionId && product.id) {
				await fetch(`${API_BASE}/collections/${createCollectionId}/products`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ product_ids: [product.id] })
				});
			}
			closeCreate();
			fetchProducts();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Top bar: Products icon, actions, bell -->
	<div class="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-6">
		<div class="flex items-center gap-2">
			<div
				class="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground"
			>
				<Package class="size-4" />
			</div>
			<span class="font-semibold">Products</span>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm">Export</Button>
			<Button variant="outline" size="sm">Import</Button>
			<Button size="sm" onclick={openCreate}>Create</Button>
			<Button variant="ghost" size="icon" class="size-9">
				<Bell class="size-4" />
				<span class="sr-only">Notifications</span>
			</Button>
		</div>
	</div>

	<!-- Content -->
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2">
					<div class="relative max-w-md min-w-[200px] flex-1">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search products..."
							bind:value={searchQuery}
							class="h-9 rounded-md pl-9"
						/>
					</div>
					<button
						type="button"
						class="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<ArrowUpDown class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				</div>
			</div>
		</div>

		{#if error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{error}
			</div>
		{:else if loading}
			<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else}
			<!-- Table -->
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="w-10 px-4 py-3"></th>
							<th class="px-4 py-3 text-left font-medium">Product</th>
							<th class="px-4 py-3 text-left font-medium">Category</th>
							<th class="px-4 py-3 text-left font-medium">Inventory</th>
							<th class="px-4 py-3 text-left font-medium">Sales Channels</th>
							<th class="px-4 py-3 text-left font-medium">Variants</th>
							<th class="px-4 py-3 text-left font-medium">Status</th>
							<th class="px-4 py-3 text-left font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#if products.length === 0}
							<tr>
								<td colspan="8" class="px-4 py-8 text-center text-muted-foreground">
									No products found.
								</td>
							</tr>
						{:else}
							{#each products as product (product.id)}
								{@const isSelected = selectedProducts.has(product.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3">
										<input
											type="checkbox"
											checked={isSelected}
											onchange={(e) => {
												const checked = (e.currentTarget as HTMLInputElement).checked;
												if (checked) {
													selectedProducts = new Set([...selectedProducts, product.id]);
												} else {
													const newSet = new Set(selectedProducts);
													newSet.delete(product.id);
													selectedProducts = newSet;
												}
											}}
											class="size-4 rounded border-input"
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
											<span class="font-medium"
												>{product.title || product.handle || product.id || '—'}</span
											>
										</a>
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{product.category?.value ?? '—'}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										<a
											href="/products/{product.id}"
											class="text-primary hover:underline"
										>
											View
										</a>
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{product.sales_channels?.length
											? product.sales_channels.map((sc) => sc.name).join(', ')
											: '—'}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{product.variants?.length != null ? product.variants.length : '—'}
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
									<td class="px-4 py-3" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
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
														onSelect={() => goto(`/products/${product.id}`)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openDeleteConfirm(product)}
													>
														<Trash2 class="size-4" />
														Delete
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

			<!-- Pagination -->
			<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
				<p class="text-sm text-muted-foreground">
					{#if pagination && pagination.total > 0}
						{start} - {end} of {pagination.total} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_previous_page}
						onclick={() => (page = page - 1)}
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
						onclick={() => (page = page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create Product Modal (full-page, multi-step) -->
<Dialog.Root bind:open={createOpen}>
	<Dialog.Content class="h-full w-full">
		<div class="flex h-full flex-col">
			<!-- Step tabs -->
			<div class="flex shrink-0 items-center gap-1 border-b px-6 py-4">
				<button
					type="button"
					class={cn(
						'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						createStep === 1
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => (createStep = 1)}
				>
					{#if createStep > 1}
						<Check class="size-4" />
					{:else}
						<Info class="size-4" />
					{/if}
					Details
				</button>
				<button
					type="button"
					class={cn(
						'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						createStep === 2
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => goToStep2()}
				>
					{#if createStep > 2}
						<Check class="size-4" />
					{:else if createStep === 2}
						<Info class="size-4" />
					{/if}
					Attributes
				</button>
				<button
					type="button"
					class={cn(
						'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						createStep === 3
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => goToStep3()}
				>
					{#if createStep > 3}
						<Check class="size-4" />
					{:else if createStep === 3}
						<Info class="size-4" />
					{/if}
					Organize
				</button>
				<button
					type="button"
					class={cn(
						'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						createStep === 4
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => goToStep4()}
				>
					{#if createStep === 4}
						<Info class="size-4" />
					{/if}
					Variants
				</button>
			</div>

			{#if createError && !createSubmitting}
				<div
					class="mx-6 mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{createError}
				</div>
			{/if}

			<!-- Step 1: Details -->
			{#if createStep === 1}
				<div class="flex-1 overflow-auto p-6 pt-4">
					<h2 class="text-lg font-semibold">Details</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Add the basic information for your product.
					</p>
					<div class="mt-6 flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<label for="create-title" class="text-sm font-medium">Title</label>
							<Input
								id="create-title"
								bind:value={createTitle}
								placeholder="e.g. Winter jacket"
								class={cn('h-9', createError === 'Title is required' && 'border-destructive')}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-subtitle" class="text-sm font-medium">
								Subtitle <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="create-subtitle"
								bind:value={createSubtitle}
								placeholder="e.g. Warm and cosy"
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-handle" class="flex items-center gap-1.5 text-sm font-medium">
								Handle <span class="font-normal text-muted-foreground">(Optional)</span>
								<Info class="size-3.5 text-muted-foreground" />
							</label>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span
								>
								<Input
									id="create-handle"
									bind:value={createHandle}
									placeholder="handle"
									class="h-9 pl-6"
								/>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-description" class="text-sm font-medium">
								Description <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<textarea
								id="create-description"
								bind:value={createDescription}
								placeholder="e.g. A warm and cozy jacket"
								rows="4"
								class="flex w-full min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
							></textarea>
						</div>
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">
								Media <span class="font-normal text-muted-foreground">(Optional)</span>
							</span>
							<div
								role="group"
								aria-label="Media upload"
								class="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
							>
								<Upload class="size-8 text-muted-foreground" />
								<p>Drag and drop images here or click to upload.</p>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-has-variants" class="text-sm font-medium">Variants</label>
							<div class="flex items-center gap-2">
								<button
									id="create-has-variants"
									type="button"
									role="switch"
									aria-checked={createHasVariants}
									aria-label="Product has variants"
									class={cn(
										'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
										createHasVariants ? 'bg-primary' : 'bg-input'
									)}
									onclick={() => {
										createHasVariants = !createHasVariants;
										if (createHasVariants) {
											syncVariantsFromOptions();
										}
									}}
								>
									<span
										class={cn(
											'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
											createHasVariants ? 'translate-x-5' : 'translate-x-[1px]'
										)}
									></span>
								</button>
								<span class="text-sm">Yes, this is a product with variants</span>
							</div>
							<p class="text-xs text-muted-foreground">
								When unchecked, we will create a default variant for you.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 2: Attributes -->
			{#if createStep === 2}
				<div class="flex-1 overflow-auto p-6 pt-4">
					<h2 class="text-lg font-semibold">Attributes</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Assign product attributes and their values. You can manage attributes from the product detail page after creation.
					</p>
					<div class="mt-6 flex flex-col gap-4">
						{#each createAttributeEntries as entry, entryIndex (entryIndex)}
							<div class="rounded-lg border p-4">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0 flex-1 space-y-3">
										<div class="flex flex-col gap-2">
											<label for="create-attr-select-{entryIndex}" class="text-sm font-medium">Attribute</label>
											<Select.Root
												type="single"
												value={entry.attributeId}
												onValueChange={(v) => setAttributeEntryAttribute(entryIndex, v ?? '')}
												allowDeselect
											>
												<Select.Trigger id="create-attr-select-{entryIndex}" class="w-full">
													{entry.attributeTitle || 'Select attribute'}
												</Select.Trigger>
												<Select.Content>
													<Select.Group>
														<Select.Label>Attribute</Select.Label>
														<Select.Item value="" label="Select attribute">
															Select attribute
														</Select.Item>
														{#each attributesList.filter((a) => !createAttributeEntries.some((e2, i2) => i2 !== entryIndex && e2.attributeId === a.id)) as attr (attr.id)}
															<Select.Item value={attr.id} label={attr.title}>
																{attr.title}
															</Select.Item>
														{/each}
													</Select.Group>
												</Select.Content>
											</Select.Root>
										</div>
										<div class="flex flex-col gap-2">
											<label for="create-attr-value-{entryIndex}" class="text-sm font-medium">Value</label>
											<Input
												id="create-attr-value-{entryIndex}"
												class="h-9"
												placeholder="Value"
												value={entry.value}
												oninput={(e) => setAttributeEntryValue(entryIndex, (e.currentTarget as HTMLInputElement).value)}
											/>
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										class="size-8 shrink-0 text-destructive hover:bg-destructive/10"
										onclick={() => removeAttributeEntry(entryIndex)}
										aria-label="Remove attribute"
									>
										<X class="size-4" />
									</Button>
								</div>
							</div>
						{/each}
						<Button type="button" variant="outline" class="w-fit" onclick={addAttributeEntry}>
							Add attribute
						</Button>
					</div>
				</div>
			{/if}

			<!-- Step 3: Organize -->
			{#if createStep === 3}
				<div class="flex-1 overflow-auto p-6 pt-4">
					<h2 class="text-lg font-semibold">Organize</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Organize your product with collections, categories, and channels.
					</p>
					<div class="mt-6 flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<label for="create-discountable" class="text-sm font-medium">
								Discountable <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<div class="flex items-center gap-2">
								<button
									id="create-discountable"
									type="button"
									role="switch"
									aria-checked={createDiscountable}
									aria-label="Product is discountable"
									class={cn(
										'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
										createDiscountable ? 'bg-primary' : 'bg-input'
									)}
									onclick={() => (createDiscountable = !createDiscountable)}
								>
									<span
										class={cn(
											'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
											createDiscountable ? 'translate-x-5' : 'translate-x-[1px]'
										)}
									></span>
								</button>
								<span class="text-sm">Apply discounts to this product</span>
							</div>
							<p class="text-xs text-muted-foreground">
								When unchecked, discounts will not be applied to this product.
							</p>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-collection" class="text-sm font-medium">
								Collection <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<select
								id="create-collection"
								bind:value={createCollectionId}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">None</option>
								{#each collectionsList as col (col.id)}
									<option value={col.id}>{col.title}</option>
								{/each}
							</select>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-category" class="text-sm font-medium">
								Categories <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<select
								id="create-category"
								bind:value={createCategoryId}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">None</option>
								{#each categoriesList as cat (cat.id)}
									<option value={cat.id}>{cat.value}</option>
								{/each}
							</select>
							{#if createCategoryId}
								<p class="text-xs text-muted-foreground">1 selected</p>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-tags-select" class="text-sm font-medium">
								Tags <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<div class="flex flex-wrap items-center gap-2">
								{#each createTagIds as tagId (tagId)}
									{@const tag = tagsList.find((t) => t.id === tagId)}
									{#if tag}
										<span
											class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm"
										>
											{tag.value}
											<button
												type="button"
												class="rounded p-0.5 hover:bg-muted"
												onclick={() => removeTag(tagId)}
												aria-label="Remove tag"
											>
												<X class="size-3.5" />
											</button>
										</span>
									{/if}
								{/each}
								<select
									id="create-tags-select"
									class="flex h-8 min-w-[120px] rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
									onchange={(e) => {
										const el = e.currentTarget;
										const id = el.value;
										if (id) {
											addTag(id);
											el.value = '';
										}
									}}
								>
									<option value="">Add tag</option>
									{#each tagsList.filter((t) => !createTagIds.includes(t.id)) as tag (tag.id)}
										<option value={tag.id}>{tag.value}</option>
									{/each}
								</select>
							</div>
							{#if createTagIds.length > 0}
								<p class="text-xs text-muted-foreground">{createTagIds.length} selected</p>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-sales-channel-input" class="text-sm font-medium">
								Sales channels <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<p class="text-xs text-muted-foreground">
								This product will only be available in the default sales channel if left untouched.
							</p>
							<div class="flex flex-wrap items-center gap-2">
								{#each createSalesChannels as ch (ch.id)}
									<span
										class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm"
									>
										{ch.name}
										<button
											type="button"
											class="rounded p-0.5 hover:bg-muted"
											onclick={() => removeSalesChannel(ch.id)}
											aria-label="Remove"
										>
											<X class="size-3.5" />
										</button>
									</span>
								{/each}
								<div class="flex gap-1">
									<select
										id="create-sales-channel-input"
										class="h-8 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm"
										bind:value={createSalesChannelInput}
										onchange={() => {
											if (createSalesChannelInput) {
												addSalesChannel();
												createSalesChannelInput = '';
											}
										}}
									>
										<option value="">Add sales channel</option>
										{#each salesChannelsList.filter((ch) => !createSalesChannels.some((s) => s.id === ch.id)) as channel (channel.id)}
											<option value={channel.id}>{channel.name}</option>
										{/each}
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 4: Variants -->
			{#if createStep === 4}
				<div class="flex-1 overflow-auto p-6 pt-4">
					<h2 class="text-lg font-semibold">Variants</h2>
					{#if createHasVariants}
						<p class="mt-1 text-sm text-muted-foreground">
							Define options and variant details. This ranking will affect the variants' order in
							your storefront.
						</p>
						<!-- Product options -->
						<div class="mt-6">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="text-sm font-medium">Product options</h3>
									<p class="text-xs text-muted-foreground">
										Define the options for the product, e.g. color, size, etc.
									</p>
								</div>
								<Button type="button" variant="outline" size="sm" onclick={addOption}>Add</Button>
							</div>
							<div class="mt-4 flex flex-col gap-4">
								{#each createOptions as opt, optIndex (optIndex)}
									<div class="flex flex-col gap-2 rounded-md border p-3">
										<div class="flex items-center gap-2">
											<Input
												placeholder="Title (e.g. Size)"
												value={opt.title}
												oninput={(e) =>
													updateOptionTitle(optIndex, (e.target as HTMLInputElement).value)}
												class="h-8 flex-1"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												class="size-8 shrink-0"
												onclick={() => removeOption(optIndex)}
											>
												<X class="size-4" />
											</Button>
										</div>
										<div class="flex flex-wrap items-center gap-1.5">
											{#each opt.values as val, valIndex (valIndex)}
												<span
													class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-sm"
												>
													{val}
													<button
														type="button"
														class="rounded p-0.5 hover:bg-muted"
														onclick={() => removeOptionValue(optIndex, valIndex)}
													>
														<X class="size-3" />
													</button>
												</span>
											{/each}
											<form
												class="inline-flex gap-1"
												onsubmit={(e) => {
													e.preventDefault();
													const input = e.currentTarget.querySelector('input') as HTMLInputElement;
													addOptionValue(optIndex, input?.value ?? '');
													if (input) input.value = '';
												}}
											>
												<Input
													placeholder="Add value"
													class="h-7 w-24"
													onkeydown={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															const t = e.target as HTMLInputElement;
															addOptionValue(optIndex, t.value);
															t.value = '';
														}
													}}
												/>
											</form>
										</div>
									</div>
								{/each}
							</div>
						</div>
						<!-- Variant table -->
						<div class="mt-6">
							<h3 class="text-sm font-medium">Product variants</h3>
							<p class="text-xs text-muted-foreground">
								Edit title, SKU, inventory, and price per variant.
							</p>
							<div class="mt-2 overflow-auto rounded-lg border">
								<table class="w-full text-sm">
									<thead class="border-b bg-muted/50">
										<tr>
											<th class="px-3 py-2 text-left font-medium">Option</th>
											<th class="px-3 py-2 text-left font-medium">Title</th>
											<th class="px-3 py-2 text-left font-medium">SKU</th>
											<th class="px-3 py-2 text-left font-medium">Available count</th>
											<th class="px-3 py-2 text-left font-medium">Allow backorder</th>
											<th class="px-3 py-2 text-left font-medium">Price EUR</th>
										</tr>
									</thead>
									<tbody>
										{#each createVariants as v, i (i)}
											<tr class="border-b last:border-0">
												<td class="px-3 py-2 text-muted-foreground">
													{Object.values(v.options).join(' / ')}
												</td>
												<td class="px-3 py-2">
													<Input bind:value={v.title} class="h-8 w-full min-w-[100px]" />
												</td>
												<td class="px-3 py-2">
													<Input bind:value={v.sku} placeholder="SKU" class="h-8 w-24" />
												</td>
												<td class="px-3 py-2">
													<Input
														type="number"
														bind:value={v.availableCount}
														placeholder="0"
														min="0"
														class={cn(
															"h-8 w-20",
															String(v.availableCount || '').trim() && !v.sku.trim() && "border-destructive"
														)}
														disabled={!v.sku.trim()}
													/>
													{#if String(v.availableCount || '').trim() && !v.sku.trim()}
														<p class="text-xs text-destructive mt-0.5">SKU required</p>
													{/if}
												</td>
												<td class="px-3 py-2">
													<input
														type="checkbox"
														bind:checked={v.allow_backorder}
														class="rounded border-input"
													/>
												</td>
												<td class="px-3 py-2">
													<div class="relative w-20">
														<span
															class="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-muted-foreground"
															>€</span
														>
														<Input
															bind:value={v.priceAmount}
															type="text"
															placeholder="0"
															class="h-8 pl-6"
														/>
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{:else}
						<p class="mt-2 text-sm text-muted-foreground">
							A default variant will be created when you save.
						</p>
					{/if}
				</div>
			{/if}

			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				{#if createStep === 1}
					<Button onclick={() => goToStep2()}>Continue</Button>
				{:else if createStep === 2}
					<Button variant="outline" onclick={() => (createStep = 1)}>Back</Button>
					<Button onclick={() => goToStep3()}>Continue</Button>
				{:else if createStep === 3}
					<Button variant="outline" onclick={() => (createStep = 2)}>Back</Button>
					<Button onclick={() => goToStep4()}>Continue</Button>
				{:else}
					<Button variant="outline" onclick={() => (createStep = 3)}>Back</Button>
					<Button
						variant="outline"
						disabled={createSubmitting}
						onclick={() => submitCreate('draft')}
					>
						Save as draft
					</Button>
					<Button disabled={createSubmitting} onclick={() => submitCreate('published')}>
						Publish
					</Button>
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete product confirmation -->
<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="product"
	entityTitle={productToDelete?.title || productToDelete?.handle || productToDelete?.id || ''}
	onConfirm={confirmDeleteProduct}
	onCancel={handleDeleteCancel}
	submitting={deleteSubmitting}
/>
