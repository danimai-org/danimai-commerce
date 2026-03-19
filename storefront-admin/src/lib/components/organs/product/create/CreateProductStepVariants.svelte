<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		PaginationTable,
		TableHead,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

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

	let {
		createHasVariants = true,
		variantsError = null as string | null,
		createOptions = $bindable([] as ProductOption[]),
		displayedVariants = [] as ProductVariantForm[],
		variantSearch = $bindable(''),
		variantPagination,
		variantStart,
		variantEnd,
		variantTableColumns,
		addOption,
		removeOption,
		updateOptionTitle,
		removeOptionValue,
		addOptionValue,
		setVariantPage,
		onEnableVariants
	}: {
		createHasVariants: boolean;
		variantsError: string | null;
		createOptions: ProductOption[];
		displayedVariants: ProductVariantForm[];
		variantSearch: string;
		variantPagination: PaginationMeta;
		variantStart: number;
		variantEnd: number;
		variantTableColumns: TableColumn[];
		addOption: () => void;
		removeOption: (index: number) => void;
		updateOptionTitle: (optIndex: number, title: string) => void;
		removeOptionValue: (optIndex: number, valIndex: number) => void;
		addOptionValue: (optIndex: number, value: string) => void;
		setVariantPage: (page: number) => void;
		onEnableVariants: () => void;
	} = $props();
</script>

<div class="flex-1 overflow-auto p-4 pt-4 sm:p-6 sm:pt-4">
	<h2 class="text-lg font-semibold">Variants</h2>
	{#if createHasVariants}
		<p class="mt-1 text-sm text-muted-foreground">
			Define options and variant details. This ranking will affect the variants' order in your storefront.
		</p>
		{#if variantsError}
			<p class="mt-2 text-sm text-destructive">{variantsError}</p>
		{/if}
		<div class="mt-6">
			<div class="flex flex-wrap items-start justify-between gap-2">
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
								oninput={(e) => updateOptionTitle(optIndex, (e.target as HTMLInputElement).value)}
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
								<span class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-sm">
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
							<div class="inline-flex gap-1">
								<Input
									placeholder="Add value"
									class="h-7 w-24"
									onblur={(e) => {
										const input = e.currentTarget as HTMLInputElement;
										addOptionValue(optIndex, input.value);
										input.value = '';
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											const t = e.target as HTMLInputElement;
											addOptionValue(optIndex, t.value);
											t.value = '';
										}
									}}
								/>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div class="mt-6">
			<h3 class="text-sm font-medium">Product variants</h3>
			<p class="text-xs text-muted-foreground">Edit title, SKU, inventory, and price per variant.</p>
			<PaginationTable
				bind:searchQuery={variantSearch}
				searchPlaceholder="Search variants"
				showFilter={false}
				showSort={false}
				showToolbar={true}
			>
				<div class="mt-2 min-h-0 flex-1 overflow-x-auto rounded-lg border bg-card">
					<table class="min-w-[720px] w-full text-sm">
						<TableHead columns={variantTableColumns} />
						<tbody>
							{#each displayedVariants as v (v.variant_rank)}
								<tr class="border-b last:border-0">
									<td class="px-3 py-2 text-muted-foreground">{Object.values(v.options).join(' / ')}</td>
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
												String(v.availableCount || '').trim() && !v.sku.trim() && 'border-destructive'
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
											bind:checked={v.manage_inventory}
											class="rounded border-input"
										/>
									</td>
									<td class="px-3 py-2">
										<input type="checkbox" bind:checked={v.allow_backorder} class="rounded border-input" />
									</td>
									<td class="px-3 py-2">
										<div class="relative w-20">
											<span class="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-muted-foreground">
												€
											</span>
											<Input bind:value={v.priceAmount} type="text" placeholder="0" class="h-8 pl-6" />
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<TablePagination
					pagination={variantPagination}
					start={variantStart}
					end={variantEnd}
					onPageChange={(p) => setVariantPage(p)}
				/>
			</PaginationTable>
		</div>
	{:else}
		<p class="mt-2 text-sm text-muted-foreground">A default variant will be created when you save.</p>
		<div class="mt-4">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={onEnableVariants}
			>
				Enable variants
			</Button>
		</div>
	{/if}
</div>
