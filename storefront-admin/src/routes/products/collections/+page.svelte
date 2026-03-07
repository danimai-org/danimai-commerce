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
	import FileText from '@lucide/svelte/icons/file-text';
	import Info from '@lucide/svelte/icons/info';
	import X from '@lucide/svelte/icons/x';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { listCollections, deleteCollections } from '$lib/product-collection/api.js';
	import type { ProductCollection } from '$lib/product-collection/types.js';
	import type { CollectionsListResponse } from '$lib/product-collection/types.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

	type FilterKind = 'sales_channel' | 'type';
	const FILTER_OPTIONS: { id: FilterKind; label: string }[] = [
		{ id: 'sales_channel', label: 'Sales channel' },
		{ id: 'type', label: 'Type' }
	];

	const COLLECTION_TYPE_OPTIONS = ['manual', 'automated'] as const;

	let searchQuery = $state('');
	let activeFilterTypes = $state<Set<FilterKind>>(new Set());
	let selectedSalesChannelIds = $state<Set<string>>(new Set());
	let selectedCollectionTypes = $state<Set<string>>(new Set());
	let salesChannelsList = $state<Array<{ id: string; name: string }>>([]);

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination<CollectionsListResponse>(
		async (): Promise<CollectionsListResponse> => {
			const q = paginationQuery as Record<string, unknown>;
			const params = {
				page: q?.page != null ? Number(q.page) : 1,
				limit: q?.limit != null ? Number(q.limit) : 10,
				sorting_field: (q?.sorting_field as string) ?? 'created_at',
				sorting_direction: (q?.sorting_direction as 'asc' | 'desc') ?? 'desc',
				search: searchQuery.trim() || undefined,
				sales_channel_ids:
					selectedSalesChannelIds.size > 0 ? [...selectedSalesChannelIds] : undefined,
				collection_type:
					selectedCollectionTypes.size > 0 ? [...selectedCollectionTypes] : undefined
			};
			return listCollections(params);
		},
		['collections']
	);

	$effect(() => {
		page.url.searchParams.toString();
		searchQuery;
		[...selectedSalesChannelIds].sort().join(',');
		[...selectedCollectionTypes].sort().join(',');
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	function syncPageOne() {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', '1');
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	function toggleFilterType(id: FilterKind) {
		activeFilterTypes = new Set(activeFilterTypes);
		if (activeFilterTypes.has(id)) activeFilterTypes.delete(id);
		else activeFilterTypes.add(id);
	}

	function toggleSalesChannel(id: string) {
		selectedSalesChannelIds = new Set(selectedSalesChannelIds);
		if (selectedSalesChannelIds.has(id)) selectedSalesChannelIds.delete(id);
		else selectedSalesChannelIds.add(id);
		syncPageOne();
	}

	function clearSalesChannelFilter() {
		selectedSalesChannelIds = new Set();
		syncPageOne();
	}

	function toggleCollectionType(t: string) {
		selectedCollectionTypes = new Set(selectedCollectionTypes);
		if (selectedCollectionTypes.has(t)) selectedCollectionTypes.delete(t);
		else selectedCollectionTypes.add(t);
		syncPageOne();
	}

	function clearCollectionTypeFilter() {
		selectedCollectionTypes = new Set();
		syncPageOne();
	}

	function clearFilters() {
		activeFilterTypes = new Set();
		searchQuery = '';
		selectedSalesChannelIds = new Set();
		selectedCollectionTypes = new Set();
		syncPageOne();
	}

	function removeFilterChip() {
		searchQuery = '';
		syncPageOne();
	}

	const hasActiveFilters = $derived(
		searchQuery.trim() !== '' ||
			activeFilterTypes.size > 0 ||
			selectedSalesChannelIds.size > 0 ||
			selectedCollectionTypes.size > 0
	);

	let prevSearch = $state('');
	$effect(() => {
		if (searchQuery !== prevSearch) {
			prevSearch = searchQuery;
			syncPageOne();
		}
	});

	let salesChannelsLoaded = $state(false);
	$effect(() => {
		if (salesChannelsLoaded) return;
		salesChannelsLoaded = true;
		fetch(`${API_BASE}/sales-channels?limit=100`)
			.then((r) => (r.ok ? r.json() : { data: [] }))
			.then((j) => {
				const list = j.data ?? [];
				salesChannelsList = list.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }));
			})
			.catch(() => {
				salesChannelsList = [];
			});
	});

	const queryData = $derived(paginateState.query.data as CollectionsListResponse | undefined);
	const rawRows = $derived(queryData?.data?.rows ?? []);
	function getHandle(collection: ProductCollection): string {
		return collection.handle.startsWith('/') ? collection.handle : `/${collection.handle}`;
	}
	const rows = $derived(rawRows.map((c) => ({ ...c, handle_display: getHandle(c) })));
	const pagination = $derived(queryData?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);

	const openEditSheet = (collection: ProductCollection) => openEdit(collection);
	const openDeleteConfirm = paginateState.openDeleteConfirm;
	const closeDeleteConfirm = paginateState.closeDeleteConfirm;
	const confirmDelete = paginateState.confirmDelete;
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);

	const tableColumns: TableColumn[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'link',
			cellHref: (row) => `/products/collections/${row.id}`,
			textKey: 'title'
		},
		{ label: 'Handle', key: 'handle_display', type: 'text' },
		{ label: 'Products', key: 'product_count', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => openEditSheet(item as ProductCollection)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as unknown as CollectionsListResponse)
				}
			]
		}
	];

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
			paginateState.refetch();
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
			paginateState.refetch();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Collections | Products | Danimai Store</title>
	<meta name="description" content="Manage product collections." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<FileText class="size-4" />
				<span class="font-semibold">Collections</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
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
							emptyMessage="No collections found."
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
	bind:open={paginateState.deleteConfirmOpen}
	entityName="collection"
	entityTitle={(deleteItem as unknown as ProductCollection)?.title ?? (deleteItem as unknown as ProductCollection)?.handle ?? (deleteItem as unknown as ProductCollection)?.id ?? ''}
	onConfirm={() => confirmDelete((item) => deleteCollections([(item as unknown as ProductCollection).id]))}
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
