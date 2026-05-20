<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditAttributesSheet from './EditAttributesSheet.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { Product } from '../type';
	import { getDetailContext } from '$lib/hooks';
	import { client } from '$lib/client';

	type ProductAttributesForm = {
		id: string;
		attributes: Array<{
			attribute_id: string;
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
		category_id: string | null;
	};

	let {
		productAttributesForm = $bindable(
			{} as SuperValidated<ProductAttributesForm, string | unknown, Record<string, unknown>>
		)
	}: {
		productAttributesForm: SuperValidated<
			ProductAttributesForm,
			string | unknown,
			Record<string, unknown>
		>;
	} = $props();

	const detailQuery = getDetailContext<Product>();
	const product = $derived(detailQuery?.data ?? null);

	let categoryAttributeRows = $state<Array<{ id: string; title: string }>>([]);

	function extractRows<T>(payload: unknown): T[] {
		if (!payload || typeof payload !== 'object') return [];
		const data = (payload as { data?: unknown }).data;
		if (Array.isArray(data)) return data as T[];
		if (data && typeof data === 'object' && Array.isArray((data as { rows?: unknown[] }).rows)) {
			return ((data as { rows?: unknown[] }).rows ?? []) as T[];
		}
		return [];
	}

	const productCategoryId = $derived.by(() => {
		const cat = (product as { category?: { id?: string } | null } | null)?.category;
		if (cat?.id) return cat.id;
		const attrs = (product as { attributes?: ProductAttributeRow[] } | null)?.attributes ?? [];
		return attrs[0]?.category_id ?? null;
	});

	const categoryTitle = $derived.by(() => {
		const cat = (product as { category?: { value?: string; id?: string } | null } | null)?.category;
		return cat?.value ?? 'Category';
	});

	$effect(() => {
		const categoryId = productCategoryId;
		if (!categoryId) {
			categoryAttributeRows = [];
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const res = await client['product-attributes'].get({
					query: { page: 1, limit: 100, filters: { category_id: categoryId } }
				});
				if (cancelled) return;
				categoryAttributeRows = extractRows<{ id: string; title?: string }>(res).map((r) => ({
					id: r.id,
					title: r.title ?? r.id
				}));
			} catch {
				if (!cancelled) categoryAttributeRows = [];
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	const attributesGroup = $derived.by<AttributeDisplayGroup[]>(() => {
		const productAttributes =
			(product as { attributes?: ProductAttributeRow[] } | null)?.attributes ?? [];
		const categoryId = productCategoryId;

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
			for (const ca of categoryAttributeRows) {
				attributeTitlesById[ca.id] = ca.title;
			}
			const groupId = categoryId || 'ungrouped';
			for (const [index, attr] of formAttributes.entries()) {
				const attrTitle = attributeTitlesById[attr.attribute_id] ?? attr.attribute_id;
				upsertRow(groupId, categoryTitle, `${attr.attribute_id}:${index}`, attrTitle, attr.value);
			}
			return grouped;
		}

		if (categoryId && categoryAttributeRows.length > 0) {
			const valuesByTitle: Record<string, string> = {};
			for (const a of productAttributes) {
				if (a?.title) valuesByTitle[a.title] = a.value;
			}
			for (const [index, ca] of categoryAttributeRows.entries()) {
				upsertRow(
					categoryId,
					categoryTitle,
					`${categoryId}:${ca.id}:${index}`,
					ca.title,
					valuesByTitle[ca.title] ?? ''
				);
			}
			return grouped;
		}

		if (productAttributes.length === 0) return [];
		const groupId = categoryId || 'ungrouped';
		for (const [index, attr] of productAttributes.entries()) {
			upsertRow(
				groupId,
				categoryTitle,
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
					<dt
						class="mb-2.5 border-b p-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
					>
						{group.title}
					</dt>
					<div class="space-y-0 divide-y divide-border/60">
						{#each group.rows as attr (attr.id)}
							<dd class="grid grid-cols-[1fr_auto] items-start gap-4 py-3 first:pt-0 last:pb-0">
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
	categoryId={productCategoryId ?? ''}
	{categoryTitle}
	{productAttributesForm}
	onSaved={() => void detailQuery?.refetch?.()}
/>
