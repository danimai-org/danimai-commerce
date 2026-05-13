<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
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

	const detailQuery = getDetailContext<Product>();
	const product = $derived(detailQuery?.data ?? null);

	let groupTitlesById = $state<Record<string, string>>({});
	let groupAttributeRows = $state<Array<{ id: string; title: string }>>([]);

	function extractRows<T>(payload: unknown): T[] {
		if (!payload || typeof payload !== 'object') return [];
		const data = (payload as { data?: unknown }).data;
		if (Array.isArray(data)) return data as T[];
		if (data && typeof data === 'object' && Array.isArray((data as { rows?: unknown[] }).rows)) {
			return ((data as { rows?: unknown[] }).rows ?? []) as T[];
		}
		return [];
	}

	onMount(async () => {
		try {
			const res = await client['product-attribute-groups'].get({
				query: { page: 1, limit: 100, search: '', sorting_field: 'created_at' }
			});
			const rows = extractRows<{ id: string; title?: string }>(res);
			const next: Record<string, string> = {};
			for (const row of rows) {
				if (row?.id) next[row.id] = row.title ?? row.id;
			}
			groupTitlesById = next;
		} catch {
			groupTitlesById = {};
		}
	});
	const productAttributeGroupId = $derived.by(() => {
		const direct = (product as { attribute_group_id?: string | null } | null)?.attribute_group_id;
		if (direct) return direct;
		const attrs = (product as { attributes?: ProductAttributeRow[] } | null)?.attributes ?? [];
		return attrs[0]?.attribute_group_id ?? null;
	});

	$effect(() => {
		const attrGroupId = productAttributeGroupId;
		if (!attrGroupId) {
			groupAttributeRows = [];
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const res = await client['product-attributes'].get({
					query: { page: 1, limit: 100, filters: { attribute_group_id: attrGroupId } }
				});
				if (cancelled) return;
				groupAttributeRows = extractRows<{ id: string; title?: string }>(res).map((r) => ({
					id: r.id,
					title: r.title ?? r.id
				}));
			} catch {
				if (!cancelled) groupAttributeRows = [];
			}
		})();
		return () => {
			cancelled = true;
		};
	});
	const attributesGroup = $derived.by<AttributeDisplayGroup[]>(() => {
		const productAttributes =
			(product as { attributes?: ProductAttributeRow[] } | null)?.attributes ?? [];
		const attrGroupId = productAttributeGroupId;

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
			if (!group.rows.some((r) => r.id === rowId)) {
				group.rows.push({ id: rowId, title: rowTitle, value: rowValue });
			}
		};

		const formAttributes = productAttributesForm?.data?.attributes ?? [];
		if (formAttributes.length > 0) {
			const attributeTitlesById: Record<string, string> = {};
			for (const a of productAttributes) {
				if (a?.id) attributeTitlesById[a.id] = a.title ?? a.id;
			}
			for (const ga of groupAttributeRows) {
				attributeTitlesById[ga.id] = ga.title;
			}
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

		if (attrGroupId && groupAttributeRows.length > 0) {
			const valuesByTitle: Record<string, string> = {};

			for (const a of productAttributes) {
				if (a?.title) {
					valuesByTitle[a.title] = a.value;
				}
			}
			const groupTitle = resolveGroupTitle(attrGroupId);

			for (const [index, ga] of groupAttributeRows.entries()) {
				upsertRow(
					attrGroupId,
					groupTitle,
					`${attrGroupId}:${ga.id}:${index}`,
					ga.title,
					valuesByTitle[ga.title] ?? ''
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

	<dl class="space-y-6">
		{#if attributesGroup.length > 0}
			{#each attributesGroup as group (group.id)}
				<div>
					<dt class="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
						{group.title}
					</dt>
					<div class="space-y-0 divide-y divide-border/60">
						{#each group.rows as attr (attr.id)}
							<dd
								class="grid grid-cols-[1fr_auto] items-start gap-4 py-3 first:pt-0 last:pb-0"
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
	productId={product?.id ?? ''}
	attributeGroupId={productAttributeGroupId ?? ''}
	{productAttributesForm}
	onSaved={() => void detailQuery?.refetch?.()}
/>
