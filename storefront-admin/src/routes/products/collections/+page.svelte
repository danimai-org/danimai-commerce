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
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import FileText from '@lucide/svelte/icons/file-text';
	import Info from '@lucide/svelte/icons/info';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type ProductCollection = {
		id: string;
		title: string;
		handle: string;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
		product_count?: number;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	type CollectionsResponse = {
		data: ProductCollection[];
		pagination: Pagination;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let sortingField = $state('created_at');
	let sortingDirection = $state<'asc' | 'desc'>('desc');

	let data = $state<CollectionsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchCollections() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: sortingField,
				sorting_direction: sortingDirection
			});
			const res = await fetch(`${API_BASE}/collections?${params}`);
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			data = (await res.json()) as CollectionsResponse;
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
		fetchCollections();
	});

	const collections = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	function getHandle(collection: ProductCollection): string {
		return collection.handle.startsWith('/') ? collection.handle : `/${collection.handle}`;
	}

	let deleteConfirmOpen = $state(false);
	let collectionToDelete = $state<ProductCollection | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteConfirm(collection: ProductCollection) {
		collectionToDelete = collection;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			collectionToDelete = null;
		}
	}

	async function confirmDeleteCollection() {
		if (!collectionToDelete) return;
		deleteSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/collections`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ collection_ids: [collectionToDelete.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			deleteConfirmOpen = false;
			collectionToDelete = null;
			fetchCollections();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	// Create modal
	let createOpen = $state(false);
	let createTitle = $state('');
	let createHandle = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createTitle = '';
		createHandle = '';
		createError = null;
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
			const handle =
				createHandle.trim() ||
				createTitle
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, '');
			const res = await fetch(`${API_BASE}/collections`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: createTitle.trim(), handle })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreate();
			fetchCollections();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit modal
	let editOpen = $state(false);
	let editCollection = $state<ProductCollection | null>(null);
	let editTitle = $state('');
	let editHandle = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(collection: ProductCollection) {
		editCollection = collection;
		editOpen = true;
		editTitle = collection.title;
		editHandle = collection.handle.replace(/^\//, '') || '';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editCollection = null;
	}

	async function submitEdit() {
		if (!editCollection) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const handle =
				editHandle.trim() ||
				editTitle
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, '');
			const res = await fetch(`${API_BASE}/collections/${editCollection.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: editTitle.trim(), handle })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			fetchCollections();
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
				<FileText class="size-4" />
				<span class="font-semibold">Collections</span>
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
							<th class="px-4 py-3 text-left font-medium">Title</th>
							<th class="px-4 py-3 text-left font-medium">Handle</th>
							<th class="px-4 py-3 text-left font-medium">Products</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if collections.length === 0}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
									No collections found.
								</td>
							</tr>
						{:else}
							{#each collections as collection (collection.id)}
								<tr
									class="border-b transition-colors hover:bg-muted/30 cursor-pointer"
									role="button"
									tabindex="0"
									onclick={() => goto(`/products/collections/${collection.id}`)}
									onkeydown={(e) => e.key === 'Enter' && goto(`/products/collections/${collection.id}`)}
								>
									<td class="px-4 py-3 font-medium">{collection.title}</td>
									<td class="px-4 py-3 text-muted-foreground">{getHandle(collection)}</td>
									<td class="px-4 py-3 text-muted-foreground">
										{collection.product_count ?? 0}
									</td>
									<td class="px-4 py-3" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
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
														onSelect={() => openEdit(collection)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openDeleteConfirm(collection)}
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

<!-- Create Collection Modal -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<div>
						<h2 class="text-lg font-semibold">Create Collection</h2>
						<p class="mt-1 text-sm text-muted-foreground">
							Create a new collection to organize your products.
						</p>
					</div>

					{#if createError}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{createError}
						</div>
					{/if}
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="create-title" class="text-sm font-medium">Title</label>
							<Input
								id="create-title"
								bind:value={createTitle}
								placeholder="Enter collection title"
								class={cn('h-9', createError && !createTitle.trim() && 'border-destructive')}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-1.5">
								<label for="create-handle" class="text-sm font-medium">
									Handle
									<span class="font-normal text-muted-foreground">(Optional)</span>
								</label>
								<Tooltip.Root>
									<Tooltip.Trigger
										class="rounded-full text-muted-foreground hover:text-foreground"
										aria-label="Handle info"
									>
										<Info class="size-3.5" />
									</Tooltip.Trigger>
									<Tooltip.Content>
										Leave empty to auto-generate from title.
									</Tooltip.Content>
								</Tooltip.Root>
							</div>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span>
								<Input
									id="create-handle"
									bind:value={createHandle}
									placeholder="handle"
									class="h-9 pl-6"
								/>
							</div>
						</div>
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

<!-- Edit Collection Modal -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<div>
						<h2 class="text-lg font-semibold">Edit Collection</h2>
						<p class="mt-1 text-sm text-muted-foreground">Update collection details.</p>
					</div>

					{#if editError}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{editError}
						</div>
					{/if}
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-title" class="text-sm font-medium">Title</label>
							<Input
								id="edit-title"
								bind:value={editTitle}
								placeholder="Enter collection title"
								class={cn('h-9', editError && !editTitle.trim() && 'border-destructive')}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-1.5">
								<label for="edit-handle" class="text-sm font-medium">
									Handle
									<span class="font-normal text-muted-foreground">(Optional)</span>
								</label>
								<Tooltip.Root>
									<Tooltip.Trigger
										class="rounded-full text-muted-foreground hover:text-foreground"
										aria-label="Handle info"
									>
										<Info class="size-3.5" />
									</Tooltip.Trigger>
									<Tooltip.Content>
										Leave empty to auto-generate from title.
									</Tooltip.Content>
								</Tooltip.Root>
							</div>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span>
								<Input
									id="edit-handle"
									bind:value={editHandle}
									placeholder="handle"
									class="h-9 pl-6"
								/>
							</div>
						</div>
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

<!-- Delete collection confirmation -->
<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="collection"
	entityTitle={collectionToDelete?.title || collectionToDelete?.handle || collectionToDelete?.id || ''}
	onConfirm={confirmDeleteCollection}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
