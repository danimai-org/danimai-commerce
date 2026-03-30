<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { AttributeHeroCard } from '$lib/components/organs/attribute/detail/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { ProductListingCard } from '$lib/components/organs/index.js';

	import { createQuery } from '@tanstack/svelte-query';
	import { setDetailContext } from '$lib/hooks';

	const attributeId = $derived(page.params?.id ?? '');

	const detailQuery = createQuery(() => ({
		queryKey: ['attribute-detail', page.params?.id ?? ''],
		queryFn: async () => {
			const id = page.params?.id ?? '';
			const res = await client['product-attributes']({ id }).get();
			return res.data ?? null;
		},
		refetchOnWindowFocus: false
	}));

	setDetailContext(detailQuery);

	const attribute = $derived(detailQuery?.data ?? null);
	const error = $derived(detailQuery?.error);
	const isPending = $derived(detailQuery?.isPending);

	let selectedIds = $state<Set<string>>(new Set());
</script>

<svelte:head>
	<title>{attribute?.title ?? attributeId ?? 'Attribute'} | Attributes | Danimai Store</title>
	<meta name="description" content="Manage product attributes." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/products/attributes', {}), { replaceState: true })}
			>
				<SlidersHorizontal class="size-4 shrink-0" />
				<span>Attributes</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{attribute?.title ?? attributeId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !attribute}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Attribute not found'}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/products/attributes', {}), { replaceState: true })}
				>Back to Attributes</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<AttributeHeroCard />

			<div class="flex flex-col gap-8 p-6">
				<ProductListingCard
					title="Products with this Attribute"
					filter={{ attribute_ids: [attributeId] }}
					pickerFilter={{}}
					bind:selectedIds
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={attribute.id}
						metadataEntity="product-attribute"
						metadata={attribute.metadata as Record<string, unknown> | null}
						onSaved={() => {
							void detailQuery?.refetch();
						}}
					/>
					<JSONComponent product={attribute} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
