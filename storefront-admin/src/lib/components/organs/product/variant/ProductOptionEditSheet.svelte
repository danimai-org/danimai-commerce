<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		PaginationTable,
		TableHead,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import type { VariantEditRow } from './generate-variants-from-option-drafts.js';
	import RegionPriceCell from './RegionPriceCell.svelte';
	import type { RegionPriceColumn } from './region-prices.js';
	import X from '@lucide/svelte/icons/x';

	export type OptionEditDraft = {
		id: string;
		title: string;
		values: string[];
	};

	type Props = {
		open: boolean;
		optionDrafts: OptionEditDraft[];
		displayedVariants?: VariantEditRow[];
		variantSearch?: string;
		variantPagination: PaginationMeta;
		variantStart: number;
		variantEnd: number;
		variantTableColumns: TableColumn[];
		regions?: RegionPriceColumn[];
		submitting?: boolean;
		error?: string | null;
		onOptionTitleChange: (optionId: string, value: string) => void;
		onAddOptionValue: (optionId: string, value: string) => void;
		onRemoveOptionValue: (optionId: string, value: string) => void;
		onRemoveOption: (optionId: string) => void;
		onAddOption: () => void;
		onVariantPageChange: (page: number) => void;
		onCancel: () => void;
		onSave: () => void;
	};

	let {
		open = $bindable(false),
		optionDrafts = [],
		displayedVariants = [],
		variantSearch = $bindable(''),
		variantPagination,
		variantStart,
		variantEnd,
		variantTableColumns,
		regions = [],
		submitting = false,
		error = null,
		onOptionTitleChange,
		onAddOptionValue,
		onRemoveOptionValue,
		onRemoveOption,
		onAddOption,
		onVariantPageChange,
		onCancel,
		onSave
	}: Props = $props();

</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex w-full flex-col sm:max-w-4xl">
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title class="sr-only">Options & Variants</Sheet.Title>
		</Sheet.Header>

		<div class="flex min-h-0 flex-1 flex-col overflow-auto p-6">
			<h2 class="text-lg font-semibold">Edit Options & Variants</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Define options and variant details. This ranking will affect the variants' order in your
				storefront.
			</p>

			{#if error}
				<p class="mt-2 text-sm text-destructive">{error}</p>
			{/if}

			<div class="mt-6">
				<div class="flex flex-wrap items-start justify-between gap-2">
					<div>
						<h3 class="text-sm font-medium">Product options</h3>
						<p class="text-xs text-muted-foreground">
							Define the options for the product, e.g. color, size, etc.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={submitting}
						onclick={onAddOption}
					>
						Add
					</Button>
				</div>

				<div class="mt-4 flex flex-col gap-4">
					{#each optionDrafts as draft (draft.id)}
							<div class="flex flex-col gap-2 rounded-md border p-3">
								<div class="flex items-center gap-2">
									<Input
										placeholder="Title (e.g. Size)"
										class="h-8 flex-1"
										value={draft.title}
										disabled={submitting}
										oninput={(e) =>
											onOptionTitleChange(draft.id, (e.currentTarget as HTMLInputElement).value)}
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										class="size-8 shrink-0"
										disabled={submitting}
										onclick={() => onRemoveOption(draft.id)}
									>
										<X class="size-4" />
									</Button>
								</div>
								<div class="flex flex-wrap items-center gap-1.5">
									{#each draft.values as val (val)}
										<span
											class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-sm"
										>
											{val}
											<button
												type="button"
												class="rounded p-0.5 hover:bg-muted"
												disabled={submitting}
												onclick={() => onRemoveOptionValue(draft.id, val)}
											>
												<X class="size-3" />
											</button>
										</span>
									{/each}
									<div class="inline-flex">
										<Input
											placeholder="Add value"
											class="h-7 w-24"
											disabled={submitting}
											onblur={(e) => {
												const input = e.currentTarget as HTMLInputElement;
												onAddOptionValue(draft.id, input.value);
												input.value = '';
											}}
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													const input = e.currentTarget as HTMLInputElement;
													onAddOptionValue(draft.id, input.value);
													input.value = '';
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
				<p class="text-xs text-muted-foreground">
					Edit title, SKU, inventory, and price per variant.
				</p>
				<PaginationTable
					bind:searchQuery={variantSearch}
					searchPlaceholder="Search variants"
					showFilter={false}
					showSort={false}
					showToolbar={true}
				>
					<div class="mt-2 min-h-0 flex-1 overflow-x-auto rounded-lg border bg-card">
						<table class="w-full min-w-[720px] text-sm">
							<TableHead columns={variantTableColumns} />
							<tbody>
								{#if displayedVariants.length === 0}
									<tr>
										<td
											colspan={variantTableColumns.length}
											class="px-4 py-8 text-center text-muted-foreground"
										>
											{optionDrafts.some((d) => d.values.length > 0)
												? 'No variants match your search.'
												: 'Add option values to generate variants.'}
										</td>
									</tr>
								{:else}
									{#each displayedVariants as row (row.key)}
										<tr class="border-b last:border-0">
											<td class="px-3 py-2 text-muted-foreground">
												{Object.values(row.options).join(' / ') || row.title}
											</td>
											<td class="px-3 py-2">
												<Input bind:value={row.title} class="h-8 w-full min-w-[100px]" />
											</td>
											<td class="px-3 py-2">
												<Input bind:value={row.sku} placeholder="SKU" class="h-8 w-24" />
											</td>
											<td class="px-3 py-2">
												<input
													type="checkbox"
													bind:checked={row.manage_inventory}
													class="rounded border-input"
												/>
											</td>
											<td class="px-3 py-2">
												<input
													type="checkbox"
													bind:checked={row.allow_backorder}
													class="rounded border-input"
												/>
											</td>
											{#each regions as region (region.id)}
												<td class="px-3 py-2">
													<RegionPriceCell
														bind:value={row.regionPrices[region.id]}
														symbol={region.currency_symbol}
													/>
												</td>
											{/each}
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
					<TablePagination
						pagination={variantPagination}
						start={variantStart}
						end={variantEnd}
						onPageChange={onVariantPageChange}
					/>
				</PaginationTable>
			</div>
		</div>

		<Sheet.Footer class="border-t p-4">
			<div class="flex w-full justify-end gap-2">
				<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>
				<Button onclick={onSave} disabled={submitting}>
					{submitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
