<script lang="ts">
	import { client } from '$lib/client.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { MultiSelectCombobox } from '../multi-select-combobox';
	import X from '@lucide/svelte/icons/x';
	import { TableHead, type TableColumn } from '$lib/components/organs/index.js';
	import {
		type CategoryAttributeCatalogRow,
		normalizeCategoryAttributeCatalogRows
	} from './category-attribute-catalog.js';

	let {
		open = false,
		active = false,
		comboboxId = 'category-attributes',
		controlKey = 0,
		initialAttributeIds = [] as string[],
		initialCategoryAttributes = [] as CategoryAttributeCatalogRow[],
		initialRequiredById = {} as Record<string, boolean>,
		selectedToAdd = $bindable([] as string[]),
		requiredByAttributeId = $bindable({} as Record<string, boolean>),
		disabled = false
	}: {
		open?: boolean;
		active?: boolean;
		comboboxId?: string;
		controlKey?: number;
		initialAttributeIds?: string[];
		initialCategoryAttributes?: CategoryAttributeCatalogRow[];
		initialRequiredById?: Record<string, boolean>;
		selectedToAdd?: string[];
		requiredByAttributeId?: Record<string, boolean>;
		disabled?: boolean;
	} = $props();

	let searchRows = $state<CategoryAttributeCatalogRow[]>([]);
	const attributesById = new SvelteMap<string, CategoryAttributeCatalogRow>();
	let attributesLoading = $state(false);

	let attributeSearch = $state('');
	let debouncedAttributeSearch = $state('');
	let attributeFetchGen = 0;
	let attributesFetchEnabled = $state(false);

	$effect(() => {
		const q = attributeSearch;
		const t = setTimeout(() => {
			debouncedAttributeSearch = q;
		}, 300);
		return () => clearTimeout(t);
	});

	const attributeOptions = $derived(
		searchRows.map((a) => ({
			id: a.id,
			value: a.title
		}))
	);

	const comboboxOptions = $derived.by(() => {
		const seen = new SvelteSet<string>();
		const out: { id: string; value: string }[] = [];
		for (const o of attributeOptions) {
			if (seen.has(o.id)) continue;
			seen.add(o.id);
			out.push(o);
		}
		for (const id of selectedToAdd) {
			if (seen.has(id)) continue;
			const row = attributesById.get(id);
			out.push(row ? { id: row.id, value: row.title } : { id, value: id });
			seen.add(id);
		}
		return out;
	});

	const selectedRows = $derived.by(() => {
		const seen = new SvelteSet<string>();
		const out: CategoryAttributeCatalogRow[] = [];
		for (const id of selectedToAdd) {
			if (seen.has(id)) continue;
			seen.add(id);
			const row = attributesById.get(id);
			if (row) out.push(row);
			else out.push({ id, title: id, type: '' });
		}
		return out;
	});

	const tableColumns: TableColumn[] = [
		{ label: 'Title', key: 'title', type: 'text' },
		{ label: 'Type', key: 'type', type: 'text' },
		{ label: 'Required', key: 'required', type: 'boolean' },
		{ label: 'Action', key: 'actions', type: 'actions' }
	];

	function toggleRequiredForRow(id: string) {
		requiredByAttributeId = {
			...requiredByAttributeId,
			[id]: !(requiredByAttributeId[id] ?? false)
		};
	}

	function removeSelectedRow(id: string) {
		selectedToAdd = selectedToAdd.filter((x) => x !== id);
	}

	function mergeRowsIntoAttributesById(
		map: SvelteMap<string, CategoryAttributeCatalogRow>,
		incoming: CategoryAttributeCatalogRow[]
	) {
		for (const row of incoming) {
			map.set(row.id, row);
		}
	}

	async function fetchAttributesPage(search: string): Promise<CategoryAttributeCatalogRow[]> {
		const res = await client['product-attributes'].get({
			query: {
				search: search.trim(),
				page: 1,
				limit: 100,
				sorting_field: 'title'
			}
		});
		return normalizeCategoryAttributeCatalogRows((res.data?.rows ?? []) as unknown[]);
	}

	async function fetchAllCatalogPages(): Promise<CategoryAttributeCatalogRow[]> {
		const limit = 100;
		const maxPages = 100;
		const out: CategoryAttributeCatalogRow[] = [];
		for (let page = 1; page <= maxPages; page++) {
			const res = await client['product-attributes'].get({
				query: {
					search: '',
					page,
					limit,
					sorting_field: 'title'
				}
			});
			const rows = normalizeCategoryAttributeCatalogRows((res.data?.rows ?? []) as unknown[]);
			out.push(...rows);
			const p = res.data?.pagination;
			if (!p?.has_next_page || rows.length === 0) break;
		}
		return out;
	}

	function onAttributeComboboxOpen() {
		attributesFetchEnabled = true;
	}

	$effect(() => {
		if (!active) {
			selectedToAdd = [];
			requiredByAttributeId = {};
			searchRows = [];
			attributesById.clear();
			attributesLoading = false;
			attributesFetchEnabled = false;
			attributeFetchGen++;
			attributeSearch = '';
			debouncedAttributeSearch = '';
			return;
		}

		void controlKey;
		attributeSearch = '';
		debouncedAttributeSearch = '';

		const categoryRows = [...initialCategoryAttributes];
		const ids = [...initialAttributeIds];

		selectedToAdd = ids;
		attributesById.clear();
		mergeRowsIntoAttributesById(attributesById, categoryRows);

		requiredByAttributeId = Object.fromEntries(
			ids.map((id) => [id, initialRequiredById[id] ?? false])
		);

		searchRows = [];
		attributesFetchEnabled = false;
	});

	$effect(() => {
		if (!active || !attributesFetchEnabled) {
			if (!active) attributesLoading = false;
			return;
		}
		const search = debouncedAttributeSearch;
		const gen = ++attributeFetchGen;
		attributesLoading = true;
		void (async () => {
			try {
				const rows = search.trim()
					? await fetchAttributesPage(search)
					: await fetchAllCatalogPages();
				if (gen !== attributeFetchGen) return;
				searchRows = rows;
				mergeRowsIntoAttributesById(attributesById, rows);
			} catch {
				if (gen !== attributeFetchGen) return;
				searchRows = [];
			} finally {
				if (gen === attributeFetchGen) attributesLoading = false;
			}
		})();
	});

	$effect(() => {
		const ids = selectedToAdd;
		requiredByAttributeId = (() => {
			const prev = untrack(() => requiredByAttributeId);
			const next: Record<string, boolean> = {};
			for (const id of ids) {
				next[id] = id in prev ? prev[id]! : false;
			}
			return next;
		})();
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		<label for={comboboxId} class="text-sm font-medium">Attributes</label>
		{#key controlKey}
			<MultiSelectCombobox
				id={comboboxId}
				options={comboboxOptions}
				bind:value={selectedToAdd}
				onOpen={onAttributeComboboxOpen}
				loading={attributesLoading}
				showSelectedTable={false}
				placeholder="Search attributes…"
				emptyMessage="No attributes found."
				disabled={disabled || !open}
				onSearchChange={(q) => {
					attributeSearch = q;
				}}
				class="mt-1"
			/>
		{/key}
	</div>

	<div class="flex flex-col gap-2">
		<h3 class="text-sm font-medium">Selected attributes</h3>
		<section class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
		<div class="sm:p-1">
			{#if selectedRows.length === 0}
				<div
					class="m-3 flex min-h-[8rem] items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/15 px-3 py-6"
				>
					<p class="text-center text-sm text-muted-foreground">No attribute selected yet.</p>
				</div>
			{:else}
				<div
					class="max-h-[min(18rem,calc(100vh-13rem))] min-h-0 overflow-auto px-1 pb-1 sm:px-2 sm:pb-2"
				>
					<table class="w-full border-collapse text-sm">
						<TableHead columns={tableColumns} />
						<tbody class="divide-y divide-border">
							{#each selectedRows as row, i (row.id ?? i)}
								<tr class="hover:bg-muted/40">
									<td class="px-4 py-2.5 font-medium">{row.title}</td>
									<td class="px-4 py-2.5 text-muted-foreground">{row.type}</td>
									<td class="px-4 py-2.5" onclick={(e) => e.stopPropagation()}>
										<div class="flex justify-center">
											<input
												type="checkbox"
												class="h-4 w-4 rounded border-input"
												checked={requiredByAttributeId[row.id] ?? false}
												disabled={disabled}
												onchange={() => toggleRequiredForRow(row.id)}
											/>
										</div>
									</td>
									<td class="px-4 py-2.5 text-right" onclick={(e) => e.stopPropagation()}>
										<button
											type="button"
											class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
											aria-label="Remove {row.title}"
											disabled={disabled}
											onclick={() => removeSelectedRow(row.id)}
										>
											<X class="size-4" aria-hidden="true" />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
		</section>
	</div>
</div>
