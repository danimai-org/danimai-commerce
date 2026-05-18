<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Combobox } from '$lib/components/organs/index.js';
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
		productId: string;
		attributeGroupId?: string;
		productAttributesForm: SuperValidated<
			ProductAttributeGroup,
			string | unknown,
			Record<string, unknown>
		>;
		onSaved?: () => void | Promise<void>;
	}

	let {
		open = $bindable(false),
		productId,
		attributeGroupId = '',
		productAttributesForm,
		onSaved = async () => {}
	}: Props = $props();

	let loading = $state(false);
	let saving = $state(false);
	let saveError = $state('');
	let attributeGroups = $state<ProductAttributeGroupRow[]>([]);
	let groupAttributes = $state<ProductAttributeRow[]>([]);
	let groupAttributesLoading = $state(false);
	let groupSearchLoading = $state(false);
	let selectedGroupId = $state('');
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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

	async function searchAttributeGroups(search: string = '') {
		groupSearchLoading = true;
		try {
			const res = await client['product-attribute-groups'].get({
				query: { page: 1, limit: 100, search, sorting_field: 'created_at' }
			});
			const rows = extractRows<{ id: string; title?: string }>(res);
			attributeGroups = rows.map((row) => ({ id: row.id, title: pickLabel(row) }));
		} catch {
			/* keep existing options on error */
		} finally {
			groupSearchLoading = false;
		}
	}

	function handleGroupSearch(query: string) {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => searchAttributeGroups(query), 300);
	}

	onMount(async () => {
		loading = true;
		await searchAttributeGroups('');
		const existingGroupId =
			attributeGroupId || productAttributesForm?.data?.attributes?.[0]?.attribute_group_id || '';
		selectedGroupId = existingGroupId || attributeGroups[0]?.id || '';
		loading = false;
	});

	const selectedGroupTitle = $derived(
		attributeGroups.find((group) => group.id === selectedGroupId)?.title ?? 'Attribute Group'
	);

	const attributeGroupOptions = $derived(
		attributeGroups.map((group) => ({ id: group.id, value: group.title }))
	);

	$effect(() => {
		const groupId = selectedGroupId;
		if (!groupId) return;

		let cancelled = false;
		groupAttributesLoading = true;
		(async () => {
			try {
				const res = await client['product-attributes'].get({
					query: { page: 1, limit: 100, filters: { attribute_group_id: groupId } }
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
		const formData = productAttributesForm?.data;
		const groupId = selectedGroupId;
		if (!open || !formData || !groupId || loading || groupAttributesLoading) return;

		const current = [...(formData.attributes ?? [])];
		const otherGroups = current.filter((a) => a.attribute_group_id !== groupId);

		const nextForGroup = groupAttributes.map((attr) => {
			const existing = current.find(
				(a) => a.attribute_id === attr.id && a.attribute_group_id === groupId
			);
			return (
				existing ?? {
					attribute_group_id: groupId,
					attribute_id: attr.id,
					attribute_group_title: selectedGroupTitle,
					value: ''
				}
			);
		});

		formData.attributes = [...otherGroups, ...nextForGroup];
	});

	/** When closed, strip attribute draft rows so the card uses product/API data instead of stale form rows. */
	$effect(() => {
		if (open) return;
		const formData = productAttributesForm?.data;
		if ((formData?.attributes?.length ?? 0) > 0) {
			formData.attributes = [];
		}
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
					<label for="edit-attribute-group" class="text-sm font-semibold"> Attribute Group</label>
					<Combobox
						id="edit-attribute-group"
						bind:value={selectedGroupId}
						options={attributeGroupOptions}
						placeholder="Select group"
						loading={groupSearchLoading}
						onSearchChange={handleGroupSearch}
					/>
				</div>

				{#if selectedGroupId}
					{#if groupAttributesLoading}
						<p class="text-sm text-muted-foreground">Loading attributes…</p>
					{:else if groupAttributes.length > 0}
						<div class="space-y-1">
							<p class="text-sm font-semibold">Attributes</p>
							<p class="text-xs text-muted-foreground">
								Set values for each attribute in this group.
							</p>
						</div>
						<div class="rounded-lg border bg-card">
							{#each groupAttributes as attr, i (attr.id)}
								<div
									class="flex items-center gap-4 px-4 py-3{i < groupAttributes.length - 1
										? ' border-b'
										: ''}"
								>
									<label
										class="w-28 shrink-0 text-sm font-medium text-foreground capitalize"
										for="attr-{attr.id}"
									>
										{attr.title}
									</label>
									<Input
										id="attr-{attr.id}"
										class="h-8 flex-1 bg-background"
										placeholder="Enter {attr.title.toLowerCase()}"
										value={getSelectedValue(attr.id)}
										oninput={(e) => updateAttributeValue(attr.id, e.currentTarget.value)}
									/>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">No attributes found in this group.</p>
					{/if}
				{/if}
			{/if}
		</div>

		<Sheet.Footer class="border-t p-4">
			{#if saveError}
				<p class="mr-auto text-sm text-destructive">{saveError}</p>
			{/if}
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				disabled={saving}
				onclick={async () => {
					saving = true;
					saveError = '';
					try {
						const attrs = (productAttributesForm?.data?.attributes ?? [])
							.filter((a) => a.attribute_id && a.value.trim())
							.map((a) => ({
								attribute_group_id: a.attribute_group_id,
								attribute_id: a.attribute_id,
								value: a.value.trim()
							}));
						const res = await client.products({ id: productId }).put({
							attribute_group_id: selectedGroupId || undefined,
							attributes: attrs
						});
						if (res.error) {
							const err = res.error as { value?: { message?: string } };
							saveError = err.value?.message ?? 'Failed to save attributes';
							return;
						}
						await onSaved();
						open = false;
					} catch (e) {
						saveError = e instanceof Error ? e.message : 'Failed to save attributes';
					} finally {
						saving = false;
					}
				}}>{saving ? 'Saving…' : 'Save'}</Button
			>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
