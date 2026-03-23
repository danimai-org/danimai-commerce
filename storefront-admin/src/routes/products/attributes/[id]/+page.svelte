<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import { AttributeHeroCard } from '$lib/components/organs/attribute/detail/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { ProductListingCard } from '$lib/components/organs/index.js';

	const attributeId = $derived(page.params?.id ?? '');

	type AttributeDetail = {
		id: string;
		title: string;
		type: string;
		metadata?: unknown | null;
	};

	const attributeDetailQuery = createQuery(() => ({
		queryKey: ['attribute-detail', attributeId],
		queryFn: async (): Promise<AttributeDetail | null> => {
			if (!attributeId) return null;
			const res = await client['product-attributes']({ id: attributeId }).get();
			if (res?.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					throw new Error('Attribute not found');
				}
				throw new Error(String(err?.value?.message ?? res.error));
			}
			return (res?.data ?? null) as AttributeDetail | null;
		},
		enabled: !!attributeId,
		refetchOnWindowFocus: false
	}));

	const attribute = $derived(attributeDetailQuery.data ?? null);
	const loading = $derived(attributeDetailQuery.isPending && attributeDetailQuery.isFetching);
	const error = $derived(
		attributeDetailQuery.error != null
			? attributeDetailQuery.error instanceof Error
				? attributeDetailQuery.error.message
				: String(attributeDetailQuery.error)
			: attribute === null && attributeDetailQuery.isSuccess && attributeId
				? 'Attribute not found'
				: null
	);
	const displayName = $derived(attribute?.title ?? attributeId ?? 'Attribute');
	let selectedIds = $state<Set<string>>(new Set());
	async function refetchAttribute() {
		await attributeDetailQuery.refetch();
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
					bind:selectedIds
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
