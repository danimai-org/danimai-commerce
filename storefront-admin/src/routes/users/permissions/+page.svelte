<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Lock from '@lucide/svelte/icons/lock';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';
	import { client } from '$lib/client.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';

	type Permission = {
		id: string;
		name: string;
		description: string;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date | null;
	};

	let searchQuery = $state('');

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			return client['permissions'].get({ query: paginationQuery });
		},
		['permissions']
	);

	const permissions = $derived(paginateState.query.data?.data?.rows ?? []);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	function formatDate(iso: string | Date) {
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

	// Edit permission sheet
	let editOpen = $state(false);
	let editPermission = $state<Permission | null>(null);
	let editName = $state('');
	let editDescription = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(perm: Permission) {
		editPermission = perm;
		editOpen = true;
		editName = perm.name;
		editDescription = perm.description ?? '';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editPermission = null;
	}

	const refetch = $derived(paginateState.refetch);

	async function submitEdit() {
		if (!editPermission) return;
		editError = null;
		editSubmitting = true;
		try {
			const body: { description?: string } = {};
			if (editDescription.trim() !== (editPermission.description ?? '')) body.description = editDescription.trim();
			const res = await fetch(`/admin/permissions/${editPermission.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const text = await res.text();
			if (!res.ok) {
				let msg = text;
				try {
					const j = JSON.parse(text);
					msg = j.message ?? text;
				} catch {}
				throw new Error(msg);
			}
			closeEdit();
			refetch();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<svelte:head>
    <title>Permissions</title>
    <meta name="description" content="Manage permissions." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Lock class="size-4" />
				<span class="font-semibold">Permissions</span>
			</div>
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
							<th class="px-4 py-3 text-left font-medium">Description</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if permissions.length === 0}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
									No permissions found. Run migrations to seed default permissions.
								</td>
							</tr>
						{:else}
							{#each permissions as perm (perm.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">{perm.name}</td>
									<td class="px-4 py-3 text-muted-foreground">{perm.description || '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(perm.created_at)}</td>
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
														onSelect={() => openEdit(perm)}
													>
														<Pencil class="size-4" />
														Edit
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
						onclick={() => pagination && goToPage(pagination.page - 1)}
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
						onclick={() => pagination && goToPage(pagination.page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Edit permission sheet -->
	<Sheet.Root bind:open={editOpen}>
		<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
			<div class="flex h-full flex-col">
				<div class="border-b px-6 py-4">
					<h2 class="text-lg font-semibold">Edit permission</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Update name and description.
					</p>
				</div>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						submitEdit();
					}}
					class="flex flex-1 flex-col overflow-auto"
				>
					<div class="space-y-4 px-6 py-6">
						<div class="space-y-2">
							<label for="edit-permission-name" class="block text-sm font-medium">Name</label>
							<Input
								id="edit-permission-name"
								type="text"
								placeholder="e.g. customer:read"
								class="w-full"
								bind:value={editName}
								disabled
							/>
						</div>
						<div class="space-y-2">
							<label for="edit-permission-description" class="block text-sm font-medium">Description</label>
							<Input
								id="edit-permission-description"
								type="text"
								placeholder="Description"
								class="w-full"
								bind:value={editDescription}
								disabled={editSubmitting}
							/>
						</div>
						{#if editError}
							<p class="text-sm text-destructive">{editError}</p>
						{/if}
					</div>
					<div class="flex justify-end gap-2 border-t p-4">
						<Button type="button" variant="outline" onclick={closeEdit} disabled={editSubmitting}>
							Cancel
						</Button>
						<Button type="submit" disabled={editSubmitting}>
							{editSubmitting ? 'Saving…' : 'Save'}
						</Button>
					</div>
				</form>
			</div>
		</Sheet.Content>
	</Sheet.Root>
</div>
