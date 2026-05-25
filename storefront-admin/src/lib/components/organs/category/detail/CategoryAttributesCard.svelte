<script lang="ts">
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		DeleteConfirmationModal,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Search from '@lucide/svelte/icons/search';
	import Plus from '@lucide/svelte/icons/plus';
	import { getDetailContext } from '$lib/hooks';
	import { SvelteSet } from 'svelte/reactivity';
	import type { CategoryAttribute, CategoryDetail } from '$lib/components/organs/category/type.js';
	import { client } from '$lib/client.js';
	import { toast } from 'svelte-sonner';
	import AddAttributeToCategorySheet from '$lib/components/organs/category/detail/AddAttributeToCategorySheet.svelte';
	import { createQuery } from '@tanstack/svelte-query';

	const detailQuery = getDetailContext<CategoryDetail | null>();
	const categoryId = $derived(detailQuery?.data?.id ?? '');
	const categoryAttributes = $derived(detailQuery?.data?.attributes ?? []);

	const selectedAttributeIds = $derived(categoryAttributes.map((a) => a.id));

	const filteredAttributes = $derived.by(() => {
		const byId = new Map(categoryAttributes.map((a) => [a.id, a]));
		const seen = new SvelteSet<string>();
		const out: CategoryAttribute[] = [];
		for (const id of selectedAttributeIds) {
			if (seen.has(id)) continue;
			const row = byId.get(id);
			if (row) {
				seen.add(id);
				out.push(row);
			}
		}
		return out;
	});

	const SEARCH_DEBOUNCE_MS = 300;

	let searchInput = $state('');
	let debouncedSearch = $state('');
	let sortDir = $state<'asc' | 'desc'>('asc');
	let typeFilter = $state<Set<string>>(new Set());
	let filterPanelOpen = $state(false);

	let addSheetOpen = $state(false);

	let removeConfirmOpen = $state(false);
	let attributeToRemove = $state<CategoryAttribute | null>(null);
	let removeSubmitting = $state(false);
	let removeError = $state<string | null>(null);

	const PAGE_SIZE = 10;
	let attributePage = $state(1);

	const attributeTypes = $derived.by(() => {
		const types = new SvelteSet<string>();
		for (const a of filteredAttributes) {
			if (a.type) types.add(a.type);
		}
		return Array.from(types).sort((a, b) => a.localeCompare(b));
	});

	$effect(() => {
		void detailQuery?.data?.id;
		searchInput = '';
		debouncedSearch = '';
	});

	$effect(() => {
		const s = searchInput;
		const tid = setTimeout(() => {
			debouncedSearch = s.trim();
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(tid);
	});

	const attributeSearchQuery = createQuery(() => ({
		queryKey: ['category-attributes-search', categoryId, debouncedSearch],
		queryFn: async () => {
			const res = await client['product-attributes'].get({
				query: {
					page: 1,
					limit: 500,
					search: debouncedSearch,
					sorting_field: 'title',
					filters: { category_id: categoryId }
				}
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err.value?.message ?? 'Failed to search attributes');
			}
			const rows = (res.data?.rows ?? []) as { id?: string }[];
			return rows.map((r) => String(r.id ?? '')).filter(Boolean);
		},
		enabled: () => Boolean(categoryId && debouncedSearch.length > 0),
		refetchOnWindowFocus: false
	}));

	const apiMatchedIds = $derived(
		debouncedSearch.length > 0 && attributeSearchQuery.data
			? new SvelteSet(attributeSearchQuery.data)
			: null
	);

	const displayRows = $derived.by(() => {
		let rows: CategoryAttribute[];
		const q = debouncedSearch;
		const qlower = q.toLowerCase();
		if (!q) {
			rows = [...filteredAttributes];
		} else {
			rows = filteredAttributes.filter((r) => {
				if (apiMatchedIds?.has(r.id)) return true;
				if (r.title.toLowerCase().includes(qlower)) return true;
				if (r.type.toLowerCase().includes(qlower)) return true;
				return false;
			});
		}
		if (typeFilter.size > 0) {
			rows = rows.filter((r) => typeFilter.has(r.type));
		}
		rows.sort((a, b) => {
			const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
			return sortDir === 'asc' ? cmp : -cmp;
		});
		return rows;
	});

	const attributeTotal = $derived(displayRows.length);
	const attributeTotalPages = $derived(
		attributeTotal > 0 ? Math.max(1, Math.ceil(attributeTotal / PAGE_SIZE)) : 1
	);
	const pagedDisplayRows = $derived.by(() => {
		const offset = (attributePage - 1) * PAGE_SIZE;
		return displayRows.slice(offset, offset + PAGE_SIZE);
	});
	const attributePagination = $derived({
		total: attributeTotal,
		page: attributePage,
		limit: PAGE_SIZE,
		total_pages: attributeTotalPages,
		has_next_page: attributePage < attributeTotalPages,
		has_previous_page: attributePage > 1
	} satisfies PaginationMeta);
	const attributeStart = $derived(attributeTotal > 0 ? (attributePage - 1) * PAGE_SIZE + 1 : 0);
	const attributeEnd = $derived(Math.min(attributePage * PAGE_SIZE, attributeTotal));

	$effect(() => {
		void debouncedSearch;
		void sortDir;
		void typeFilter;
		attributePage = 1;
	});
	$effect(() => {
		if (attributePage > attributeTotalPages) attributePage = attributeTotalPages;
		if (attributePage < 1) attributePage = 1;
	});

	function toggleSort() {
		sortDir = sortDir === 'asc' ? 'desc' : 'asc';
	}

	function toggleTypeFilter(t: string) {
		const next = new SvelteSet(typeFilter);
		if (next.has(t)) next.delete(t);
		else next.add(t);
		typeFilter = next;
	}

	function refetchCategory() {
		void detailQuery?.refetch?.();
	}

	type AttributeRow = CategoryAttribute;

	function requestRemove(row: AttributeRow) {
		attributeToRemove = row;
		removeError = null;
		removeConfirmOpen = true;
	}

	const tableColumns = $derived.by((): TableColumn<AttributeRow>[] => [
		{
			label: 'Title',
			key: 'title',
			type: 'text'
		},
		{ label: 'Type', key: 'type', type: 'text' },
		{ label: 'Required', key: 'required', type: 'boolean' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => requestRemove(item as AttributeRow)
				}
			]
		}
	]);

	async function confirmRemoveFromCategory() {
		const row = attributeToRemove;
		const category = detailQuery?.data;
		if (!row || !category?.id) return;
		removeSubmitting = true;
		removeError = null;
		try {
			const nextIds = selectedAttributeIds.filter((id) => id !== row.id);
			const byId = new Map(categoryAttributes.map((a) => [a.id, a]));
			const res = await client['product-categories']({ id: category.id }).put({
				attributes: nextIds.map((attribute_id) => ({
					attribute_id,
					required: byId.get(attribute_id)?.required ?? false
				}))
			});
			if (res == null || (typeof res === 'object' && 'error' in res && res.error)) {
				removeError = 'Could not update this category';
				return;
			}
			toast.success('Attribute removed from category');
			removeConfirmOpen = false;
			attributeToRemove = null;
			refetchCategory();
		} finally {
			removeSubmitting = false;
		}
	}
