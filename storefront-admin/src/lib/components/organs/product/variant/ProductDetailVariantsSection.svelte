<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		PaginationTable,
		TableHead,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ImageIcon from '@lucide/svelte/icons/image';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Search from '@lucide/svelte/icons/search';
	import {
		getVariantOptionEntries,
		variantMatchesSearch,
		type VariantOptionEntry,
		type VariantOptionRef
	} from './variant-option-entries.js';
	import { SvelteSet } from 'svelte/reactivity';

	const CHIP_CLASS =
		'inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2.5 py-1 text-sm';

	type ProductVariant = {
		id: string;
		title: string;
		sku: string | null;
		product_id: string | null;
		thumbnail?: string | null;
		manage_inventory: boolean;
		allow_backorder?: boolean;
		created_at?: string | Date;
		updated_at?: string | Date;
		options?: VariantOptionRef[];
	};
	type ProductOption = {
		id: string;
		title: string;
		product_id: string | null;
		values?: Array<{ id?: string; value?: string }>;
	};

	type OptionValueOverride = {
		optionId: string;
		title: string;
		values: string[];
	};

	let {
		variants = [],
		options = [],
		optionValueOverrides = null,
		variantPricesMap = new Map<string, string>(),
		loading = false,
		onEditVariant = () => {},
		onDeleteVariant = () => {},
		onEditOptionsAndVariants = () => {}
	}: {
		variants?: ProductVariant[];
		options?: ProductOption[];
		optionValueOverrides?: OptionValueOverride[] | null;
		variantPricesMap?: Map<string, string>;
		loading?: boolean;
		onEditVariant?: (row: Record<string, unknown>) => void;
		onDeleteVariant?: (row: Record<string, unknown>) => void;
		onEditOptionsAndVariants?: () => void;
	} = $props();

	const optionRefs = $derived(options.map((o) => ({ id: o.id, title: o.title })));

	const variantLimit = 10;
	let variantPage = $state(1);
	let variantSearchQuery = $state('');

	const optionsWithValues = $derived.by(() => {
		if (optionValueOverrides && optionValueOverrides.length > 0) {
			return optionValueOverrides.map((entry) => ({
				option: {
					id: entry.optionId,
					title: entry.title,
					product_id: null
				},
				values: entry.values
			}));
		}

		if (options.length === 0) return [] as { option: ProductOption; values: string[] }[];

		return options.map((opt, optIndex) => {
			const valuesSet = new SvelteSet<string>();
			if (Array.isArray(opt.values) && opt.values.length > 0) {
				for (const value of opt.values) {
					const normalized = (value?.value ?? '').trim();
					if (normalized) valuesSet.add(normalized);
				}
			}
			if (valuesSet.size === 0) {
				if (options.length === 1) {
					variants.forEach((v) => {
						if (v.title?.trim()) valuesSet.add(v.title.trim());
					});
				} else {
					variants.forEach((v) => {
						const parts = (v.title ?? '')
							.split('/')
							.map((p) => p.trim())
							.filter(Boolean);
						if (parts[optIndex]) valuesSet.add(parts[optIndex]);
					});
				}
			}
			return { option: opt, values: Array.from(valuesSet) };
		});
	});

	const filteredVariants = $derived(
		variantSearchQuery.trim()
			? variants.filter((v) => variantMatchesSearch(v, variantSearchQuery, optionRefs))
			: variants
	);
	const variantTotal = $derived(filteredVariants.length);
	const variantTotalPages = $derived(Math.max(1, Math.ceil(variantTotal / variantLimit)));
	const paginatedVariants = $derived(
		filteredVariants.slice((variantPage - 1) * variantLimit, variantPage * variantLimit)
	);
	const variantStart = $derived(variantTotal > 0 ? (variantPage - 1) * variantLimit + 1 : 0);
	const variantEnd = $derived(Math.min(variantPage * variantLimit, variantTotal));
	const variantPagination = $derived({
		total: variantTotal,
		page: variantPage,
		limit: variantLimit,
		total_pages: variantTotalPages,
		has_next_page: variantPage < variantTotalPages,
		has_previous_page: variantPage > 1
	});
	const variantTableRows = $derived(
		paginatedVariants.map((v) => {
			const priceInCents = variantPricesMap.get(v.id);
			const option_entries = getVariantOptionEntries(v, optionRefs);
			return {
				...v,
				option_entries,
				price_display: priceInCents ? `€${(parseFloat(priceInCents) / 100).toFixed(2)}` : '—'
			};
		}) as Array<
			Record<string, unknown> & {
				option_entries: VariantOptionEntry[];
				price_display: string;
			}
		>
	);

	const variantTableColumns: TableColumn[] = [
		{ label: 'Variant', key: 'title', type: 'text' },
		{ label: 'SKU', key: 'sku', type: 'text' },
		{ label: 'Inventory', key: 'manage_inventory', type: 'boolean' },
		{ label: 'Price', key: 'price_display', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Updated', key: 'updated_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{ label: 'Edit', key: 'edit', type: 'button', onClick: (row) => onEditVariant(row) },
				{ label: 'Delete', key: 'delete', type: 'button', onClick: (row) => onDeleteVariant(row) }
			]
		}
	];

	function goToVariantPage(pageNum: number) {
		variantPage = Math.max(1, Math.min(variantTotalPages, pageNum));
	}

	function formatDate(value: unknown): string {
		if (value == null || value === '') return '—';
		try {
			const date = new Date(value as string | Date);
			if (Number.isNaN(date.getTime())) return '—';
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '—';
		}
	}

	function cellText(key: string, row: Record<string, unknown>): string {
		const value = row[key];
		if (key === 'created_at' || key === 'updated_at') return formatDate(value);
		if (value == null || value === '') return '—';
		return String(value);
	}

	$effect(() => {
		void variantSearchQuery;
		variantPage = 1;
	});

	$effect(() => {
		if (variantTotalPages >= 1 && variantPage > variantTotalPages) {
			variantPage = variantTotalPages;
		}
	});

	$effect(() => {
		void variants.length;
		if (variantPage > variantTotalPages) {
			variantPage = Math.max(1, variantTotalPages);
		}
	});
