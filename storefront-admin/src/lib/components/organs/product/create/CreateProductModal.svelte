<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { TableColumn } from '$lib/components/organs/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import Info from '@lucide/svelte/icons/info';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';
	import { client, postProductImages } from '$lib/client.js';
	import { superForm } from 'sveltekit-superforms/client';
	import CreateProductStepDetails from './CreateProductStepDetails.svelte';
	import CreateProductStepAttributes from './CreateProductStepAttributes.svelte';
	import CreateProductStepOrganize from './CreateProductStepOrganize.svelte';
	import CreateProductStepVariants from './CreateProductStepVariants.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { get } from 'svelte/store';
	import { type MediaUploadLocalItem } from '$lib/components/shared/media-upload.types.js';
	import { SvelteMap } from 'svelte/reactivity';

	interface Props {
		open: boolean;
		productCreateForm: Record<string, unknown>;
		onSuccess?: () => void;
	}
	let {
		open = $bindable(false),
		productCreateForm: initialProductCreateForm,
		onSuccess
	}: Props = $props();

	type ProductOption = { title: string; values: string[] };
	type ProductVariantForm = {
		title: string;
		options: Record<string, string>;
		sku: string;
		availableCount: string;
		manage_inventory: boolean;
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
				manage_inventory: true,
				allow_backorder: false,
				variant_rank: i,
				priceAmount: ''
			};
		});
	}

	let createStep = $state(1);
	let createError = $state<string | null>(null);
	let createFormElement = $state<HTMLFormElement | null>(null);
	let submitStatus = $state<'draft' | 'published'>('draft');
	let submitPending = $state(false);
	let createdProductId = $state<string | null>(null);

	async function uploadProductImages(productId: string, files: File[]) {
		if (!files.length) return [] as Array<{ id: string; url: string }>;
		const response = await postProductImages(productId, { files });

		if (!response.ok) {
			const payload = (await response.json().catch(() => null)) as { message?: string } | null;
			throw new Error(payload?.message ?? 'Failed to upload product images');
		}
		const payload = (await response.json()) as {
			uploaded?: Array<{ id: string; url: string }>;
		};
		return payload.uploaded ?? [];
	}

	const {
		form: createFormData,
		enhance: enhanceCreate,
		submitting: createSubmitting,
		errors: serverFieldErrors
	} = superForm(initialProductCreateForm as SuperValidated<Record<string, unknown>>, {
		resetForm: false,
		invalidateAll: false,
		dataType: 'json',
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				const data = result.data as { error?: string } | undefined;
				createError = data?.error ?? 'Failed to create product';
				createdProductId = null;
				submitPending = false;
			}
			if (result.type === 'success') {
				const data = result.data as { createdId?: string } | undefined;
				createdProductId = data?.createdId ?? null;
			}
		},
		onUpdated: async ({ form }) => {
			if (!submitPending) return;
			submitPending = false;
			if (form.valid) {
				try {
					if (!createdProductId && createMediaItems.length > 0) {
						throw new Error(
							'Product created but media upload could not start (missing product id).'
						);
					}
					if (createdProductId && createMediaItems.length > 0) {
						const expectedCount = createMediaItems.length;
						const uploaded = await uploadProductImages(
							createdProductId,
							createMediaItems.map((m: MediaUploadLocalItem) => m.file)
						);
						if (uploaded.length === 0) {
							throw new Error('Product created but no images were uploaded.');
						}
						if (uploaded.length < expectedCount) {
							throw new Error(
								`Product created but only ${uploaded.length} of ${expectedCount} images uploaded.`
							);
						}
						const res = await client.products({ id: createdProductId }).put({
							thumbnail_media_id: uploaded[0]?.id ?? null,
							media_ids: uploaded.map((item) => item.id)
						});
						if (res.error) {
							const err = res.error as { value?: { message?: string } };
							throw new Error(err?.value?.message ?? String(res.error));
						}
					}
					createError = null;
					closeCreate();
					onSuccess?.();
				} catch (error) {
					createError = error instanceof Error ? error.message : 'Failed to upload product media';
				}
				return;
			}
			createError = 'Please fix the highlighted fields and try again.';
		}
	});

	let createTitle = $state('');
	let createSubtitle = $state('');
	let createHandle = $state('');
	let createDescription = $state('');
	let createHasVariants = $state(true);
	let createMediaItems = $state<MediaUploadLocalItem[]>([]);

	let createDiscountable = $state(true);
	let createCollectionIds = $state<string[]>([]);
	let createCategoryId = $state('');
	let createTagIds = $state<string[]>([]);
	let createSalesChannelIds = $state<string[]>([]);

	let createOptions = $state<ProductOption[]>([]);
	let createVariants = $state<ProductVariantForm[]>([]);

	let variantSearch = $state('');
	let variantPage = $state(1);
	let variantLimit = $state(10);

	const filteredVariants = $derived(
		variantSearch.trim()
			? createVariants.filter((v) => {
					const q = variantSearch.toLowerCase();
					const title = (v.title ?? '').toLowerCase();
					const optionsStr = Object.values(v.options).join(' ').toLowerCase();
					const sku = (v.sku ?? '').toLowerCase();
					return title.includes(q) || optionsStr.includes(q) || sku.includes(q);
				})
			: createVariants
	);
	const displayedVariants = $derived(
		filteredVariants.slice((variantPage - 1) * variantLimit, variantPage * variantLimit)
	);
	const variantTotal = $derived(filteredVariants.length);
	const variantPagination = $derived({
		total: variantTotal,
		page: variantPage,
		limit: variantLimit,
		total_pages: Math.max(1, Math.ceil(variantTotal / variantLimit)),
		has_next_page: variantPage * variantLimit < variantTotal,
		has_previous_page: variantPage > 1
	} as PaginationMeta);
	const variantStart = $derived(variantTotal === 0 ? 0 : (variantPage - 1) * variantLimit + 1);
	const variantEnd = $derived(Math.min(variantPage * variantLimit, variantTotal));

	const variantTableColumns: TableColumn[] = [
		{ label: 'Option', key: 'option' },
		{ label: 'Title', key: 'title' },
		{ label: 'SKU', key: 'sku' },
		{ label: 'Available count', key: 'availableCount' },
		{ label: 'Manage inventory', key: 'manage_inventory' },
		{ label: 'Allow backorder', key: 'allow_backorder' },
		{ label: 'Price EUR', key: 'priceAmount' }
	];

	$effect(() => {
		const totalPages = Math.max(1, Math.ceil(variantTotal / variantLimit));
		if (variantPage > totalPages) variantPage = totalPages;
	});

	let collectionsList = $state<{ id: string; title: string; handle: string }[]>([]);
	let categoriesList = $state<{ id: string; value: string; handle: string }[]>([]);
	let tagsList = $state<{ id: string; value: string }[]>([]);
	let attributesList = $state<{ id: string; title: string; type: string; options: string[] }[]>([]);
	let attributesLoading = $state(false);
	let attributesLoadError = $state<string | null>(null);
	let salesChannelsList = $state<{ id: string; name: string }[]>([]);
	let collectionSearch = $state('');
	let categorySearch = $state('');
	let tagSearch = $state('');
	let salesChannelSearch = $state('');
	let debouncedCollectionSearch = $state('');
	let debouncedCategorySearch = $state('');
	let debouncedTagSearch = $state('');
	let debouncedSalesChannelSearch = $state('');
	let collectionsLoading = $state(false);
	let categoriesLoading = $state(false);
	let tagsLoading = $state(false);
	let salesChannelsLoading = $state(false);
	let collectionFetchGen = 0;
	let categoryFetchGen = 0;
	let tagFetchGen = 0;
	let salesChannelFetchGen = 0;

	type CreateAttributeEntry = { attributeId: string; attributeTitle: string; value: string };
	let createAttributeEntries = $state<CreateAttributeEntry[]>([]);
	let attributesFetchGen = 0;
	let previousCategoryId = $state('');
	const ORGANIZE_SEARCH_DEBOUNCE_MS = 350;
	const ORGANIZE_SEARCH_MIN_CHARS = 2;

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
						manage_inventory: ex.manage_inventory,
						allow_backorder: ex.allow_backorder,
						priceAmount: ex.priceAmount
					}
				: v;
		});
		variantPage = 1;
	}

	function setAttributeEntryValue(attributeId: string, value: string) {
		createAttributeEntries = createAttributeEntries.map((entry) =>
			entry.attributeId === attributeId ? { ...entry, value } : entry
		);
	}

	function extractRows<T>(response: unknown): T[] {
		const payload = (response as { data?: unknown } | null)?.data;
		if (!payload) return [];
		if (Array.isArray(payload)) return payload as T[];
		if (typeof payload !== 'object') return [];
		const record = payload as Record<string, unknown>;
		if (Array.isArray(record.rows)) return record.rows as T[];
		if (Array.isArray(record.data)) return record.data as T[];
		for (const value of Object.values(record)) {
			if (Array.isArray(value)) return value as T[];
		}
		return [];
	}

	function pickLabel(row: { title?: string; value?: string; name?: string }): string {
		return row.title ?? row.value ?? row.name ?? '';
	}

	function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
		const merged = new SvelteMap(existing.map((item) => [item.id, item] as const));
		for (const item of incoming) merged.set(item.id, item);
		return Array.from(merged.values());
	}

	const listQuery = createPaginationQuery({
		page: 1,
		limit: 100,
		search: '',
		sorting_field: 'created_at'
	}) as {
		search?: string;
		page?: string | number;
		limit?: string | number;
		sorting_field?: string;
	};

	function buildSearchQuery(search: string) {
		const normalized = search.trim();
		return {
			...listQuery,
			search: normalized || undefined
		};
	}

	async function fetchCollections(search: string, allowEmpty = false) {
		const query = search.trim();
		if (!allowEmpty && query.length < ORGANIZE_SEARCH_MIN_CHARS) {
			collectionsLoading = false;
			return;
		}
		const gen = ++collectionFetchGen;
		collectionsLoading = true;
		try {
			const res = await client.collections.get({ query: buildSearchQuery(query) });
			if (gen !== collectionFetchGen) return;
			const fetched = extractRows<{ id: string; title: string; handle?: string }>(res).map(
				(row) => ({
					id: row.id,
					title: row.title,
					handle: row.handle ?? ''
				})
			);
			collectionsList = mergeById(collectionsList, fetched);
		} catch {
			/* keep existing options */
		} finally {
			if (gen === collectionFetchGen) collectionsLoading = false;
		}
	}

	async function fetchCategories(search: string, allowEmpty = false) {
		const query = search.trim();
		if (!allowEmpty && query.length < ORGANIZE_SEARCH_MIN_CHARS) {
			categoriesLoading = false;
			return;
		}
		const gen = ++categoryFetchGen;
		categoriesLoading = true;
		try {
			const res = await client['product-categories'].get({ query: buildSearchQuery(query) });
			if (gen !== categoryFetchGen) return;
			const fetched = extractRows<{
				id: string;
				value?: string;
				title?: string;
				name?: string;
				handle?: string;
			}>(res).map((row) => ({
				id: row.id,
				value: pickLabel(row),
				handle: row.handle ?? ''
			}));
			categoriesList = mergeById(categoriesList, fetched);
		} catch {
			/* keep existing options */
		} finally {
			if (gen === categoryFetchGen) categoriesLoading = false;
		}
	}

	async function fetchTags(search: string, allowEmpty = false) {
		const query = search.trim();
		if (!allowEmpty && query.length < ORGANIZE_SEARCH_MIN_CHARS) {
			tagsLoading = false;
			return;
		}
		const gen = ++tagFetchGen;
		tagsLoading = true;
		try {
			const res = await client['product-tags'].get({ query: buildSearchQuery(query) });
			if (gen !== tagFetchGen) return;
			const fetched = extractRows<{ id: string; value: string }>(res);
			tagsList = mergeById(tagsList, fetched);
		} catch {
			/* keep existing options */
		} finally {
			if (gen === tagFetchGen) tagsLoading = false;
		}
	}

	async function fetchSalesChannels(search: string, allowEmpty = false) {
		const query = search.trim();
		if (!allowEmpty && query.length < ORGANIZE_SEARCH_MIN_CHARS) {
			salesChannelsLoading = false;
			return;
		}
		const gen = ++salesChannelFetchGen;
		salesChannelsLoading = true;
		try {
			const res = await client['sales-channels'].get({ query: buildSearchQuery(query) });
			if (gen !== salesChannelFetchGen) return;
			const fetched = extractRows<{ id: string; name: string }>(res);
			salesChannelsList = mergeById(salesChannelsList, fetched);
		} catch {
			/* keep existing options */
		} finally {
			if (gen === salesChannelFetchGen) salesChannelsLoading = false;
		}
	}

	async function init() {
		createStep = 1;
		createTitle = '';
		createSubtitle = '';
		createHandle = '';
		createDescription = '';
		createHasVariants = true;
		createDiscountable = true;
		createCollectionIds = [];
		createCategoryId = '';
		createTagIds = [];
		createSalesChannelIds = [];
		createOptions = [];
		createAttributeEntries = [];
		attributesList = [];
		attributesLoading = false;
		attributesLoadError = null;
		collectionsList = [];
		categoriesList = [];
		tagsList = [];
		salesChannelsList = [];
		collectionSearch = '';
		categorySearch = '';
		tagSearch = '';
		salesChannelSearch = '';
		debouncedCollectionSearch = '';
		debouncedCategorySearch = '';
		debouncedTagSearch = '';
		debouncedSalesChannelSearch = '';
		collectionsLoading = false;
		categoriesLoading = false;
		tagsLoading = false;
		salesChannelsLoading = false;
		collectionFetchGen = 0;
		categoryFetchGen = 0;
		tagFetchGen = 0;
		salesChannelFetchGen = 0;
		createMediaItems = [];
		createError = null;
		submitPending = false;
		createdProductId = null;
		variantSearch = '';
		variantPage = 1;
		previousCategoryId = '';
		attributesFetchGen = 0;
		syncVariantsFromOptions();
		attributesList = [];
	}

	function closeCreate() {
		open = false;
	}

	function isDetailsStepValid() {
		return createTitle.trim().length > 0;
	}

	$effect(() => {
		const categoryId = createCategoryId.trim();
		const changed = categoryId !== previousCategoryId;
		if (changed) {
			previousCategoryId = categoryId;
			createAttributeEntries = [];
			attributesList = [];
			attributesLoadError = null;
		}
		if (!categoryId) {
			attributesLoading = false;
			attributesLoadError = null;
			return;
		}
		const currentGen = ++attributesFetchGen;
		attributesLoading = true;
		void (async () => {
			try {
				const res = await client['product-attributes'].get({
					query: {
						...listQuery,
						filters: { category_id: categoryId }
					}
				});
				if (currentGen !== attributesFetchGen) return;
				const nextAttributes = extractRows<{
					id: string;
					title?: string;
					type?: string;
					options?: string[];
					values?: string[];
					metadata?: { options?: string[]; values?: string[] };
				}>(res).map((row) => ({
					id: row.id,
					title: pickLabel(row),
					type: row.type ?? 'text',
					options: row.options ?? row.values ?? row.metadata?.options ?? row.metadata?.values ?? []
				}));
				attributesList = nextAttributes;
				createAttributeEntries = nextAttributes.map((attribute) => ({
					attributeId: attribute.id,
					attributeTitle: attribute.title,
					value: ''
				}));
				attributesLoadError = null;
			} catch {
				if (currentGen !== attributesFetchGen) return;
				attributesList = [];
				createAttributeEntries = [];
				attributesLoadError = 'Failed to load attributes for this category.';
			} finally {
				if (currentGen === attributesFetchGen) attributesLoading = false;
			}
		})();
	});

	$effect(() => {
		const q = collectionSearch;
		const t = setTimeout(() => {
			debouncedCollectionSearch = q;
		}, ORGANIZE_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	});

	$effect(() => {
		const q = categorySearch;
		const t = setTimeout(() => {
			debouncedCategorySearch = q;
		}, ORGANIZE_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	});

	$effect(() => {
		const q = tagSearch;
		const t = setTimeout(() => {
			debouncedTagSearch = q;
		}, ORGANIZE_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	});

	$effect(() => {
		const q = salesChannelSearch;
		const t = setTimeout(() => {
			debouncedSalesChannelSearch = q;
		}, ORGANIZE_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	});

	$effect(() => {
		if (createStep !== 2) return;
		void fetchCollections(debouncedCollectionSearch);
	});

	$effect(() => {
		if (createStep !== 2) return;
		void fetchCategories(debouncedCategorySearch);
	});

	$effect(() => {
		if (createStep !== 2) return;
		void fetchTags(debouncedTagSearch);
	});

	$effect(() => {
		if (createStep !== 2) return;
		void fetchSalesChannels(debouncedSalesChannelSearch);
	});

	function goToStep2() {
		if (!isDetailsStepValid()) {
			createError = 'Title is required';
			return;
		}
		createError = null;
		createStep = 2;
	}

	function goToStep3() {
		if (!isDetailsStepValid()) {
			createError = 'Title is required';
			return;
		}
		if (!createCategoryId.trim()) {
			createError = 'Select a category before adding attributes.';
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

	const createTagIdsJson = $derived(JSON.stringify(createTagIds));
	const createCollectionIdsJson = $derived(JSON.stringify(createCollectionIds));
	const createSalesChannelIdsJson = $derived(JSON.stringify(createSalesChannelIds));
	const createOptionsJson = $derived(
		JSON.stringify(
			createOptions
				.filter((option) => option.title.trim() && option.values.length > 0)
				.map((option) => ({
					title: option.title.trim(),
					values: option.values.map((value) => value.trim())
				}))
		)
	);
	const createVariantsJson = $derived(
		JSON.stringify(
			createVariants.map((variant, index) => {
				const availableCount = String(variant.availableCount ?? '').trim();
				const optionValues = Object.entries(variant.options ?? {})
					.map(([title, value]) => ({
						title: title.trim(),
						value: String(value ?? '').trim()
					}))
					.filter((option) => option.title && option.value);
				return {
					title: variant.title,
					option_values: optionValues,
					sku: variant.sku.trim() || undefined,
					available_count: availableCount ? parseInt(availableCount, 10) : undefined,
					manage_inventory: variant.manage_inventory,
					allow_backorder: variant.allow_backorder,
					variant_rank: index,
					price_amount: variant.priceAmount.trim() || undefined
				};
			})
		)
	);
	const createAttributesJson = $derived(
		JSON.stringify(
			createAttributeEntries
				.filter((entry) => entry.attributeId && entry.value.trim())
				.map((entry) => ({
					attribute_id: entry.attributeId,
					value: entry.value.trim()
				}))
		)
	);

	function firstError(value: unknown): string | null {
		if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
		return null;
	}

	const normalizedFieldErrors = $derived(($serverFieldErrors ?? {}) as Record<string, unknown>);
	const titleError = $derived(firstError(normalizedFieldErrors.title));
	const categoryError = $derived(firstError(normalizedFieldErrors.category_id));
	const variantsError = $derived(firstError(normalizedFieldErrors.variants));

	function submitCreate(status: 'draft' | 'published') {
		createError = null;
		if (!createTitle.trim()) {
			createError = 'Title is required';
			return;
		}
		const selectedAttributeEntries = createAttributeEntries.filter(
			(entry) => entry.attributeId.trim() && entry.value.trim()
		);
		const hasAttributeEntries = selectedAttributeEntries.length > 0;
		if (hasAttributeEntries && !createCategoryId.trim()) {
			createError = 'Select a category when setting attributes.';
			return;
		}
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
		submitStatus = status;
		createFormData.set({
			...get(createFormData),
			title: createTitle,
			subtitle: createSubtitle,
			handle: createHandle,
			description: createDescription,
			status,
			discountable: createDiscountable,
			collection_ids: createCollectionIds,
			category_id: createCategoryId,
			tag_ids: createTagIds,
			sales_channel_ids: createSalesChannelIds,
			has_variants: createHasVariants,
			options: createOptions
				.filter((option) => option.title.trim() && option.values.length > 0)
				.map((option) => ({
					title: option.title.trim(),
					values: option.values.map((value) => value.trim())
				})),
			variants: createVariants.map((variant, index) => {
				const availableCount = String(variant.availableCount ?? '').trim();
				const optionValues = Object.entries(variant.options ?? {})
					.map(([title, value]) => ({
						title: title.trim(),
						value: String(value ?? '').trim()
					}))
					.filter((option) => option.title && option.value);
				return {
					title: variant.title,
					option_values: optionValues,
					sku: variant.sku.trim() || undefined,
					available_count: availableCount ? parseInt(availableCount, 10) : undefined,
					manage_inventory: variant.manage_inventory,
					allow_backorder: variant.allow_backorder,
					variant_rank: index,
					price_amount: variant.priceAmount.trim() || undefined
				};
			}),
			attributes: createAttributeEntries
				.filter((entry) => entry.attributeId && entry.value.trim())
				.map((entry) => ({
					attribute_id: entry.attributeId,
					value: entry.value.trim()
				})),
			thumbnail: undefined
		});
		createdProductId = null;
		submitPending = true;
		createFormElement?.requestSubmit();
	}

	let wasOpen = $state(false);
	$effect(() => {
		if (open && !wasOpen) {
			wasOpen = true;
			void init();
		}
		if (!open) wasOpen = false;
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-xl sm:max-w-2xl">
		<form
			method="POST"
			action="?/create"
			use:enhanceCreate
			bind:this={createFormElement}
			class="flex h-full min-h-0 flex-col"
		>
			<div class="shrink-0 border-b px-4 py-4 sm:px-6">
				<div class="-mx-1 overflow-x-auto px-1">
					<div class="flex min-w-max items-center gap-1">
						<button
							type="button"
							class={cn(
								'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
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
								'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
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
							Organize
						</button>
						<button
							type="button"
							class={cn(
								'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
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
							Attributes
						</button>
						<button
							type="button"
							class={cn(
								'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
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
				</div>
			</div>

			{#if createError && !$createSubmitting}
				<div
					class="mx-4 mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6"
				>
					{createError}
				</div>
			{/if}

			{#if createStep === 1}
				<CreateProductStepDetails
					bind:createTitle
					bind:createSubtitle
					bind:createHandle
					bind:createDescription
					{createError}
					{titleError}
					bind:createHasVariants
					bind:createMediaItems
					onEnableVariants={syncVariantsFromOptions}
				/>
			{/if}

			{#if createStep === 2}
				<CreateProductStepOrganize
					bind:createDiscountable
					bind:createCollectionIds
					bind:createCategoryId
					bind:createTagIds
					bind:createSalesChannelIds
					bind:salesChannelsList
					{collectionsLoading}
					{categoriesLoading}
					{tagsLoading}
					{salesChannelsLoading}
					onCollectionSearchChange={(value: string) => {
						collectionSearch = value;
					}}
					onCollectionOpenChange={(isOpen: boolean) => {
						if (!isOpen || collectionSearch.trim()) return;
						void fetchCollections('', true);
					}}
					onCategorySearchChange={(value: string) => {
						categorySearch = value;
					}}
					onCategoryOpenChange={(isOpen: boolean) => {
						if (!isOpen || categorySearch.trim()) return;
						void fetchCategories('', true);
					}}
					onTagSearchChange={(value: string) => {
						tagSearch = value;
					}}
					onTagOpenChange={(isOpen: boolean) => {
						if (!isOpen || tagSearch.trim()) return;
						void fetchTags('', true);
					}}
					onSalesChannelSearchChange={(value: string) => {
						salesChannelSearch = value;
					}}
					onSalesChannelOpenChange={(isOpen: boolean) => {
						if (!isOpen || salesChannelSearch.trim()) return;
						void fetchSalesChannels('', true);
					}}
					{collectionsList}
					{categoriesList}
					{tagsList}
				/>
			{/if}

			{#if createStep === 3}
				<CreateProductStepAttributes
					bind:createCategoryId
					{categoryError}
					{categoriesList}
					{createAttributeEntries}
					{attributesList}
					{attributesLoading}
					{attributesLoadError}
					{setAttributeEntryValue}
				/>
			{/if}

			{#if createStep === 4}
				<CreateProductStepVariants
					{createHasVariants}
					bind:createOptions
					{displayedVariants}
					bind:variantSearch
					{variantPagination}
					{variantStart}
					{variantEnd}
					{variantTableColumns}
					{addOption}
					{removeOption}
					{updateOptionTitle}
					{removeOptionValue}
					{addOptionValue}
					setVariantPage={(p) => (variantPage = p)}
					onEnableVariants={() => {
						createHasVariants = true;
						syncVariantsFromOptions();
					}}
					{variantsError}
				/>
			{/if}

			<input type="hidden" name="title" value={createTitle} />
			<input type="hidden" name="subtitle" value={createSubtitle} />
			<input type="hidden" name="handle" value={createHandle} />
			<input type="hidden" name="description" value={createDescription} />
			<input type="hidden" name="status" value={submitStatus} />
			<input type="hidden" name="discountable" value={String(createDiscountable)} />
			<input type="hidden" name="collection_ids" value={createCollectionIdsJson} />
			<input type="hidden" name="category_id" value={createCategoryId} />
			<input type="hidden" name="tag_ids" value={createTagIdsJson} />
			<input type="hidden" name="sales_channel_ids" value={createSalesChannelIdsJson} />
			<input type="hidden" name="has_variants" value={String(createHasVariants)} />
			<input type="hidden" name="options" value={createOptionsJson} />
			<input type="hidden" name="variants" value={createVariantsJson} />
			<input type="hidden" name="attributes" value={createAttributesJson} />

			<div class="flex shrink-0 flex-wrap justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={closeCreate}>Cancel</Button>
				{#if createStep === 1}
					<Button type="button" onclick={() => goToStep2()}>Continue</Button>
				{:else if createStep === 2}
					<Button type="button" variant="outline" onclick={() => (createStep = 1)}>Back</Button>
					<Button type="button" onclick={() => goToStep3()}>Continue</Button>
				{:else if createStep === 3}
					<Button type="button" variant="outline" onclick={() => (createStep = 2)}>Back</Button>
					<Button type="button" onclick={() => goToStep4()}>Continue</Button>
				{:else}
					<Button type="button" variant="outline" onclick={() => (createStep = 3)}>Back</Button>
					<Button
						type="button"
						variant="outline"
						disabled={$createSubmitting}
						onclick={() => submitCreate('draft')}
					>
						Save as draft
					</Button>
					<Button
						type="button"
						disabled={$createSubmitting}
						onclick={() => submitCreate('published')}
					>
						Publish
					</Button>
				{/if}
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
