<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		AttributeGroupHeroCard,
		AttributeGroupAttributesCard
	} from '$lib/components/organs/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { getAttributeGroup } from '$lib/product-attribute-groups/api.js';
	import type { ProductAttributeGroupDetail } from '$lib/product-attribute-groups/types.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';

	const groupId = $derived(page.params.id);

	let group = $state<ProductAttributeGroupDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadGroup() {
		if (!groupId) return;
		loading = true;
		error = null;
		try {
			const data = await getAttributeGroup(groupId);
			if (data === null) {
				error = 'Attribute group not found';
				group = null;
			} else {
				group = data;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			group = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		groupId;
		loadGroup();
	});

</script>

<svelte:head>
	<title>{group ? group.title : 'Attribute Group'} | Attribute Groups | Danimai Store</title>
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

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !group}
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
						onUpdated={loadGroup}
						onDeleted={() => goto('/products/attribute-groups')}
					/>
				</div>

				<AttributeGroupAttributesCard {group} />
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<MetadataComponent
						productId={group?.id ?? null}
						metadata={group?.metadata as Record<string, unknown> | null}
						onSaved={loadGroup}
					/>

					<JSONComponent product={group} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
