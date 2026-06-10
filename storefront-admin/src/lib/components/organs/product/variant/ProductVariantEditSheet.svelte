<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { client } from '$lib/client.js';
	import { getVariantOptionEntries } from './variant-option-entries.js';
	import RegionPriceCell from './RegionPriceCell.svelte';
	import {
		createEmptyRegionPrices,
		mapPricesToRegionPrices,
		type RegionPriceColumn
	} from './region-prices.js';
	import type { ProductVariantUpdateFormData } from '$lib/components/organs/product/product-detail-forms.js';

	type VariantRow = {
		id: string;
		title?: string | null;
		sku?: string | null;
		ean?: string | null;
		upc?: string | null;
		barcode?: string | null;
		manage_inventory?: boolean;
		options?: Array<{ id: string; title: string; value: string; rank: number }>;
	};

	interface Props {
		open: boolean;
		productVariantUpdateForm: SuperValidated<ProductVariantUpdateFormData>;
		options: { id: string; title: string }[];
		variant: VariantRow | null;
		regions?: RegionPriceColumn[];
		variantPricesByVariantId?: Map<string, Map<string, string>>;
		onSaved?: () => void | Promise<void>;
	}

	let {
		open = $bindable(false),
		productVariantUpdateForm,
		options,
		variant = null,
		regions = [],
		variantPricesByVariantId = new Map<string, Map<string, string>>(),
		onSaved = () => {}
	}: Props = $props();

	let apiError = $state<string | null>(null);
	let initializedKey = $state<string | null>(null);
	let regionPrices = $state<Record<string, string>>({});

	const initKey = $derived(
		variant?.id ? `${variant.id}:${regions.map((region) => region.id).join(',')}` : ''
	);

	const optionRefs = $derived(options.map((o) => ({ id: o.id, title: o.title })));

	// svelte-ignore state_referenced_locally
	const { form, enhance, delayed, reset } = superForm(productVariantUpdateForm, {
		resetForm: false,
		invalidateAll: false,
		onResult: async ({ result }) => {
			if (result.type === 'failure') {
				const d = result.data as { error?: string } | undefined;
				apiError = d?.error ?? null;
				return;
			}
			if (result.type === 'error') {
				apiError =
					result.error instanceof Error
						? result.error.message
						: String(result.error ?? 'Something went wrong');
				return;
			}
			if (result.type === 'success') {
				apiError = null;
				open = false;
				await onSaved();
			}
		}
	});

	$effect(() => {
		$form.region_prices_json = JSON.stringify(regionPrices);
	});

	function parseOptionValues(): Record<string, string> {
		try {
			const parsed = JSON.parse($form.option_values_json || '{}') as unknown;
			return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
				? (parsed as Record<string, string>)
				: {};
		} catch {
			return {};
		}
	}

	function buildVariantTitleFromOptions(values: Record<string, string>): string {
		if (optionRefs.length === 0) return $form.title.trim();
		if (optionRefs.length === 1) {
			return (values[optionRefs[0]?.id ?? ''] ?? '').trim();
		}
		return optionRefs
			.map((opt) => (values[opt.id] ?? '').trim())
			.filter(Boolean)
			.join(' / ');
	}

	function setOptionValue(optionId: string, value: string) {
		const next = { ...parseOptionValues(), [optionId]: value };
		$form.option_values_json = JSON.stringify(next);
		$form.title = buildVariantTitleFromOptions(next);
	}

	function populateOptionValues(currentVariant: VariantRow): Record<string, string> {
		const entries = getVariantOptionEntries(currentVariant, optionRefs);
		return Object.fromEntries(
			optionRefs.map((opt) => {
				const entry = entries.find(
					(e) => e.optionTitle.toLowerCase() === opt.title.toLowerCase()
				);
				return [opt.id, entry?.value ?? ''];
			})
		);
	}

	$effect(() => {
		if (!open || !variant?.id || regions.length === 0) {
			initializedKey = null;
			return;
		}
		if (initializedKey === initKey) return;

		void (async () => {
			initializedKey = initKey;
			apiError = null;

			let nextRegionPrices = createEmptyRegionPrices(regions);
			const cachedPrices = variantPricesByVariantId.get(variant.id);
			if (cachedPrices) {
				nextRegionPrices = mapPricesToRegionPrices(
					Array.from(cachedPrices.entries()).map(([currency_code, amount]) => ({
						currency_code,
						amount
					})),
					regions
				);
			}

			let material = '';
			let manageInventory = variant.manage_inventory ?? true;
			try {
				const res = await client['product-variants']({ id: variant.id }).get();
				if (!res.error && res.data) {
					manageInventory = res.data.manage_inventory ?? manageInventory;
					nextRegionPrices = mapPricesToRegionPrices(res.data.prices, regions);
					const metadata = res.data.metadata;
					if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
						const value = (metadata as Record<string, unknown>).material;
						if (typeof value === 'string') material = value;
					}
				}
			} catch {
				// use row defaults
			}

			regionPrices = nextRegionPrices;
			const optionValues = populateOptionValues(variant);
			reset({
				data: {
					id: variant.id,
					title: variant.title ?? '',
					material,
					sku: variant.sku ?? '',
					ean: variant.ean ?? '',
					upc: variant.upc ?? '',
					barcode: variant.barcode ?? '',
					region_prices_json: JSON.stringify(nextRegionPrices),
					option_values_json: JSON.stringify(optionValues),
					manage_inventory: manageInventory
				}
			});
			$form.title = buildVariantTitleFromOptions(optionValues);
		})();
	});

	function closeSheet() {
		if ($delayed) return;
		open = false;
		apiError = null;
	}

	function onOpenChange(next: boolean) {
		if (!next) {
			apiError = null;
			initializedKey = null;
		}
	}
