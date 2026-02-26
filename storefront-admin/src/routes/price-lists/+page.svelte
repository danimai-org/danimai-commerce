<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import Info from '@lucide/svelte/icons/info';
	import Check from '@lucide/svelte/icons/check';
	import Clock from '@lucide/svelte/icons/clock';
	import ImageIcon from '@lucide/svelte/icons/image';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000/admin';

	type Product = {
		id: string;
		title: string;
		handle: string;
		thumbnail: string | null;
		category?: { id: string; value: string; handle: string } | null;
		sales_channels?: Array<{ id: string; name: string }>;
		variants?: Array<{ id: string }>;
	};

	type PriceListType = 'sale' | 'override';
	type PriceListStatus = 'active' | 'draft';

	type PriceList = {
		id: string;
		name: string;
		description: string | null;
		type: PriceListType;
		status: PriceListStatus;
		starts_at: string | null;
		ends_at: string | null;
		created_at: string;
		updated_at: string;
	};

	const STORAGE_KEY = 'price-lists';

	function loadPriceLists(): PriceList[] {
		if (typeof window === 'undefined') return [];
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) return JSON.parse(stored);
		} catch (e) {
			console.error('Failed to load price lists:', e);
		}
		return [];
	}

	function savePriceLists(list: PriceList[]) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
			} catch (e) {
				console.error('Failed to save price lists:', e);
			}
		}
	}

	function generateId() {
		return crypto.randomUUID?.() ?? `pl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	}

	let priceLists = $state<PriceList[]>(loadPriceLists());
	let searchQuery = $state('');
	let page = $state(1);
	const limit = 10;

	const filtered = $derived(
		searchQuery.trim()
			? priceLists.filter(
					(p) =>
						p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
				)
			: priceLists
	);
	const total = $derived(filtered.length);
	const totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	const start = $derived((page - 1) * limit + 1);
	const end = $derived(Math.min(page * limit, total));
	const pageData = $derived(filtered.slice((page - 1) * limit, page * limit));

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return iso;
		}
	}

	// Create - Multi-step form
	let createOpen = $state(false);
	let createStep = $state(1);
	let createName = $state('');
	let createDescription = $state('');
	let createType = $state<PriceListType>('sale');
	let createStatus = $state<PriceListStatus>('active');
	let createStartsAt = $state('');
	let createEndsAt = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	// Product selection state
	let createProductsLoading = $state(false);
	let createProducts = $state<Product[]>([]);
	let createProductsSearch = $state('');
	let createProductsPage = $state(1);
	let createProductsTotal = $state(0);
	let createSelectedProducts = $state<Set<string>>(new Set());

	// Price configuration state
	type ProductVariant = {
		id: string;
		product_id: string;
		title: string;
		sku: string | null;
	};

	type ProductWithVariants = {
		product: Product;
		variants: ProductVariant[];
	};

	let createProductsWithVariants = $state<ProductWithVariants[]>([]);
	let createPricesLoading = $state(false);
	let createPricesData = $state<Record<string, Record<string, { amount: string; currency_code: string }>>>({});
	const CURRENCIES = [
		{ code: 'USD', name: 'US Dollar', symbol: '$' },
		{ code: 'EUR', name: 'Euro', symbol: '€' },
		{ code: 'GBP', name: 'British Pound', symbol: '£' },
		{ code: 'INR', name: 'Indian Rupee', symbol: '₹' }
	] as const;

	async function fetchCreateProducts() {
		createProductsLoading = true;
		try {
			const params = new URLSearchParams({
				page: String(createProductsPage),
				limit: '10',
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			if (createProductsSearch.trim()) {
				params.append('search', createProductsSearch.trim());
			}
			const res = await fetch(`${API_BASE}/products?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}
			const raw = (await res.json()) as {
				products?: Product[];
				count?: number;
			};
			createProducts = raw.products || [];
			createProductsTotal = raw.count || 0;
		} catch (e) {
			console.error('Failed to fetch products:', e);
			createProducts = [];
			createProductsTotal = 0;
		} finally {
			createProductsLoading = false;
		}
	}

	function toggleProductSelection(productId: string) {
		const newSet = new Set(createSelectedProducts);
		if (newSet.has(productId)) {
			newSet.delete(productId);
		} else {
			newSet.add(productId);
		}
		createSelectedProducts = newSet;
	}

	function toggleSelectAllProducts() {
		if (createSelectedProducts.size === createProducts.length && createProducts.length > 0) {
			createSelectedProducts = new Set();
		} else {
			createSelectedProducts = new Set(createProducts.map((p) => p.id));
		}
	}

	function openCreate() {
		createOpen = true;
		createStep = 1;
		createName = '';
		createDescription = '';
		createType = 'sale';
		createStatus = 'active';
		createStartsAt = '';
		createEndsAt = '';
		createError = null;
		createSelectedProducts = new Set();
		createProducts = [];
		createProductsSearch = '';
		createProductsPage = 1;
		createProductsWithVariants = [];
		createPricesData = {};
	}

	function closeCreate() {
		createOpen = false;
		createStep = 1;
		createSelectedProducts = new Set();
		createProducts = [];
		createProductsSearch = '';
		createProductsPage = 1;
		createProductsWithVariants = [];
		createPricesData = {};
	}

	function goToStep2() {
		createError = null;
		if (!createName.trim()) {
			createError = 'Title is required';
			return;
		}
		createStep = 2;
		fetchCreateProducts();
	}

	async function fetchProductVariants(productId: string): Promise<ProductVariant[]> {
		try {
			const res = await fetch(`${API_BASE}/product-variants?limit=100`, { cache: 'no-store' });
			if (!res.ok) {
				return [];
			}
			const data = (await res.json()) as { data?: ProductVariant[] };
			return (data.data || []).filter((v) => v.product_id === productId);
		} catch {
			return [];
		}
	}

	async function goToStep3() {
		createStep = 3;
		createPricesLoading = true;
		try {
			// Fetch variants for all selected products
			const productsWithVariants: ProductWithVariants[] = [];
			for (const productId of createSelectedProducts) {
				const product = createProducts.find((p) => p.id === productId);
				if (product) {
					const variants = await fetchProductVariants(productId);
					productsWithVariants.push({
						product,
						variants: variants.length > 0 ? variants : [{ id: `default-${productId}`, product_id: productId, title: 'Default', sku: null }]
					});
				}
			}
			createProductsWithVariants = productsWithVariants;

			// Initialize price data
			const prices: Record<string, Record<string, { amount: string; currency_code: string }>> = {};
			for (const { product, variants } of productsWithVariants) {
				prices[product.id] = {};
				for (const variant of variants) {
					if (!prices[product.id][variant.id]) {
						prices[product.id][variant.id] = { amount: '', currency_code: 'USD' };
					}
				}
			}
			createPricesData = prices;
		} catch (e) {
			console.error('Failed to load variants:', e);
			createProductsWithVariants = [];
		} finally {
			createPricesLoading = false;
		}
	}

	function updatePrice(productId: string, variantId: string, field: 'amount' | 'currency_code', value: string) {
		if (!createPricesData[productId]) {
			createPricesData[productId] = {};
		}
		if (!createPricesData[productId][variantId]) {
			createPricesData[productId][variantId] = { amount: '', currency_code: 'USD' };
		}
		createPricesData[productId][variantId][field] = value;
		createPricesData = { ...createPricesData };
	}

	async function submitCreate() {
		createError = null;
		if (!createName.trim()) {
			createError = 'Title is required';
			return;
		}
		createSubmitting = true;
		try {
			const now = new Date().toISOString();
			const newList: PriceList = {
				id: generateId(),
				name: createName.trim(),
				description: createDescription.trim() || null,
				type: createType,
				status: createStatus,
				starts_at: createStartsAt.trim() || null,
				ends_at: createEndsAt.trim() || null,
				created_at: now,
				updated_at: now
			};
			priceLists = [...priceLists, newList];
			savePriceLists(priceLists);
			closeCreate();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit
	let editOpen = $state(false);
	let editList = $state<PriceList | null>(null);
	let editName = $state('');
	let editDescription = $state('');
	let editType = $state<PriceListType>('sale');
	let editStatus = $state<PriceListStatus>('draft');
	let editStartsAt = $state('');
	let editEndsAt = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openDetail(pl: PriceList) {
		detailList = pl;
		detailOpen = true;
		detailProducts = [];
		loadDetailProducts(pl.id);
	}

	function closeDetail() {
		detailOpen = false;
		detailList = null;
		detailProducts = [];
	}

	async function loadDetailProducts(priceListId: string) {
		// For now, load from localStorage or API
		// This would be replaced with actual API call
		detailProductsLoading = true;
		try {
			// Placeholder - in real app, fetch from API
			detailProducts = [];
		} catch (e) {
			console.error('Failed to load products:', e);
			detailProducts = [];
		} finally {
			detailProductsLoading = false;
		}
	}

	function openAddProductsSheet() {
		addProductsSheetOpen = true;
		addProductsSearch = '';
		addProductsPage = 1;
		addProductsList = [];
		addProductsSelected = new Set();
		fetchAddProducts();
	}

	function closeAddProductsSheet() {
		addProductsSheetOpen = false;
		addProductsSearch = '';
		addProductsPage = 1;
		addProductsList = [];
		addProductsSelected = new Set();
	}

	async function fetchAddProducts() {
		detailProductsLoading = true;
		try {
			const params = new URLSearchParams({
				page: String(addProductsPage),
				limit: '10',
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			if (addProductsSearch.trim()) {
				params.append('search', addProductsSearch.trim());
			}
			const res = await fetch(`${API_BASE}/products?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}
			const raw = (await res.json()) as {
				products?: Product[];
				count?: number;
			};
			addProductsList = raw.products || [];
			addProductsTotal = raw.count || 0;
		} catch (e) {
			console.error('Failed to fetch products:', e);
			addProductsList = [];
			addProductsTotal = 0;
		} finally {
			detailProductsLoading = false;
		}
	}

	function toggleAddProductSelection(productId: string) {
		const newSet = new Set(addProductsSelected);
		if (newSet.has(productId)) {
			newSet.delete(productId);
		} else {
			newSet.add(productId);
		}
		addProductsSelected = newSet;
	}

	function toggleSelectAllAddProducts() {
		if (addProductsSelected.size === addProductsList.length && addProductsList.length > 0) {
			addProductsSelected = new Set();
		} else {
			addProductsSelected = new Set(addProductsList.map((p) => p.id));
		}
	}

	function addSelectedProducts() {
		if (!detailList || addProductsSelected.size === 0) return;
		const productsToAdd = addProductsList.filter((p) => addProductsSelected.has(p.id));
		detailProducts = [...detailProducts, ...productsToAdd];
		closeAddProductsSheet();
	}

	function openEdit(pl: PriceList) {
		editList = pl;
		editOpen = true;
		editName = pl.name;
		editDescription = pl.description ?? '';
		editType = pl.type;
		editStatus = pl.status;
		editStartsAt = pl.starts_at ? pl.starts_at.slice(0, 16) : '';
		editEndsAt = pl.ends_at ? pl.ends_at.slice(0, 16) : '';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editList = null;
	}

	async function submitEdit() {
		if (!editList) return;
		editError = null;
		if (!editName.trim()) {
			editError = 'Name is required';
			return;
		}
		editSubmitting = true;
		try {
			const now = new Date().toISOString();
			priceLists = priceLists.map((p) =>
				p.id === editList!.id
					? {
							...p,
							name: editName.trim(),
							description: editDescription.trim() || null,
							type: editType,
							status: editStatus,
							starts_at: editStartsAt.trim() || null,
							ends_at: editEndsAt.trim() || null,
							updated_at: now
						}
					: p
			);
			savePriceLists(priceLists);
			closeEdit();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	// Detail view
	let detailOpen = $state(false);
	let detailList = $state<PriceList | null>(null);
	let detailProducts = $state<Product[]>([]);
	let detailProductsLoading = $state(false);
	let addProductsSheetOpen = $state(false);
	let addProductsSearch = $state('');
	let addProductsPage = $state(1);
	let addProductsTotal = $state(0);
	let addProductsList = $state<Product[]>([]);
	let addProductsSelected = $state<Set<string>>(new Set());

	// Delete
	let deleteConfirmOpen = $state(false);
	let listToDelete = $state<PriceList | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteConfirm(pl: PriceList) {
		listToDelete = pl;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			listToDelete = null;
		}
	}

	function confirmDelete() {
		if (!listToDelete) return;
		deleteSubmitting = true;
		try {
			priceLists = priceLists.filter((p) => p.id !== listToDelete!.id);
			savePriceLists(priceLists);
			deleteConfirmOpen = false;
			listToDelete = null;
		} finally {
			deleteSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListChecks class="size-4" />
				<span class="font-semibold">Price Lists</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2">
					<div class="relative w-64">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
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

		<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
			<table class="w-full text-sm">
				<thead class="sticky top-0 border-b bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium">Name</th>
						<th class="px-4 py-3 text-left font-medium">Type</th>
						<th class="px-4 py-3 text-left font-medium">Status</th>
						<th class="px-4 py-3 text-left font-medium">Starts</th>
						<th class="px-4 py-3 text-left font-medium">Ends</th>
						<th class="px-4 py-3 text-left font-medium">Created</th>
						<th class="w-10 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#if pageData.length === 0}
						<tr>
							<td colspan="7" class="px-4 py-12 text-center text-muted-foreground">
								No price lists yet. Create one to define custom pricing (e.g. sales or overrides).
							</td>
						</tr>
					{:else}
						{#each pageData as pl (pl.id)}
							<tr class="border-b transition-colors hover:bg-muted/30">
								<td class="px-4 py-3">
									<button
										type="button"
										onclick={() => openDetail(pl)}
										class="font-medium text-left hover:underline cursor-pointer"
									>
										{pl.name}
									</button>
								</td>
								<td class="px-4 py-3 text-muted-foreground capitalize">{pl.type}</td>
								<td class="px-4 py-3">
									<span
										class={cn(
											'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
											pl.status === 'active'
												? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
												: 'bg-muted text-muted-foreground'
										)}
									>
										{pl.status}
									</span>
								</td>
								<td class="px-4 py-3 text-muted-foreground">
									{pl.starts_at ? formatDate(pl.starts_at) : '–'}
								</td>
								<td class="px-4 py-3 text-muted-foreground">
									{pl.ends_at ? formatDate(pl.ends_at) : '–'}
								</td>
								<td class="px-4 py-3 text-muted-foreground">{formatDate(pl.created_at)}</td>
								<td class="px-4 py-3">
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
													onSelect={() => openEdit(pl)}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Item
													textValue="Delete"
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openDeleteConfirm(pl)}
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

		<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
			<p class="text-sm text-muted-foreground">
				{#if total > 0}
					{start} – {end} of {total} results
				{:else}
					0 results
				{/if}
			</p>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={page <= 1}
					onclick={() => (page = page - 1)}
				>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">
					{page} of {totalPages} pages
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={page >= totalPages}
					onclick={() => (page = page + 1)}
				>
					Next
				</Button>
			</div>
		</div>
	</div>
</div>

<!-- Create Price List Sheet (multi-step) -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<!-- Step tabs -->
			<Sheet.Header class="flex flex-col gap-4 border-b px-6 py-4">
				<div class="flex items-center gap-2 pt-[10px]">
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createStep >= 1 ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createStep > 1}
								1
							{:else}
								<Info class="size-3" />
							{/if}
						</span>
						<span class={cn('text-sm', createStep === 1 ? 'font-medium' : 'text-muted-foreground')}>Details</span>
					</div>
					<div class="h-px flex-1 bg-border"></div>
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createStep >= 2 ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createStep > 2}
								2
							{:else if createStep === 2}
								<Info class="size-3" />
							{:else}
								2
							{/if}
						</span>
						<span class={cn('text-sm', createStep === 2 ? 'font-medium' : 'text-muted-foreground')}>Products</span>
					</div>
					<div class="h-px flex-1 bg-border"></div>
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createStep >= 3 ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createStep === 3}
								<Info class="size-3" />
							{:else}
								3
							{/if}
						</span>
						<span class={cn('text-sm', createStep === 3 ? 'font-medium' : 'text-muted-foreground')}>Prices</span>
					</div>
				</div>
			</Sheet.Header>

			{#if createError && !createSubmitting}
				<div
					class="mx-6 mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{createError}
				</div>
			{/if}

			<!-- Step content -->
			<div class="flex-1 overflow-auto px-6 py-6">
				{#if createStep === 1}
					<h2 class="text-lg font-semibold">Create Price List</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Create a new price list to manage the prices of your products.
					</p>

					<div class="mt-6 flex flex-col gap-6">
						<!-- Type Selection -->
						<div class="flex flex-col gap-2">
							<div class="text-sm font-medium">Type</div>
							<p class="text-xs text-muted-foreground">Choose the type of price list you want to create.</p>
							<div class="mt-2 flex flex-col gap-2">
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										createType === 'sale'
											? 'border-primary bg-primary/5'
											: 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="create-type"
										value="sale"
										checked={createType === 'sale'}
										onchange={() => (createType = 'sale')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div class="min-w-0 flex-1">
										<span class="font-medium">Sale</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Sale prices are temporary price changes for products.
										</p>
									</div>
								</label>
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										createType === 'override'
											? 'border-primary bg-primary/5'
											: 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="create-type"
										value="override"
										checked={createType === 'override'}
										onchange={() => (createType = 'override')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div class="min-w-0 flex-1">
										<span class="font-medium">Override</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Overrides are usually used to create customer-specific prices.
										</p>
									</div>
								</label>
							</div>
						</div>

						<!-- General Details -->
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-2">
								<label for="create-title" class="text-sm font-medium">Title</label>
								<Input
									id="create-title"
									bind:value={createName}
									placeholder="e.g. Summer Sale 2025"
									class={cn('h-9', createError === 'Title is required' && 'border-destructive')}
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-status" class="text-sm font-medium">Status</label>
								<Select.Root
									type="single"
									value={createStatus}
									onValueChange={(v) => v && (createStatus = v as PriceListStatus)}
								>
									<Select.Trigger id="create-status" class="h-9 w-full">
										{createStatus === 'active' ? 'Active' : 'Draft'}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="active" label="Active">Active</Select.Item>
										<Select.Item value="draft" label="Draft">Draft</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-description" class="text-sm font-medium">Description</label>
								<textarea
									id="create-description"
									bind:value={createDescription}
									rows="3"
									class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
									placeholder="Price list description"
								></textarea>
							</div>
						</div>

						<!-- Price List Start Date -->
						<div class="flex flex-col gap-2">
							<label for="create-starts-at" class="text-sm font-medium">Price list has a start date? (Optional)</label>
							<p class="text-xs text-muted-foreground">Schedule the price list to activate in the future.</p>
							<div class="relative mt-2">
								<Clock
									class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="create-starts-at"
									type="datetime-local"
									bind:value={createStartsAt}
									class="h-9 w-full pl-[32px]"
									placeholder="MM/DD/YYYY -:- AM"
								/>
							</div>
						</div>

						<!-- Price List End Date -->
						<div class="flex flex-col gap-2">
							<label for="create-ends-at" class="text-sm font-medium">Price list has an end date? (Optional)</label>
							<p class="text-xs text-muted-foreground">Schedule when the price list should expire.</p>
							<div class="relative mt-2">
								<Clock
									class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="create-ends-at"
									type="datetime-local"
									bind:value={createEndsAt}
									class="h-9 w-full pl-[32px]"
									placeholder="MM/DD/YYYY -:- AM"
								/>
							</div>
						</div>
					</div>
				{:else if createStep === 2}
					<h2 class="text-lg font-semibold">Products</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Select products to include in this price list.
					</p>

					<div class="mt-6 flex flex-col gap-4">
						<!-- Search -->
						<div class="relative">
							<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search products..."
								bind:value={createProductsSearch}
								oninput={() => {
									createProductsPage = 1;
									fetchCreateProducts();
								}}
								class="h-9 pl-9"
							/>
						</div>

						<!-- Products Table -->
						<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
							{#if createProductsLoading}
								<div class="flex items-center justify-center p-12">
									<p class="text-sm text-muted-foreground">Loading products...</p>
								</div>
							{:else if createProducts.length === 0}
								<div class="flex items-center justify-center p-12">
									<p class="text-sm text-muted-foreground">No products found.</p>
								</div>
							{:else}
								<table class="w-full text-sm">
									<thead class="sticky top-0 border-b bg-muted/50">
										<tr>
											<th class="w-10 px-4 py-3 text-left">
												<input
													type="checkbox"
													class="size-4 rounded border-input"
													checked={createProducts.length > 0 &&
														createSelectedProducts.size === createProducts.length}
													onchange={toggleSelectAllProducts}
													aria-label="Select all"
												/>
											</th>
											<th class="px-4 py-3 text-left font-medium">Product</th>
											<th class="px-4 py-3 text-left font-medium">Category</th>
											<th class="px-4 py-3 text-left font-medium">Variants</th>
										</tr>
									</thead>
									<tbody>
										{#each createProducts as product (product.id)}
											{@const isSelected = createSelectedProducts.has(product.id)}
											<tr class="border-b transition-colors hover:bg-muted/30">
												<td class="px-4 py-3">
													<input
														type="checkbox"
														checked={isSelected}
														onchange={() => toggleProductSelection(product.id)}
														class="size-4 rounded border-input"
													/>
												</td>
												<td class="px-4 py-3">
													<div class="flex items-center gap-3">
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
														<span class="font-medium">{product.title || product.handle || product.id}</span>
													</div>
												</td>
												<td class="px-4 py-3 text-muted-foreground">
													{product.category?.value ?? '—'}
												</td>
												<td class="px-4 py-3 text-muted-foreground">
													{product.variants?.length ?? 0} variant{(product.variants?.length ?? 0) === 1 ? '' : 's'}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}
						</div>

						<!-- Pagination -->
						{#if createProductsTotal > 10}
							<div class="flex items-center justify-between border-t pt-4">
								<p class="text-sm text-muted-foreground">
									{Math.min((createProductsPage - 1) * 10 + 1, createProductsTotal)} – {Math.min(createProductsPage * 10, createProductsTotal)} of {createProductsTotal} products
								</p>
								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={createProductsPage <= 1}
										onclick={() => {
											createProductsPage--;
											fetchCreateProducts();
										}}
									>
										Prev
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={createProductsPage * 10 >= createProductsTotal}
										onclick={() => {
											createProductsPage++;
											fetchCreateProducts();
										}}
									>
										Next
									</Button>
								</div>
							</div>
						{/if}

						<!-- Selected count -->
						{#if createSelectedProducts.size > 0}
							<div class="rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm">
								<span class="font-medium">{createSelectedProducts.size}</span>
								<span class="ml-2 text-muted-foreground">
									product{createSelectedProducts.size === 1 ? '' : 's'} selected
								</span>
							</div>
						{/if}
					</div>
				{:else if createStep === 3}
					<h2 class="text-lg font-semibold">Prices</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Set prices for the selected products.
					</p>

					<div class="mt-6 flex flex-col gap-6">
						{#if createPricesLoading}
							<div class="flex items-center justify-center p-12">
								<p class="text-sm text-muted-foreground">Loading variants...</p>
							</div>
						{:else if createProductsWithVariants.length === 0}
							<div class="rounded-lg border border-dashed p-12 text-center">
								<p class="text-sm text-muted-foreground">
									No products selected. Please go back and select products.
								</p>
							</div>
						{:else}
							{#each createProductsWithVariants as { product, variants } (product.id)}
								<div class="rounded-lg border bg-card">
									<div class="border-b p-4">
										<div class="flex items-center gap-3">
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
											<div>
												<h3 class="font-medium">{product.title || product.handle || product.id}</h3>
												<p class="text-xs text-muted-foreground">{variants.length} variant{variants.length === 1 ? '' : 's'}</p>
											</div>
										</div>
									</div>
									<div class="p-4">
										<table class="w-full text-sm">
											<thead class="border-b bg-muted/50">
												<tr>
													<th class="px-4 py-2 text-left font-medium">Variant</th>
													<th class="px-4 py-2 text-left font-medium">SKU</th>
													<th class="px-4 py-2 text-left font-medium">Currency</th>
													<th class="px-4 py-2 text-left font-medium">Amount</th>
												</tr>
											</thead>
											<tbody>
												{#each variants as variant (variant.id)}
													{@const price = createPricesData[product.id]?.[variant.id] || { amount: '', currency_code: 'USD' }}
													<tr class="border-b last:border-0">
														<td class="px-4 py-3">
															<span class="font-medium">{variant.title}</span>
														</td>
														<td class="px-4 py-3 text-muted-foreground">
															{variant.sku || '—'}
														</td>
														<td class="px-4 py-3">
															<Select.Root
																type="single"
																value={price.currency_code}
																onValueChange={(v) => v && updatePrice(product.id, variant.id, 'currency_code', v)}
															>
																<Select.Trigger class="h-8 w-32">
																	{price.currency_code}
																</Select.Trigger>
																<Select.Content>
																	{#each CURRENCIES as currency}
																		<Select.Item value={currency.code} label={currency.code}>
																			{currency.code} - {currency.name}
																		</Select.Item>
																	{/each}
																</Select.Content>
															</Select.Root>
														</td>
														<td class="px-4 py-3">
															<div class="relative w-40">
																<span
																	class="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-muted-foreground"
																>
																	{CURRENCIES.find((c) => c.code === price.currency_code)?.symbol ?? '$'}
																</span>
																<Input
																	type="number"
																	step="0.01"
																	min="0"
																	placeholder="0.00"
																	value={price.amount}
																	oninput={(e) =>
																		updatePrice(product.id, variant.id, 'amount', (e.currentTarget as HTMLInputElement).value)}
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
							{/each}
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				{#if createStep === 1}
					<Button onclick={() => goToStep2()}>Continue</Button>
				{:else if createStep === 2}
					<Button variant="outline" onclick={() => (createStep = 1)}>Back</Button>
					<Button onclick={() => goToStep3()}>Continue</Button>
				{:else}
					<Button variant="outline" onclick={() => (createStep = 2)}>Back</Button>
					<Button disabled={createSubmitting} onclick={submitCreate}>
						{createSubmitting ? 'Creating…' : 'Create'}
					</Button>
				{/if}
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit price list sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit price list</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update name, type, status, and dates.
				</p>
				{#if editError && !editSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-name"
							bind:value={editName}
							placeholder="e.g. Summer Sale 2025"
							class={cn('h-9', editError === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-desc" class="text-sm font-medium">Description (optional)</label>
						<Input id="edit-desc" bind:value={editDescription} placeholder="Short description" class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-type" class="text-sm font-medium">Type</label>
						<Select.Root
							type="single"
							value={editType}
							onValueChange={(v) => v && (editType = v as PriceListType)}
						>
							<Select.Trigger id="edit-type" class="h-9 w-full">
								{editType === 'sale' ? 'Sale' : 'Override'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="sale" label="Sale">Sale</Select.Item>
								<Select.Item value="override" label="Override">Override</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-status" class="text-sm font-medium">Status</label>
						<Select.Root
							type="single"
							value={editStatus}
							onValueChange={(v) => v && (editStatus = v as PriceListStatus)}
						>
							<Select.Trigger id="edit-status" class="h-9 w-full">
								{editStatus === 'active' ? 'Active' : 'Draft'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="draft" label="Draft">Draft</Select.Item>
								<Select.Item value="active" label="Active">Active</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-starts" class="text-sm font-medium">Starts at (optional)</label>
						<Input id="edit-starts" type="datetime-local" bind:value={editStartsAt} class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-ends" class="text-sm font-medium">Ends at (optional)</label>
						<Input id="edit-ends" type="datetime-local" bind:value={editEndsAt} class="h-9" />
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

<!-- Detail Sheet -->
<Sheet.Root bind:open={detailOpen}>
	<Sheet.Content side="right" class="w-full max-w-4xl sm:max-w-4xl">
		<div class="flex h-full flex-col">
			<Sheet.Header class="border-b px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Sheet.Title class="text-xl font-semibold">{detailList?.name}</Sheet.Title>
						{#if detailList}
							<span
								class={cn(
									'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
									detailList.status === 'active'
										? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
										: 'bg-muted text-muted-foreground'
								)}
							>
								{detailList.status}
							</span>
						{/if}
					</div>
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
								{#if detailList}
									<DropdownMenu.Item
										textValue="Edit"
										class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
										onSelect={() => {
											closeDetail();
											openEdit(detailList!);
										}}
									>
										<Pencil class="size-4" />
										Edit
									</DropdownMenu.Item>
									<DropdownMenu.Item
										textValue="Delete"
										class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
										onSelect={() => {
											closeDetail();
											openDeleteConfirm(detailList!);
										}}
									>
										<Trash2 class="size-4" />
										Delete
									</DropdownMenu.Item>
								{/if}
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if detailList}
					<!-- General Details -->
					<div class="mb-6 rounded-lg border bg-card p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold">General</h2>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<div class="text-sm font-medium text-muted-foreground">Type</div>
								<div class="mt-1 capitalize">{detailList.type}</div>
							</div>
							<div>
								<div class="text-sm font-medium text-muted-foreground">Description</div>
								<div class="mt-1">{detailList.description || '—'}</div>
							</div>
							<div>
								<div class="text-sm font-medium text-muted-foreground">Price overrides</div>
								<div class="mt-1">—</div>
							</div>
						</div>
					</div>

					<!-- Products Section -->
					<div class="mb-6 rounded-lg border bg-card p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">Products</h2>
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
											textValue="Add Product"
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={openAddProductsSheet}
										>
											<ImageIcon class="size-4" />
											Add Product
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						{#if detailProductsLoading}
							<div class="flex items-center justify-center p-12">
								<p class="text-sm text-muted-foreground">Loading products...</p>
							</div>
						{:else if detailProducts.length === 0}
							<div class="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-12 text-center">
								<Info class="size-6 text-muted-foreground" />
								<p class="text-sm font-medium text-muted-foreground">No records</p>
								<p class="text-xs text-muted-foreground">There are no records to show</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each detailProducts as product (product.id)}
									<div class="flex items-center gap-3 rounded-md border p-3">
										{#if product.thumbnail}
											<img
												src={product.thumbnail}
												alt=""
												class="size-12 shrink-0 rounded-md object-cover"
											/>
										{:else}
											<div
												class="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
											>
												<ImageIcon class="size-6" />
											</div>
										{/if}
										<div class="min-w-0 flex-1">
											<div class="font-medium">{product.title || product.handle || product.id}</div>
											<div class="text-xs text-muted-foreground">
												{product.variants?.length ?? 0} variant{(product.variants?.length ?? 0) === 1 ? '' : 's'}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Configuration Section -->
					<div class="mb-6 rounded-lg border bg-card p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">Configuration</h2>
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
											onSelect={() => {
												closeDetail();
												openEdit(detailList!);
											}}
										>
											<Pencil class="size-4" />
											Edit
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<div class="text-sm font-medium text-muted-foreground">Start date</div>
								<div class="mt-1">
									{detailList.starts_at
										? new Date(detailList.starts_at).toLocaleString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
												hour: 'numeric',
												minute: '2-digit'
											})
										: '—'}
								</div>
							</div>
							<div>
								<div class="text-sm font-medium text-muted-foreground">End date</div>
								<div class="mt-1">
									{detailList.ends_at
										? new Date(detailList.ends_at).toLocaleString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
												hour: 'numeric',
												minute: '2-digit'
											})
										: '—'}
								</div>
							</div>
						</div>
					</div>

					<!-- JSON Section -->
					<div class="rounded-lg border bg-card p-6 shadow-sm">
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1">
								<h2 class="text-lg font-semibold mb-1">JSON</h2>
								<p class="text-sm text-muted-foreground">
									{Object.keys(detailList).length} keys
								</p>
							</div>
							<button
								type="button"
								class="flex size-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
								onclick={() => {
									if (detailList) {
										const jsonString = JSON.stringify(detailList, null, 2);
										navigator.clipboard.writeText(jsonString);
									}
								}}
								title="Copy JSON"
							>
								<ExternalLink class="size-4" />
								<span class="sr-only">Copy JSON</span>
							</button>
						</div>
						<div class="mt-4 overflow-auto rounded-md border bg-zinc-900 p-4">
							<pre class="font-mono text-sm break-all whitespace-pre-wrap text-zinc-300">
								<code>{JSON.stringify(detailList, null, 2)}</code>
							</pre>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Add Products Sheet -->
<Sheet.Root bind:open={addProductsSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<Sheet.Header class="border-b px-6 py-4">
				<Sheet.Title>Add Products</Sheet.Title>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				<div class="mb-4 flex flex-col gap-4">
					<!-- Search -->
					<div class="relative">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search products..."
							bind:value={addProductsSearch}
							oninput={() => {
								addProductsPage = 1;
								fetchAddProducts();
							}}
							class="h-9 pl-9"
						/>
					</div>

					<!-- Products Table -->
					<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
						{#if detailProductsLoading}
							<div class="flex items-center justify-center p-12">
								<p class="text-sm text-muted-foreground">Loading products...</p>
							</div>
						{:else if addProductsList.length === 0}
							<div class="flex items-center justify-center p-12">
								<p class="text-sm text-muted-foreground">No products found.</p>
							</div>
						{:else}
							<table class="w-full text-sm">
								<thead class="sticky top-0 border-b bg-muted/50">
									<tr>
										<th class="w-10 px-4 py-3 text-left">
											<input
												type="checkbox"
												class="size-4 rounded border-input"
												checked={addProductsList.length > 0 &&
													addProductsSelected.size === addProductsList.length}
												onchange={toggleSelectAllAddProducts}
												aria-label="Select all"
											/>
										</th>
										<th class="px-4 py-3 text-left font-medium">Product</th>
										<th class="px-4 py-3 text-left font-medium">Category</th>
										<th class="px-4 py-3 text-left font-medium">Variants</th>
									</tr>
								</thead>
								<tbody>
									{#each addProductsList as product (product.id)}
										{@const isSelected = addProductsSelected.has(product.id)}
										<tr class="border-b transition-colors hover:bg-muted/30">
											<td class="px-4 py-3">
												<input
													type="checkbox"
													checked={isSelected}
													onchange={() => toggleAddProductSelection(product.id)}
													class="size-4 rounded border-input"
												/>
											</td>
											<td class="px-4 py-3">
												<div class="flex items-center gap-3">
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
													<span class="font-medium">{product.title || product.handle || product.id}</span>
												</div>
											</td>
											<td class="px-4 py-3 text-muted-foreground">
												{product.category?.value ?? '—'}
											</td>
											<td class="px-4 py-3 text-muted-foreground">
												{product.variants?.length ?? 0} variant{(product.variants?.length ?? 0) === 1 ? '' : 's'}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>

					<!-- Pagination -->
					{#if addProductsTotal > 10}
						<div class="flex items-center justify-between border-t pt-4">
							<p class="text-sm text-muted-foreground">
								{Math.min((addProductsPage - 1) * 10 + 1, addProductsTotal)} – {Math.min(addProductsPage * 10, addProductsTotal)} of {addProductsTotal} products
							</p>
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={addProductsPage <= 1}
									onclick={() => {
										addProductsPage--;
										fetchAddProducts();
									}}
								>
									Prev
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={addProductsPage * 10 >= addProductsTotal}
									onclick={() => {
										addProductsPage++;
										fetchAddProducts();
									}}
								>
									Next
								</Button>
							</div>
						</div>
					{/if}

					<!-- Selected count -->
					{#if addProductsSelected.size > 0}
						<div class="rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm">
							<span class="font-medium">{addProductsSelected.size}</span>
							<span class="ml-2 text-muted-foreground">
								product{addProductsSelected.size === 1 ? '' : 's'} selected
							</span>
						</div>
					{/if}
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeAddProductsSheet}>Cancel</Button>
				<Button onclick={addSelectedProducts} disabled={addProductsSelected.size === 0}>
					Add Products
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="price list"
	entityTitle={listToDelete?.name ?? listToDelete?.id ?? ''}
	onConfirm={confirmDelete}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
