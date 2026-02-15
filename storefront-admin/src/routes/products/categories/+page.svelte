<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Info from '@lucide/svelte/icons/info';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type ProductCategory = {
		id: string;
		value: string;
		handle: string;
		metadata: unknown | null;
		parent_id: string | null;
		status: string;
		visibility: string;
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

	type CategoriesResponse = {
		data: ProductCategory[];
		pagination: Pagination;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let sortingField = $state('created_at');
	let sortingDirection = $state<'asc' | 'desc'>('desc');

	let data = $state<CategoriesResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchCategories() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: sortingField,
				sorting_direction: sortingDirection
			});
			const res = await fetch(`${API_BASE}/product-categories?${params}`);
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			data = (await res.json()) as CategoriesResponse;
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
		fetchCategories();
	});

	const categories = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

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
		// Fetch all categories for ranking (use high limit)
		try {
			const res = await fetch(
				`${API_BASE}/product-categories?page=1&limit=100&sorting_field=created_at&sorting_direction=asc`
			);
			if (res.ok) {
				const json = (await res.json()) as CategoriesResponse;
				rankedCategories = [...(json.data ?? [])];
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
			fetchCategories();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
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
			fetchCategories();
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
			fetchCategories();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	function getHandle(category: ProductCategory): string {
		const h = category.handle;
		if (h) return h.startsWith('/') ? h : `/${h}`;
		return `/${category.value.toLowerCase().replace(/\s+/g, '-')}`;
	}

	async function deleteCategory(category: ProductCategory) {
		try {
			const res = await fetch(`${API_BASE}/product-categories`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ category_ids: [category.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			fetchCategories();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Content -->
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm text-muted-foreground">
						Organize products into categories, and manage those categories' ranking and hierarchy.
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" onclick={openRanking}>
						<GripVertical class="mr-1.5 size-4" />
						Edit ranking
					</Button>
					<Button size="sm" onclick={openCreate}>Create</Button>
				</div>
			</div>
			<div class="relative max-w-sm">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search"
					bind:value={searchQuery}
					class="h-9 rounded-md pl-9"
				/>
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
			<!-- Table -->
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Handle</th>
							<th class="px-4 py-3 text-left font-medium">Status</th>
							<th class="px-4 py-3 text-left font-medium">Visibility</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if categories.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
									No categories found.
								</td>
							</tr>
						{:else}
							{#each categories as category (category.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">
										<a
											href="/products/categories/{category.id}"
											class="hover:underline focus:underline focus:outline-none"
										>
											{category.value}
										</a>
									</td>
									<td class="px-4 py-3 text-muted-foreground">{getHandle(category)}</td>
									<td class="px-4 py-3">
										<span
											class={cn(
												'inline-flex items-center gap-1.5 text-sm capitalize',
												category.status === 'active' && 'text-green-700 dark:text-green-400',
												category.status === 'inactive' && 'text-muted-foreground'
											)}
										>
											<span
												class={cn(
													'size-1.5 rounded-full',
													category.status === 'active' && 'bg-green-600',
													category.status === 'inactive' && 'bg-muted-foreground'
												)}
											></span>
											{category.status ?? 'Active'}
										</span>
									</td>
									<td class="px-4 py-3">
										<span
											class={cn(
												'inline-flex items-center gap-1.5 text-sm capitalize',
												category.visibility === 'public' && 'text-green-700 dark:text-green-400',
												category.visibility === 'private' && 'text-muted-foreground'
											)}
										>
											<span
												class={cn(
													'size-1.5 rounded-full',
													category.visibility === 'public' && 'bg-green-600',
													category.visibility === 'private' && 'bg-muted-foreground'
												)}
											></span>
											{category.visibility ?? 'Public'}
										</span>
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
														onSelect={() => openEdit(category)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => deleteCategory(category)}
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

			<!-- Pagination -->
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
