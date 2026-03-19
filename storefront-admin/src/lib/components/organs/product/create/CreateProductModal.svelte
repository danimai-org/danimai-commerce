<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { TableColumn } from '$lib/components/organs/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import Info from '@lucide/svelte/icons/info';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client.js';
	import { superForm } from 'sveltekit-superforms/client';
	import CreateProductStepDetails from './CreateProductStepDetails.svelte';
	import CreateProductStepAttributes from './CreateProductStepAttributes.svelte';
	import CreateProductStepOrganize from './CreateProductStepOrganize.svelte';
	import CreateProductStepVariants from './CreateProductStepVariants.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { get } from 'svelte/store';

	interface Props {
		open: boolean;
		productCreateForm: Record<string, unknown>;
		onSuccess?: () => void;
	}
	let { open = $bindable(false), productCreateForm: initialProductCreateForm, onSuccess }: Props = $props();

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

	const {
		form: createFormData,
		enhance: enhanceCreate,
		submitting: createSubmitting,
		errors: serverFieldErrors
	} = superForm(initialProductCreateForm as SuperValidated<Record<string, unknown>, any, Record<string, unknown>>, {
		resetForm: false,
		invalidateAll: false,
		dataType: 'json',
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				const data = result.data as { error?: string } | undefined;
				createError = data?.error ?? 'Failed to create product';
				submitPending = false;
			}
		},
		onUpdated: ({ form }) => {
			if (!submitPending) return;
			submitPending = false;
			if (form.valid) {
				createError = null;
				closeCreate();
				onSuccess?.();
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
	let createMediaModalOpen = $state(false);
	let createMediaImageUrl = $state('');
	let createMediaChosenFile = $state<File | null>(null);
	let createMediaFileInput = $state<HTMLInputElement | undefined>();
	let createMediaUrl = $state('');
	let createMediaFile = $state<File | null>(null);

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
	const variantStart = $derived(
		variantTotal === 0 ? 0 : (variantPage - 1) * variantLimit + 1
	);
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
	let attributesList = $state<
		{
			id: string;
			title: string;
			type: string;
			attribute_group_id?: string | null;
			product_attribute_group_id?: string | null;
			attributeGroupId?: string | null;
			attribute_group?: { id?: string | null } | null;
			product_attribute_group?: { id?: string | null } | null;
			group_id?: string | null;
		}[]
	>([]);
	let attributeGroupsList = $state<
		{ id: string; title: string; value?: string; name?: string }[]
	>([]);
	let salesChannelsList = $state<{ id: string; name: string }[]>([]);

	type CreateAttributeEntry = { attributeId: string; attributeTitle: string; value: string };
	let createAttributeGroupId = $state('');
	let createAttributeEntries = $state<CreateAttributeEntry[]>([]);

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
			i === index
				? {
						...e,
						attributeId: attributeId,
						attributeTitle:
							attr?.title ??
							(attr as { value?: string; name?: string } | undefined)?.value ??
							(attr as { value?: string; name?: string } | undefined)?.name ??
							''
					}
				: e
		);
		if (!createAttributeGroupId && attr) {
			const attributeGroupId = resolveAttributeGroupId(attr);
			if (attributeGroupId) {
				createAttributeGroupId = attributeGroupId;
			}
		}
	}

	function setAttributeEntryValue(entryIndex: number, value: string) {
		createAttributeEntries = createAttributeEntries.map((e, i) =>
			i === entryIndex ? { ...e, value } : e
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

	function resolveAttributeGroupId(attribute: {
		attribute_group_id?: string | null;
		product_attribute_group_id?: string | null;
		attributeGroupId?: string | null;
		attribute_group?: { id?: string | null } | null;
		product_attribute_group?: { id?: string | null } | null;
		group_id?: string | null;
	}): string {
		return (
			attribute.attribute_group_id ??
			attribute.product_attribute_group_id ??
			attribute.attributeGroupId ??
			attribute.attribute_group?.id ??
			attribute.product_attribute_group?.id ??
			attribute.group_id ??
			''
		).trim();
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
		createAttributeGroupId = '';
		createAttributeEntries = [];
		createMediaUrl = '';
		createMediaFile = null;
		createError = null;
		submitPending = false;
		variantSearch = '';
		variantPage = 1;
		syncVariantsFromOptions();
		const [
			collectionsResponse,
			categoriesResponse,
			tagsResponse,
			attributesResponse,
			attributeGroupsResponse,
			salesChannelsResponse
		] = await Promise.allSettled([
			client.collections.get({ query: listQuery }),
			client['product-categories'].get({ query: listQuery }),
			client['product-tags'].get({ query: listQuery }),
			client['product-attributes'].get({ query: listQuery }),
			client['product-attribute-groups'].get({ query: listQuery }),
			client['sales-channels'].get({ query: listQuery })
		]);

		collectionsList =
			collectionsResponse.status === 'fulfilled'
				? extractRows<{ id: string; title: string; handle: string }>(collectionsResponse.value)
				: [];
		categoriesList =
			categoriesResponse.status === 'fulfilled'
				? extractRows<{ id: string; value: string; handle: string }>(categoriesResponse.value)
				: [];
		tagsList =
			tagsResponse.status === 'fulfilled'
				? extractRows<{ id: string; value: string }>(tagsResponse.value)
				: [];
		attributesList =
			attributesResponse.status === 'fulfilled'
				? extractRows<
						{
							id: string;
							title?: string;
							value?: string;
							name?: string;
							type?: string;
							attribute_group_id?: string | null;
							product_attribute_group_id?: string | null;
							attributeGroupId?: string | null;
							attribute_group?: { id?: string | null } | null;
							product_attribute_group?: { id?: string | null } | null;
							group_id?: string | null;
						}
				  >(attributesResponse.value).map((row) => ({
						id: row.id,
						title: pickLabel(row),
						type: row.type ?? '',
						attribute_group_id: row.attribute_group_id,
						product_attribute_group_id: row.product_attribute_group_id,
						attributeGroupId: row.attributeGroupId,
						attribute_group: row.attribute_group,
						product_attribute_group: row.product_attribute_group,
						group_id: row.group_id
					}))
				: [];
		attributeGroupsList =
			attributeGroupsResponse.status === 'fulfilled'
				? extractRows<{ id: string; title?: string; value?: string; name?: string }>(
						attributeGroupsResponse.value
				  ).map((row) => ({
						id: row.id,
						title: pickLabel(row),
						value: row.value,
						name: row.name
					}))
				: [];

		const fetchedSalesChannels =
			salesChannelsResponse.status === 'fulfilled'
				? extractRows<{ id: string; name: string; is_default?: boolean }>(salesChannelsResponse.value)
				: [];
		salesChannelsList = fetchedSalesChannels.map((ch) => ({ id: ch.id, name: ch.name }));
		const defaultChannels = fetchedSalesChannels.filter((ch) => ch.is_default);
		if (defaultChannels.length > 0) {
			createSalesChannelIds = defaultChannels.map((ch) => ch.id);
		}
	}

	function closeCreate() {
		open = false;
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

	function addTag(tagId: string) {
		if (tagId && !createTagIds.includes(tagId)) {
			createTagIds = [...createTagIds, tagId];
		}
	}

	function removeTag(tagId: string) {
		createTagIds = createTagIds.filter((id) => id !== tagId);
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
				return {
					title: variant.title,
					options: variant.options,
					sku: variant.sku.trim() || undefined,
					available_count: availableCount ? parseInt(availableCount, 10) : undefined,
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
	const attributeGroupError = $derived(
		firstError(normalizedFieldErrors.attribute_group_id)
	);
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
		let effectiveAttributeGroupId = createAttributeGroupId.trim();
		if (hasAttributeEntries && !effectiveAttributeGroupId) {
			const inferredGroupIds = Array.from(
				new Set(
					selectedAttributeEntries
						.map((entry) => {
							const attr = attributesList.find((a) => a.id === entry.attributeId);
							return attr ? resolveAttributeGroupId(attr) : '';
						})
						.filter((id) => id.length > 0)
				)
			);
			if (inferredGroupIds.length === 1) {
				effectiveAttributeGroupId = inferredGroupIds[0];
				createAttributeGroupId = effectiveAttributeGroupId;
			}
		}
		if (hasAttributeEntries && !effectiveAttributeGroupId) {
			createError = 'Select an attribute group when setting attributes.';
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
				return {
					title: variant.title,
					options: variant.options,
					sku: variant.sku.trim() || undefined,
					available_count: availableCount ? parseInt(availableCount, 10) : undefined,
					allow_backorder: variant.allow_backorder,
					variant_rank: index,
					price_amount: variant.priceAmount.trim() || undefined
				};
			}),
			attribute_group_id: createAttributeGroupId,
			attributes: createAttributeEntries
				.filter((entry) => entry.attributeId && entry.value.trim())
				.map((entry) => ({
					attribute_id: entry.attributeId,
					value: entry.value.trim()
				}))
		});
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
								'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
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
								'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
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
								'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
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
								'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
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
				<div class="mx-4 mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6">
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
					bind:createMediaModalOpen
					bind:createMediaImageUrl
					bind:createMediaChosenFile
					bind:createMediaFileInput
					bind:createMediaUrl
					bind:createMediaFile
					onEnableVariants={syncVariantsFromOptions}
				/>
			{/if}

			{#if createStep === 2}
				<CreateProductStepAttributes
					bind:createAttributeGroupId
					{attributeGroupsList}
					{createAttributeEntries}
					{attributesList}
					{addAttributeEntry}
					{removeAttributeEntry}
					{setAttributeEntryAttribute}
					{setAttributeEntryValue}
					{attributeGroupError}
				/>
			{/if}

			{#if createStep === 3}
				<CreateProductStepOrganize
					bind:createDiscountable
					bind:createCollectionIds
					bind:createCategoryId
					bind:createTagIds
					bind:createSalesChannelIds
					
					collectionsList={collectionsList}
					categoriesList={categoriesList}
					tagsList={tagsList}
					salesChannelsList={salesChannelsList}
					addTag={addTag}
					removeTag={removeTag}
					addSalesChannel={(ids: string[]) => (createSalesChannelIds = ids)}
					removeSalesChannel={(id: string) =>
						(createSalesChannelIds = createSalesChannelIds.filter((channelId) => channelId !== id))}
					
				/>
			{/if}

			{#if createStep === 4}
				<CreateProductStepVariants
					{createHasVariants}
					bind:createOptions
					{displayedVariants}
					bind:variantSearch
					variantPagination={variantPagination}
					variantStart={variantStart}
					variantEnd={variantEnd}
					variantTableColumns={variantTableColumns}
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
			<input type="hidden" name="attribute_group_id" value={createAttributeGroupId} />
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
