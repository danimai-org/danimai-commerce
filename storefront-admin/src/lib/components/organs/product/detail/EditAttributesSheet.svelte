<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
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
	type ProductAttributeRow = {
		id: string;
		title: string;
		type: string;
		attribute_group_id?: string | null;
		product_attribute_group_id?: string | null;
		attributeGroupId?: string | null;
		attribute_group?: { id?: string | null } | null;
		product_attribute_group?: { id?: string | null } | null;
		group_id?: string | null;
	};

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
	let loadError = $state<string | null>(null);
	let attributeGroups = $state<ProductAttributeGroupRow[]>([]);
	let allAttributes = $state<ProductAttributeRow[]>([]);
	let selectedGroupId = $state('');

	function pickLabel(item: { title?: string; value?: string; name?: string }): string {
		return item.title ?? item.value ?? item.name ?? '';
	}

	function getAttributeGroupId(item: ProductAttributeRow): string | null {
		return (
			item.attribute_group_id ??
			item.product_attribute_group_id ??
			item.attributeGroupId ??
			item.attribute_group?.id ??
			item.product_attribute_group?.id ??
			item.group_id ??
			null
		);
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
		loadError = null;
		const listQuery = { page: 1, limit: 100, search: '', sorting_field: 'created_at' };

		const [attributesResponse, attributeGroupsResponse] = await Promise.allSettled([
			client['product-attributes'].get({ query: listQuery }),
			client['product-attribute-groups'].get({ query: listQuery })
		]);

		if (attributesResponse.status === 'fulfilled') {
			const rows = extractRows<{
				id: string;
				title?: string;
				value?: string;
				name?: string;
				type?: string;
				attribute_group_id?: string | null;
				product_attribute_group_id?: string | null;
				attributeGroupId?: string | null;
				attribute_group?: { id?: string | null } | null;
				product_attribute_group?: { id?: string | null } | null;
				group_id?: string | null;
			}>(attributesResponse.value);
			allAttributes = rows.map((row) => ({
				id: row.id,
				title: pickLabel(row),
				type: row.type ?? 'text',
				attribute_group_id: row.attribute_group_id,
				product_attribute_group_id: row.product_attribute_group_id,
				attributeGroupId: row.attributeGroupId,
				attribute_group: row.attribute_group,
				product_attribute_group: row.product_attribute_group,
				group_id: row.group_id
			}));
		}

		if (attributeGroupsResponse.status === 'fulfilled') {
			const rows = extractRows<{ id: string; title?: string; value?: string; name?: string }>(
				attributeGroupsResponse.value
			);
			attributeGroups = rows.map((row) => ({ id: row.id, title: pickLabel(row) }));
		}

		if (attributesResponse.status === 'rejected' || attributeGroupsResponse.status === 'rejected') {
			loadError = 'Failed to load attributes';
		}
		const existingGroupId = productAttributesForm?.data?.attributes?.[0]?.attribute_group_id ?? '';
		selectedGroupId = existingGroupId || attributeGroups[0]?.id || '';
		loading = false;
	});

	const selectedGroupTitle = $derived(
		attributeGroups.find((group) => group.id === selectedGroupId)?.title ?? 'Attribute Group'
	);
	const groupAttributes = $derived.by(() =>
		allAttributes.filter((attr) => getAttributeGroupId(attr) === selectedGroupId)
	);
	function isSelected(attributeId: string): boolean {
		return (
			(productAttributesForm?.data?.attributes ?? []).findIndex(
				(attr) => attr.attribute_id === attributeId && attr.attribute_group_id === selectedGroupId
			) >= 0
		);
	}
	function toggleAttribute(attributeId: string, checked: boolean) {
		const formData = productAttributesForm?.data;
		if (!formData) return;
		const current = [...(formData.attributes ?? [])];
		const existingIndex = current.findIndex(
			(attr) => attr.attribute_id === attributeId && attr.attribute_group_id === selectedGroupId
		);
		if (checked && existingIndex === -1) {
			current.push({
				attribute_group_id: selectedGroupId,
				attribute_group_title: selectedGroupTitle,
				attribute_id: attributeId,
				value: ''
			});
		}
		if (!checked && existingIndex !== -1) {
			current.splice(existingIndex, 1);
		}
		formData.attributes = current;
	}
	function updateAttributeValue(attributeId: string, value: string) {
		const formData = productAttributesForm?.data;
		if (!formData) return;
		const current = [...(formData.attributes ?? [])];
		const existingIndex = current.findIndex(
			(attr) => attr.attribute_id === attributeId && attr.attribute_group_id === selectedGroupId
		);
		if (existingIndex === -1) return;
		current[existingIndex] = {
			...current[existingIndex],
			attribute_group_title: selectedGroupTitle,
			value
		};
		formData.attributes = current;
	}
	function getSelectedValue(attributeId: string): string {
		return (
			(productAttributesForm?.data?.attributes ?? []) .find(
				(attr) => attr.attribute_id === attributeId && attr.attribute_group_id === selectedGroupId
			)?.value ?? ''
		);
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		class="flex w-full flex-col sm:max-w-lg"
		side="right"
		data-product-id={productAttributesForm?.data?.id}
	>
		<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
			<Sheet.Title>Edit Attributes</Sheet.Title>
		</Sheet.Header>
		<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
			{#if loading}
				<p class="text-sm text-muted-foreground">Loading attributes…</p>
			{:else}
				<div class="space-y-2">
					<label for="edit-attribute-group" class="text-sm font-medium">Attribute group</label>
					<select
						id="edit-attribute-group"
						class="h-9 w-full rounded-md border bg-background px-3 text-sm"
						value={selectedGroupId}
						onchange={(e) => (selectedGroupId = (e.currentTarget as HTMLSelectElement).value)}
					>
						<option value="" disabled>Select group</option>
						{#each attributeGroups as group (group.id)}
							<option value={group.id}>{group.title}</option>
						{/each}
					</select>
				</div>
				{#if loadError}
					<p class="text-sm text-destructive">{loadError}</p>
				{:else if selectedGroupId && groupAttributes.length > 0}
					<div class="space-y-3">
						<div class="rounded-md border bg-card p-3">
							<p class="text-sm font-semibold">{selectedGroupTitle}</p>
						</div>
						{#each groupAttributes as attribute (attribute.id)}
							<div class="rounded-md border p-3">
								<label class="flex items-center gap-2 text-sm font-medium">
									<input
										type="checkbox"
										checked={isSelected(attribute.id)}
										onchange={(e) =>
											toggleAttribute(attribute.id, (e.currentTarget as HTMLInputElement).checked)}
									/>
									<span>{attribute.title}</span>
								</label>
								{#if isSelected(attribute.id)}
									<div class="mt-2">
										<Input
											class="h-9"
											placeholder="Enter value"
											value={getSelectedValue(attribute.id)}
											oninput={(e) =>
												updateAttributeValue(
													attribute.id,
													(e.currentTarget as HTMLInputElement).value
												)}
										/>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No attributes available for this group</p>
				{/if}
			{/if}
		</div>
		<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				onclick={async () => {
					productAttributesForm.data.attributes = [...(productAttributesForm?.data?.attributes ?? [])];
					await onSaved();
					open = false;
				}}
			>
				Save
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
