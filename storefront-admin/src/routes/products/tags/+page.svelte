<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Tag from '@lucide/svelte/icons/tag';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type ProductTag = {
		id: string;
		value: string;
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

	type TagsResponse = {
		data: ProductTag[];
		pagination: Pagination;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let sortingField = $state('created_at');
	let sortingDirection = $state<'asc' | 'desc'>('desc');

	let data = $state<TagsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchTags() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: sortingField,
				sorting_direction: sortingDirection
			});
			const res = await fetch(`${API_BASE}/product-tags?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			data = (await res.json()) as TagsResponse;
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
		fetchTags();
	});

	const tags = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	let deleteConfirmOpen = $state(false);
	let tagToDelete = $state<ProductTag | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteConfirm(tag: ProductTag) {
		tagToDelete = tag;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			tagToDelete = null;
		}
	}

	async function confirmDeleteTag() {
		if (!tagToDelete) return;
		deleteSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-tags`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tag_ids: [tagToDelete.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			deleteConfirmOpen = false;
			tagToDelete = null;
			fetchTags();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	// Create sheet
	let createOpen = $state(false);
	let createValue = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createValue = '';
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	async function submitCreate() {
		createError = null;
		if (!createValue.trim()) {
			createError = 'Value is required';
			return;
		}
		createSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-tags`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ value: createValue.trim() })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreate();
			fetchTags();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit sheet
	let editOpen = $state(false);
	let editTag = $state<ProductTag | null>(null);
	let editValue = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(tag: ProductTag) {
		editTag = tag;
		editOpen = true;
		editValue = tag.value;
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editTag = null;
	}

	async function submitEdit() {
		if (!editTag) return;
		editError = null;
		if (!editValue.trim()) {
			editError = 'Value is required';
			return;
		}
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-tags/${editTag.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ value: editValue.trim() })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			fetchTags();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Tag class="size-4" />
				<span>Tags</span>
			</div>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm text-muted-foreground">
						Organize products with tags.
					</p>
				</div>
				<Button size="sm" onclick={openCreate}>Create</Button>
			</div>
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
							<th class="px-4 py-3 text-left font-medium">Value</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if tags.length === 0}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
									No tags found.
								</td>
							</tr>
						{:else}
							{#each tags as tag (tag.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">
										<a
											href="/products/tags/{tag.id}"
											class="hover:underline"
										>
											{tag.value}
										</a>
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{new Date(tag.created_at).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{new Date(tag.updated_at).toLocaleDateString('en-US', {
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
														onSelect={() => openEdit(tag)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openDeleteConfirm(tag)}
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

<!-- Create Tag Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Tag</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new product tag.
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
						<label for="create-value" class="text-sm font-medium">Value</label>
						<Input
							id="create-value"
							bind:value={createValue}
							placeholder="e.g. sale, new-arrival"
							class={cn('h-9', createError === 'Value is required' && 'border-destructive')}
						/>
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

<!-- Edit Tag Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Tag</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the tag value.
				</p>
				{#if editError && !editSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-value" class="text-sm font-medium">Value</label>
						<Input
							id="edit-value"
							bind:value={editValue}
							placeholder="e.g. sale, new-arrival"
							class={cn('h-9', editError === 'Value is required' && 'border-destructive')}
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

<!-- Delete tag confirmation -->
<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="tag"
	entityTitle={tagToDelete?.value || tagToDelete?.id || ''}
	onConfirm={confirmDeleteTag}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
