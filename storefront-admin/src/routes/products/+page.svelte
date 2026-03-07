<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Package from '@lucide/svelte/icons/package';
	import Info from '@lucide/svelte/icons/info';
	import Check from '@lucide/svelte/icons/check';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { listProducts } from '$lib/products/api';
	import type { Product, ProductsListResponse, ListProductsParams } from '$lib/products/types.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';

	async function deleteProducts(ids: string[]): Promise<void> {
		const res = await fetch(`${API_BASE}/products`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ product_ids: ids })
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(text || `HTTP ${res.status}`);
		}
	}

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

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
				optionsRecord[opt.title.trim()] = (combo[j] as string)?.trim() ?? '';
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

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState =
		createPagination<ProductsListResponse>(async (): Promise<ProductsListResponse> => {
			const q = paginationQuery as Record<string, unknown>;
			const categoryIds = q?.category_ids;
			const categoryIdsArr =
				typeof categoryIds === 'string'
					? categoryIds
							.split(',')
							.map((s: string) => s.trim())
							.filter(Boolean)
					: Array.isArray(categoryIds)
						? categoryIds
						: undefined;
			const params = {
				page: q?.page != null ? Number(q.page) : 1,
				limit: q?.limit != null ? Number(q.limit) : 10,
				sorting_field: (q?.sorting_field as string) ?? 'created_at',
				sorting_direction: (q?.sorting_direction as 'asc' | 'desc') ?? 'desc',
				search: (q?.search as string) || undefined,
				category_ids: categoryIdsArr?.length ? (categoryIdsArr as string[]) : undefined
			};
			return listProducts(params as any) as unknown as ProductsListResponse;
		}, ['products']);

	$effect(() => {
		paginationQuery;
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data as ProductsListResponse | undefined);
	const rawRows = $derived(queryData?.data?.rows ?? []);
	const rows = $derived(
		rawRows.map((p: Product) => ({
			...p,
			category_display: p.category?.value ?? '—',
			sales_channels_display: p.sales_channels?.map((sc) => sc.name).join(', ') ?? '—',
			variants_count: p.variants?.length ?? 0
		}))
	) as Record<string, unknown>[];
	const pagination = $derived((queryData?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteError = $derived(paginateState.deleteError);
	const refetch = $derived(paginateState.refetch);

	const tableColumns: TableColumn[] = [
		{
			label: 'Product',
			key: 'title',
			type: 'link',
			cellHref: (row) => `/products/${row.id}`,
			thumbnailKey: 'thumbnail',
			textKey: 'title'
		},
		{ label: 'Category', key: 'category_display', type: 'text' },
		{
			label: 'Inventory',
			key: 'id',
			type: 'link',
			cellHref: (row) => `/products/${row.id}`,
			linkLabel: 'View'
		},
		{ label: 'Sales Channels', key: 'sales_channels_display', type: 'text' },
		{ label: 'Variants', key: 'variants_count', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => goto(`/products/${item.id}`)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as unknown as ProductsListResponse)
				}
			]
		}
	];

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
	let createMediaModalOpen = $state(false);
	let createMediaImageUrl = $state('');
	let createMediaChosenFile = $state<File | null>(null);
	let createMediaFileInput = $state<HTMLInputElement | undefined>();
	// Saved choice: either URL or one file
	let createMediaUrl = $state('');
	let createMediaFile = $state<File | null>(null);

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
	let attributeGroupsList = $state<{ id: string; title: string }[]>([]);
	let salesChannelsList = $state<{ id: string; name: string }[]>([]);

	// Step 2: Attributes
	type CreateAttributeEntry = { attributeId: string; attributeTitle: string; value: string };
	let createAttributeGroupId = $state('');
	let createAttributeEntries = $state<CreateAttributeEntry[]>([]);

	function addAttributeEntry() {
		createAttributeEntries = [
			...createAttributeEntries,
			{ attributeId: '', attributeTitle: '', value: '' }
		];
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
		createAttributeGroupId = '';
		createAttributeEntries = [];
		createMediaUrl = '';
		createMediaFile = null;
		createError = null;
		syncVariantsFromOptions();
		// Fetch collections, categories, attributes
		fetch(`${API_BASE}/collections?limit=100`)
			.then((r) => (r.ok ? r.json() : { rows: [] }))
			.then((j) => {
				collectionsList = (j as { rows?: { id: string; title: string; handle: string }[] }).rows ?? [];
			})
			.catch(() => {
				collectionsList = [];
			});
		fetch(`${API_BASE}/product-categories?limit=100`)
			.then((r) => (r.ok ? r.json() : { rows: [] }))
			.then((j) => {
				categoriesList = (j as { rows?: { id: string; value: string; handle: string }[] }).rows ?? [];
			})
			.catch(() => {
				categoriesList = [];
			});
		fetch(`${API_BASE}/product-tags?limit=100`)
			.then((r) => (r.ok ? r.json() : { rows: [] }))
			.then((j) => {
				tagsList = (j as { rows?: { id: string; value: string }[] }).rows ?? [];
			})
			.catch(() => {
				tagsList = [];
			});
		fetch(`${API_BASE}/product-attributes?limit=100`)
			.then((r) => (r.ok ? r.json() : { rows: [] }))
			.then((j) => {
				attributesList = (j as { rows?: { id: string; title: string; type: string }[] }).rows ?? [];
			})
			.catch(() => {
				attributesList = [];
			});
		fetch(`${API_BASE}/product-attribute-groups?limit=100`)
			.then((r) => (r.ok ? r.json() : { rows: [] }))
			.then((j) => {
				attributeGroupsList = (j as { rows?: { id: string; title: string }[] }).rows ?? [];
			})
			.catch(() => {
				attributeGroupsList = [];
			});
		// Fetch sales channels and set defaults
		fetch(`${API_BASE}/sales-channels?limit=100`)
			.then((r) => (r.ok ? r.json() : { rows: [] }))
			.then((j) => {
				const salesChannels =
					(j as { rows?: { id: string; name: string; is_default?: boolean }[] }).rows ?? [];
				salesChannelsList = salesChannels.map((ch) => ({
					id: ch.id,
					name: ch.name
				}));
				const defaultChannels = salesChannels.filter((ch) => ch.is_default);
				if (defaultChannels.length > 0) {
					createSalesChannels = defaultChannels.map((ch) => ({
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
			.map((o) => ({
				title: o.title.trim(),
				values: o.values.map((val) => (typeof val === 'string' ? val.trim() : val))
			}));

		const variantsForApi = createVariants.map((v, i) => {
			const prices = v.priceAmount.trim()
				? [{ amount: Math.round(parseFloat(v.priceAmount) * 100), currency_code: 'eur' }]
				: [];
			const availableCountStr = String(v.availableCount || '').trim();
			const availableCountNum = availableCountStr ? parseInt(availableCountStr, 10) : null;
			const optionsTrimmed = Object.fromEntries(
				Object.entries(v.options).map(([k, val]) => [
					k.trim(),
					typeof val === 'string' ? val.trim() : val
				])
			);
			return {
				title: v.title,
				options: optionsTrimmed,
				sku: v.sku || undefined,
				manage_inventory: availableCountNum !== null && availableCountNum >= 0,
				allow_backorder: v.allow_backorder,
				variant_rank: i,
				prices,
				available_count: availableCountNum !== null ? availableCountNum : undefined
			};
		});

		const attributesFiltered = createAttributeEntries.filter(
			(e) => e.attributeId && e.value.trim()
		);
		const attributesForApi =
			createAttributeGroupId && attributesFiltered.length > 0
				? attributesFiltered.map((e) => ({
						attribute_group_id: createAttributeGroupId,
						attribute_id: e.attributeId,
						value: e.value.trim()
					}))
				: undefined;
		const attributeGroupsForApi =
			createAttributeGroupId && attributesFiltered.length > 0
				? [{ attribute_group_id: createAttributeGroupId, required: false, rank: 0 }]
				: undefined;

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
			sales_channels:
				createSalesChannels.length > 0
					? createSalesChannels.map((ch) => ({ id: ch.id }))
					: undefined,
			attribute_groups: attributeGroupsForApi,
			attributes: attributesForApi
		};
	}

	async function submitCreate(status: 'draft' | 'published') {
		createError = null;
		if (!createTitle.trim()) {
			createError = 'Title is required';
			return;
		}
		const hasAttributeEntries = createAttributeEntries.some((e) => e.attributeId && e.value.trim());
		if (hasAttributeEntries && !createAttributeGroupId) {
			createError = 'Select an attribute group when setting attributes.';
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
			console.log('createVariants', createVariants);
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
			refetch();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Products | Danimai Store</title>
	<meta name="description" content="Manage products." />
</svelte:head>
<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Package class="size-4" />
				<span class="font-semibold">Products</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>
		<PaginationTable>
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
						<TableHead columns={tableColumns} />
						<TableBody {rows} columns={tableColumns} emptyMessage="No products found." />
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
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
								role="button"
								tabindex="0"
								aria-label="Media upload"
								class="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
								onclick={() => {
									createMediaImageUrl = createMediaUrl;
									createMediaChosenFile = createMediaFile;
									createMediaModalOpen = true;
								}}
								onkeydown={(e) => e.key === 'Enter' && (createMediaModalOpen = true)}
							>
								<Upload class="size-8 text-muted-foreground" />
								<p>Drag and drop images here or click to upload.</p>
								{#if createMediaUrl || createMediaFile}
									<p class="text-xs text-muted-foreground">
										{createMediaUrl
											? 'Image URL set'
											: (createMediaFile?.name ?? '1 image selected')}
									</p>
								{/if}
							</div>
							<!-- Image URL / Choose file modal (centered, not full-screen sheet) -->
							<Dialog.Root bind:open={createMediaModalOpen}>
								<Dialog.Content
									class="mx-auto my-auto h-max max-h-[90dvh] w-full max-w-md overflow-auto rounded-lg border shadow-lg"
								>
									<Dialog.Header>
										<Dialog.Title>Provide an image</Dialog.Title>
									</Dialog.Header>
									<div class="grid gap-4 p-[10px]">
										<div class="flex flex-col gap-2">
											<label for="create-media-url" class="text-sm font-medium">Image URL</label>
											<Input
												id="create-media-url"
												type="url"
												placeholder="https://..."
												bind:value={createMediaImageUrl}
												class="w-full"
											/>
										</div>
										<p class="text-sm text-muted-foreground">Or choose file</p>
										<div class="flex items-center gap-2">
											<input
												type="file"
												accept="image/*"
												class="hidden"
												bind:this={createMediaFileInput}
												onchange={(e) => {
													const f = e.currentTarget.files?.[0];
													if (f) createMediaChosenFile = f;
													e.currentTarget.value = '';
												}}
											/>
											<Button
												type="button"
												variant="outline"
												onclick={() => createMediaFileInput?.click()}
											>
												Choose file
											</Button>
											<span class="text-sm text-muted-foreground">
												{createMediaChosenFile?.name ?? 'No file chosen'}
											</span>
										</div>
									</div>
									<Dialog.Footer class="flex flex-row justify-end gap-2 border-t p-4">
										<Button
											type="button"
											variant="outline"
											onclick={() => (createMediaModalOpen = false)}
										>
											Cancel
										</Button>
										<Button
											type="button"
											onclick={() => {
												if (createMediaImageUrl.trim()) {
													createMediaUrl = createMediaImageUrl.trim();
													createMediaFile = null;
												}
												if (createMediaChosenFile) {
													createMediaFile = createMediaChosenFile;
													createMediaUrl = '';
												}
												createMediaModalOpen = false;
											}}
										>
											Save
										</Button>
									</Dialog.Footer>
								</Dialog.Content>
							</Dialog.Root>
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
						Assign product attributes and their values. You can manage attributes from the product
						detail page after creation.
					</p>
					<div class="mt-6 flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="create-attr-group-select" class="text-sm font-medium"
								>Attribute group</label
							>
							<Select.Root
								type="single"
								value={createAttributeGroupId}
								onValueChange={(v) => (createAttributeGroupId = v ?? '')}
								allowDeselect
							>
								<Select.Trigger id="create-attr-group-select" class="w-full max-w-xs">
									{attributeGroupsList.find((g) => g.id === createAttributeGroupId)?.title ??
										'Select attribute group'}
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										<Select.Label>Attribute group</Select.Label>
										<Select.Item value="" label="Select attribute group">
											Select attribute group
										</Select.Item>
										{#each attributeGroupsList as ag (ag.id)}
											<Select.Item value={ag.id} label={ag.title}>
												{ag.title}
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
							<p class="text-xs text-muted-foreground">
								Required when adding attributes. Attributes must belong to the selected group.
							</p>
						</div>
						{#each createAttributeEntries as entry, entryIndex (entryIndex)}
							<div class="rounded-lg border p-4">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0 flex-1 space-y-3">
										<div class="flex flex-col gap-2">
											<label for="create-attr-select-{entryIndex}" class="text-sm font-medium"
												>Attribute</label
											>
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
											<label for="create-attr-value-{entryIndex}" class="text-sm font-medium"
												>Value</label
											>
											<Input
												id="create-attr-value-{entryIndex}"
												class="h-9"
												placeholder="Value"
												value={entry.value}
												oninput={(e) =>
													setAttributeEntryValue(
														entryIndex,
														(e.currentTarget as HTMLInputElement).value
													)}
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
															'h-8 w-20',
															String(v.availableCount || '').trim() &&
																!v.sku.trim() &&
																'border-destructive'
														)}
														disabled={!v.sku.trim()}
													/>
													{#if String(v.availableCount || '').trim() && !v.sku.trim()}
														<p class="mt-0.5 text-xs text-destructive">SKU required</p>
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

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="product"
	entityTitle={(deleteItem as unknown as Product | null)?.title ??
		(deleteItem as unknown as Product | null)?.handle ??
		(deleteItem as unknown as Product | null)?.id ??
		''}
	onConfirm={() => confirmDelete((p) => deleteProducts([(p as unknown as Product).id]))}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
{#if deleteError}
	<div
		class="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
	>
		{deleteError}
	</div>
{/if}
