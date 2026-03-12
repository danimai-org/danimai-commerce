<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		ProductHero,
		ProductStatus,
		ProductOrganisation,
		ProductSalesChannel,
		ProductAttribute,
		ProductVariant,
		MetadataComponent,
		JSONComponent
	} from '$lib/components/organs/index.js';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { loadProductDetail, getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import { resolve } from '$app/paths';

	const productId = $derived(page.params?.id ?? '');
	// $effect(() => {
	// 	loadProductDetail(productId);
	// });
	loadProductDetail(productId);
	const {
		data,
		error,
		isPending
	} = $derived(getProductDetail());

	// Variant state and logic are in ProductVariant component

</script>

<svelte:head>
	<title>{data ? `${data.title} | Product` : 'Product'} | Danimai Store</title>
	<meta name="description" content="Manage product." />
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Breadcrumb + actions -->
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground"
				onclick={() => goto(('/products'))}
			>
				Products
			</button>
			<span class="text-muted-foreground">/</span>
			<span class="font-medium">{data?.title ?? productId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !data}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Product not found'}</p>
			<Button variant="outline" onclick={() => goto(('/products'))}>Back to products</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="p-6">
				<div
					class="grid gap-6"
					style="grid-template-columns: 1fr 24rem; grid-auto-rows: minmax(0, auto); align-items: start;"
				>
					<!-- Product card (row 1) -->
					<ProductHero />

					<!-- Right: Status, Visibility, Organisation, Sales Channels, Attributes, Shipping -->
					<div class="row-span-2 flex w-80 flex-col gap-6 self-start">
						<ProductStatus/>
						<ProductOrganisation/>
						<ProductSalesChannel/>
						<ProductAttribute/>
					</div>

					<!-- Media + Options (row 2, column 1) --> 
					<div class="flex min-w-0 flex-col gap-6">
						<!-- Media card -->
						<div class="rounded-lg border bg-card p-6 shadow-sm">
							<div class="flex items-center justify-between">
								<h2 class="font-semibold">Media</h2>
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={() => {}}
									aria-label="Edit media"
								>
									<Pencil class="size-4" />
								</Button>
							</div>
							{#if data.title}
								<div class="mt-4">
									<img
										src={data.title}
										alt="Product"
										class="size-24 rounded-md border object-cover"
									/>
								</div>
							{:else}
								<div
									class="mt-4 flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 py-8 text-center text-sm text-muted-foreground"
								>
									<Upload class="size-8" />
									<p>No media yet</p>
									<p class="text-xs">Add media to the product to showcase it in your storefront.</p>
								</div>
							{/if}
						</div>

						<ProductVariant	/>

						<!-- Metadata / JSON -->
						<div class="grid gap-4 sm:grid-cols-2">
							<MetadataComponent
								productId={data?.id}
								metadata={data?.metadata ?? {}}
								onSaved={() => {}}
							/>
							<JSONComponent product={data} options={[]} variants={[]} category={null} />
						</div>
					</div>
				</div>
			</div>
		</div>

	{/if}
</div>