</script>

<div class="min-w-0 rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Options &amp; Variants</h2>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={onEditOptionsAndVariants}
			aria-label="Edit options and variants"
		>
			<Pencil class="size-4" />
		</Button>
	</div>

	<div class="mt-4">
		<h3 class="text-sm font-medium">Options</h3>
		{#if optionsWithValues.length === 0}
			<p class="mt-2 text-sm text-muted-foreground">No options defined.</p>
		{:else}
			<div class="mt-2 flex flex-col gap-4">
				{#each optionsWithValues as { option: opt, values: vals } (opt.id)}
					<div>
						<p class="text-sm font-medium text-muted-foreground">{opt.title}</p>
						<div class="mt-1.5 flex flex-wrap gap-1.5">
							{#each vals as val (val)}
								<span class={CHIP_CLASS}>{val}</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="mt-6 border-t pt-6">
		<div class="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
			<h3 class="shrink-0 text-sm font-medium">Variants</h3>
			<div class="relative min-w-0 w-full sm:w-64">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search variants…"
					class="h-9 w-full rounded-md pl-9"
					bind:value={variantSearchQuery}
				/>
			</div>
		</div>
		<PaginationTable showToolbar={false}>
			<div class="overflow-x-auto rounded-lg border">
				<table class="w-full text-sm">
					<TableHead columns={variantTableColumns} />
					<tbody>
						{#if loading}
							<tr>
								<td
									colspan={variantTableColumns.length}
									class="px-4 py-8 text-center text-muted-foreground"
								>
									Loading variants…
								</td>
							</tr>
						{:else if variantTableRows.length === 0}
							<tr>
								<td
									colspan={variantTableColumns.length}
									class="px-4 py-8 text-center text-muted-foreground"
								>
									No variants.
								</td>
							</tr>
						{:else}
							{#each variantTableRows as row (row.id)}
								<tr class="border-b transition-colors last:border-0 hover:bg-muted/30">
									<td class="px-4 py-3">
										<div class="flex min-w-[12rem] items-center gap-3">
											{#if row.thumbnail}
												<img
													src={String(row.thumbnail)}
													alt=""
													class="size-10 shrink-0 rounded-md object-cover"
												/>
											{:else}
												<div
													class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
												>
													<ImageIcon class="size-5" />
												</div>
											{/if}
											<p class="min-w-0 flex-1 font-medium leading-snug">{row.title}</p>
										</div>
									</td>
									<td class="px-4 py-3 text-muted-foreground">{cellText('sku', row)}</td>
									<td class="px-4 py-3">
										{#if row.manage_inventory === true}
											<span
												class="inline-flex items-center rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
											>
												Yes
											</span>
										{:else}
											<span
												class="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400"
											>
												No
											</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-muted-foreground">{row.price_display}</td>
									<td class="px-4 py-3 text-muted-foreground"
										>{formatDate(row.created_at)}</td
									>
									<td class="px-4 py-3 text-muted-foreground"
										>{formatDate(row.updated_at)}</td
									>
									<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
											>
												<MoreHorizontal class="size-4" />
												<span class="sr-only">Actions</span>
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content
													class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
													sideOffset={4}
												>
													<DropdownMenu.Item
														textValue="Edit"
														class="relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
														onclick={() => onEditVariant(row)}
													>
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
														onclick={() => onDeleteVariant(row)}
													>
														Delete
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									</td>
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
				onPageChange={goToVariantPage}
			/>
		</PaginationTable>
	</div>
</div>
