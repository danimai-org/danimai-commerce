<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import EditAttributesSheet from './EditAttributesSheet.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { Product } from '../type';
	import { getDetailContext } from '$lib/hooks';

	type ProductAttributeGroup = {
		id: string;
		attributes: Array<{
			attribute_group_id: string;
			attribute_id: string;
			attribute_group_title?: string;
			value: string;
		}>;
	};
	type AttributeDisplayGroup = {
		id: string;
		title: string;
		rows: Array<{ id: string; title: string; value: string }>;
	};

	let {
		productAttributesForm = $bindable(
			{} as SuperValidated<ProductAttributeGroup, string | unknown, Record<string, unknown>>
		)
	}: {
		productAttributesForm: SuperValidated<
			ProductAttributeGroup,
			string | unknown,
			Record<string, unknown>
		>;
	} = $props();

	const product = $derived(getDetailContext<Product>()?.data ?? null);

	const attributesGroup = $derived.by<AttributeDisplayGroup[]>(() => {
		const formAttributes = productAttributesForm?.data?.attributes ?? [];
		if (formAttributes.length > 0) {
			const grouped: AttributeDisplayGroup[] = [];
			for (const [index, attr] of formAttributes.entries()) {
				const groupId = attr.attribute_group_id || 'ungrouped';
				const groupTitle =
					attr.attribute_group_title || attr.attribute_group_id || 'Attribute Group';
				let group = grouped.find((g) => g.id === groupId);
				if (!group) {
					group = { id: groupId, title: groupTitle, rows: [] };
					grouped.push(group);
				}
				group.rows.push({
					id: `${attr.attribute_group_id}:${attr.attribute_id}:${index}`,
					title: attr.attribute_id,
					value: attr.value
				});
			}
			return grouped;
		}
		const attributes =
			(product as { attributes?: Array<{ id: string; title: string; value: string }> } | null)
				?.attributes ?? [];
		if (attributes.length === 0) return [];
		return [{ id: 'default', title: 'Attributes', rows: attributes }];
	});
	let editAttributesSheetOpen = $state(false);
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Attributes</h2>

		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={() => {
				editAttributesSheetOpen = true;
			}}
			aria-label="Edit attributes"
		>
			<Pencil class="size-4" />
		</Button>
	</div>
	<dl class="mt-4 space-y-4 text-sm">
		{#if attributesGroup.length > 0}
			{#each attributesGroup as group (group.id)}
				<div class="rounded-md border p-3">
					<dt class="font-medium text-foreground">{group.title}</dt>
					<div class="mt-2 space-y-2">
						{#each group.rows as attr (attr.id)}
							<dd class="grid grid-cols-[1fr_auto] gap-4">
								<span class="text-muted-foreground">{attr.title}</span>
								<span class="wrap-break-word text-foreground">{attr.value ?? '—'}</span>
							</dd>
						{/each}
					</div>
				</div>
			{/each}
		{:else}
			<div>
				<dt class="font-medium text-muted-foreground">No attributes</dt>
				<dd>—</dd>
			</div>
		{/if}
	</dl>
</div>

<EditAttributesSheet
	bind:open={editAttributesSheetOpen}
	{productAttributesForm}
	onSaved={() => void getProductDetail()?.refetch?.()}
/>
