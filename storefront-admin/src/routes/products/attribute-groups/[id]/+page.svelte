<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { client } from '$lib/client';
	import { createQuery } from '@tanstack/svelte-query';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import AttributeGroupHeroCard from '$lib/components/organs/attribute-group/detail/AttributeGroupHeroCard.svelte';
	import AttributeGroupAttributesCard from '$lib/components/organs/attribute-group/detail/AttributeGroupAttributesCard.svelte';
	
	const groupId = $derived(page.params.id);
	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const attributeQuery = $derived(createQuery(() => ({
		queryKey: ['product-attributes', paginationQuery],
		queryFn: async () => {
			const res = await client['product-attributes'].get({ query: paginationQuery });
			return res;
		}
	})));

	const groupQuery = $derived(createQuery(() => ({
		queryKey: ['product-attribute-groups', groupId],
		queryFn: async () => {
			const res = await client['product-attribute-groups']({ id: groupId }).get();
			return res;
		}
	})));

	const group = $derived((groupQuery.data?.data ?? null) as any | null);
	const attributes = $derived(
		(attributeQuery.data?.data?.rows ?? []) as any[]
	);
	const isPending = $derived(groupQuery.isPending || attributeQuery.isPending);
	const error = $derived(groupQuery.error || attributeQuery.error);

	const refetchGroupData = async () => {
		await Promise.all([groupQuery.refetch(), attributeQuery.refetch()]);
	};
</script>

<svelte:head>
	<title>{group?.title ?? groupId ?? '…'} | Attribute Group</title>
	<meta name="description" content="Manage product attribute groups." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/attribute-groups')}
			>
				<ListFilter class="size-4 shrink-0" />
				<span>Attribute Groups</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{group?.title ?? groupId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || group === null}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Attribute group not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/attribute-groups')}>
				Back to Attribute Groups
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<div class="rounded-lg">
					<AttributeGroupHeroCard
						{group}
						onRefetch={refetchGroupData}
						onDeleted={() => goto('/products/attribute-groups')}
					/>
					
				</div>

				<AttributeGroupAttributesCard group={group} attributes={attributes} />
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<MetadataComponent
						productId={group?.id ?? null}
						metadata={group?.metadata as Record<string, unknown> | null}
						onSaved={refetchGroupData}
					/>

					<JSONComponent product={group} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
