<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { Button } from '$lib/components/ui/button/index.js';
	import { client } from '$lib/client';
	import {
		AttributeHeroCard
	} from '$lib/components/organs/attribute/detail/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { ProductListingCard } from '$lib/components/organs/index.js';
	const attributeId = $derived(page.params.id);
	

	const attributeQuery = $derived(
		createQuery(() => ({
			queryKey: ['product-attributes', attributeId],
			queryFn: async () => {
				return client['product-attributes']({ id: attributeId }).get();
			}
		}))
	);

	const attribute = $derived((attributeQuery.data?.data ?? null) as any | null);
	const loading = $derived(attributeQuery.isPending);
	const error = $derived(
		attributeQuery.error != null
			? attributeQuery.error instanceof Error
				? attributeQuery.error.message
				: String(attributeQuery.error)
			: null
	);
	async function refetchAttributeData() {
		await attributeQuery.refetch();
	}

	let selectedIds = $state<Set<string>>(new Set());
</script>

<svelte:head>
	<title>{attribute ? attribute.title : 'Attribute'} | Attributes | Danimai Store</title>
	<meta name="description" content="Manage product attributes." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] text-sm pl-[10px]">
			<button
				type="button"
				class="flex items-center gap-1 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products')}
			>
				<ChevronLeft class="size-4" />
				Products
			</button>
			<span class="text-muted-foreground">/</span>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/attributes')}
			>
				Attributes
			</button>
			<span class="text-muted-foreground">/</span>
			<span class="font-medium">{attribute?.title ?? attributeId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !attribute}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Attribute not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/attributes')}
				>Back to Attributes</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<div class="flex gap-6">
					<AttributeHeroCard {attribute} onUpdated={refetchAttributeData} />
				</div>

				
				<ProductListingCard
              title="Products with this Attribute"
             filter={{ attribute_ids: [attributeId] }} 
              bind:selectedIds={selectedIds}
              />

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={attribute?.id ?? null}
						metadata={attribute?.metadata ?? {}}
						metadataEntity="product-attribute"
						onSaved={refetchAttributeData}
					/>
					<JSONComponent product={attribute} options={[]} variants={[]} category={null} />

				</div>
			</div>
		</div>
	{/if}
</div>
