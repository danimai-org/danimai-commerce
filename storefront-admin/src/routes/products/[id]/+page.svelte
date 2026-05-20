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
		ProductMediaCard,
		MetadataComponent,
		JSONComponent
	} from '$lib/components/organs/index.js';
	import { resolve } from '$app/paths';
	import type { ProductDetailPageData } from '$lib/components/organs/product/product-detail-forms.js';
	import { setDetailContext, useDetailQuery } from '$lib/hooks';
	import { client } from '$lib/client';

	let { data }: { data: ProductDetailPageData } = $props();

	const productId = $derived(page.params?.id ?? '');
	const detailQuery = useDetailQuery(async () => {
		const res = await client.products({ id: productId }).get();
		return res.data;
	}, ['product-detail', productId]);

	setDetailContext(detailQuery);

	const product = $derived(detailQuery?.data ?? null);
	const error = $derived(detailQuery?.error);
	const isPending = $derived(detailQuery?.isPending);
</script>

<svelte:head>
	<title>{product?.title ? `${product.title} | Product` : 'Product'} | Danimai Store</title>
	<meta name="description" content="Manage product." />
</svelte:head>

<div class="flex h-full flex-col">
	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !product}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Product not found'}</p>
			<Button variant="outline" onclick={() => goto(resolve('/products', {}))}
				>Back to products</Button
			>
		</div>
	{:else}
		<div class="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
			<nav class="flex min-w-0 flex-wrap items-center gap-1 gap-y-1 pl-0 text-sm sm:gap-[5px] sm:pl-[10px]">
				<button
					type="button"
					class="shrink-0 text-muted-foreground hover:text-foreground"
					onclick={() => goto(resolve('/products', {}))}
				>
					Products
				</button>
				<span class="shrink-0 text-muted-foreground">/</span>
				<span class="min-w-0 truncate font-medium">{product?.title ?? productId ?? '…'}</span>
			</nav>
		</div>
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="p-4 sm:p-6">
				<div
					class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start"
				>
					<ProductHero productUpdateForm={data.productUpdateForm} />

					<div
						class="flex w-full min-w-0 flex-col gap-6 self-start lg:row-span-2 lg:w-auto"
					>
						<ProductStatus />
						<ProductOrganisation productOrganisationForm={data.productUpdateForm} />
						<ProductSalesChannel />
						<ProductAttribute productAttributesForm={data.productUpdateForm} />
					</div>

					<div class="flex min-w-0 flex-col gap-6">
						<ProductMediaCard productId={product?.id as string} />

						<ProductVariant productVariantUpdateForm={data.productVariantUpdateForm} />
					</div>

					<div
						class="col-span-1 grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:col-span-2"
					>
						<MetadataComponent
							productId={product?.id}
							metadata={product?.metadata ?? {}}
							onSaved={() => {}}
						/>
						<JSONComponent {product} options={[]} variants={[]} category={null} />
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
