<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	interface ProductVariantsTableRow {
		key: string;
		optionTitle: string;
		title: string;
		sku: string;
		manage_inventory: boolean;
		allow_backorder: boolean;
		priceAmount: string;
	}


	let { rows = $bindable([]), updateRow = $bindable((key: string, updates: Partial<ProductVariantsTableRow>) => {}) }: { rows: ProductVariantsTableRow[]; updateRow: (key: string, updates: Partial<ProductVariantsTableRow>) => void } = $props();
</script>

<div class="mt-6">
	<h3 class="text-sm font-medium">Product variants</h3>
	<p class="text-xs text-muted-foreground">
		Edit title, SKU, inventory, and price per variant.
	</p>
	<div class="mt-2 overflow-auto rounded-lg border">
		<table class="w-full text-sm">
			<thead class="border-b bg-muted/50">
				<tr>
					<th class="px-3 py-2 text-left font-medium">Option</th>
					<th class="px-3 py-2 text-left font-medium">Title</th>
					<th class="px-3 py-2 text-left font-medium">SKU</th>
					<th class="px-3 py-2 text-left font-medium">Managed inventory</th>
					<th class="px-3 py-2 text-left font-medium">Allow backorder</th>
					<th class="px-3 py-2 text-left font-medium">Price EUR</th>
				</tr>
			</thead>
			<tbody>
				{#if rows.length === 0}
					<tr>
						<td colspan="6" class="px-3 py-8 text-center text-muted-foreground">
							Add options and values above to generate variants.
						</td>
					</tr>
				{:else}
					{#each rows as row (row.key)}
						<tr class="border-b last:border-0">
							<td class="px-3 py-2 text-muted-foreground">{row.optionTitle}</td>
							<td class="px-3 py-2">
								<Input
									value={row.title}
									oninput={(e) =>
										updateRow(row.key, {
											title: (e.currentTarget as HTMLInputElement).value
										})}
									class="h-8 w-full min-w-[80px]"
								/>
							</td>
							<td class="px-3 py-2">
								<Input
									value={row.sku}
									oninput={(e) =>
										updateRow(row.key, {
											sku: (e.currentTarget as HTMLInputElement).value
										})}
									placeholder="SKU"
									class="h-8 w-24"
								/>
							</td>
							<td class="px-3 py-2">
								<input
									type="checkbox"
									class="rounded border-muted-foreground/50"
									checked={row.manage_inventory}
									onchange={(e) =>
										updateRow(row.key, {
											manage_inventory: (e.currentTarget as HTMLInputElement).checked
										})}
								/>
							</td>
							<td class="px-3 py-2">
								<input
									type="checkbox"
									class="rounded border-muted-foreground/50"
									checked={row.allow_backorder}
									onchange={(e) =>
										updateRow(row.key, {
											allow_backorder: (e.currentTarget as HTMLInputElement).checked
										})}
								/>
							</td>
							<td class="px-3 py-2">
								<div class="relative w-20">
									<span
										class="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-muted-foreground"
										>€</span
									>
									<Input
										type="text"
										value={row.priceAmount}
										oninput={(e) =>
											updateRow(row.key, {
												priceAmount: (e.currentTarget as HTMLInputElement).value
											})}
										placeholder="0"
										class="h-8 pl-6"
									/>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
