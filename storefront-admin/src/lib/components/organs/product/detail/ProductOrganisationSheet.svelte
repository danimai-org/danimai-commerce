<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Combobox, MultiSelectCombobox } from '$lib/components/organs/index.js';
	import Info from '@lucide/svelte/icons/info';
	import { client } from '$lib/client.js';

	import { SvelteMap } from 'svelte/reactivity';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { getDetailContext } from '$lib/hooks';
	import type { Product } from '../type';

	type ProductOrganisationFormData = {
		id: string;
		category_id: string;
		collection_ids: string[];
		tag_ids: string[];
	};

	type Props = {
		open?: boolean;
		productOrganisationForm: SuperValidated<
			ProductOrganisationFormData,
			string | unknown,
			Record<string, unknown>
		>;
		onSaved?: () => void | Promise<void>;
	};

	type Option = { id: string; value: string };
	type ListQuery = {
		search?: string;
		page?: string | number;
		limit?: string | number;
		sorting_field?: string;
	};

	function extractRows<T>(response: unknown): T[] {
		const payload = (response as { data?: { rows?: T[]; data?: T[] } | T[] } | null)?.data;
		if (Array.isArray(payload)) return payload;
		if (Array.isArray(payload?.rows)) return payload.rows;
		if (Array.isArray(payload?.data)) return payload.data;
		return [];
	}
	function uniqById(options: Option[]): Option[] {
		const map = new SvelteMap<string, Option>();
		for (const option of options) map.set(option.id, option);
		return Array.from(map.values());
	}

	function buildQuery(search: string): ListQuery {
		return { page: 1, limit: 100, sorting_field: 'created_at', search: search.trim() || undefined };
	}

	// const passthrough = (opts: Option[]) => opts;

	const product = $derived(getDetailContext<Product>()?.data ?? null);

	const selectedTags = $derived(
		(product as { tags?: Array<{ id: string; value: string }> } | null)?.tags?.map((t) => ({
			id: t.id,
			value: t.value
		})) ?? []
	);
	const selectedCollections = $derived(
		(product as { collections?: Array<{ id: string; title: string }> } | null)?.collections?.map(
			(c) => ({ id: c.id, value: c.title })
		) ?? []
	);
	const selectedCategories = $derived<Option[]>(
		(product as { category?: { id: string; value: string } } | null)?.category?.id &&
			(product as { category?: { id: string; value: string } } | null)?.category?.value
			? [
					{
						id: (product as { category?: { id: string } } | null)?.category?.id ?? '',
						value: (product as { category?: { value: string } } | null)?.category?.value ?? ''
					}
				]
			: []
	);

	let fetchedTags = $state<Option[]>([]);
	let fetchedCollections = $state<Option[]>([]);
	let fetchedCategories = $state<Option[]>([]);

	const tagsOptions = $derived(uniqById([...fetchedTags, ...selectedTags]));
	const collectionsOptions = $derived(uniqById([...fetchedCollections, ...selectedCollections]));
	const categoriesOptions = $derived(uniqById([...fetchedCategories, ...selectedCategories]));

	const productCategoryId = $derived(
		(product as { category?: { id: string } } | null)?.category?.id ?? ''
	);
	const productCollectionIds = $derived(
		(product as { collections?: Array<{ id: string }> } | null)?.collections?.map((c) => c.id) ?? []
	);
	const productTagIds = $derived(
		(product as { tags?: Array<{ id: string }> } | null)?.tags?.map((t) => t.id) ?? []
	);
	const productId = $derived((product as { id?: string } | null)?.id ?? '');

	let {
		open = $bindable(false),
		productOrganisationForm,
		onSaved = async () => {}
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form } = superForm(productOrganisationForm, {
		resetForm: true,
		invalidateAll: false
	});

	let selectedCategoryId = $state('');
	let selectedCollectionIds = $state<string[]>([]);
	let selectedTagIds = $state<string[]>([]);
	let submitting = $state(false);
	let saveError = $state<string | null>(null);
	let prevOpen = $state(false);

	let categorySearch = $state('');
	let debouncedCategorySearch = $state('');
	let categoryLoading = $state(false);
	let collectionSearch = $state('');
	let debouncedCollectionSearch = $state('');
	let collectionLoading = $state(false);
	let tagSearch = $state('');
	let debouncedTagSearch = $state('');
	let tagLoading = $state(false);

	$effect(() => {
		const q = categorySearch;
		categoryLoading = true;
		const t = setTimeout(() => {
			debouncedCategorySearch = q;
		}, 300);
		return () => clearTimeout(t);
	});
	$effect(() => {
		const q = collectionSearch;
		collectionLoading = true;
		const t = setTimeout(() => {
			debouncedCollectionSearch = q;
		}, 300);
		return () => clearTimeout(t);
	});
	$effect(() => {
		const q = tagSearch;
		tagLoading = true;
		const t = setTimeout(() => {
			debouncedTagSearch = q;
		}, 300);
		return () => clearTimeout(t);
	});

	$effect(() => {
		if (!open) return;
		const search = debouncedCategorySearch;
		categoryLoading = true;
		void (async () => {
			try {
				const res = await client['product-categories'].get({ query: buildQuery(search) });
				fetchedCategories = extractRows<{ id: string; value: string }>(res).map((c) => ({
					id: c.id,
					value: c.value
				}));
			} catch {
				/* keep existing options */
			} finally {
				categoryLoading = false;
			}
		})();
	});

	$effect(() => {
		if (!open) return;
		const search = debouncedCollectionSearch;
		collectionLoading = true;
		void (async () => {
			try {
				const res = await client.collections.get({ query: buildQuery(search) });
				fetchedCollections = extractRows<{ id: string; title: string }>(res).map((c) => ({
					id: c.id,
					value: c.title
				}));
			} catch {
				/* keep existing options */
			} finally {
				collectionLoading = false;
			}
		})();
	});

	$effect(() => {
		if (!open) return;
		const search = debouncedTagSearch;
		tagLoading = true;
		void (async () => {
			try {
				const res = await client['product-tags'].get({ query: buildQuery(search) });
				fetchedTags = extractRows<{ id: string; value: string }>(res).map((t) => ({
					id: t.id,
					value: t.value
				}));
			} catch {
				/* keep existing options */
			} finally {
				tagLoading = false;
			}
		})();
	});

	$effect(() => {
		if (open && !prevOpen) {
			selectedCategoryId = productCategoryId;
			selectedCollectionIds = [...productCollectionIds];
			selectedTagIds = [...productTagIds];
			saveError = null;
			categorySearch = '';
			debouncedCategorySearch = '';
			collectionSearch = '';
			debouncedCollectionSearch = '';
			tagSearch = '';
			debouncedTagSearch = '';
		}
		prevOpen = open;
	});

	async function saveOrganisation() {
		if (!productId || submitting) return;
		submitting = true;
		saveError = null;
		try {
			const payload = {
				...(selectedCategoryId ? { category_id: selectedCategoryId } : {}),
				collection_ids: selectedCollectionIds,
				tag_ids: selectedTagIds
			};
			const response = await client.products({ id: productId }).put(payload);

			if (response.error) {
				const err = response.error as { value?: { message?: string } };
				saveError = err.value?.message ?? 'Failed to update product organisation';
				return;
			}

			await onSaved();
			open = false;
		} catch (error) {
			saveError = error instanceof Error ? error.message : String(error);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right" data-product-id={$form.id}>
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
			{#if saveError}
				<p class="text-sm text-destructive">{saveError}</p>
			{/if}
			<div class="flex flex-col gap-2">
				<label for="org-categories" class="text-sm font-medium">Category</label>
				<Combobox
					id="org-categories"
					bind:value={selectedCategoryId}
					options={categoriesOptions}
					placeholder="Search categories…"
					emptyMessage="No categories found"
					disabled={submitting}
					loading={categoryLoading}
					onSearchChange={(q) => {
						categorySearch = q;
					}}
				/>
			</div>
			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-medium">Collections</h3>
				<MultiSelectCombobox
					id="org-collections"
					bind:value={selectedCollectionIds}
					options={collectionsOptions}
					placeholder="Search collections…"
					emptyMessage="No collections yet."
					disabled={submitting}
					loading={collectionLoading}
					onSearchChange={(q) => {
						collectionSearch = q;
					}}
				/>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between gap-2">
					<label for="org-tags-search" class="text-sm font-medium">
						Tags <span class="font-normal text-muted-foreground">(Optional)</span>
					</label>
				</div>
				<MultiSelectCombobox
					id="org-tags"
					bind:value={selectedTagIds}
					options={tagsOptions}
					placeholder="Type to search…"
					emptyMessage="No tags found"
					disabled={submitting}
					loading={tagLoading}
					onSearchChange={(q) => {
						tagSearch = q;
					}}
				/>
			</div>
		</div>
		<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={() => (open = false)} disabled={submitting}>Cancel</Button>
			<Button onclick={saveOrganisation} disabled={submitting}>
				{submitting ? 'Saving…' : 'Save'}
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
