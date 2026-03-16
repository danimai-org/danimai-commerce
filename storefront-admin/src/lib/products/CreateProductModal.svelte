<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { TableColumn } from '$lib/components/organs/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import Info from '@lucide/svelte/icons/info';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client.js';
	import type { Product } from './types.js';
	import CreateProductStepDetails from './create-product-modal/CreateProductStepDetails.svelte';
	import CreateProductStepAttributes from './create-product-modal/CreateProductStepAttributes.svelte';
	import CreateProductStepOrganize from './create-product-modal/CreateProductStepOrganize.svelte';
	import CreateProductStepVariants from './create-product-modal/CreateProductStepVariants.svelte';

	interface Props {
		open: boolean;
		onSuccess?: () => void;
	}
	let { open = $bindable(false), onSuccess }: Props = $props();

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

	let createStep = $state(1);
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

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
	let createCollectionId = $state('');
	let createCategoryId = $state('');
	let createTagIds = $state<string[]>([]);
	let createSalesChannels = $state<{ id: string; name: string }[]>([]);
	let createSalesChannelInput = $state('');

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
	let attributesList = $state<{ id: string; title: string; type: string }[]>([]);
	let attributeGroupsList = $state<{ id: string; title: string }[]>([]);
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
			i === index ? { ...e, attributeId: attributeId, attributeTitle: attr?.title ?? '' } : e
		);
	}

	function setAttributeEntryValue(entryIndex: number, value: string) {
		createAttributeEntries = createAttributeEntries.map((e, i) =>
			i === entryIndex ? { ...e, value } : e
		);
	}

	function extractRows<T>(response: unknown): T[] {
		const payload = (response as { data?: { rows?: T[]; data?: T[] } | T[] } | null)?.data;
		if (Array.isArray(payload)) return payload;
		if (Array.isArray(payload?.rows)) return payload.rows;
		if (Array.isArray(payload?.data)) return payload.data;
		return [];
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
				? extractRows<{ id: string; title: string; type: string }>(attributesResponse.value)
				: [];
		attributeGroupsList =
			attributeGroupsResponse.status === 'fulfilled'
				? extractRows<{ id: string; title: string }>(attributeGroupsResponse.value)
				: [];

		const fetchedSalesChannels =
			salesChannelsResponse.status === 'fulfilled'
				? extractRows<{ id: string; name: string; is_default?: boolean }>(salesChannelsResponse.value)
				: [];
		salesChannelsList = fetchedSalesChannels.map((ch) => ({ id: ch.id, name: ch.name }));
		const defaultChannels = fetchedSalesChannels.filter((ch) => ch.is_default);
		if (defaultChannels.length > 0) {
			createSalesChannels = defaultChannels.map((ch) => ({ id: ch.id, name: ch.name }));
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
			onSuccess?.();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
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

<Dialog.Root bind:open>
	<Dialog.Content class="h-full w-full">
		<div class="flex h-full flex-col">
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

			{#if createStep === 1}
				<CreateProductStepDetails
					bind:createTitle
					bind:createSubtitle
					bind:createHandle
					bind:createDescription
					{createError}
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
				/>
			{/if}

			{#if createStep === 3}
				<CreateProductStepOrganize
					bind:createDiscountable
					bind:createCollectionId
					bind:createCategoryId
					{createTagIds}
					{createSalesChannels}
					bind:createSalesChannelInput
					{collectionsList}
					{categoriesList}
					{tagsList}
					{salesChannelsList}
					{addTag}
					{removeTag}
					{addSalesChannel}
					{removeSalesChannel}
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
				/>
			{/if}

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