</script>

<Sheet.Root bind:open {onOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<form action="?/updateVariant" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			{#if options.length > 0}
				<input type="hidden" name="title" bind:value={$form.title} />
			{/if}
			<input type="hidden" name="option_values_json" bind:value={$form.option_values_json} />
			<input type="hidden" name="region_prices_json" bind:value={$form.region_prices_json} />
			<input
				type="hidden"
				name="manage_inventory"
				value={$form.manage_inventory ? 'true' : 'false'}
			/>
			<div class="flex h-full flex-col">
				<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
					<Sheet.Title>Edit Variant</Sheet.Title>
				</Sheet.Header>
				<div class="min-h-0 flex-1 overflow-auto p-6">
					<div class="flex flex-col gap-4">
						{#if apiError}
							<p class="text-sm text-destructive">{apiError}</p>
						{/if}
						{#if options.length > 0}
							<div class="flex flex-col gap-2">
								<p class="text-sm font-medium">Options</p>
								<div class="grid gap-3">
									{#each options as option (option.id)}
										<div>
											<label
												for="edit-variant-option-{option.id}"
												class="text-xs text-muted-foreground"
											>
												{option.title}
											</label>
											<Input
												id="edit-variant-option-{option.id}"
												value={parseOptionValues()[option.id] ?? ''}
												oninput={(e) =>
													setOptionValue(
														option.id,
														(e.currentTarget as HTMLInputElement).value
													)}
												class="mt-1 h-9"
											/>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="flex flex-col gap-2">
								<label for="edit-variant-title" class="text-sm font-medium">Title</label>
								<Input
									id="edit-variant-title"
									name="title"
									bind:value={$form.title}
									class="h-9"
								/>
							</div>
						{/if}
						<div class="flex flex-col gap-2">
							<label for="edit-variant-material" class="text-sm font-medium">
								Material <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-variant-material"
								name="material"
								bind:value={$form.material}
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<p class="text-sm font-medium">Pricing</p>
							<div class="grid gap-3">
								{#each regions as region (region.id)}
									<div>
										<label
											for="edit-variant-price-{region.id}"
											class="text-xs text-muted-foreground"
										>
											Price {region.name} (Optional)
										</label>
										<div class="mt-1">
											<RegionPriceCell
												bind:value={regionPrices[region.id]}
												symbol={region.currency_symbol}
												class="h-9 pl-8"
											/>
										</div>
									</div>
								{/each}
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<p class="text-sm font-medium">Stock & Inventory</p>
							<div class="flex items-center gap-2">
								<input
									id="edit-variant-manage-inventory"
									type="checkbox"
									bind:checked={$form.manage_inventory}
									class="size-4 rounded border-input"
								/>
								<label for="edit-variant-manage-inventory" class="text-sm font-medium">
									Manage inventory
								</label>
							</div>
							<div class="grid gap-3">
								<div>
									<label for="edit-variant-sku" class="text-xs text-muted-foreground"
										>SKU (Optional)</label
									>
									<Input id="edit-variant-sku" name="sku" bind:value={$form.sku} class="h-9" />
								</div>
								<div>
									<label for="edit-variant-ean" class="text-xs text-muted-foreground"
										>EAN (Optional)</label
									>
									<Input id="edit-variant-ean" name="ean" bind:value={$form.ean} class="h-9" />
								</div>
								<div>
									<label for="edit-variant-upc" class="text-xs text-muted-foreground"
										>UPC (Optional)</label
									>
									<Input id="edit-variant-upc" name="upc" bind:value={$form.upc} class="h-9" />
								</div>
								<div>
									<label for="edit-variant-barcode" class="text-xs text-muted-foreground"
										>Barcode (Optional)</label
									>
									<Input
										id="edit-variant-barcode"
										name="barcode"
										bind:value={$form.barcode}
										class="h-9"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
				<Sheet.Footer class="flex flex-wrap items-center justify-end gap-2 border-t p-4">
					<div class="flex gap-2">
						<Button type="button" variant="outline" onclick={closeSheet} disabled={!!$delayed}>
							Cancel
						</Button>
						<Button type="submit" disabled={!!$delayed}>
							{$delayed ? 'Saving…' : 'Save'}
						</Button>
					</div>
				</Sheet.Footer>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
