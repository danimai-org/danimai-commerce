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
	import type { PageData } from './$types';
	import { setDetailContext, useDetailQuery } from '$lib/hooks';
	import { client } from '$lib/client';

	let { data }: { data: PageData } = $props();

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
		<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
			<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground"
					onclick={() => goto(resolve('/products', {}))}
				>
					Products
				</button>
				<span class="text-muted-foreground">/</span>
				<span class="font-medium">{product?.title ?? productId ?? '…'}</span>
			</nav>
		</div>
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="p-6">
				<div
					class="grid gap-6"
					style="grid-template-columns: 1fr 24rem; grid-auto-rows: minmax(0, auto); align-items: start;"
				>
					<ProductHero productUpdateForm={data.productUpdateForm} />

					<div class="row-span-2 flex w-80 flex-col gap-6 self-start">
						<ProductStatus />
						<ProductOrganisation productOrganisationForm={data.productUpdateForm} />
						<ProductSalesChannel />
						<ProductAttribute productAttributesForm={data.productUpdateForm} />
					</div>

					<div class="flex min-w-0 flex-col gap-6">
						<ProductMediaCard productId={product?.id as string} />

						<ProductVariant />
					</div>

					<div class="col-span-2 grid w-full min-w-0 gap-4 sm:grid-cols-2">
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
