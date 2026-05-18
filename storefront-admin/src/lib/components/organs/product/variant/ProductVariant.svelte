<script lang="ts">
	import ProductDetailVariantsSection from './ProductDetailVariantsSection.svelte';
	import ProductOptionEditSheet, {
		type OptionEditDraft
	} from './ProductOptionEditSheet.svelte';
	import ProductVariantEditSheet from './ProductVariantEditSheet.svelte';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import { getDetailContext } from '$lib/hooks';
	import { buildReplaceVariantsPayload } from './build-replace-variants-payload.js';
	import { deriveProductOptionsFromVariants } from './derive-product-options.js';
	import { getVariantOptionEntries } from './variant-option-entries.js';
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

	let optionEditOpen = $state(false);
	let optionEditDrafts = $state<OptionEditDraft[]>([]);
	let optionEditSubmitting = $state(false);
	let optionEditError = $state<string | null>(null);
	const variantPricesMap = new SvelteMap<string, string>();

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
		editVariantSize =
			options.length === 1 && entries[0]?.value ? entries[0].value : '';

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

	function openEditOptionSheet() {
		if (options.length === 0) return;
		optionEditDrafts = options.map((option) => ({
			id: option.id,
			title: option.title ?? '',
			variationsInput: extractOptionValues(option).join(', ')
		}));
		optionEditError = null;
		optionEditOpen = true;
	}

	function updateOptionDraftTitle(optionId: string, title: string) {
		optionEditDrafts = optionEditDrafts.map((draft) =>
			draft.id === optionId ? { ...draft, title } : draft
		);
	}

	function updateOptionDraftVariations(optionId: string, variationsInput: string) {
		optionEditDrafts = optionEditDrafts.map((draft) =>
			draft.id === optionId ? { ...draft, variationsInput } : draft
		);
	}

	function removeVariationChip(optionId: string, value: string) {
		const normalized = value.trim().toLowerCase();
		optionEditDrafts = optionEditDrafts.map((draft) => {
			if (draft.id !== optionId) return draft;
			return {
				...draft,
				variationsInput: draft.variationsInput
					.split(',')
					.map((v) => v.trim())
					.filter((v) => v && v.toLowerCase() !== normalized)
					.join(', ')
			};
		});
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
					values: draft.variationsInput
						.split(',')
						.map((v) => v.trim())
						.filter(Boolean)
				})),
				existingVariants: loadedVariants,
				priceCentsByVariantId: variantPricesMap
			});
			await postReplaceProductVariants(payload);

			await detailQuery?.refetch?.();
			await loadVariants();
			optionEditOpen = false;
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
	variants={variants.map((variant) => ({
		id: variant.id,
		title: variant.title ?? ''
	}))}
	submitting={optionEditSubmitting}
	error={optionEditError}
	onOptionTitleChange={updateOptionDraftTitle}
	onVariationsInputChange={updateOptionDraftVariations}
	onRemoveVariation={removeVariationChip}
	onCancel={() => {
		if (!optionEditSubmitting) optionEditOpen = false;
	}}
	onSave={saveOptionEdit}
/>

<ProductVariantEditSheet
	bind:open={editVariantOpen}
	options={optionRefs}
	editVariantTitle={editVariantTitle}
	editVariantSize={editVariantSize}
	editVariantMaterial={editVariantMaterial}
	editVariantSku={editVariantSku}
	editVariantEan={editVariantEan}
	editVariantUpc={editVariantUpc}
	editVariantBarcode={editVariantBarcode}
	editVariantPrice={editVariantPrice}
	editVariantError={editVariantError}
	editVariantSubmitting={editVariantSubmitting}
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
