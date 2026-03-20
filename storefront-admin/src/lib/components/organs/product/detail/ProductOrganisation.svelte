<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ProductOrganisationSheet from './ProductOrganisationSheet.svelte';
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import type { SuperValidated } from 'sveltekit-superforms';

	type ProductOrganisationFormData = {
		id: string;
		category_id: string;
		collection_ids: string[];
		tag_ids: string[];
	};

	let {
		productOrganisationForm
	}: {
		productOrganisationForm: SuperValidated<ProductOrganisationFormData>;
	} = $props();

	const product = $derived(getProductDetail()?.data ?? null);

	let orgSheetOpen = $state(false);
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between gap-2">
		<h2 class="font-semibold">Organisation</h2>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={() => {
				
				orgSheetOpen = true;
			}}
			aria-label="Edit organisation"
		>
			<Pencil class="size-4" />
		</Button>
	</div>
	<dl class="mt-4 grid gap-3 text-sm">
		<div>
			<dt class="font-medium text-muted-foreground">Category</dt>
			<dd class="mt-0.5">{product?.category?.value || '—'}</dd>
		</div>
		<div>
			<dt class="font-medium text-muted-foreground">Collections</dt>
			<dd class="mt-0.5">
				{#if product?.collections?.length}
					{product.collections.map((c) => c.title).join(', ')}
				{product.collections.length > 0 ? product.collections.map((c) => c.title).join(', ') : '—'}
				{/if}
			</dd>
		</div>
		<div>
			<dt class="font-medium text-muted-foreground">Tags</dt>
			<dd class="mt-0.5">
				{#if product?.tags?.length}
					{product.tags.map((t) => t.value).join(', ')}
				{:else}
					—
				{/if}
			</dd>
		</div>
	</dl>
</div>

<ProductOrganisationSheet
	bind:open={orgSheetOpen}
	{productOrganisationForm}
	onSaved={() => void getProductDetail()?.refetch?.()}
/>
