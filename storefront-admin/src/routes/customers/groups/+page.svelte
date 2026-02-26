<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Folder from '@lucide/svelte/icons/folder';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';

	const API_BASE = 'http://localhost:8000/admin';

	type CustomerGroup = {
		id: string;
		name: string;
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

	let page = $state(1);
	let limit = $state(10);
	let searchQuery = $state('');
	let data = $state<{ data: CustomerGroup[]; pagination: Pagination } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchCustomerGroups() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/customer-groups?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			data = (await res.json()) as { data: CustomerGroup[]; pagination: Pagination };
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
		fetchCustomerGroups();
	});

	const customerGroups = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	const filteredCustomerGroups = $derived(
		searchQuery.trim()
			? customerGroups.filter((g) =>
					g.name.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: customerGroups
	);

	// Delete confirmation
	let deleteModalOpen = $state(false);
	let groupToDelete = $state<CustomerGroup | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteModal(group: CustomerGroup) {
		groupToDelete = group;
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		if (!deleteSubmitting) {
			deleteModalOpen = false;
			groupToDelete = null;
		}
	}

	async function handleConfirmDelete() {
		if (!groupToDelete) return;
		deleteSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/customer-groups`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ customer_group_ids: [groupToDelete.id] })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error((err as { message?: string })?.message ?? 'Failed to delete customer group');
			}
			deleteModalOpen = false;
			groupToDelete = null;
			await fetchCustomerGroups();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	// Edit customer group sheet
	let editOpen = $state(false);
	let editingGroup = $state<CustomerGroup | null>(null);
	let editName = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(group: CustomerGroup) {
		editingGroup = group;
		editName = group.name;
		editError = null;
		editOpen = true;
	}

	function closeEdit() {
		editOpen = false;
		editingGroup = null;
	}

	async function saveEdit() {
		if (!editingGroup) return;
		editError = null;
		editSubmitting = true;

		if (!editName.trim()) {
			editError = 'Name is required';
			editSubmitting = false;
			return;
		}

		try {
			const response = await fetch(`${API_BASE}/customer-groups/${editingGroup.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: editName.trim()
				})
			});
			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error((err as { message?: string })?.message ?? 'Failed to update customer group');
			}
			closeEdit();
			fetchCustomerGroups();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	// Create customer group sheet
	let createOpen = $state(false);
	let createName = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createName = '';
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	async function submitCreate() {
		createError = null;
		createSubmitting = true;

		if (!createName.trim()) {
			createError = 'Name is required';
			createSubmitting = false;
			return;
		}

		try {
			const response = await fetch(`${API_BASE}/customer-groups`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					customer_groups: [
						{
							name: createName.trim()
						}
					]
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || 'Failed to create customer group');
			}

			closeCreate();
			fetchCustomerGroups();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Folder class="size-4" />
				<span class="font-semibold">Customer Groups</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2">
					<div class="relative w-64">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={searchQuery}
							class="h-9 rounded-md pl-9"
						/>
					</div>
					<button
						type="button"
						class="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<ArrowUpDown class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				</div>
			</div>
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
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Customers</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if filteredCustomerGroups.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
									No customer groups found.
								</td>
							</tr>
						{:else}
							{#each filteredCustomerGroups as group (group.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">
										<a
											href="/customers/groups/{group.id}"
											class="text-primary underline-offset-4 hover:underline"
										>
											{group.name}
										</a>
									</td>
									<td class="px-4 py-3 text-muted-foreground">0</td>
									<td class="px-4 py-3 text-muted-foreground">
										{group.created_at
											? new Date(group.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
											: '–'}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{group.updated_at
											? new Date(group.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
											: '–'}
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
														class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openEdit(group)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openDeleteModal(group)}
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
						{start} - {end} of {pagination.total} results
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

<!-- Create Customer Group Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Create Customer Group</Sheet.Title>
				<Sheet.Description>Create a new customer group to segment your customers.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if createError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-name" class="text-sm font-medium">Name</label>
						<Input
							id="create-name"
							bind:value={createName}
							placeholder="Customer group name"
							class="h-9"
							disabled={createSubmitting}
							required
						/>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate} disabled={createSubmitting}>
					Cancel
				</Button>
				<Button onclick={submitCreate} disabled={createSubmitting}>
					{createSubmitting ? 'Creating...' : 'Create'}
				</Button>
			</Sheet.Footer>
		</div>
		</Sheet.Content>
	</Sheet.Root>

<!-- Edit Customer Group Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Edit Customer Group</Sheet.Title>
				<Sheet.Description>Update customer group details.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if editError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-name"
							bind:value={editName}
							placeholder="Customer group name"
							class="h-9"
							disabled={editSubmitting}
							required
						/>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit} disabled={editSubmitting}>
					Cancel
				</Button>
				<Button onclick={saveEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving...' : 'Save'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="customer group"
	entityTitle={groupToDelete?.name ?? ''}
	onConfirm={handleConfirmDelete}
	onCancel={closeDeleteModal}
	submitting={deleteSubmitting}
/>
