<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type SalesChannel = {
		id: string;
		name: string;
		description: string | null;
		is_default: boolean;
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

	type SalesChannelsResponse = {
		data: SalesChannel[];
		pagination: Pagination;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let sortingField = $state('created_at');
	let sortingDirection = $state<'asc' | 'desc'>('desc');

	let data = $state<SalesChannelsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchChannels() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: sortingField,
				sorting_direction: sortingDirection
			});
			const res = await fetch(`${API_BASE}/sales-channels?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			data = (await res.json()) as SalesChannelsResponse;
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
		fetchChannels();
	});

	const channels = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	// Filter by search client-side for now
	const filteredChannels = $derived(
		searchQuery.trim()
			? channels.filter(
					(c) =>
						c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(c.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
				)
			: channels
	);

	async function deleteChannel(channel: SalesChannel) {
		try {
			const res = await fetch(`${API_BASE}/sales-channels`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sales_channel_ids: [channel.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			fetchChannels();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	// Create sheet
	let createOpen = $state(false);
	let createName = $state('');
	let createDescription = $state('');
	let createIsDefault = $state(false);
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createName = '';
		createDescription = '';
		createIsDefault = false;
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
			const res = await fetch(`${API_BASE}/sales-channels`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sales_channels: [
						{
							name: createName.trim(),
							description: createDescription.trim() || null,
							is_default: createIsDefault
						}
					]
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreate();
			fetchChannels();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit sheet
	let editOpen = $state(false);
	let editChannel = $state<SalesChannel | null>(null);
	let editName = $state('');
	let editDescription = $state('');
	let editIsDefault = $state(false);
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(channel: SalesChannel) {
		editChannel = channel;
		editOpen = true;
		editName = channel.name;
		editDescription = channel.description ?? '';
		editIsDefault = channel.is_default;
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editChannel = null;
	}

	async function submitEdit() {
		if (!editChannel) return;
		editError = null;
		if (!editName.trim()) {
			editError = 'Name is required';
			return;
		}
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/sales-channels/${editChannel.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: editName.trim(),
					description: editDescription.trim() || null,
					is_default: editIsDefault
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			fetchChannels();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-foreground">Sales Channels</span>
			</div>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm text-muted-foreground">
						Manage the online and offline channels you sell products on.
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
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Description</th>
							<th class="px-4 py-3 text-left font-medium">Default</th>
							<th class="px-4 py-3 text-left font-medium">Created at</th>
							<th class="px-4 py-3 text-left font-medium">Updated at</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if filteredChannels.length === 0}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
									No sales channels found.
								</td>
							</tr>
						{:else}
							{#each filteredChannels as channel (channel.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">{channel.name}</td>
									<td class="px-4 py-3 text-muted-foreground">
										{channel.description ?? '—'}
									</td>
									<td class="px-4 py-3">
										{#if channel.is_default}
											<span
												class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400"
											>
												Yes
											</span>
										{:else}
											<span
												class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-400"
											>
												No
											</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{formatDate(channel.created_at)}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{formatDate(channel.updated_at)}
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
														onSelect={() => openEdit(channel)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => deleteChannel(channel)}
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

<!-- Create Sales Channel Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Sales Channel</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new sales channel.
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
							placeholder="e.g. Default Sales Channel"
							class={cn('h-9', createError === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-description" class="text-sm font-medium">Description</label>
						<Input
							id="create-description"
							bind:value={createDescription}
							placeholder="Optional description"
							class="h-9"
						/>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="create-is-default"
							bind:checked={createIsDefault}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="create-is-default" class="text-sm font-medium">Default</label>
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

<!-- Edit Sales Channel Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Sales Channel</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the sales channel.
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
							placeholder="e.g. Default Sales Channel"
							class={cn('h-9', editError === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-description" class="text-sm font-medium">Description</label>
						<Input
							id="edit-description"
							bind:value={editDescription}
							placeholder="Optional description"
							class="h-9"
						/>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="edit-is-default"
							bind:checked={editIsDefault}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="edit-is-default" class="text-sm font-medium">Default</label>
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
