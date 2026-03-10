<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { SvelteSet, SvelteURLSearchParams } from 'svelte/reactivity';

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
	type ProductOption = { id: string; title: string; product_id: string | null };

	let {
		variants = [],
		options = [],
		variantPricesMap = new Map<string, string>(),
		onEditVariant = () => {},
		onDeleteVariant = () => {},
		onEditOptionsAndVariants = () => {}
	}: {
		variants?: ProductVariant[];
		options?: ProductOption[];
		variantPricesMap?: Map<string, string>;
		onEditVariant?: (row: Record<string, unknown>) => void;
		onDeleteVariant?: (row: Record<string, unknown>) => void;
		onEditOptionsAndVariants?: () => void;
	} = $props();

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	function updateVariantUrl(updates: { page?: number; search?: string }) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		if (updates.page != null) params.set('page', String(updates.page));
		if (updates.search !== undefined) {
			const s = updates.search.trim();
			if (s) params.set('search', s);
			else params.delete('search');
			params.set('page', '1');
		}
		// goto(resolve(`${page.url.pathname}?${params.toString()}`), { replaceState: true });
	}

	const variantPage = $derived(Math.max(1, Number(paginationQuery.page) || 1));
	const variantLimit = $derived(Math.max(1, Math.min(100, Number(paginationQuery.limit) || 10)));
	const variantSearchQuery = $derived.by(() => paginationQuery.search ?? '');

	const optionsWithValues = $derived.by(() => {
		if (options.length === 0) return [] as { option: ProductOption; values: string[] }[];
		return options.map((opt, optIndex) => {
			const valuesSet = new SvelteSet<string>();
			if (options.length === 1) {
				variants.forEach((v) => {
					if (v.title?.trim()) valuesSet.add(v.title.trim());
				});
			} else {
				variants.forEach((v) => {
					const parts = (v.title ?? '').split('/').map((p) => p.trim()).filter(Boolean);
					if (parts[optIndex]) valuesSet.add(parts[optIndex]);
				});
			}
			return { option: opt, values: Array.from(valuesSet) };
		});
	});

	const filteredVariants = $derived(
		variantSearchQuery.trim()
			? variants.filter(
					(v) =>
						v.title.toLowerCase().includes(variantSearchQuery.toLowerCase()) ||
						(v.sku ?? '').toLowerCase().includes(variantSearchQuery.toLowerCase())
				)
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
			return {
				...v,
				price_display: priceInCents
					? `€${(parseFloat(priceInCents) / 100).toFixed(2)}`
					: '—'
			};
		}) as Record<string, unknown>[]
	);

	const variantTableColumns: TableColumn[] = [
		{
			label: 'Variant',
			key: 'title',
			type: 'link',
			cellHref: () => '#',
			thumbnailKey: 'thumbnail',
			textKey: 'title'
		},
		{ label: 'SKU', key: 'sku', type: 'text' },
		{ label: 'Inventory', key: 'manage_inventory', type: 'boolean' },
		{ label: 'Price', key: 'price_amount', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Updated', key: 'updated_at', type: 'date' },
		{ label: 'Actions', key: 'actions', type: 'actions', actions: [
			{ label: 'Edit', key: 'edit', type: 'button', onClick: (row) => onEditVariant(row) },
			{ label: 'Delete', key: 'delete', type: 'button', onClick: (row) => onDeleteVariant(row) }
		] },
	];

	function goToVariantPage(pageNum: number) {
		updateVariantUrl({ page: Math.max(1, Math.min(variantTotalPages, pageNum)) });
	}

	$effect(() => {
		if (variantTotalPages >= 1 && variantPage > variantTotalPages) {
			updateVariantUrl({ page: variantTotalPages });
		}
	});
</script>

<!-- Options & Variants card (merged) -->
<div class="rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Options & Variants</h2>
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

	<!-- Options section -->
	{#if optionsWithValues.length === 0}
		<p class="mt-4 text-sm text-muted-foreground">No options defined.</p>
	{:else}
		<div class="mt-4 flex flex-col gap-4">
			{#each optionsWithValues as { option: opt, values: vals } (opt.id)}
				<div>
					<p class="text-sm font-medium text-muted-foreground">{opt.title}</p>
					<div class="mt-1.5 flex flex-wrap gap-1.5">
						{#each vals as val (val)}
							<span
								class="inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1 text-sm"
							>
								{val}
							</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Variants section -->
	<div class="mt-4">
		<PaginationTable
			searchQuery={variantSearchQuery}
			searchPlaceholder="Search variants…"
			showFilter={false}
			showSort={false}
		>
			<div class="overflow-x-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<TableHead columns={variantTableColumns} />
					<TableBody
						rows={variantTableRows}
						columns={variantTableColumns}
						emptyMessage="No variants."
					/>
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
