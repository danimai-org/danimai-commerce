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
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	const ATTRIBUTE_TYPES = [
		{ value: 'string', label: 'String' },
		{ value: 'number', label: 'Number' },
		{ value: 'boolean', label: 'Boolean' },
		{ value: 'date', label: 'Date' }
	] as const;

	type ProductAttribute = {
		id: string;
		title: string;
		type: string;
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

	type AttributesResponse = {
		data: ProductAttribute[];
		pagination: Pagination;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let sortingField = $state('created_at');
	let sortingDirection = $state<'asc' | 'desc'>('desc');

	let data = $state<AttributesResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchAttributes() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: sortingField,
				sorting_direction: sortingDirection
			});
			const res = await fetch(`${API_BASE}/product-attributes?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			data = (await res.json()) as AttributesResponse;
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
		fetchAttributes();
	});

	const attributes = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	let deleteConfirmOpen = $state(false);
	let attributeToDelete = $state<ProductAttribute | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteConfirm(attr: ProductAttribute) {
		attributeToDelete = attr;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			attributeToDelete = null;
		}
	}

	async function confirmDeleteAttribute() {
		if (!attributeToDelete) return;
		deleteSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-attributes`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ attribute_ids: [attributeToDelete.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			deleteConfirmOpen = false;
			attributeToDelete = null;
			fetchAttributes();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	// Create sheet
	let createOpen = $state(false);
	let createTitle = $state('');
	let createType = $state('string');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createTitle = '';
		createType = 'string';
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
			const res = await fetch(`${API_BASE}/product-attributes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: createTitle.trim(), type: createType })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreate();
			fetchAttributes();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit sheet
	let editOpen = $state(false);
	let editAttribute = $state<ProductAttribute | null>(null);
	let editTitle = $state('');
	let editType = $state('string');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(attr: ProductAttribute) {
		editAttribute = attr;
		editOpen = true;
		editTitle = attr.title;
		editType = attr.type ?? 'string';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editAttribute = null;
	}

	async function submitEdit() {
		if (!editAttribute) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-attributes/${editAttribute.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: editTitle.trim(), type: editType })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			fetchAttributes();
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
				<span class="font-semibold">Attributes</span>
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
							<th class="px-4 py-3 text-left font-medium">Type</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if attributes.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
									No attributes found.
								</td>
							</tr>
						{:else}
							{#each attributes as attr (attr.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">
										<a href="/products/attributes/{attr.id}" class="hover:underline">
											{attr.title}
										</a>
									</td>
									<td class="px-4 py-3 text-muted-foreground">{attr.type}</td>
									<td class="px-4 py-3 text-muted-foreground">
										{new Date(attr.created_at).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{new Date(attr.updated_at).toLocaleDateString('en-US', {
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
															onSelect={() => openEdit(attr)}
														>
															<Pencil class="size-4" />
															Edit
														</DropdownMenu.Item>
														<DropdownMenu.Item
															textValue="Delete"
															class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
															onSelect={() => openDeleteConfirm(attr)}
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

<!-- Create Attribute Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Attribute</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new product attribute (e.g. Color, Size).
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
							placeholder="e.g. Color, Size"
							class={cn('h-9', createError === 'Title is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-type" class="text-sm font-medium">Type</label>
						<select
							id="create-type"
							bind:value={createType}
							class="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs ring-offset-background outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each ATTRIBUTE_TYPES as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
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

<!-- Edit Attribute Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute title and type.</p>
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
							placeholder="e.g. Color, Size"
							class={cn('h-9', editError === 'Title is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-type" class="text-sm font-medium">Type</label>
						<select
							id="edit-type"
							bind:value={editType}
							class="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs ring-offset-background outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if editType && !ATTRIBUTE_TYPES.some((t) => t.value === editType)}
								<option value={editType}>{editType}</option>
							{/if}
							{#each ATTRIBUTE_TYPES as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
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

<!-- Delete attribute confirmation -->
<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="attribute"
	entityTitle={attributeToDelete?.title || attributeToDelete?.id || ''}
	onConfirm={confirmDeleteAttribute}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
