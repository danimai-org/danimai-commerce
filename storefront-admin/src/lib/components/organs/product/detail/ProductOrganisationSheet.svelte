<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Combobox, MultiSelectCombobox } from '$lib/components/organs/index.js';
	import Info from '@lucide/svelte/icons/info';
	
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

	type Props = {
		open: boolean;
	}


	const tagsOptions = $derived(getProductDetail().data?.tags?.map((t) => ({ id: t.id, value: t.value })) ?? []);

	const collectionsOptions = $derived(getProductDetail().data?.collections?.map((c) => ({ id: c.id, value: c.title })) ?? []);

	const categoriesOptions = $derived(
		getProductDetail().data?.category?.value ? [{ value: getProductDetail().data?.category?.value }] : []
	);
	
	const productCategoryId = $derived(getProductDetail().data?.category?.id);
	const productCollectionIds = $derived(getProductDetail().data?.collections?.map((c) => c.id));
	const productTagIds = $derived(getProductDetail().data?.tags?.map((t) => t.id)); 
	
	let { open = $bindable(false) }: Props = $props();

	

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
					// options={categoriesOptions}
					options={[]}
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
