<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Combobox, type ComboboxOption } from '$lib/components/organs/index.js';
	import { client } from '$lib/client';
	import { SvelteMap } from 'svelte/reactivity';
	import type { SuperValidated } from 'sveltekit-superforms';

	type ProductAttributesForm = {
		id: string;
		attributes: Array<{
			attribute_id: string;
			value: string;
		}>;
	};

	type ProductAttributeRow = { id: string; title: string; type: string };
	type CategoryOption = { id: string; value: string };

	interface Props {
		open?: boolean;
		productId: string;
		categoryId?: string;
		categoryTitle?: string;
		productAttributesForm: SuperValidated<
			ProductAttributesForm,
			string | unknown,
			Record<string, unknown>
		>;
		onSaved?: () => void | Promise<void>;
	}

	let {
		open = $bindable(false),
		productId,
		categoryId = '',
		categoryTitle = '',
		productAttributesForm,
		onSaved = async () => {}
	}: Props = $props();

	let saving = $state(false);
	let saveError = $state('');
	let categoryAttributes = $state<ProductAttributeRow[]>([]);
	let categoryAttributesLoading = $state(false);

	let selectedCategoryId = $state('');
	let prevOpen = $state(false);
	let controlsKey = 0;

	let categorySearch = $state('');
	let debouncedCategorySearch = $state('');
	let categoryLoading = $state(false);
	let categoryFetchGen = 0;
	let fetchedCategories = $state<CategoryOption[]>([]);
	let selectedCategorySnapshot = $state<CategoryOption | null>(null);

	function uniqById(options: CategoryOption[]): CategoryOption[] {
		const map = new SvelteMap<string, CategoryOption>();
		for (const option of options) map.set(option.id, option);
		return Array.from(map.values());
	}

	/** Dropdown: API results only while searching; include selected label when search is empty. */
	const categoriesOptions = $derived.by((): ComboboxOption[] => {
		const fromApi = fetchedCategories.map((c) => ({ id: c.id, value: c.value }));
		if (categorySearch.trim()) return fromApi;
		const snap = selectedCategorySnapshot;
		if (snap && !fromApi.some((o) => o.id === snap.id)) {
			return uniqById([...fromApi, snap]).map((c) => ({ id: c.id, value: c.value }));
		}
		return fromApi;
	});

	const categoryVerified = $derived(
		!!selectedCategoryId && fetchedCategories.some((c) => c.id === selectedCategoryId)
	);

	const selectedCategoryLabel = $derived(
		selectedCategorySnapshot?.value ??
			fetchedCategories.find((c) => c.id === selectedCategoryId)?.value ??
			''
	);

	const categorySearchStale = $derived(
		categorySearch.trim() !== debouncedCategorySearch.trim()
	);

	const categoryComboboxLoading = $derived(categorySearchStale || categoryLoading);

	const passthroughComboboxFilter: (opts: ComboboxOption[], _query: string) => ComboboxOption[] = (
		opts
	) => opts;

	function pickLabel(item: { title?: string; value?: string; name?: string }): string {
		return item.title ?? item.value ?? item.name ?? '';
	}

	function extractRows<T>(payload: unknown): T[] {
		if (!payload || typeof payload !== 'object') return [];
		const data = (payload as { data?: unknown }).data;
		if (Array.isArray(data)) return data as T[];
		if (data && typeof data === 'object' && Array.isArray((data as { rows?: unknown[] }).rows)) {
			return ((data as { rows?: unknown[] }).rows ?? []) as T[];
		}
		return [];
	}

	function buildCategoryQuery(search: string) {
		return {
			page: 1,
			limit: 100,
			sorting_field: 'created_at',
			search: search.trim() || undefined
		};
	}

	$effect(() => {
		const q = categorySearch;
		const t = setTimeout(() => {
			debouncedCategorySearch = q;
		}, 300);
		return () => clearTimeout(t);
	});

	function fetchCategories(sheetOpen: boolean, searchDebounce: string) {
		const gen = ++categoryFetchGen;
		if (!sheetOpen) {
			categoryLoading = false;
			return;
		}
		categoryLoading = true;
		fetchedCategories = [];
		void (async () => {
			try {
				const res = await client['product-categories'].get({
					query: buildCategoryQuery(searchDebounce)
				});
				if (gen !== categoryFetchGen) return;
				fetchedCategories = extractRows<{ id: string; value: string }>(res).map((c) => ({
					id: c.id,
					value: c.value
				}));
			} catch {
				if (gen === categoryFetchGen) fetchedCategories = [];
			} finally {
				if (gen === categoryFetchGen) categoryLoading = false;
			}
		})();
	}

	function selectCategory(optionId: string) {
		if (!optionId) {
			selectedCategoryId = '';
			selectedCategorySnapshot = null;
			return;
		}
		selectedCategoryId = optionId;
		const match = fetchedCategories.find((c) => c.id === optionId);
		if (match) selectedCategorySnapshot = match;
	}

	$effect(() => {
		if (categoryLoading || categorySearchStale) return;
		const search = debouncedCategorySearch.trim();
		if (!search || !selectedCategoryId) return;
		if (!fetchedCategories.some((c) => c.id === selectedCategoryId)) {
			selectedCategoryId = '';
			selectedCategorySnapshot = null;
			categoryAttributes = [];
		}
	});

	$effect(() => {
		fetchCategories(open, debouncedCategorySearch);
	});

	$effect(() => {
		if (open && !prevOpen) {
			controlsKey += 1;
			selectedCategoryId = categoryId;
			selectedCategorySnapshot =
				categoryId ?
					{ id: categoryId, value: categoryTitle.trim() || categoryId }
				:	null;
			categorySearch = '';
			debouncedCategorySearch = '';
			fetchedCategories = [];
			saveError = '';
		}
		prevOpen = open;
	});

	$effect(() => {
		const catId = selectedCategoryId;
		if (!catId || !open || !categoryVerified) {
			categoryAttributes = [];
			return;
		}

		let cancelled = false;
		categoryAttributesLoading = true;
		(async () => {
			try {
				const res = await client['product-attributes'].get({
					query: { page: 1, limit: 100, filters: { category_id: catId } }
				});

				if (cancelled) return;
				const rows = extractRows<ProductAttributeRow>(res);
				categoryAttributes = rows.map((row) => ({
					id: row.id,
					title: pickLabel(row),
					type: row.type ?? 'text'
				}));
			} finally {
				if (!cancelled) categoryAttributesLoading = false;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const formData = productAttributesForm?.data;
		if (!open || !formData || !categoryVerified || categoryAttributesLoading) return;

		const current = [...(formData.attributes ?? [])];

		const nextForCategory = categoryAttributes.map((attr) => {
			const existing = current.find((a) => a.attribute_id === attr.id);
			return existing ?? { attribute_id: attr.id, value: '' };
		});

		formData.attributes = nextForCategory;
	});

	$effect(() => {
		if (open) return;
		const formData = productAttributesForm?.data;
		if ((formData?.attributes?.length ?? 0) > 0) {
			formData.attributes = [];
		}
	});

	function updateAttributeValue(attributeId: string, value: string) {
		const attr = productAttributesForm?.data?.attributes?.find(
			(a) => a.attribute_id === attributeId
		);
		if (attr) attr.value = value;
	}

	function getSelectedValue(attributeId: string): string {
		return (
			productAttributesForm?.data?.attributes?.find((a) => a.attribute_id === attributeId)
				?.value ?? ''
		);
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
		<Sheet.Header>
			<Sheet.Title>Edit Attributes</Sheet.Title>
		</Sheet.Header>

		<div class="flex flex-1 flex-col gap-6 overflow-auto px-4 py-4">
			{#key controlsKey}
				<div class="flex flex-col gap-2">
					<label for="edit-attr-category" class="text-sm font-medium">Category</label>
					<Combobox
						id="edit-attr-category"
						bind:value={selectedCategoryId}
						options={categoriesOptions}
						placeholder="Search categories…"
						emptyMessage="No categories found"
						disabled={saving}
						loading={categoryComboboxLoading}
						filterFn={passthroughComboboxFilter}
						onValueChange={selectCategory}
						onSearchChange={(q) => {
							categorySearch = q;
						}}
						onOpenChange={(panelOpen) => {
							if (panelOpen && open) fetchCategories(open, debouncedCategorySearch);
						}}
					/>
				</div>
			{/key}

			{#if !selectedCategoryId}
				<p class="text-sm text-muted-foreground">
					Select a category to view and edit attributes linked to it.
				</p>
			{:else if !categoryVerified && (categoryLoading || categorySearchStale)}
				<p class="text-sm text-muted-foreground">Loading categories…</p>
			{:else if !categoryVerified}
				<p class="text-sm text-muted-foreground">
					Select an existing category from the list to edit attributes.
				</p>
			{:else if categoryAttributesLoading}
				<p class="text-sm text-muted-foreground">Loading attributes…</p>
			{:else if categoryAttributes.length > 0}
				<div class="space-y-1">
					<p class="text-sm font-semibold">
						Category: {selectedCategoryLabel || selectedCategoryId}
					</p>
					<p class="text-xs text-muted-foreground">
						Set values for each attribute linked to this category.
					</p>
				</div>
				<div class="rounded-lg border bg-card">
					{#each categoryAttributes as attr, i (attr.id)}
						<div
							class="flex items-center gap-4 px-4 py-3{i < categoryAttributes.length - 1
								? ' border-b'
								: ''}"
						>
							<label
								class="w-28 shrink-0 text-sm font-medium text-foreground capitalize"
								for="attr-{attr.id}"
							>
								{attr.title}
							</label>
							<Input
								id="attr-{attr.id}"
								class="h-8 flex-1 bg-background"
								placeholder="Enter {attr.title.toLowerCase()}"
								value={getSelectedValue(attr.id)}
								oninput={(e) => updateAttributeValue(attr.id, e.currentTarget.value)}
							/>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">No attributes linked to this category.</p>
			{/if}
		</div>

		<Sheet.Footer class="border-t p-4">
			{#if saveError}
				<p class="mr-auto text-sm text-destructive">{saveError}</p>
			{/if}
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				disabled={saving || !categoryVerified}
				onclick={async () => {
					saving = true;
					saveError = '';
					try {
						const attrs = (productAttributesForm?.data?.attributes ?? [])
							.filter((a) => a.attribute_id && a.value.trim())
							.map((a) => ({
								attribute_id: a.attribute_id,
								value: a.value.trim()
							}));
						const res = await client.products({ id: productId }).put({
							category_id: selectedCategoryId || undefined,
							attributes: attrs
						});
						if (res.error) {
							const err = res.error as { value?: { message?: string } };
							saveError = err.value?.message ?? 'Failed to save attributes';
							return;
						}
						await onSaved();
						open = false;
					} catch (e) {
						saveError = e instanceof Error ? e.message : 'Failed to save attributes';
					} finally {
						saving = false;
					}
				}}>{saving ? 'Saving…' : 'Save'}</Button
			>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
