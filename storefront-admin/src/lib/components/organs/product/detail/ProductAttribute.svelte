<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import EditAttributesSheet from './EditAttributesSheet.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { Product } from '../type';
	import { getDetailContext } from '$lib/hooks';
	import { client } from '$lib/client';
	import { onMount } from 'svelte';

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
	type ProductAttributeRow = {
		id: string;
		title: string;
		value: string;
		attribute_group_id: string | null;
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

	let groupTitlesById = $state<Record<string, string>>({});

	onMount(async () => {
		try {
			const res = await client['product-attribute-groups'].get({
				query: { page: 1, limit: 100, search: '', sorting_field: 'created_at' }
			});
			const payload = res as unknown as { data?: unknown };
			const data = payload?.data;
			const rows: Array<{ id: string; title?: string }> = Array.isArray(data)
				? (data as Array<{ id: string; title?: string }>)
				: Array.isArray((data as { rows?: unknown[] })?.rows)
					? (((data as { rows?: unknown[] }).rows ?? []) as Array<{ id: string; title?: string }>)
					: [];
			const next: Record<string, string> = {};
			for (const row of rows) {
				if (row?.id) next[row.id] = row.title ?? row.id;
			}
			groupTitlesById = next;
		} catch {
			groupTitlesById = {};
		}
	});

	const attributesGroup = $derived.by<AttributeDisplayGroup[]>(() => {
		const productAttributes =
			(product as { attributes?: ProductAttributeRow[] } | null)?.attributes ?? [];
		const attributeTitlesById: Record<string, string> = {};
		for (const a of productAttributes) {
			if (a?.id) attributeTitlesById[a.id] = a.title ?? a.id;
		}

		const resolveGroupTitle = (groupId: string, fallback?: string) =>
			groupTitlesById[groupId] || fallback || 'Attribute Group';

		const grouped: AttributeDisplayGroup[] = [];
		const upsertRow = (
			groupId: string,
			groupTitle: string,
			rowId: string,
			rowTitle: string,
			rowValue: string
		) => {
			let group = grouped.find((g) => g.id === groupId);
			if (!group) {
				group = { id: groupId, title: groupTitle, rows: [] };
				grouped.push(group);
			}
			group.rows.push({ id: rowId, title: rowTitle, value: rowValue });
		};

		const formAttributes = productAttributesForm?.data?.attributes ?? [];
		if (formAttributes.length > 0) {
			for (const [index, attr] of formAttributes.entries()) {
				const groupId = attr.attribute_group_id || 'ungrouped';
				const groupTitle = resolveGroupTitle(groupId, attr.attribute_group_title);
				const attrTitle = attributeTitlesById[attr.attribute_id] ?? attr.attribute_id;
				upsertRow(
					groupId,
					groupTitle,
					`${attr.attribute_group_id}:${attr.attribute_id}:${index}`,
					attrTitle,
					attr.value
				);
			}
			return grouped;
		}

		if (productAttributes.length === 0) return [];
		for (const [index, attr] of productAttributes.entries()) {
			const groupId = attr.attribute_group_id || 'ungrouped';
			const groupTitle = resolveGroupTitle(groupId);
			upsertRow(
				groupId,
				groupTitle,
				`${groupId}:${attr.id}:${index}`,
				attr.title ?? attr.id,
				attr.value
			);
		}
		return grouped;
	});

	let editAttributesSheetOpen = $state(false);
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-medium text-foreground">Attributes</h2>

		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0 border hover:bg-muted"
			onclick={() => {
				editAttributesSheetOpen = true;
			}}
			aria-label="Edit attributes"
		>
			<Pencil class="size-4" />
		</Button>
	</div>

	<dl class="space-y-4">
		{#if attributesGroup.length > 0}
			{#each attributesGroup as group (group.id)}
				<div class="rounded-lg border bg-muted/30 p-4 shadow-xs">
					<dt class="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
						{group.title}
					</dt>
					<div class="space-y-3">
						{#each group.rows as attr (attr.id)}
							<dd
								class="grid grid-cols-[1fr_auto] items-start gap-4 border-b border-gray-200/50 pb-2 last:border-0 last:pb-0"
							>
								<span class="text-sm font-medium text-muted-foreground">{attr.title}</span>

								<div class="flex max-w-[250px] flex-wrap justify-end gap-1.5">
									{#if attr.value && attr.value.includes(',')}
										<span
											class="text-md inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-0.5 text-foreground shadow-sm"
										>
										</span>
									{:else if attr.value}
										<span class="text-sm font-semibold text-foreground">
											{attr.value}
										</span>
									{:else}
										<span class="text-sm text-muted-foreground italic">—</span>
									{/if}
								</div>
							</dd>
						{/each}
					</div>
				</div>
			{/each}
		{:else}
			<div class="rounded-lg border-2 border-dashed py-6 text-center">
				<dt class="font-medium text-muted-foreground">No attributes assigned</dt>
			</div>
		{/if}
	</dl>
</div>

<EditAttributesSheet
	bind:open={editAttributesSheetOpen}
	{productAttributesForm}
	onSaved={() => void getProductDetail()?.refetch?.()}
/>
