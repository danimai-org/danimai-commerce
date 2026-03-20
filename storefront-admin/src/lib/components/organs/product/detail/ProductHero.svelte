<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditProductSheet from './EditProductSheet.svelte';
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import type { SuperValidated } from 'sveltekit-superforms';

	type ProductUpdateFormData = {
		id: string;
		status: 'draft' | 'proposed' | 'published' | 'rejected';
		title: string;
		subtitle: string;
		handle: string;
		description: string;
		discountable: boolean;
	};

	let {
		productUpdateForm
	}: {
		productUpdateForm: SuperValidated<ProductUpdateFormData>;
	} = $props();

	const product = $derived(getProductDetail()?.data?? null);

	let editSheetOpen = $state(false);

	const handleDisplay = $derived(
		product?.handle ? (product.handle.startsWith('/') ? product.handle : `/${product.handle}`) : '—'
	);
</script>

<div class="min-w-0 self-start rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-4">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">{product?.title ?? '—'}</h1>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={() => (editSheetOpen = true)}
				aria-label="Edit product"
			>
				<Pencil class="size-4" />
			</Button>
		</div>
	</section>
	<div class="rounded-lg bg-card pt-6 pr-6 pb-6 pl-0">
		<dl class="mt-0 grid gap-3 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Description</dt>
				<dd class="text-right">{product?.description || '—'}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Handle</dt>
				<dd class="text-right">{handleDisplay}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Discountable</dt>
				<dd class="text-right">
					<!-- {product?.discountable === true
						? 'True'
						: product?.discountable === false
							? 'False'
							: '—'} -->
							True
				</dd>
			</div>
		</dl>
	</div>
</div>

<EditProductSheet
	bind:open={editSheetOpen}
	{productUpdateForm}
	onSaved={() => void getProductDetail()?.refetch?.()}
/>
