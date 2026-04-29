<script lang="ts">
	import ProductDetailVariantsSection from './ProductDetailVariantsSection.svelte';
	import ProductOptionEditSheet from './ProductOptionEditSheet.svelte';
	import { getDetailContext } from '$lib/hooks';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { client } from '$lib/client.js';
	type ProductOptionValue = { id?: string; value?: string };
	type ProductOption = {
		id: string;
		title: string;
		product_id: string | null;
		values?: ProductOptionValue[];
	};
	type ProductVariant = {
		id: string;
		title: string;
		sku: string | null;
		product_id: string | null;
		thumbnail?: string | null;
		manage_inventory: boolean;
		allow_backorder?: boolean;
		created_at?: string;
		updated_at?: string;
	};

	const detailQuery = getDetailContext<Record<string, unknown>>();
	const product = $derived((detailQuery?.data as Record<string, unknown> | null) ?? null);
	const options = $derived(
		((product?.options as ProductOption[] | undefined) ?? []).filter(Boolean)
	);
	const variants = $derived(
		((product?.variants as ProductVariant[] | undefined) ?? []).filter(Boolean)
	);

	let optionEditOpen = $state(false);
	let optionTitle = $state('');
	let optionVariationsInput = $state('');
	let editingOptionId = $state('');
	let optionEditSubmitting = $state(false);
	let optionEditError = $state<string | null>(null);
	const variantPricesMap = new SvelteMap<string, string>();

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
		const target = options[0];
		if (!target) return;
		editingOptionId = target.id;
		optionTitle = target.title ?? '';
		optionVariationsInput = extractOptionValues(target).join(', ');
		optionEditError = null;
		optionEditOpen = true;
	}

	function removeVariationChip(value: string) {
		const normalized = value.trim().toLowerCase();
		optionVariationsInput = optionVariationsInput
			.split(',')
			.map((v) => v.trim())
			.filter((v) => v && v.toLowerCase() !== normalized)
			.join(', ');
	}

	async function loadVariantPrices() {
		const updatedMap = new SvelteMap<string, string>();
		for (const variant of variants) {
			try {
				const res = (await client.admin['product-variants']({
					id: variant.id
				}).get()) as Response & {
					data: {
						prices?: Array<{ amount: string; currency_code: string }>;
					};
				};
				if (!res.ok || !res.data) continue;
				const eurPrice = res.data.prices?.find(
					(p) => p.currency_code?.toLowerCase() === 'eur'
				)?.amount;
				if (eurPrice) updatedMap.set(variant.id, eurPrice);
			} catch {
				// keep rendering without price
			}
		}
	}

	$effect(() => {
		if (variants.length > 0) loadVariantPrices();
		else variantPricesMap.clear();
	});

	async function saveOptionEdit() {
		if (!editingOptionId || optionEditSubmitting) return;
		optionEditSubmitting = true;
		optionEditError = null;
		try {
			const values = optionVariationsInput
				.split(',')
				.map((v) => v.trim())
				.filter(Boolean);
			const response = await client.admin['product-options']({ id: editingOptionId }).put({
				title: optionTitle.trim(),
				values
			});

			if (response.error) {
				const text = await response.text();
				throw new Error(text || 'Failed to update option');
			}

			await detailQuery?.refetch?.();
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
	onEditVariant={() => {}}
	onDeleteVariant={() => {}}
	onEditOptionsAndVariants={openEditOptionSheet}
/>

<ProductOptionEditSheet
	bind:open={optionEditOpen}
	{optionTitle}
	variationsInput={optionVariationsInput}
	submitting={optionEditSubmitting}
	error={optionEditError}
	onOptionTitleChange={(value) => (optionTitle = value)}
	onVariationsInputChange={(value) => (optionVariationsInput = value)}
	onRemoveVariation={removeVariationChip}
	onCancel={() => {
		if (!optionEditSubmitting) optionEditOpen = false;
	}}
	onSave={saveOptionEdit}
/>
