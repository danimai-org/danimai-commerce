<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import { cn } from '$lib/utils.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

	type ProductAttribute = {
		id: string;
		title: string;
		type: string;
	};

	type ProductAttributeGroup = {
		id: string;
		title: string;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	type AttributeGroupsResponse = {
		data: ProductAttributeGroup[];
		pagination: Pagination;
	};

	let page = $state(1);
	let limit = $state(10);
	let sortingField = $state('created_at');
	let sortingDirection = $state<'asc' | 'desc'>('desc');

	let data = $state<AttributeGroupsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchGroups() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: sortingField,
				sorting_direction: sortingDirection
			});
			const res = await fetch(`${API_BASE}/product-attribute-groups?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			data = (await res.json()) as AttributeGroupsResponse;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			data = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		page;
		limit;
		sortingField;
		sortingDirection;
		fetchGroups();
	});

	const groups = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	let deleteConfirmOpen = $state(false);
	let groupToDelete = $state<ProductAttributeGroup | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteConfirm(grp: ProductAttributeGroup) {
		groupToDelete = grp;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			groupToDelete = null;
		}
	}

	async function confirmDeleteGroup() {
		if (!groupToDelete) return;
		deleteSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-attribute-groups`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ attribute_group_ids: [groupToDelete.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			deleteConfirmOpen = false;
			groupToDelete = null;
			fetchGroups();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	let createOpen = $state(false);
	let createTitle = $state('');
	let createAttributeIds = $state<string[]>([]);
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	let availableAttributes = $state<ProductAttribute[]>([]);
	let attributesLoading = $state(false);
	let attributesLoadError = $state<string | null>(null);

	async function fetchAvailableAttributes() {
		attributesLoading = true;
		attributesLoadError = null;
		try {
			const res = await fetch(
				`${API_BASE}/product-attributes?page=1&limit=100&sorting_field=title&sorting_direction=asc`,
				{ cache: 'no-store' }
			);
			if (!res.ok) throw new Error(await res.text());
			const json = (await res.json()) as { data?: ProductAttribute[]; items?: ProductAttribute[] };
			const list = json.data ?? json.items ?? [];
			availableAttributes = Array.isArray(list) ? list : [];
		} catch (e) {
			attributesLoadError = e instanceof Error ? e.message : 'Failed to load attributes';
			availableAttributes = [];
		} finally {
			attributesLoading = false;
		}
	}

	function openCreate() {
		createOpen = true;
		createTitle = '';
		createAttributeIds = [];
		createError = null;
		attributesLoadError = null;
		fetchAvailableAttributes();
	}

	function closeCreate() {
		createOpen = false;
	}

	async function submitCreate() {
		createError = null;
		if (!createTitle.trim()) {
			createError = 'Title is required';
			return;
		}
		createSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-attribute-groups`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: createTitle.trim() })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			const created = (await res.json()) as ProductAttributeGroup;
			if (createAttributeIds.length > 0) {
				const updateRes = await fetch(`${API_BASE}/product-attribute-groups/${created.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ attribute_ids: createAttributeIds })
				});
				if (!updateRes.ok) {
					const text = await updateRes.text();
					throw new Error(text || `HTTP ${updateRes.status}`);
				}
			}
			closeCreate();
			fetchGroups();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	let editOpen = $state(false);
	let editGroup = $state<ProductAttributeGroup | null>(null);
	let editTitle = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(grp: ProductAttributeGroup) {
		editGroup = grp;
		editOpen = true;
		editTitle = grp.title;
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editGroup = null;
	}

	async function submitEdit() {
		if (!editGroup) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-attribute-groups/${editGroup.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: editTitle.trim() })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			fetchGroups();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListFilter class="size-4" />
				<span class="font-semibold">Attribute Groups</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>

		{#if error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{error}
			</div>
		{:else if loading}
			<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else}
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium">Title</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if groups.length === 0}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
									No attribute groups found.
								</td>
							</tr>
						{:else}
							{#each groups as grp (grp.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">
										<a href="/products/attribute-groups/{grp.id}" class="hover:underline">
											{grp.title}
										</a>
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{new Date(grp.created_at).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{new Date(grp.updated_at).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})}
									</td>
									<td class="px-4 py-3">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
											>
												<MoreHorizontal class="size-4" />
												<span class="sr-only">Actions</span>
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content
													class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
													sideOffset={4}
												>
													<DropdownMenu.Item
														textValue="Edit"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openEdit(grp)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openDeleteConfirm(grp)}
													>
														<Trash2 class="size-4" />
														Delete
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>

			<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
				<p class="text-sm text-muted-foreground">
					{#if pagination && pagination.total > 0}
						{start} – {end} of {pagination.total} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_previous_page}
						onclick={() => (page = page - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{pagination?.page ?? 1} of {pagination?.total_pages ?? 1} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_next_page}
						onclick={() => (page = page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create Attribute Group Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new attribute group (e.g. Specifications, Dimensions). Assign attributes to this group to use them on products.
				</p>
				{#if createError && !createSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-title" class="text-sm font-medium">Title</label>
						<Input
							id="create-title"
							bind:value={createTitle}
							placeholder="e.g. Specifications"
							class={cn('h-9', createError === 'Title is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Attributes</span>
						<p class="text-xs text-muted-foreground">
							Optional. Assign attributes to this group to use them on products.
						</p>
						{#if attributesLoading}
							<p class="py-3 text-sm text-muted-foreground">Loading attributes…</p>
						{:else if attributesLoadError}
							<p class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-destructive">{attributesLoadError}</p>
						{:else}
							<div class="mt-1 flex flex-col gap-0 rounded-md border bg-muted/30 p-1">
								{#if availableAttributes.length === 0}
									<p class="px-3 py-4 text-center text-sm text-muted-foreground">No attributes available.</p>
								{:else}
									{#each availableAttributes as attr (attr.id)}
										<label
											class="flex cursor-pointer items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
										>
											<input
												type="checkbox"
												checked={createAttributeIds.includes(attr.id)}
												onchange={() => {
													createAttributeIds = createAttributeIds.includes(attr.id)
														? createAttributeIds.filter((id) => id !== attr.id)
														: [...createAttributeIds, attr.id];
												}}
												class="size-4 shrink-0 rounded border-input accent-primary"
											/>
											<span class="min-w-0 flex-1 font-medium">{attr.title}</span>
											<span class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">{attr.type}</span>
										</label>
									{/each}
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				<Button onclick={submitCreate} disabled={createSubmitting}>
					{createSubmitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Attribute Group Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute group title.</p>
				{#if editError && !editSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							bind:value={editTitle}
							placeholder="e.g. Specifications"
							class={cn('h-9', editError === 'Title is required' && 'border-destructive')}
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="attribute group"
	entityTitle={groupToDelete?.title || groupToDelete?.id || ''}
	onConfirm={confirmDeleteGroup}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
