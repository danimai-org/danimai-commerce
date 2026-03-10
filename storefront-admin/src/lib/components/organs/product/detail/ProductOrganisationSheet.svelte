<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Combobox, MultiSelectCombobox } from '$lib/components/organs/index.js';
	import Info from '@lucide/svelte/icons/info';
	import type { ProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import type { ProductCategory } from '$lib/product-categories/types.js';
	import type { ProductCollection } from '$lib/product-collection/types.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

	interface Props {
		open: boolean;
		product: ProductDetail | null;
		onSaved: () => void | Promise<void>;
	}

	let { open = $bindable(false), product, onSaved }: Props = $props();

	let orgCollectionIds = $state<string[]>([]);
	let orgCategoryId = $state('');
	let orgTagIds = $state<string[]>([]);
	let orgError = $state<string | null>(null);
	let orgSubmitting = $state(false);
	let orgTagCreating = $state(false);
	let collectionsList = $state<ProductCollection[]>([]);
	let categoriesList = $state<ProductCategory[]>([]);
	let tagsList = $state<Array<{ id: string; value: string }>>([]);

	const tagsOptions = $derived(tagsList.map((t) => ({ id: t.id, value: t.value })));
	const collectionsOptions = $derived(collectionsList.map((c) => ({ id: c.id, value: c.title })));
	const categoriesOptions = $derived(
		categoriesList.map((c) => ({ id: c.id, value: c.value }))
	);

	$effect(() => {
		if (open && product?.id) {
			orgCollectionIds = [...(product.collection_ids ?? product.collections?.map((c) => c.id) ?? [])];
			orgCategoryId = product.category_id ?? '';
			orgTagIds = [...(product.tag_ids ?? [])];
			orgError = null;
			loadCollectionsList();
			loadCategoriesList();
			loadTagsList();
		}
	});

	async function loadCollectionsList() {
		try {
			const res = await fetch(`${API_BASE}/collections?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as {
					rows?: ProductCollection[];
					collections?: ProductCollection[];
				};
				collectionsList = j.rows ?? j.collections ?? [];
			} else {
				collectionsList = [];
			}
		} catch {
			collectionsList = [];
		}
	}

	async function loadCategoriesList() {
		try {
			const res = await fetch(`${API_BASE}/product-categories?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { rows?: ProductCategory[]; data?: ProductCategory[] };
				categoriesList = j.rows ?? j.data ?? [];
			} else {
				categoriesList = [];
			}
		} catch {
			categoriesList = [];
		}
	}

	async function loadTagsList() {
		try {
			const res = await fetch(`${API_BASE}/product-tags?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { rows?: Array<{ id: string; value: string }> };
				tagsList = j.rows ?? [];
			} else {
				tagsList = [];
			}
		} catch {
			tagsList = [];
		}
	}

	function closeSheet() {
		open = false;
		orgError = null;
	}

	async function submitOrgSheet() {
		if (!product?.id) return;
		orgError = null;
		orgSubmitting = true;
		try {
			if (orgCategoryId) {
				const res = await fetch(
					`${API_BASE}/product-categories/${orgCategoryId}/products`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ product_ids: [product.id] })
					}
				);
				if (!res.ok) throw new Error(await res.text());
			} else {
				const res = await fetch(`${API_BASE}/products/${product.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ category_id: '' })
				});
				if (!res.ok) throw new Error(await res.text());
			}
			const orgRes = await fetch(`${API_BASE}/products/${product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ collection_ids: orgCollectionIds, tag_ids: orgTagIds })
			});
			if (!orgRes.ok) throw new Error(await orgRes.text());
			await onSaved();
			closeSheet();
		} catch (e) {
			orgError = e instanceof Error ? e.message : String(e);
		} finally {
			orgSubmitting = false;
		}
	}

	async function createAndSelectOrgTag(tagValue: string) {
		const value = tagValue.trim();
		if (!value || orgTagCreating) return;
		orgTagCreating = true;
		try {
			const res = await fetch(`${API_BASE}/product-tags`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ value })
			});
			if (!res.ok) throw new Error(await res.text());
			const tag = (await res.json()) as { id: string; value: string };
			tagsList = [...tagsList, { id: tag.id, value: tag.value }];
			orgTagIds = [...orgTagIds, tag.id];
		} catch {
			// leave so user can retry
		} finally {
			orgTagCreating = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		class="flex w-full flex-col sm:max-w-lg"
		side="right"
		onOpenAutoFocus={(e) => e.preventDefault()}
	>
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
				<label for="org-categories" class="text-sm font-medium">Type</label>
				<Combobox
					id="org-categories"
					bind:value={orgCategoryId}
					options={categoriesOptions}
					placeholder="Select category…"
					emptyMessage="No categories found"
				/>
			</div>
			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-medium">Collections</h3>
				<MultiSelectCombobox
					id="org-collections"
					bind:value={orgCollectionIds}
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
						disabled={orgTagCreating}
						onclick={async () => {
							const name = window.prompt('New tag name');
							if (name) await createAndSelectOrgTag(name);
						}}
					>
						{orgTagCreating ? 'Creating…' : 'Create tag'}
					</Button>
				</div>
				<MultiSelectCombobox
					id="org-tags"
					bind:value={orgTagIds}
					options={tagsOptions}
					placeholder="Type to search…"
					emptyMessage="No tags found"
				/>
			</div>
			{#if orgError}
				<p class="text-sm text-destructive">{orgError}</p>
			{/if}
		</div>
		<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={closeSheet} disabled={orgSubmitting}>Cancel</Button>
			<Button onclick={submitOrgSheet} disabled={orgSubmitting}>
				{orgSubmitting ? 'Saving…' : 'Save'}
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
