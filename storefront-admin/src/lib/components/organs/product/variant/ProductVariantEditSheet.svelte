<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	interface Props {
		open: boolean;
		options: { id: string; title: string }[];
		editVariantTitle: string;
		editVariantSize: string;
		editVariantMaterial: string;
		editVariantSku: string;
		editVariantEan: string;
		editVariantUpc: string;
		editVariantBarcode: string;
		editVariantPrice: string;
		editVariantError: string | null;
		editVariantSubmitting: boolean;
		onTitleChange: (v: string) => void;
		onSizeChange: (v: string) => void;
		onMaterialChange: (v: string) => void;
		onSkuChange: (v: string) => void;
		onEanChange: (v: string) => void;
		onUpcChange: (v: string) => void;
		onBarcodeChange: (v: string) => void;
		onPriceChange: (v: string) => void;
		onCancel: () => void;
		onSave: () => void;
	}

	let {
		open = $bindable(false),
		options,
		editVariantTitle,
		editVariantSize,
		editVariantMaterial,
		editVariantSku,
		editVariantEan,
		editVariantUpc,
		editVariantBarcode,
		editVariantPrice,
		editVariantError,
		editVariantSubmitting,
		onTitleChange,
		onSizeChange,
		onMaterialChange,
		onSkuChange,
		onEanChange,
		onUpcChange,
		onBarcodeChange,
		onPriceChange,
		onCancel,
		onSave
	}: Props = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Edit Variant</Sheet.Title>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-variant-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-variant-title"
							value={editVariantTitle}
							oninput={(e) => onTitleChange((e.currentTarget as HTMLInputElement).value)}
							class="h-9"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-variant-material" class="text-sm font-medium">
							Material <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<Input
							id="edit-variant-material"
							value={editVariantMaterial}
							oninput={(e) => onMaterialChange((e.currentTarget as HTMLInputElement).value)}
							class="h-9"
						/>
					</div>
					{#if options.length === 1}
						<div class="flex flex-col gap-2">
							<label for="edit-variant-option" class="text-sm font-medium"
								>{options[0]?.title ?? 'Option'}</label
							>
							<Input
								id="edit-variant-option"
								value={editVariantSize}
								oninput={(e) => onSizeChange((e.currentTarget as HTMLInputElement).value)}
								class="h-9"
							/>
						</div>
					{/if}
					<div class="flex flex-col gap-2">
						<p class="text-sm font-medium">Pricing</p>
						<div>
							<label for="edit-variant-price" class="text-xs text-muted-foreground"
								>Price EUR (Optional)</label
							>
							<div class="relative mt-1">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
									>€</span
								>
								<Input
									id="edit-variant-price"
									value={editVariantPrice}
									oninput={(e) => onPriceChange((e.currentTarget as HTMLInputElement).value)}
									type="number"
									step="0.01"
									min="0"
									placeholder="0.00"
									class="h-9 pl-8"
								/>
							</div>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<p class="text-sm font-medium">Stock & Inventory</p>
						<div class="grid gap-3">
							<div>
								<label for="edit-variant-sku" class="text-xs text-muted-foreground"
									>SKU (Optional)</label
								>
								<Input
									id="edit-variant-sku"
									value={editVariantSku}
									oninput={(e) => onSkuChange((e.currentTarget as HTMLInputElement).value)}
									class="h-9"
								/>
							</div>
							<div>
								<label for="edit-variant-ean" class="text-xs text-muted-foreground"
									>EAN (Optional)</label
								>
								<Input
									id="edit-variant-ean"
									value={editVariantEan}
									oninput={(e) => onEanChange((e.currentTarget as HTMLInputElement).value)}
									class="h-9"
								/>
							</div>
							<div>
								<label for="edit-variant-upc" class="text-xs text-muted-foreground"
									>UPC (Optional)</label
								>
								<Input
									id="edit-variant-upc"
									value={editVariantUpc}
									oninput={(e) => onUpcChange((e.currentTarget as HTMLInputElement).value)}
									class="h-9"
								/>
							</div>
							<div>
								<label for="edit-variant-barcode" class="text-xs text-muted-foreground"
									>Barcode (Optional)</label
								>
								<Input
									id="edit-variant-barcode"
									value={editVariantBarcode}
									oninput={(e) => onBarcodeChange((e.currentTarget as HTMLInputElement).value)}
									class="h-9"
								/>
							</div>
						</div>
					</div>
					{#if editVariantError}
						<p class="text-sm text-destructive">{editVariantError}</p>
					{/if}
				</div>
			</div>
			<Sheet.Footer class="flex flex-wrap items-center justify-end gap-2 border-t p-4">
				<div class="flex gap-2">
					<Button variant="outline" onclick={onCancel} disabled={editVariantSubmitting}>
						Cancel
					</Button>
					<Button onclick={onSave} disabled={editVariantSubmitting}>
						{editVariantSubmitting ? 'Saving…' : 'Save'}
					</Button>
				</div>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
