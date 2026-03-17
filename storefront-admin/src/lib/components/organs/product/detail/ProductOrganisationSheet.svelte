<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Combobox, MultiSelectCombobox } from '$lib/components/organs/index.js';
	import Info from '@lucide/svelte/icons/info';
	import { client } from '$lib/client.js';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

	type Props = {
		open: boolean;
	};

	type Option = { id: string; value: string };

	function extractRows<T>(response: unknown): T[] {
		const payload = (response as { data?: { rows?: T[]; data?: T[] } | T[] } | null)?.data;
		if (Array.isArray(payload)) return payload;
		if (Array.isArray(payload?.rows)) return payload.rows;
		if (Array.isArray(payload?.data)) return payload.data;
		return [];
	}

	function uniqById(options: Option[]): Option[] {
		const map = new Map<string, Option>();
		for (const option of options) map.set(option.id, option);
		return Array.from(map.values());
	}

	const listQuery = createPaginationQuery({
		page: 1,
		limit: 100,
		search: '',
		sorting_field: 'created_at'
	}) as {
		search?: string;
		page?: string | number;
		limit?: string | number;
		sorting_field?: string;
	};

	const productDetail = $derived(getProductDetail().data ?? null);

	const selectedTags = $derived(productDetail?.tags?.map((t) => ({ id: t.id, value: t.value })) ?? []);
	const selectedCollections = $derived(
		productDetail?.collections?.map((c) => ({ id: c.id, value: c.title })) ?? []
	);
	const selectedCategories = $derived<Option[]>(
		productDetail?.category?.id && productDetail?.category?.value
			? [{ id: productDetail.category.id, value: productDetail.category.value }]
			: []
	);

	let fetchedTags = $state<Option[]>([]);
	let fetchedCollections = $state<Option[]>([]);
	let fetchedCategories = $state<Option[]>([]);

	const tagsOptions = $derived(uniqById([...fetchedTags, ...selectedTags]));
	const collectionsOptions = $derived(uniqById([...fetchedCollections, ...selectedCollections]));
	const categoriesOptions = $derived(uniqById([...fetchedCategories, ...selectedCategories]));
	
	const productCategoryId = $derived(productDetail?.category?.id ?? '');
	const productCollectionIds = $derived(productDetail?.collections?.map((c) => c.id) ?? []);
	const productTagIds = $derived(productDetail?.tags?.map((t) => t.id) ?? []);
	
	let { open = $bindable(false) }: Props = $props();

	let optionsLoaded = $state(false);

	async function loadOptions() {
		if (optionsLoaded) return;
		optionsLoaded = true;

		const [collectionsResponse, categoriesResponse, tagsResponse] = await Promise.allSettled([
			client.collections.get({ query: listQuery }),
			client['product-categories'].get({ query: listQuery }),
			client['product-tags'].get({ query: listQuery })
		]);

		fetchedCollections =
			collectionsResponse.status === 'fulfilled'
				? extractRows<{ id: string; title: string }>(collectionsResponse.value).map((c) => ({
						id: c.id,
						value: c.title
					}))
				: [];

		fetchedCategories =
			categoriesResponse.status === 'fulfilled'
				? extractRows<{ id: string; value: string }>(categoriesResponse.value).map((c) => ({
						id: c.id,
						value: c.value
					}))
				: [];

		fetchedTags =
			tagsResponse.status === 'fulfilled'
				? extractRows<{ id: string; value: string }>(tagsResponse.value).map((t) => ({
						id: t.id,
						value: t.value
					}))
				: [];
	}

	$effect(() => {
		if (open) loadOptions();
	});

</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
		<Sheet.Header class="flex flex-col gap-1.5 px-4 pt-4 text-left">
			<div class="flex items-center gap-2">
				<Sheet.Title>Product organization</Sheet.Title>
				<span
					class="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
					title="Assign a category (type), collections, and tags to organize this product."
					aria-label="Info"
				>
					<Info class="size-3" />
				</span>
			</div>
		</Sheet.Header>
		<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
			<div class="flex flex-col gap-2">
				<label for="org-categories" class="text-sm font-medium">Category</label>
				<Combobox
					id="org-categories"
					value={productCategoryId}
					options={categoriesOptions}
					placeholder="Search categories…"
					emptyMessage="No categories found"
				/>
			</div>
			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-medium">Collections</h3>
				<MultiSelectCombobox
					id="org-collections"
						value={productCollectionIds}
						options={collectionsOptions}
						placeholder="Search collections…"
					emptyMessage="No collections yet."
				/>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between gap-2">
					<label for="org-tags-search" class="text-sm font-medium">
						Tags <span class="font-normal text-muted-foreground">(Optional)</span>
					</label>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={async () => {
							// const name = window.prompt('New tag name');
							// if (name) await createAndSelectOrgTag(name);
						}}
					>
						Create tag
					</Button>
				</div>
				<MultiSelectCombobox
					id="org-tags"
					value={productTagIds}
					options={tagsOptions}
					placeholder="Type to search…"
					emptyMessage="No tags found"
				/>
			</div>
		</div>
		<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={() => open = false}>Cancel</Button>
			<Button onclick={() => {}}>Save</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
