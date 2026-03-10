<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ProductOrganisationSheet from './ProductOrganisationSheet.svelte';
	import type { Product } from '$lib/products/types.js';
	import type { ProductCategory } from '$lib/product-categories/types.js';
	import type { ProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

	type ProductWithOrgFields = Product & {
		collection_ids?: string[];
		tag_ids?: string[];
		collections?: Array<{ id: string; title: string }>;
		tags?: Array<{ id: string; value: string }>;
	};

	interface Props {
		product: ProductWithOrgFields | ProductDetail | null;
		category: ProductCategory | null;
		onSaved: () => void | Promise<void>;
	}

	let { product, category, onSaved }: Props = $props();

	let orgSheetOpen = $state(false);
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between gap-2">
		<h2 class="font-semibold">Organisation</h2>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={() => (orgSheetOpen = true)}
			aria-label="Edit organisation"
		>
			<Pencil class="size-4" />
		</Button>
	</div>
	<dl class="mt-4 grid gap-3 text-sm">
		<div>
			<dt class="font-medium text-muted-foreground">Category</dt>
			<dd class="mt-0.5">{category?.value ?? '—'}</dd>
		</div>
		<div>
			<dt class="font-medium text-muted-foreground">Collections</dt>
			<dd class="mt-0.5">
				{#if product?.collections?.length}
					{product.collections.map((c) => c.title).join(', ')}
				{:else if product?.collection_ids?.length}
					{product.collection_ids.length} collection(s)
				{:else}
					—
				{/if}
			</dd>
		</div>
		<div>
			<dt class="font-medium text-muted-foreground">Tags</dt>
			<dd class="mt-0.5">
				{#if product?.tags?.length}
					{product.tags.map((t) => t.value).join(', ')}
				{:else if product?.tag_ids?.length}
					{product.tag_ids.length} tag(s)
				{:else}
					—
				{/if}
			</dd>
		</div>
	</dl>
</div>

<ProductOrganisationSheet bind:open={orgSheetOpen} product={product as ProductDetail | null} onSaved={onSaved} />
