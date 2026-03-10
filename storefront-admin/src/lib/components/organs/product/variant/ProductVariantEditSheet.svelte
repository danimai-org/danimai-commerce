<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';
	import type { EditVariantAttribute } from './useProductVariant.svelte.js';
	import type { AvailableAttribute } from './useProductVariant.svelte.js';

	interface Props {
		open: boolean;
		options: { id: string; title: string }[];
		editVariantAttributes: EditVariantAttribute[];
		availableAttributesList: AvailableAttribute[];
		editVariantTitle: string;
		editVariantSize: string;
		editVariantMaterial: string;
		editVariantSku: string;
		editVariantEan: string;
		editVariantUpc: string;
		editVariantBarcode: string;
		editVariantManageInventory: boolean;
		editVariantAllowBackorder: boolean;
		editVariantPrice: string;
		editVariantError: string | null;
		editVariantSubmitting: boolean;
		editVariantAddAttributeId: string;
		onTitleChange: (v: string) => void;
		onSizeChange: (v: string) => void;
		onMaterialChange: (v: string) => void;
		onSkuChange: (v: string) => void;
		onEanChange: (v: string) => void;
		onUpcChange: (v: string) => void;
		onBarcodeChange: (v: string) => void;
		onManageInventoryChange: (v: boolean) => void;
		onAllowBackorderChange: (v: boolean) => void;
		onPriceChange: (v: string) => void;
		onAddAttributeIdChange: (v: string) => void;
		onAttributeValueChange: (attrId: string, value: string) => void;
		onRemoveAttribute: (attrId: string) => void;
		onAddAttribute: () => void;
		onCancel: () => void;
		onSave: () => void;
	}

	let { open = $bindable(false), options, editVariantAttributes, availableAttributesList, editVariantTitle, editVariantSize, editVariantMaterial, editVariantSku, editVariantEan, editVariantUpc, editVariantBarcode, editVariantManageInventory, editVariantAllowBackorder, editVariantPrice, editVariantError, editVariantSubmitting, editVariantAddAttributeId, onTitleChange, onSizeChange, onMaterialChange, onSkuChange, onEanChange, onUpcChange, onBarcodeChange, onManageInventoryChange, onAllowBackorderChange, onPriceChange, onAddAttributeIdChange, onAttributeValueChange, onRemoveAttribute, onAddAttribute, onCancel, onSave }: Props = $props();
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
								<span
									class="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
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
					<div class="flex flex-col gap-2">
						<p class="text-sm font-medium">Attributes</p>
						<p class="text-xs text-muted-foreground">
							Values default from product attributes; variant overrides when set. Changes are
							saved as variant attribute values.
						</p>
						<div class="space-y-3 text-sm">
							{#each editVariantAttributes as attr (attr.id)}
								<div class="flex items-end gap-2">
									<div class="min-w-0 flex-1">
										<label
											for="edit-variant-attr-{attr.id}"
											class="font-medium text-muted-foreground">{attr.title}</label
										>
										<Input
											id="edit-variant-attr-{attr.id}"
											class="mt-1 h-9"
											value={attr.value}
											oninput={(e) =>
												onAttributeValueChange(attr.id, (e.currentTarget as HTMLInputElement).value)}
										/>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
										onclick={() => onRemoveAttribute(attr.id)}
										aria-label="Remove attribute"
									>
										<X class="size-4" />
									</Button>
								</div>
							{/each}
							<div class="flex items-end gap-2 pt-1">
								<select
									class="flex h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
									value={editVariantAddAttributeId}
									onchange={(e) =>
										onAddAttributeIdChange((e.currentTarget as HTMLSelectElement).value)}
									aria-label="Add attribute"
								>
									<option value="">Add attribute…</option>
									{#each availableAttributesList.filter((a) => !editVariantAttributes.some((e) => e.id === a.id)) as att (att.id)}
										<option value={att.id}>{att.title}</option>
									{/each}
								</select>
								<Button
									type="button"
									variant="outline"
									size="sm"
									class="shrink-0"
									onclick={onAddAttribute}
									disabled={!editVariantAddAttributeId}
								>
									Add
								</Button>
							</div>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<button
								type="button"
								role="switch"
								aria-checked={editVariantManageInventory}
								aria-label="Manage inventory"
								class={cn(
									'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
									editVariantManageInventory ? 'bg-primary' : 'bg-input'
								)}
								onclick={() => onManageInventoryChange(!editVariantManageInventory)}
							>
								<span
									class={cn(
										'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
										editVariantManageInventory ? 'translate-x-5' : 'translate-x-px'
									)}
								></span>
							</button>
							<span class="text-sm font-medium">Manage inventory</span>
						</div>
						<p class="text-xs text-muted-foreground">
							When enabled, we'll change the inventory quantity for you when orders and
							returns are created.
						</p>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<button
								type="button"
								role="switch"
								aria-checked={editVariantAllowBackorder}
								aria-label="Allow backorders"
								class={cn(
									'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
									editVariantAllowBackorder ? 'bg-primary' : 'bg-input'
								)}
								onclick={() => onAllowBackorderChange(!editVariantAllowBackorder)}
							>
								<span
									class={cn(
										'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
										editVariantAllowBackorder ? 'translate-x-5' : 'translate-x-px'
									)}
								></span>
							</button>
							<span class="text-sm font-medium">Allow backorders</span>
						</div>
						<p class="text-xs text-muted-foreground">
							When enabled, customers can purchase the variant even if there's no available
							quantity.
						</p>
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
