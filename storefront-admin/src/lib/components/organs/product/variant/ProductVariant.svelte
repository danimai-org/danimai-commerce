<script lang="ts">
	import ProductDetailVariantsSection from './ProductDetailVariantsSection.svelte';
	import ProductOptionEditSheet, { type OptionEditDraft } from './ProductOptionEditSheet.svelte';
	import ProductVariantEditSheet from './ProductVariantEditSheet.svelte';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import { getDetailContext } from '$lib/hooks';
	import {
		buildReplaceVariantsPayload,
		optionValuesKey
	} from './build-replace-variants-payload.js';
	import { deriveProductOptionsFromVariants } from './derive-product-options.js';
	import {
		generateVariantEditRowsFromOptionDrafts,
		type VariantEditRow
	} from './generate-variants-from-option-drafts.js';
	import { normalizeOptionValue, valuesInclude } from './option-draft-utils.js';
	import { getVariantOptionEntries } from './variant-option-entries.js';
	import type { TableColumn } from '$lib/components/organs/index.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { client, deleteProductVariants, postReplaceProductVariants } from '$lib/client.js';

	type ProductOptionValue = { id?: string; value?: string };
	type ProductOption = {
		id: string;
		title: string;
		product_id: string | null;
		values?: ProductOptionValue[];
	};
	type ProductVariantRow = NonNullable<
		NonNullable<Awaited<ReturnType<(typeof client)['product-variants']['get']>>['data']>['rows']
	>[number];

	const detailQuery = getDetailContext<Record<string, unknown>>();
	const product = $derived((detailQuery?.data as Record<string, unknown> | null) ?? null);
	const productId = $derived(typeof product?.id === 'string' ? product.id : '');

	let loadedVariants = $state<ProductVariantRow[]>([]);
	let variantsLoading = $state(false);

	const options = $derived.by(() => {
		const fromVariants = deriveProductOptionsFromVariants(loadedVariants);
		if (fromVariants.length > 0) return fromVariants;
		return ((product?.options as ProductOption[] | undefined) ?? []).filter(Boolean);
	});

	const variants = $derived(loadedVariants);

	type OptionValueOverride = { optionId: string; title: string; values: string[] };

	let optionEditOpen = $state(false);
	let optionEditDrafts = $state<OptionEditDraft[]>([]);
	let optionValueOverrides = $state<OptionValueOverride[] | null>(null);
	let variantEditRows = $state<VariantEditRow[]>([]);
	let variantSearch = $state('');
	let variantPage = $state(1);
	const variantLimit = 10;
	let optionEditSubmitting = $state(false);
	let optionEditError = $state<string | null>(null);
	const variantPricesMap = new SvelteMap<string, string>();

	const variantTableColumns: TableColumn[] = [
		{ label: 'Option', key: 'option' },
		{ label: 'Title', key: 'title' },
		{ label: 'SKU', key: 'sku' },
		{ label: 'Manage inventory', key: 'manage_inventory' },
		{ label: 'Allow backorder', key: 'allow_backorder' },
		{ label: 'Price EUR', key: 'priceAmount' }
	];

	let variantToDelete = $state<ProductVariantRow | null>(null);
	let deleteVariantOpen = $state(false);
	let deleteVariantSubmitting = $state(false);
	let deleteVariantError = $state<string | null>(null);

	let editVariantOpen = $state(false);
	let editingVariant = $state<ProductVariantRow | null>(null);
	let editVariantTitle = $state('');
	let editVariantSize = $state('');
	let editVariantMaterial = $state('');
	let editVariantSku = $state('');
	let editVariantEan = $state('');
	let editVariantUpc = $state('');
	let editVariantBarcode = $state('');
	let editVariantPrice = $state('');
	let editVariantError = $state<string | null>(null);
	let editVariantSubmitting = $state(false);

	const optionRefs = $derived(options.map((o) => ({ id: o.id, title: o.title })));

	function variantFromRow(row: Record<string, unknown>): ProductVariantRow | undefined {
		const id = String(row.id ?? '');
		return variants.find((v) => v.id === id);
	}

	function handleDeleteVariant(row: Record<string, unknown>) {
		const variant = variantFromRow(row);
		if (!variant) return;
		variantToDelete = variant;
		deleteVariantError = null;
		deleteVariantOpen = true;
	}

	function closeDeleteVariant() {
		if (deleteVariantSubmitting) return;
		deleteVariantOpen = false;
		variantToDelete = null;
		deleteVariantError = null;
	}

	async function openEditVariantSheet(variant: ProductVariantRow) {
		editingVariant = variant;
		editVariantTitle = variant.title ?? '';
		editVariantSku = variant.sku ?? '';
		editVariantEan = variant.ean ?? '';
		editVariantUpc = variant.upc ?? '';
		editVariantBarcode = variant.barcode ?? '';
		editVariantMaterial = '';
		editVariantPrice = '';
		editVariantError = null;

		const entries = getVariantOptionEntries(variant, optionRefs);
		editVariantSize = options.length === 1 && entries[0]?.value ? entries[0].value : '';

		const cachedPrice = variantPricesMap.get(variant.id);
		if (cachedPrice) {
			editVariantPrice = (parseFloat(cachedPrice) / 100).toString();
		}

		try {
			const res = await client['product-variants']({ id: variant.id }).get();
			if (!res.error && res.data) {
				const eurPrice = res.data.prices?.find(
					(p) => p.currency_code?.toLowerCase() === 'eur'
				)?.amount;
				if (eurPrice) {
					editVariantPrice = (parseFloat(eurPrice) / 100).toFixed(2);
				}
				const metadata = res.data.metadata;
				if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
					const material = (metadata as Record<string, unknown>).material;
					if (typeof material === 'string') editVariantMaterial = material;
				}
			}
		} catch {
			// use row defaults
		}

		editVariantOpen = true;
	}

	function handleEditVariant(row: Record<string, unknown>) {
		const variant = variantFromRow(row);
		if (variant) void openEditVariantSheet(variant);
	}

	function closeEditVariantSheet() {
		if (editVariantSubmitting) return;
		editVariantOpen = false;
		editingVariant = null;
		editVariantError = null;
	}

	async function submitEditVariant() {
		const variant = editingVariant;
		if (!variant?.id || editVariantSubmitting) return;
		editVariantSubmitting = true;
		editVariantError = null;
		try {
			let finalTitle = editVariantTitle.trim() || variant.title;
			if (options.length === 1 && editVariantSize.trim()) {
				finalTitle = editVariantSize.trim();
			}

			const trimmedSku = editVariantSku.trim();
			const trimmedBarcode = editVariantBarcode.trim();
			const body = {
				title: finalTitle,
				...(trimmedSku ? { sku: trimmedSku } : {}),
				barcode: trimmedBarcode || null,
				ean: editVariantEan.trim() || null,
				upc: editVariantUpc.trim() || null,
				allow_backorder: variant.allow_backorder ?? false,
				manage_inventory: variant.manage_inventory,
				...(editVariantMaterial.trim()
					? { metadata: { material: editVariantMaterial.trim() } }
					: {})
			};

			const response = await client['product-variants']({ id: variant.id }).put(body);
			if (response.error) {
				const err = response.error as { value?: { message?: string } };
				throw new Error(err.value?.message ?? 'Failed to update variant');
			}

			closeEditVariantSheet();
			await detailQuery?.refetch?.();
			await loadVariants();
		} catch (error) {
			editVariantError = error instanceof Error ? error.message : String(error);
		} finally {
			editVariantSubmitting = false;
		}
	}

	async function confirmDeleteVariant() {
		const variant = variantToDelete;
		if (!variant?.id) return;
		deleteVariantSubmitting = true;
		deleteVariantError = null;
		try {
			await deleteProductVariants([variant.id]);
			deleteVariantOpen = false;
			variantToDelete = null;
			await detailQuery?.refetch?.();
			await loadVariants();
		} catch (error) {
			deleteVariantError = error instanceof Error ? error.message : String(error);
		} finally {
			deleteVariantSubmitting = false;
		}
	}

	async function loadVariants() {
		if (!productId) {
			loadedVariants = [];
			return;
		}
		variantsLoading = true;
		try {
			const res = await client['product-variants'].get({
				query: { filters: { product_id: productId }, limit: '100', page: 1 }
			});
			if (res.error) {
				loadedVariants = [];
				return;
			}
			loadedVariants = (res.data?.rows ?? []).filter(Boolean);
		} catch {
			loadedVariants = [];
		} finally {
			variantsLoading = false;
		}
	}

	function extractOptionValues(option: ProductOption): string[] {
		if (Array.isArray(option.values) && option.values.length > 0) {
			return option.values.map((v) => (v?.value ?? '').trim()).filter(Boolean);
		}

		const optionIndex = options.findIndex((o) => o.id === option.id);
		if (optionIndex === -1) return [];
		const values = new SvelteSet<string>();
		for (const variant of variants) {
			const parts = (variant.title ?? '')
				.split('/')
				.map((p) => p.trim())
				.filter(Boolean);
			if (parts[optionIndex]) values.add(parts[optionIndex]);
		}
		return Array.from(values);
	}

	/** Values already represented by a loaded variant row for this option. */
	function getInUseValuesForOption(option: ProductOption): string[] {
		const inUse = new SvelteSet<string>();
		const optionTitleNorm = (option.title ?? '').trim().toLowerCase();
		const optionIndex = options.findIndex((o) => o.id === option.id);

		for (const variant of variants) {
			const entries = getVariantOptionEntries(variant, optionRefs);
			const entry = entries.find((e) => e.optionTitle.toLowerCase() === optionTitleNorm);
			if (entry?.value) {
				const normalized = normalizeOptionValue(entry.value);
				if (normalized) inUse.add(normalized);
				continue;
			}
			if (options.length === 1) {
				const title = normalizeOptionValue(variant.title ?? '');
				if (title) inUse.add(title);
			} else if (optionIndex >= 0) {
				const parts = (variant.title ?? '')
					.split('/')
					.map((p) => p.trim())
					.filter(Boolean);
				if (parts[optionIndex]) inUse.add(normalizeOptionValue(parts[optionIndex]));
			}
		}
		return Array.from(inUse);
	}

	function isValueBlockedForOption(optionId: string, raw: string): boolean {
		const value = normalizeOptionValue(raw);
		if (!value) return true;
		const draft = optionEditDrafts.find((d) => d.id === optionId);
		if (draft && valuesInclude(draft.values, value)) return true;
		const option = options.find((o) => o.id === optionId);
		if (!option) return false;
		return valuesInclude(getInUseValuesForOption(option), value);
	}

	const filteredVariantRows = $derived(
		variantSearch.trim()
			? variantEditRows.filter((row) => {
					const q = variantSearch.toLowerCase();
					return (
						row.title.toLowerCase().includes(q) ||
						Object.values(row.options).join(' ').toLowerCase().includes(q) ||
						row.sku.toLowerCase().includes(q)
					);
				})
			: variantEditRows
	);
	const variantTotal = $derived(filteredVariantRows.length);
	const variantPagination = $derived({
		total: variantTotal,
		page: variantPage,
		limit: variantLimit,
		total_pages: Math.max(1, Math.ceil(variantTotal / variantLimit)),
		has_next_page: variantPage * variantLimit < variantTotal,
		has_previous_page: variantPage > 1
	});
	const displayedVariantRows = $derived(
		filteredVariantRows.slice((variantPage - 1) * variantLimit, variantPage * variantLimit)
	);
	const variantStart = $derived(variantTotal === 0 ? 0 : (variantPage - 1) * variantLimit + 1);
	const variantEnd = $derived(Math.min(variantPage * variantLimit, variantTotal));

	function syncVariantEditRowsFromDrafts() {
		const generated = generateVariantEditRowsFromOptionDrafts(optionEditDrafts);
		const draftOptionRefs = optionEditDrafts.map((d) => ({ id: d.id, title: d.title }));
		const existingByKey = new SvelteMap<string, ProductVariantRow>();
		const priorByKey = new SvelteMap(variantEditRows.map((row) => [row.key, row]));

		for (const variant of loadedVariants) {
			const entries = getVariantOptionEntries(variant, draftOptionRefs);
			let key = optionValuesKey(entries.map((e) => ({ title: e.optionTitle, value: e.value })));
			if (!key && optionEditDrafts.length === 1) {
				const title = (variant.title ?? '').trim();
				const optionTitle = optionEditDrafts[0]?.title?.trim() ?? '';
				if (title && optionTitle) {
					key = optionValuesKey([{ title: optionTitle, value: title }]);
				}
			}
			if (key) existingByKey.set(key, variant);
		}

		variantEditRows = generated.map((row, index) => {
			const existing = existingByKey.get(row.key);
			const prior = priorByKey.get(row.key);
			const priceCents = existing ? variantPricesMap.get(existing.id) : undefined;
			let priceAmount = prior?.priceAmount ?? '';
			if (!priceAmount && priceCents) {
				priceAmount = (parseFloat(priceCents) / 100).toFixed(2);
			}
			return {
				...row,
				variant_rank: index,
				title: prior?.title ?? row.title,
				sku: prior?.sku ?? existing?.sku ?? '',
				manage_inventory: prior?.manage_inventory ?? existing?.manage_inventory ?? true,
				allow_backorder: prior?.allow_backorder ?? existing?.allow_backorder ?? false,
				priceAmount
			};
		});
	}

	function syncDisplayOverridesFromDrafts() {
		optionValueOverrides = optionEditDrafts.map((draft) => ({
			optionId: draft.id,
			title: draft.title,
			values: [...draft.values]
		}));
	}

	function clearOptionDisplayOverrides() {
		optionValueOverrides = null;
	}

	function openEditOptionSheet() {
		optionEditDrafts =
			options.length > 0
				? options.map((option) => ({
						id: option.id,
						title: option.title ?? '',
						values: extractOptionValues(option)
					}))
				: [];
		variantSearch = '';
		variantPage = 1;
		syncVariantEditRowsFromDrafts();
		syncDisplayOverridesFromDrafts();
		optionEditError = null;
		optionEditOpen = true;
	}

	function addOptionDraft() {
		optionEditDrafts = [
			...optionEditDrafts,
			{ id: `new-${crypto.randomUUID()}`, title: '', values: [] }
		];
		syncVariantEditRowsFromDrafts();
		syncDisplayOverridesFromDrafts();
		optionEditError = null;
	}

	function removeOptionDraft(optionId: string) {
		optionEditDrafts = optionEditDrafts.filter((draft) => draft.id !== optionId);
		syncVariantEditRowsFromDrafts();
		syncDisplayOverridesFromDrafts();
	}

	function updateOptionDraftTitle(optionId: string, title: string) {
		optionEditDrafts = optionEditDrafts.map((draft) =>
			draft.id === optionId ? { ...draft, title } : draft
		);
		syncVariantEditRowsFromDrafts();
		syncDisplayOverridesFromDrafts();
	}

	function addOptionDraftValue(optionId: string, raw: string) {
		const value = normalizeOptionValue(raw);
		if (!value || isValueBlockedForOption(optionId, value)) return;
		let changed = false;
		optionEditDrafts = optionEditDrafts.map((draft) => {
			if (draft.id !== optionId) return draft;
			if (valuesInclude(draft.values, value)) return draft;
			changed = true;
			return { ...draft, values: [...draft.values, value] };
		});
		if (changed) {
			syncVariantEditRowsFromDrafts();
			syncDisplayOverridesFromDrafts();
		}
	}

	function removeOptionDraftValue(optionId: string, value: string) {
		const normalized = normalizeOptionValue(value).toLowerCase();
		if (!normalized) return;
		let changed = false;
		optionEditDrafts = optionEditDrafts.map((draft) => {
			if (draft.id !== optionId) return draft;
			const nextValues = draft.values.filter(
				(v) => normalizeOptionValue(v).toLowerCase() !== normalized
			);
			if (nextValues.length === draft.values.length) return draft;
			changed = true;
			return { ...draft, values: nextValues };
		});
		if (changed) {
			syncVariantEditRowsFromDrafts();
			syncDisplayOverridesFromDrafts();
		}
	}

	function setVariantEditPage(page: number) {
		variantPage = Math.max(1, Math.min(variantPagination.total_pages, page));
	}

	$effect(() => {
		void variantSearch;
		variantPage = 1;
	});

	$effect(() => {
		if (variantPage > variantPagination.total_pages) {
			variantPage = Math.max(1, variantPagination.total_pages);
		}
	});

	function closeOptionEditSheet() {
		if (optionEditSubmitting) return;
		optionEditOpen = false;
		clearOptionDisplayOverrides();
	}

	async function loadVariantPrices() {
		variantPricesMap.clear();
		for (const variant of variants) {
			try {
				const res = await client['product-variants']({ id: variant.id }).get();
				if (res.error || !res.data) continue;
				const eurPrice = res.data.prices?.find(
					(p) => p.currency_code?.toLowerCase() === 'eur'
				)?.amount;
				if (eurPrice) variantPricesMap.set(variant.id, eurPrice);
			} catch {
				// keep rendering without price
			}
		}
	}

	$effect(() => {
		const id = productId;
		if (!id) {
			loadedVariants = [];
			return;
		}
		loadVariants();
	});

	$effect(() => {
		if (variants.length > 0) {
			loadVariantPrices();
		} else {
			variantPricesMap.clear();
		}
	});

	$effect(() => {
		if (!optionEditOpen && optionValueOverrides !== null) {
			clearOptionDisplayOverrides();
		}
	});

	async function saveOptionEdit() {
		if (!productId || optionEditSubmitting || optionEditDrafts.length === 0) return;
		optionEditSubmitting = true;
		optionEditError = null;
		try {
			const payload = buildReplaceVariantsPayload({
				productId,
				optionDrafts: optionEditDrafts.map((draft) => ({
					id: draft.id,
					title: draft.title,
					values: draft.values.map((v) => normalizeOptionValue(v)).filter(Boolean)
				})),
				existingVariants: loadedVariants,
				priceCentsByVariantId: variantPricesMap,
				variantEditRows
			});
			await postReplaceProductVariants(payload);

			await detailQuery?.refetch?.();
			await loadVariants();
			optionEditOpen = false;
			clearOptionDisplayOverrides();
		} catch (error) {
			optionEditError = error instanceof Error ? error.message : String(error);
		} finally {
			optionEditSubmitting = false;
		}
	}
