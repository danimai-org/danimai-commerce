<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Combobox, MultiSelectCombobox } from '$lib/components/organs/index.js';
	import { client } from '$lib/client';
	import type { SuperValidated } from 'sveltekit-superforms';
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

	type ProductAttributeGroupRow = { id: string; title: string };
	type ProductAttributeRow = { id: string; title: string; type: string; group_id: string };

	interface Props {
		open?: boolean;
		productAttributesForm: SuperValidated<
			ProductAttributeGroup,
			string | unknown,
			Record<string, unknown>
		>;
		onSaved?: () => void | Promise<void>;
	}

	let {
		open = $bindable(false),
		productAttributesForm,
		onSaved = async () => {}
	}: Props = $props();

	let loading = $state(false);
	// let loadError = $state<string | null>(null);
	let attributeGroups = $state<ProductAttributeGroupRow[]>([]);
	let groupAttributes = $state<ProductAttributeRow[]>([]);
	let groupAttributesLoading = $state(false);
	let selectedGroupId = $state('');
	let selectedAttributeIds = $state<string[]>([]);

	function pickLabel(item: { title?: string; value?: string; name?: string }): string {
		return item.title ?? item.value ?? item.name ?? '';
	}

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
		loading = true;
		const listQuery = { page: 1, limit: 100, search: '', sorting_field: 'created_at' };
		try {
			const res = await client['product-attribute-groups'].get({ query: listQuery });
			const rows = extractRows<{ id: string; title?: string }>(res);
			attributeGroups = rows.map((row) => ({ id: row.id, title: pickLabel(row) }));
		} catch {
			return 'Failed to load attribute groups';
		}

		const existingGroupId = productAttributesForm?.data?.attributes?.[0]?.attribute_group_id ?? '';
		selectedGroupId = existingGroupId || attributeGroups[0]?.id || '';
		loading = false;
	});

	const selectedGroupTitle = $derived(
		attributeGroups.find((group) => group.id === selectedGroupId)?.title ?? 'Attribute Group'
	);

	const attributeGroupOptions = $derived(
		attributeGroups.map((group) => ({ id: group.id, value: group.title }))
	);

	const attributeOptions = $derived(groupAttributes.map((a) => ({ id: a.id, value: a.title })));

	$effect(() => {
		const groupId = selectedGroupId;
		if (!groupId) return;

		let cancelled = false;
		groupAttributesLoading = true;
		(async () => {
			try {
				const res = await client['product-attributes'].get({
					query: { page: 1, limit: 100 }
				});

				if (cancelled) return;
				const rows = extractRows<ProductAttributeRow>(res);
				groupAttributes = rows.map((row) => ({
					id: row.id,
					title: pickLabel(row),
					type: row.type ?? 'text',
					group_id: row.group_id ?? groupId
				}));
			} finally {
				if (!cancelled) groupAttributesLoading = false;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!open || loading) return;
		selectedAttributeIds = (productAttributesForm?.data?.attributes ?? [])
			.filter((a) => a.attribute_group_id === selectedGroupId)
			.map((a) => a.attribute_id);
	});

	$effect(() => {
		const formData = productAttributesForm?.data;
		const groupId = selectedGroupId;
		if (!formData || !groupId || loading) return;

		const current = [...(formData.attributes ?? [])];
		const otherGroups = current.filter((a) => a.attribute_group_id !== groupId);

		const nextForGroup = selectedAttributeIds.map((id) => {
			const existing = current.find(
				(a) => a.attribute_id === id && a.attribute_group_id === groupId
			);
			return (
				existing ?? {
					attribute_group_id: groupId,
					attribute_id: id,
					attribute_group_title: selectedGroupTitle,
					value: ''
				}
			);
		});

		formData.attributes = [...otherGroups, ...nextForGroup];
	});

	function updateAttributeValue(attributeId: string, value: string) {
		const attr = productAttributesForm?.data?.attributes?.find(
			(a) => a.attribute_id === attributeId && a.attribute_group_id === selectedGroupId
		);
		if (attr) attr.value = value;
	}

	function getSelectedValue(attributeId: string): string {
		return (
			productAttributesForm?.data?.attributes?.find(
				(a) => a.attribute_id === attributeId && a.attribute_group_id === selectedGroupId
			)?.value ?? ''
		);
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
		<Sheet.Header>
			<Sheet.Title>Edit Attributes</Sheet.Title>
		</Sheet.Header>

		<div class="flex flex-1 flex-col gap-6 overflow-auto px-4 py-4">
			{#if loading}
				<p class="text-sm text-muted-foreground">Loading groups…</p>
			{:else}
				<div class="space-y-2">
					<label for="edit-attribute-group" class="text-sm font-semibold">1. Attribute Group</label>
					<Combobox
						id="edit-attribute-group"
						bind:value={selectedGroupId}
						options={attributeGroupOptions}
						placeholder="Select group"
					/>
				</div>

				{#if selectedGroupId}
					<div class="space-y-2">
						<label for="edit-product-attributes" class="text-sm font-semibold"
							>2. Select Attributes</label
						>
						<MultiSelectCombobox
							id="edit-product-attributes"
							bind:value={selectedAttributeIds}
							options={attributeOptions}
							placeholder="Add attributes (Size, Material, etc.)"
							disabled={groupAttributesLoading}
						/>
					</div>

					{#if selectedAttributeIds.length > 0}
						<div class="space-y-4 border-t pt-2">
							<div class="grid gap-3">
								{#each selectedAttributeIds as attributeId (attributeId)}
									{@const details = groupAttributes.find((a) => a.id === attributeId)}
									<div class="rounded-lg border bg-card p-3 shadow-sm">
										<div class="mb-1.5 flex items-center justify-between">
											<p class="text-sm font-bold tracking-tight uppercase">
												{details?.title ?? attributeId}
											</p>
										</div>
										<Input
											class="h-9"
											placeholder="e.g. S, M, L"
											value={getSelectedValue(attributeId)}
											oninput={(e) => updateAttributeValue(attributeId, e.currentTarget.value)}
										/>
										<p class="mt-1 text-[10px] text-muted-foreground italic">
											Separated by commas for tag display.
										</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			{/if}
		</div>

		<Sheet.Footer class="border-t p-4">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				onclick={async () => {
					await onSaved();
					open = false;
				}}>Save Changes</Button
			>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