</script>

<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
	<div class="relative border-b bg-card px-6 py-4">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
			<h2 class="text-base font-semibold tracking-tight">Attributes</h2>
			<div
				class="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 sm:max-w-none sm:justify-end"
			>
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="h-9 shrink-0 gap-1 rounded-lg "
					disabled={!detailQuery?.data}
					onclick={() => (addSheetOpen = true)}
				>
					<Plus class="size-4" />
					Edit
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="h-9 shrink-0 gap-2 rounded-lg"
					onclick={toggleSort}
					aria-label={`Sort by title, ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
				>
					<SlidersHorizontal class="size-4 text-muted-foreground" />
					Sort
				</Button>
				<div class="relative min-w-[12rem] flex-1 sm:max-w-xs sm:flex-initial">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						type="search"
						placeholder="Search"
						class="h-9 rounded-lg pl-9"
						bind:value={searchInput}
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					size="icon"
					class="shrink-0 rounded-lg"
					onclick={() => (filterPanelOpen = !filterPanelOpen)}
					aria-expanded={filterPanelOpen}
					aria-label="Filter by type"
				>
					<SlidersHorizontal class="size-4" />
				</Button>
			</div>
		</div>
		{#if filterPanelOpen}
			<div
				class="absolute top-full right-6 z-20 mt-1 w-56 rounded-lg border bg-popover p-3 shadow-md"
				role="region"
				aria-label="Type filters"
			>
				{#if attributeTypes.length === 0}
					<p class="text-sm text-muted-foreground">No attribute types to filter.</p>
				{:else}
					<p class="mb-2 text-xs font-medium text-muted-foreground">Type</p>
					<ul class="flex max-h-48 flex-col gap-2 overflow-auto">
						{#each attributeTypes as t (t)}
							<li>
								<label class="flex cursor-pointer items-center gap-2 text-sm">
									<input
										type="checkbox"
										class="size-4 rounded border-input accent-primary"
										checked={typeFilter.has(t)}
										onchange={() => toggleTypeFilter(t)}
									/>
									<span>{t}</span>
								</label>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>
	<div class="p-4 sm:p-6">
		<PaginationTable showToolbar={false}>
			{#if attributeSearchQuery.isError && debouncedSearch}
				<div
					class="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{attributeSearchQuery.error instanceof Error
						? attributeSearchQuery.error.message
						: String(attributeSearchQuery.error)}
				</div>
			{/if}
			{#if filteredAttributes.length === 0}
				<div
					class="flex min-h-[12rem] items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-8"
				>
					<p class="text-center text-sm text-muted-foreground">
						No attributes selected for this category.
					</p>
				</div>
			{:else}
				<div class="min-h-0 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={pagedDisplayRows}
							columns={tableColumns as TableColumn[]}
							emptyMessage="No attributes found."
						/>
					</table>
				</div>
				<TablePagination
					pagination={attributePagination}
					start={attributeStart}
					end={attributeEnd}
					onPageChange={(p) => {
						attributePage = p;
					}}
				/>
			{/if}
		</PaginationTable>
	</div>
</section>

<AddAttributeToCategorySheet
	bind:open={addSheetOpen}
	categoryId={detailQuery?.data?.id ?? ''}
	currentAttributeIds={selectedAttributeIds}
	currentAttributeRequiredById={Object.fromEntries(
		categoryAttributes.map((a) => [a.id, a.required ?? false])
	)}
	currentCategoryAttributes={categoryAttributes.map((a) => ({
		id: a.id,
		title: a.title,
		type: a.type
	}))}
	onSuccess={refetchCategory}
/>

<DeleteConfirmationModal
	bind:open={removeConfirmOpen}
	entityName="attribute from category"
	entityTitle={attributeToRemove?.title ?? attributeToRemove?.id ?? ''}
	customMessage="This removes the attribute from this category only. The attribute remains available in your catalog."
	onConfirm={confirmRemoveFromCategory}
	onCancel={() => {
		attributeToRemove = null;
		removeError = null;
	}}
	submitting={removeSubmitting}
	error={removeError}
/>