</script>

<ProductDetailVariantsSection
	{variants}
	{options}
	{optionValueOverrides}
	{variantPricesMap}
	loading={variantsLoading}
	onEditVariant={handleEditVariant}
	onDeleteVariant={handleDeleteVariant}
	onEditOptionsAndVariants={openEditOptionSheet}
/>

<DeleteConfirmationModal
	bind:open={deleteVariantOpen}
	entityName="variant"
	entityTitle={variantToDelete?.title ?? ''}
	submitting={deleteVariantSubmitting}
	error={deleteVariantError}
	onConfirm={confirmDeleteVariant}
	onCancel={closeDeleteVariant}
/>

<ProductOptionEditSheet
	bind:open={optionEditOpen}
	optionDrafts={optionEditDrafts}
	displayedVariants={displayedVariantRows}
	bind:variantSearch
	{variantPagination}
	{variantStart}
	{variantEnd}
	{variantTableColumns}
	submitting={optionEditSubmitting}
	error={optionEditError}
	onOptionTitleChange={updateOptionDraftTitle}
	onAddOptionValue={addOptionDraftValue}
	onRemoveOptionValue={removeOptionDraftValue}
	onRemoveOption={removeOptionDraft}
	onAddOption={addOptionDraft}
	onVariantPageChange={setVariantEditPage}
	onCancel={closeOptionEditSheet}
	onSave={saveOptionEdit}
/>

<ProductVariantEditSheet
	bind:open={editVariantOpen}
	options={optionRefs}
	{editVariantTitle}
	{editVariantSize}
	{editVariantMaterial}
	{editVariantSku}
	{editVariantEan}
	{editVariantUpc}
	{editVariantBarcode}
	{editVariantPrice}
	{editVariantError}
	{editVariantSubmitting}
	onTitleChange={(value) => (editVariantTitle = value)}
	onSizeChange={(value) => (editVariantSize = value)}
	onMaterialChange={(value) => (editVariantMaterial = value)}
	onSkuChange={(value) => (editVariantSku = value)}
	onEanChange={(value) => (editVariantEan = value)}
	onUpcChange={(value) => (editVariantUpc = value)}
	onBarcodeChange={(value) => (editVariantBarcode = value)}
	onPriceChange={(value) => (editVariantPrice = value)}
	onCancel={closeEditVariantSheet}
	onSave={submitEditVariant}
/>
