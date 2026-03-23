<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/client.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import AttributeGroupHeroCard from '$lib/components/organs/attribute-group/detail/AttributeGroupHeroCard.svelte';
	import AttributeGroupAttributesCard from '$lib/components/organs/attribute-group/detail/AttributeGroupAttributesCard.svelte';
	import { ProductListingCard } from '$lib/components/organs/index.js';

	const groupId = $derived(page.params?.id ?? '');

	type GroupAttribute = { id: string; title: string; type: string };
	type AttributeGroupDetail = {
		id: string;
		title: string;
		metadata: unknown | null;
		attributes: GroupAttribute[];
	};

	function parseAttributeGroupPayload(raw: unknown): AttributeGroupDetail | null {
		if (raw == null || typeof raw !== 'object') return null;
		let o = raw as Record<string, unknown>;
		if ('data' in o && o.data != null && typeof o.data === 'object' && !('title' in o)) {
			o = o.data as Record<string, unknown>;
		}
		const id = o.id;
		const title = o.title;
		if (typeof id !== 'string' || typeof title !== 'string') return null;
		let attrsRaw = o.attributes;
		if (attrsRaw == null) attrsRaw = [];
		else if (typeof attrsRaw === 'string') {
			try {
				attrsRaw = JSON.parse(attrsRaw);
			} catch {
				attrsRaw = [];
			}
		}
		if (!Array.isArray(attrsRaw)) attrsRaw = [];
		const attributes: GroupAttribute[] = [];
		for (const a of attrsRaw) {
			if (a != null && typeof a === 'object') {
				const r = a as Record<string, unknown>;
				if (typeof r.id === 'string' && typeof r.title === 'string' && typeof r.type === 'string') {
					attributes.push({ id: r.id, title: r.title, type: r.type });
				}
			} else if (typeof a === 'string') {
				try {
					const r = JSON.parse(a) as Record<string, unknown>;
					if (
						typeof r.id === 'string' &&
						typeof r.title === 'string' &&
						typeof r.type === 'string'
					) {
						attributes.push({ id: r.id, title: r.title, type: r.type });
					}
				} catch {
					/* skip */
				}
			}
		}
		return {
			id,
			title,
			metadata: (o.metadata ?? null) as unknown,
			attributes
		};
	}

	const groupDetailQuery = createQuery(() => ({
		queryKey: ['attribute-group-detail', groupId],
		queryFn: async (): Promise<AttributeGroupDetail | null> => {
			if (!groupId) return null;
			const res = await client['product-attribute-groups']({ id: groupId }).get();
			if (res?.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					throw new Error('Attribute group not found');
				}
				throw new Error(String(err?.value?.message ?? res.error));
			}
			return parseAttributeGroupPayload(res?.data as unknown);
		},
		enabled: !!groupId,
		refetchOnWindowFocus: false
	}));

	const group = $derived(groupDetailQuery.data ?? null);
	const attributes = $derived(group?.attributes ?? []);
	const loading = $derived(groupDetailQuery.isPending && groupDetailQuery.isFetching);
	const error = $derived(
		groupDetailQuery.error != null
			? groupDetailQuery.error instanceof Error
				? groupDetailQuery.error.message
				: String(groupDetailQuery.error)
			: group === null && groupDetailQuery.isSuccess && groupId
				? 'Attribute group not found'
				: null
	);

	const displayName = $derived(group?.title ?? groupId ?? 'Attribute group');

	let selectedIds = $state<Set<string>>(new Set());

	async function refetchGroupData() {
		await groupDetailQuery.refetch();
	}
</script>

<svelte:head>
	<title>{displayName} | Attribute groups | Danimai Store</title>
	<meta name="description" content="Manage product attribute groups." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div
			class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-sm text-muted-foreground"
		>
			<a href={resolve('/products/attribute-groups', {})} class="hover:text-foreground"
				>Attribute groups</a
			>
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
		{:else if group}
			<div class="flex flex-col gap-6">
				<div class="rounded-lg">
					<AttributeGroupHeroCard
						{group}
						onRefetch={refetchGroupData}
						onDeleted={() => goto(resolve('/products/attribute-groups', {}))}
					/>
				</div>

				<AttributeGroupAttributesCard {group} {attributes} />
				<ProductListingCard
					title="Products with this attribute group"
					filter={{ attribute_group_ids: [groupId] }}
					pickerFilter={{}}
					bind:selectedIds
				/>
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<MetadataComponent
						productId={group.id}
						metadata={group.metadata as Record<string, unknown> | null}
						metadataEntity="product-attribute-group"
						onSaved={refetchGroupData}
					/>

					<JSONComponent product={group} options={[]} variants={[]} category={null} />
				</div>
			</div>
		{/if}
	</div>
</div>
