<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { cn } from '$lib/utils.js';

	type PriceListType = 'sale' | 'override';
	type PriceListStatus = 'active' | 'draft';

	type PriceList = {
		id: string;
		name: string;
		description: string | null;
		type: PriceListType;
		status: PriceListStatus;
		starts_at: string | null;
		ends_at: string | null;
		created_at: string;
		updated_at: string;
	};

	const STORAGE_KEY = 'price-lists';

	function loadPriceLists(): PriceList[] {
		if (typeof window === 'undefined') return [];
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) return JSON.parse(stored);
		} catch (e) {
			console.error('Failed to load price lists:', e);
		}
		return [];
	}

	function savePriceLists(list: PriceList[]) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
			} catch (e) {
				console.error('Failed to save price lists:', e);
			}
		}
	}

	function generateId() {
		return crypto.randomUUID?.() ?? `pl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	}

	let priceLists = $state<PriceList[]>(loadPriceLists());
	let searchQuery = $state('');
	let page = $state(1);
	const limit = 10;

	const filtered = $derived(
		searchQuery.trim()
			? priceLists.filter(
					(p) =>
						p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
				)
			: priceLists
	);
	const total = $derived(filtered.length);
	const totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	const start = $derived((page - 1) * limit + 1);
	const end = $derived(Math.min(page * limit, total));
	const pageData = $derived(filtered.slice((page - 1) * limit, page * limit));

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return iso;
		}
	}

	// Create
	let createOpen = $state(false);
	let createName = $state('');
	let createDescription = $state('');
	let createType = $state<PriceListType>('sale');
	let createStatus = $state<PriceListStatus>('draft');
	let createStartsAt = $state('');
	let createEndsAt = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createName = '';
		createDescription = '';
		createType = 'sale';
		createStatus = 'draft';
		createStartsAt = '';
		createEndsAt = '';
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	async function submitCreate() {
		createError = null;
		if (!createName.trim()) {
			createError = 'Name is required';
			return;
		}
		createSubmitting = true;
		try {
			const now = new Date().toISOString();
			const newList: PriceList = {
				id: generateId(),
				name: createName.trim(),
				description: createDescription.trim() || null,
				type: createType,
				status: createStatus,
				starts_at: createStartsAt.trim() || null,
				ends_at: createEndsAt.trim() || null,
				created_at: now,
				updated_at: now
			};
			priceLists = [...priceLists, newList];
			savePriceLists(priceLists);
			closeCreate();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit
	let editOpen = $state(false);
	let editList = $state<PriceList | null>(null);
	let editName = $state('');
	let editDescription = $state('');
	let editType = $state<PriceListType>('sale');
	let editStatus = $state<PriceListStatus>('draft');
	let editStartsAt = $state('');
	let editEndsAt = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(pl: PriceList) {
		editList = pl;
		editOpen = true;
		editName = pl.name;
		editDescription = pl.description ?? '';
		editType = pl.type;
		editStatus = pl.status;
		editStartsAt = pl.starts_at ? pl.starts_at.slice(0, 16) : '';
		editEndsAt = pl.ends_at ? pl.ends_at.slice(0, 16) : '';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editList = null;
	}

	async function submitEdit() {
		if (!editList) return;
		editError = null;
		if (!editName.trim()) {
			editError = 'Name is required';
			return;
		}
		editSubmitting = true;
		try {
			const now = new Date().toISOString();
			priceLists = priceLists.map((p) =>
				p.id === editList!.id
					? {
							...p,
							name: editName.trim(),
							description: editDescription.trim() || null,
							type: editType,
							status: editStatus,
							starts_at: editStartsAt.trim() || null,
							ends_at: editEndsAt.trim() || null,
							updated_at: now
						}
					: p
			);
			savePriceLists(priceLists);
			closeEdit();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	// Delete
	let deleteConfirmOpen = $state(false);
	let listToDelete = $state<PriceList | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteConfirm(pl: PriceList) {
		listToDelete = pl;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			listToDelete = null;
		}
	}

	function confirmDelete() {
		if (!listToDelete) return;
		deleteSubmitting = true;
		try {
			priceLists = priceLists.filter((p) => p.id !== listToDelete!.id);
			savePriceLists(priceLists);
			deleteConfirmOpen = false;
			listToDelete = null;
		} finally {
			deleteSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListChecks class="size-4" />
				<span class="font-semibold">Price Lists</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create price list</Button>
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

		<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
			<table class="w-full text-sm">
				<thead class="sticky top-0 border-b bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium">Name</th>
						<th class="px-4 py-3 text-left font-medium">Type</th>
						<th class="px-4 py-3 text-left font-medium">Status</th>
						<th class="px-4 py-3 text-left font-medium">Starts</th>
						<th class="px-4 py-3 text-left font-medium">Ends</th>
						<th class="px-4 py-3 text-left font-medium">Created</th>
						<th class="w-10 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#if pageData.length === 0}
						<tr>
							<td colspan="7" class="px-4 py-12 text-center text-muted-foreground">
								No price lists yet. Create one to define custom pricing (e.g. sales or overrides).
							</td>
						</tr>
					{:else}
						{#each pageData as pl (pl.id)}
							<tr class="border-b transition-colors hover:bg-muted/30">
								<td class="px-4 py-3 font-medium">{pl.name}</td>
								<td class="px-4 py-3 text-muted-foreground capitalize">{pl.type}</td>
								<td class="px-4 py-3">
									<span
										class={cn(
											'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
											pl.status === 'active'
												? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
												: 'bg-muted text-muted-foreground'
										)}
									>
										{pl.status}
									</span>
								</td>
								<td class="px-4 py-3 text-muted-foreground">
									{pl.starts_at ? formatDate(pl.starts_at) : '–'}
								</td>
								<td class="px-4 py-3 text-muted-foreground">
									{pl.ends_at ? formatDate(pl.ends_at) : '–'}
								</td>
								<td class="px-4 py-3 text-muted-foreground">{formatDate(pl.created_at)}</td>
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
													onSelect={() => openEdit(pl)}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Item
													textValue="Delete"
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openDeleteConfirm(pl)}
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
				{#if total > 0}
					{start} – {end} of {total} results
				{:else}
					0 results
				{/if}
			</p>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={page <= 1}
					onclick={() => (page = page - 1)}
				>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">
					{page} of {totalPages} pages
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={page >= totalPages}
					onclick={() => (page = page + 1)}
				>
					Next
				</Button>
			</div>
		</div>
	</div>
</div>

<!-- Create price list sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create price list</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Define a price list for sales or overrides. You can attach it to products later.
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
						<label for="create-name" class="text-sm font-medium">Name</label>
						<Input
							id="create-name"
							bind:value={createName}
							placeholder="e.g. Summer Sale 2025"
							class={cn('h-9', createError === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-desc" class="text-sm font-medium">Description (optional)</label>
						<Input
							id="create-desc"
							bind:value={createDescription}
							placeholder="Short description"
							class="h-9"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-type" class="text-sm font-medium">Type</label>
						<Select.Root
							type="single"
							value={createType}
							onValueChange={(v) => v && (createType = v as PriceListType)}
						>
							<Select.Trigger id="create-type" class="h-9 w-full">
								{createType === 'sale' ? 'Sale' : 'Override'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="sale" label="Sale">Sale</Select.Item>
								<Select.Item value="override" label="Override">Override</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-status" class="text-sm font-medium">Status</label>
						<Select.Root
							type="single"
							value={createStatus}
							onValueChange={(v) => v && (createStatus = v as PriceListStatus)}
						>
							<Select.Trigger id="create-status" class="h-9 w-full">
								{createStatus === 'active' ? 'Active' : 'Draft'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="draft" label="Draft">Draft</Select.Item>
								<Select.Item value="active" label="Active">Active</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-starts" class="text-sm font-medium">Starts at (optional)</label>
						<Input id="create-starts" type="datetime-local" bind:value={createStartsAt} class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-ends" class="text-sm font-medium">Ends at (optional)</label>
						<Input id="create-ends" type="datetime-local" bind:value={createEndsAt} class="h-9" />
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

<!-- Edit price list sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit price list</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update name, type, status, and dates.
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
						<label for="edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-name"
							bind:value={editName}
							placeholder="e.g. Summer Sale 2025"
							class={cn('h-9', editError === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-desc" class="text-sm font-medium">Description (optional)</label>
						<Input id="edit-desc" bind:value={editDescription} placeholder="Short description" class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-type" class="text-sm font-medium">Type</label>
						<Select.Root
							type="single"
							value={editType}
							onValueChange={(v) => v && (editType = v as PriceListType)}
						>
							<Select.Trigger id="edit-type" class="h-9 w-full">
								{editType === 'sale' ? 'Sale' : 'Override'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="sale" label="Sale">Sale</Select.Item>
								<Select.Item value="override" label="Override">Override</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-status" class="text-sm font-medium">Status</label>
						<Select.Root
							type="single"
							value={editStatus}
							onValueChange={(v) => v && (editStatus = v as PriceListStatus)}
						>
							<Select.Trigger id="edit-status" class="h-9 w-full">
								{editStatus === 'active' ? 'Active' : 'Draft'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="draft" label="Draft">Draft</Select.Item>
								<Select.Item value="active" label="Active">Active</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-starts" class="text-sm font-medium">Starts at (optional)</label>
						<Input id="edit-starts" type="datetime-local" bind:value={editStartsAt} class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-ends" class="text-sm font-medium">Ends at (optional)</label>
						<Input id="edit-ends" type="datetime-local" bind:value={editEndsAt} class="h-9" />
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
	entityName="price list"
	entityTitle={listToDelete?.name ?? listToDelete?.id ?? ''}
	onConfirm={confirmDelete}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
