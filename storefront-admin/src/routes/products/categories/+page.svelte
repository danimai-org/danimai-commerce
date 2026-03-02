<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Info from '@lucide/svelte/icons/info';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import { cn } from '$lib/utils.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { listCategories, deleteCategories } from '$lib/product-categories/api.js';
	import type { ProductCategory } from '$lib/product-categories/types.js';
	import type { CategoriesListResponse } from '$lib/product-categories/types.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination<CategoriesListResponse>(
		async (): Promise<CategoriesListResponse> => {
			const q = paginationQuery as Record<string, unknown>;
			const params = {
				page: q?.page != null ? Number(q.page) : 1,
				limit: q?.limit != null ? Number(q.limit) : 10,
				sorting_field: (q?.sorting_field as string) ?? 'created_at',
				sorting_direction: (q?.sorting_direction as 'asc' | 'desc') ?? 'desc'
			};
			return listCategories(params);
		},
		['product-categories']
	);

	$effect(() => {
		page.url.searchParams.toString();
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data as CategoriesListResponse | undefined);
	const rawRows = $derived(queryData?.data?.rows ?? []);
	function getHandle(category: ProductCategory): string {
		const h = category.handle;
		if (h) return h.startsWith('/') ? h : `/${h}`;
		return `/${category.value.toLowerCase().replace(/\s+/g, '-')}`;
	}
	const rows = $derived(rawRows.map((c) => ({ ...c, handle_display: getHandle(c) })));
	const pagination = $derived(queryData?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const categories = $derived(rows);

	// Create modal
	let createOpen = $state(false);
	let createTitle = $state('');
	let createHandle = $state('');
	let createDescription = $state('');
	let createParentId = $state<string>('');
	let createStatus = $state('active');
	let createVisibility = $state('public');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createTitle = '';
		createHandle = '';
		createDescription = '';
		createParentId = '';
		createStatus = 'active';
		createVisibility = 'public';
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	// Ranking sheet
	let rankingOpen = $state(false);
	let rankedCategories = $state<ProductCategory[]>([]);
	let rankingSaving = $state(false);
	let dragFromIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	async function openRanking() {
		rankingOpen = true;
		try {
			const res = await fetch(
				`${API_BASE}/product-categories?page=1&limit=100&sorting_field=created_at&sorting_direction=asc`
			);
			if (res.ok) {
				const json = (await res.json()) as { rows?: ProductCategory[] };
				rankedCategories = [...(json.rows ?? [])];
			} else {
				rankedCategories = [...categories];
			}
		} catch {
			rankedCategories = [...categories];
		}
		dragFromIndex = null;
		dragOverIndex = null;
	}

	function closeRanking() {
		rankingOpen = false;
	}

	function handleRankingDragStart(e: DragEvent, index: number) {
		dragFromIndex = index;
		e.dataTransfer?.setData('text/plain', String(index));
		e.dataTransfer!.effectAllowed = 'move';
		if (e.target instanceof HTMLElement) e.target.style.opacity = '0.5';
	}

	function handleRankingDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		dragOverIndex = index;
	}

	function handleRankingDragLeave(e: DragEvent) {
		if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
			dragOverIndex = null;
		}
	}

	function handleRankingDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		const from = dragFromIndex;
		if (from === null || from === toIndex) return;
		const items = [...rankedCategories];
		const [removed] = items.splice(from, 1);
		items.splice(toIndex, 0, removed);
		rankedCategories = items;
		dragFromIndex = null;
		dragOverIndex = null;
		if (e.target instanceof HTMLElement) e.target.style.opacity = '1';
	}

	function handleRankingDragEnd(e: DragEvent) {
		dragFromIndex = null;
		dragOverIndex = null;
		if (e.target instanceof HTMLElement) e.target.style.opacity = '1';
	}

	async function saveRanking() {
		rankingSaving = true;
		try {
			for (let i = 0; i < rankedCategories.length; i++) {
				const cat = rankedCategories[i];
				const meta =
					typeof cat.metadata === 'object' && cat.metadata !== null
						? (cat.metadata as Record<string, string | number>)
						: {};
				await fetch(`${API_BASE}/product-categories/${cat.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ metadata: { ...meta, rank: i } })
				});
			}
			closeRanking();
			paginateState.refetch();
		} catch (e) {
			// use a local ranking error if we add state for it; for now keep refetch
			paginateState.refetch();
		} finally {
			rankingSaving = false;
		}
	}

	// Edit modal
	let editOpen = $state(false);
	let editCategory = $state<ProductCategory | null>(null);
	let editTitle = $state('');
	let editHandle = $state('');
	let editDescription = $state('');
	let editParentId = $state<string>('');
	let editStatus = $state('active');
	let editVisibility = $state('public');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(category: ProductCategory) {
		editCategory = category;
		editOpen = true;
		editTitle = category.value;
		editHandle = category.handle?.startsWith('/')
			? category.handle.slice(1)
			: (category.handle ?? '');
		editDescription =
			typeof category.metadata === 'object' &&
			category.metadata !== null &&
			'description' in category.metadata
				? String((category.metadata as { description?: string }).description ?? '')
				: '';
		editParentId = category.parent_id ?? '';
		editStatus = category.status ?? 'active';
		editVisibility = category.visibility ?? 'public';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editCategory = null;
	}

	async function submitEdit() {
		if (!editCategory) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const body: {
				value?: string;
				parent_id?: string;
				status?: string;
				visibility?: string;
				metadata?: Record<string, string | number>;
			} = {
				value: editTitle.trim(),
				status: editStatus,
				visibility: editVisibility
			};
			body.parent_id = editParentId || undefined;
			if (editDescription.trim()) body.metadata = { description: editDescription.trim() };
			const res = await fetch(`${API_BASE}/product-categories/${editCategory.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			paginateState.refetch();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	async function submitCreate() {
		createError = null;
		if (!createTitle.trim()) {
			createError = 'Title is required';
			return;
		}
		createSubmitting = true;
		try {
			const body: {
				value: string;
				parent_id?: string;
				status?: string;
				visibility?: string;
				metadata?: Record<string, string | number>;
			} = {
				value: createTitle.trim(),
				status: createStatus,
				visibility: createVisibility
			};
			if (createParentId) body.parent_id = createParentId;
			if (createDescription.trim()) body.metadata = { description: createDescription.trim() };
			const res = await fetch(`${API_BASE}/product-categories`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreate();
			paginateState.refetch();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	const openEditSheet = (category: ProductCategory) => openEdit(category);
	const openDeleteConfirm = paginateState.openDeleteConfirm;
	const closeDeleteConfirm = paginateState.closeDeleteConfirm;
	const confirmDelete = paginateState.confirmDelete;
	const deleteConfirmOpen = $derived(paginateState.deleteConfirmOpen);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);

	const tableColumns: TableColumn[] = [
		{
			label: 'Name',
			key: 'value',
			type: 'link',
			cellHref: (row) => `/products/categories/${row.id}`,
			textKey: 'value'
		},
		{ label: 'Handle', key: 'handle_display', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{ label: 'Visibility', key: 'visibility', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{ label: 'Edit', key: 'edit', type: 'button', onClick: (item) => openEditSheet(item as ProductCategory) },
				{ label: 'Delete', key: 'delete', type: 'button', onClick: (item) => openDeleteConfirm(item as unknown as CategoriesListResponse) }
			]
		}
	];
</script>

<div class="flex h-full flex-col">
	<!-- Content -->
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<FolderTree class="size-4" />
				<span class="font-semibold">Categories</span>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" onclick={openRanking}>
					<GripVertical class="mr-1.5 size-4" />
					Edit ranking
				</Button>
				<Button size="sm" onclick={openCreate}>Create</Button>
			</div>
		</div>
		<PaginationTable>
			{#if paginateState.error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{paginateState.error}
				</div>
			{:else if paginateState.loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={rows}
							columns={tableColumns}
							emptyMessage="No categories found."
						/>
					</table>
				</div>

				<TablePagination
					{pagination}
					{start}
					{end}
					onPageChange={goToPage}
				/>
			{/if}
		</PaginationTable>
	</div>
</div>

<!-- Edit Ranking Sheet -->
<Sheet.Root bind:open={rankingOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-2">
					{#each rankedCategories as category, i (category.id)}
						<div
							draggable="true"
							role="button"
							tabindex="0"
							class={cn(
								'flex cursor-grab items-center gap-3 rounded-md border bg-card px-3 py-2.5 active:cursor-grabbing',
								dragOverIndex === i && 'border-primary bg-primary/5',
								dragFromIndex === i && 'opacity-50'
							)}
							ondragstart={(e) => handleRankingDragStart(e, i)}
							ondragover={(e) => handleRankingDragOver(e, i)}
							ondragleave={handleRankingDragLeave}
							ondrop={(e) => handleRankingDrop(e, i)}
							ondragend={handleRankingDragEnd}
						>
							<GripVertical class="size-4 shrink-0 text-muted-foreground" />
							<div
								class="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
							>
								<FolderTree class="size-3.5" />
							</div>
							<span class="flex-1">{category.value}</span>
						</div>
					{/each}
					{#if rankedCategories.length === 0}
						<p class="py-8 text-center text-sm text-muted-foreground">No categories to organize.</p>
					{/if}
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeRanking}>Cancel</Button>
				<Button onclick={saveRanking} disabled={rankingSaving}>
					{rankingSaving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Create Category Modal -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<!-- Content -->
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<div>
						<h2 class="text-lg font-semibold">Create Category</h2>
						<p class="mt-1 text-sm text-muted-foreground">
							Create a new category to organize your products.
						</p>
					</div>

					{#if createError && createSubmitting === false}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{createError}
						</div>
					{/if}
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="create-title" class="text-sm font-medium">Title</label>
							<Input
								id="create-title"
								bind:value={createTitle}
								placeholder="Enter category title"
								class={cn('h-9', createError && !createTitle.trim() && 'border-destructive')}
							/>
							{#if createError === 'Title is required'}
								<p class="flex items-center gap-1.5 text-sm text-destructive">
									<span aria-hidden="true">!</span>
									String must contain at least 1 character(s)
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label for="create-handle" class="flex items-center gap-1.5 text-sm font-medium">
								Handle
								<span class="font-normal text-muted-foreground">(Optional)</span>
								<Info class="size-3.5 text-muted-foreground" />
							</label>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span
								>
								<Input
									id="create-handle"
									bind:value={createHandle}
									placeholder="handle"
									class="h-9 pl-6"
								/>
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<label for="create-description" class="text-sm font-medium">
								Description
								<span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<textarea
								id="create-description"
								bind:value={createDescription}
								placeholder="Enter description"
								rows="4"
								class="flex w-full min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							></textarea>
						</div>

						<div class="flex flex-col gap-2">
							<label for="create-parent" class="text-sm font-medium">Parent</label>
							<select
								id="create-parent"
								bind:value={createParentId}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">No parent</option>
								{#each categories as cat (cat.id)}
									<option value={cat.id}>{cat.value}</option>
								{/each}
							</select>
						</div>

						<div class="flex flex-col gap-2">
							<label for="create-status" class="text-sm font-medium">Status</label>
							<select
								id="create-status"
								bind:value={createStatus}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>

						<div class="flex flex-col gap-2">
							<label for="create-visibility" class="text-sm font-medium">Visibility</label>
							<select
								id="create-visibility"
								bind:value={createVisibility}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="public">Public</option>
								<option value="private">Private</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				<Button onclick={submitCreate} disabled={createSubmitting}>
					{createSubmitting ? 'Creating…' : 'Continue'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Category Modal -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<div>
						<h2 class="text-lg font-semibold">Edit Category</h2>
						<p class="mt-1 text-sm text-muted-foreground">Update category details.</p>
					</div>

					{#if editError && editSubmitting === false}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{editError}
						</div>
					{/if}
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-title" class="text-sm font-medium">Title</label>
							<Input
								id="edit-title"
								bind:value={editTitle}
								placeholder="Enter category title"
								class={cn('h-9', editError && !editTitle.trim() && 'border-destructive')}
							/>
							{#if editError === 'Title is required'}
								<p class="flex items-center gap-1.5 text-sm text-destructive">
									<span aria-hidden="true">!</span>
									String must contain at least 1 character(s)
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label for="edit-handle" class="flex items-center gap-1.5 text-sm font-medium">
								Handle
								<span class="font-normal text-muted-foreground">(Optional)</span>
								<Info class="size-3.5 text-muted-foreground" />
							</label>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span
								>
								<Input
									id="edit-handle"
									bind:value={editHandle}
									placeholder="handle"
									class="h-9 pl-6"
								/>
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<label for="edit-description" class="text-sm font-medium">
								Description
								<span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<textarea
								id="edit-description"
								bind:value={editDescription}
								placeholder="Enter description"
								rows="4"
								class="flex w-full min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							></textarea>
						</div>

						<div class="flex flex-col gap-2">
							<label for="edit-parent" class="text-sm font-medium">Parent</label>
							<select
								id="edit-parent"
								bind:value={editParentId}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">No parent</option>
								{#each categories.filter((c) => c.id !== editCategory?.id) as cat (cat.id)}
									<option value={cat.id}>{cat.value}</option>
								{/each}
							</select>
						</div>

						<div class="flex flex-col gap-2">
							<label for="edit-status" class="text-sm font-medium">Status</label>
							<select
								id="edit-status"
								bind:value={editStatus}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>

						<div class="flex flex-col gap-2">
							<label for="edit-visibility" class="text-sm font-medium">Visibility</label>
							<select
								id="edit-visibility"
								bind:value={editVisibility}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="public">Public</option>
								<option value="private">Private</option>
							</select>
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

<!-- Delete Confirmation Modal -->
<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="category"
	entityTitle={(deleteItem as unknown as ProductCategory)?.value ?? (deleteItem as unknown as ProductCategory)?.id ?? ''}
	customMessage="Delete this category? This action cannot be undone."
	onConfirm={() => confirmDelete((item) => deleteCategories([(item as unknown as ProductCategory).id]))}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
{#if deleteError}
	<div
		class="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
	>
		{deleteError}
	</div>
{/if}
