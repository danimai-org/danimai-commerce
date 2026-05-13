<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import AttributeGroupHeroCard from '$lib/components/organs/attribute-group/detail/AttributeGroupHeroCard.svelte';
	import AttributeGroupAttributesCard from '$lib/components/organs/attribute-group/detail/AttributeGroupAttributesCard.svelte';

	import { parseAttributeGroupPayload } from '$lib/components/organs/attribute-group/type.js';
	import { setDetailContext, useDetailQuery } from '$lib/hooks';
	import { ProductListingCard } from '$lib/components/organs/index.js';

	const groupId = $derived(page.params?.id ?? '');

	const detailQuery = useDetailQuery(
		async () => {
			const res = await client['product-attribute-groups']({ id: page.params?.id ?? '' }).get();
			return parseAttributeGroupPayload(res.data);
		},
		() => ['attribute-group-detail', page.params?.id ?? '']
	);

	setDetailContext(detailQuery);

	const error = $derived(detailQuery?.error);
	const isPending = $derived(detailQuery?.isPending);

	let selectedIds = $state<Set<string>>(new Set());
</script>

<svelte:head>
	<title
		>{detailQuery?.data?.title ?? groupId ?? 'Attribute group'} | Attribute groups | Danimai Store</title
	>
	<meta name="description" content="Manage product attribute groups." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/products/attribute-groups', {}), { replaceState: true })}
			>
				<ListFilter class="size-4 shrink-0" />
				<span>Attribute groups</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{detailQuery?.data?.title ?? groupId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !detailQuery?.data}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Attribute group not found'}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/products/attribute-groups', {}), { replaceState: true })}
				>Back to Attribute groups</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<AttributeGroupHeroCard />

			<div class="flex flex-col gap-4 p-6">
				<AttributeGroupAttributesCard />
				<ProductListingCard
					title="Products with this attribute group"
					filter={{ attribute_group_ids: [detailQuery?.data?.id ?? ''] }}
					pickerFilter={{}}
					bind:selectedIds
				/>
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<MetadataComponent
						productId={detailQuery?.data?.id ?? ''}
						metadata={detailQuery?.data?.metadata as Record<string, unknown> | null}
						metadataEntity="product-attribute-group"
						onSaved={() => {
							void detailQuery?.refetch();
						}}
					/>

					<JSONComponent
						product={detailQuery?.data ?? null}
						options={[]}
						variants={[]}
						category={null}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
