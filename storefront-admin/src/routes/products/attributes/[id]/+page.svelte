<script lang="ts">
	import { page } from '$app/state';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import { AttributeHeroCard } from '$lib/components/organs/attribute/detail/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { ProductListingCard } from '$lib/components/organs/index.js';
	import { createPagination } from '$lib/api';
	import { createPaginationQuery } from '$lib/api';
	const attributeId = $derived(page.params?.id ?? '');

	const paginateState = createPagination(
		async () => client['product-attributes']({ id: attributeId }).get(),
		['attribute-detail', attributeId],
		createPaginationQuery(page.url.searchParams)
	);

	const attribute = $derived(paginateState.query.data?.data ?? null);
	const loading = $derived(paginateState.loading);
	const error = $derived(
		paginateState.query.error != null
			? paginateState.query.error instanceof Error
				? paginateState.query.error.message
				: String(paginateState.query.error)
			: null
	);
	const displayName = $derived(attribute?.title ?? attributeId ?? 'Attribute');

	async function refetchAttribute() {
		await paginateState.refetch();
	}
</script>

<svelte:head>
	<title>{displayName} | Attributes | Danimai Store</title>
	<meta name="description" content="Manage product attributes." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div
			class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-sm text-muted-foreground"
		>
			<a href={resolve('/products/attributes', {})} class="hover:text-foreground">Attributes</a>
			<span>/</span>
			<span class="text-foreground">{displayName}</span>
		</div>
		{#if error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{error}
			</div>
		{:else if loading}
			<div class="flex min-h-0 flex-1 items-center justify-center">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else if attribute}
			<div class="flex flex-col gap-6">
				<div class="flex gap-6">
					<AttributeHeroCard {attribute} onUpdated={refetchAttribute} />
				</div>

				<ProductListingCard
					title="Products with this Attribute"
					filter={{ attribute_ids: [attributeId] }}
					pickerFilter={{}}
					selectedIds={new Set()}
				/>
				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={attribute.id}
						metadataEntity="product-attribute"
						metadata={attribute.metadata as Record<string, unknown> | null}
						onSaved={refetchAttribute}
					/>
					<JSONComponent product={attribute} options={[]} variants={[]} category={null} />
				</div>
			</div>
		{/if}
	</div>
</div>
