<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Collapsible, DropdownMenu } from 'bits-ui';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	const API_BASE = 'http://localhost:8000';

	type Permission = {
		id: string;
		name: string;
		description: string | null;
		created_at: string;
		updated_at: string;
	};

	type Role = {
		id: string;
		name: string;
		description: string;
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
	let data = $state<{ data: Role[]; pagination: Pagination } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedIds = $state<Set<string>>(new Set());

	async function fetchRoles() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'name',
				sorting_direction: 'asc'
			});
			const res = await fetch(`${API_BASE}/roles?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			data = (await res.json()) as { data: Role[]; pagination: Pagination };
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
		fetchRoles();
	});

	const roles = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

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

	function toggleSelect(id: string) {
		selectedIds = new Set(selectedIds);
		if (selectedIds.has(id)) selectedIds.delete(id);
		else selectedIds.add(id);
	}

	function toggleSelectAll() {
		if (selectedIds.size === roles.length) selectedIds = new Set();
		else selectedIds = new Set(roles.map((r) => r.id));
	}

	async function deleteRole(role: Role) {
		try {
			const res = await fetch(`${API_BASE}/roles`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role_ids: [role.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			selectedIds = new Set(selectedIds);
			selectedIds.delete(role.id);
			fetchRoles();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function deleteSelected() {
		if (selectedIds.size === 0) return;
		try {
			const res = await fetch(`${API_BASE}/roles`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role_ids: [...selectedIds] })
			});
			if (!res.ok) throw new Error(await res.text());
			selectedIds = new Set();
			fetchRoles();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	// Permissions: fetch all and group by resource
	let permissions = $state<Permission[]>([]);
	let permissionsLoading = $state(false);

	async function fetchPermissions() {
		permissionsLoading = true;
		try {
			// Backend PaginationSchema allows max limit=100; fetch all pages if needed
			let all: Permission[] = [];
			let page = 1;
			let hasMore = true;
			while (hasMore) {
				const res = await fetch(
					`${API_BASE}/permissions?page=${page}&limit=100&sorting_field=name&sorting_direction=asc`,
					{ cache: 'no-store' }
				);
				if (!res.ok) throw new Error(await res.text());
				const json = (await res.json()) as {
					data: Permission[];
					pagination: { has_next_page: boolean };
				};
				const data = json.data ?? [];
				all = all.concat(data);
				hasMore = (json.pagination?.has_next_page ?? false) && data.length === 100;
				page += 1;
			}
			permissions = all;
		} catch {
			permissions = [];
		} finally {
			permissionsLoading = false;
		}
	}

	function groupLabel(key: string): string {
		return key
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
			.join(' ');
	}

	const permissionGroups = $derived.by(() => {
		const map = new Map<string, Permission[]>();
		for (const p of permissions) {
			const key = p.name.includes(':') ? p.name.split(':')[0] : p.name;
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(p);
		}
		return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
	});

	// Sheet: create / edit role
	let sheetOpen = $state(false);
	let sheetMode = $state<'create' | 'edit'>('create');
	let editRole = $state<Role | null>(null);
	let formName = $state('');
	let formDescription = $state('');
	let formSelectedPermissionIds = $state<Set<string>>(new Set());
	let accordionOpenGroup = $state<string | null>(null);
	let formSubmitting = $state(false);
	let formError = $state<string | null>(null);

	function togglePermission(permissionId: string) {
		formSelectedPermissionIds = new Set(formSelectedPermissionIds);
		if (formSelectedPermissionIds.has(permissionId)) formSelectedPermissionIds.delete(permissionId);
		else formSelectedPermissionIds.add(permissionId);
	}

	function togglePermissionGroup(perms: Permission[]) {
		const ids = perms.map((p) => p.id);
		const allSelected = ids.every((id) => formSelectedPermissionIds.has(id));
		formSelectedPermissionIds = new Set(formSelectedPermissionIds);
		if (allSelected) {
			ids.forEach((id) => formSelectedPermissionIds.delete(id));
		} else {
			ids.forEach((id) => formSelectedPermissionIds.add(id));
		}
	}

	function isGroupAllSelected(perms: Permission[]): boolean {
		return perms.length > 0 && perms.every((p) => formSelectedPermissionIds.has(p.id));
	}

	function isGroupSomeSelected(perms: Permission[]): boolean {
		return perms.some((p) => formSelectedPermissionIds.has(p.id));
	}

	function toggleAllPermissions() {
		if (permissions.length === 0) return;
		const allSelected = permissions.every((p) => formSelectedPermissionIds.has(p.id));
		if (allSelected) {
			formSelectedPermissionIds = new Set();
		} else {
			formSelectedPermissionIds = new Set(permissions.map((p) => p.id));
		}
	}

	const allPermissionsSelected = $derived(
		permissions.length > 0 && permissions.every((p) => formSelectedPermissionIds.has(p.id))
	);
	const somePermissionsSelected = $derived(
		permissions.some((p) => formSelectedPermissionIds.has(p.id))
	);

	function openCreate() {
		sheetMode = 'create';
		editRole = null;
		formName = '';
		formDescription = '';
		formSelectedPermissionIds = new Set();
		accordionOpenGroup = null;
		formError = null;
		fetchPermissions();
		sheetOpen = true;
	}

	function openEdit(role: Role) {
		sheetMode = 'edit';
		editRole = role;
		formName = role.name;
		formDescription = role.description;
		formSelectedPermissionIds = new Set();
		accordionOpenGroup = null;
		formError = null;
		fetchPermissions();
		sheetOpen = true;
	}

	async function submitForm() {
		formError = null;
		if (!formName.trim()) {
			formError = 'Name is required';
			return;
		}
		formSubmitting = true;
		try {
			if (sheetMode === 'create') {
				const res = await fetch(`${API_BASE}/roles`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() })
				});
				if (!res.ok) throw new Error(await res.text());
			} else if (editRole) {
				const res = await fetch(`${API_BASE}/roles/${editRole.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() })
				});
				if (!res.ok) throw new Error(await res.text());
			}
			sheetOpen = false;
			fetchRoles();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			formSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<a href="/users" class="flex items-center gap-1 hover:text-foreground">Manage Users</a>
				<span>/</span>
				<span class="text-foreground">Roles</span>
			</div>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h1 class="text-lg leading-none font-semibold">Roles</h1>
					<p class="mt-1 text-sm text-muted-foreground">Manage user roles and their permissions.</p>
				</div>
				<Button size="sm" onclick={openCreate}>Add role</Button>
			</div>
			{#if selectedIds.size > 0}
				<Button
					variant="outline"
					size="sm"
					class="rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={deleteSelected}
				>
					<Trash2 class="mr-1.5 size-4" />
					Remove selected ({selectedIds.size})
				</Button>
			{/if}
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
							<th class="w-10 px-4 py-3">
								<input
									type="checkbox"
									class="h-4 w-4 rounded border-input"
									checked={roles.length > 0 && selectedIds.size === roles.length}
									indeterminate={selectedIds.size > 0 && selectedIds.size < roles.length}
									onchange={toggleSelectAll}
								/>
							</th>
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Description</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if roles.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
									No roles. Add a role to get started.
								</td>
							</tr>
						{:else}
							{#each roles as role (role.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3">
										<input
											type="checkbox"
											class="h-4 w-4 rounded border-input"
											checked={selectedIds.has(role.id)}
											onchange={() => toggleSelect(role.id)}
										/>
									</td>
									<td class="px-4 py-3 font-medium">{role.name}</td>
									<td class="px-4 py-3 text-muted-foreground">{role.description || '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(role.created_at)}</td>
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
														onSelect={() => openEdit(role)}
													>
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => deleteRole(role)}
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

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold">
					{sheetMode === 'create' ? 'Add role' : 'Edit role'}
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{sheetMode === 'create'
						? 'Create a new role with a name and optional description.'
						: 'Update the role name and description.'}
				</p>
			</div>
			<div class="flex-1 space-y-4 overflow-auto p-6">
				{#if formError}
					<div
						class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					>
						{formError}
					</div>
				{/if}
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="role-name">Name</label>
					<Input id="role-name" bind:value={formName} placeholder="e.g. admin" />
				</div>
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="role-desc">Description</label>
					<Input id="role-desc" bind:value={formDescription} placeholder="Optional description" />
				</div>
				<div class="space-y-1">
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							class="h-4 w-4 rounded border-input"
							checked={allPermissionsSelected}
							indeterminate={somePermissionsSelected && !allPermissionsSelected}
							onchange={toggleAllPermissions}
							disabled={permissionsLoading || permissions.length === 0}
						/>
						<span class="text-sm font-medium">Permissions</span>
					</label>
					{#if permissionsLoading}
						<p class="text-sm text-muted-foreground">Loading permissions…</p>
					{:else if permissionGroups.length === 0}
						<p class="text-sm text-muted-foreground">No permissions available.</p>
					{:else}
						<div class="space-y-1 rounded-md border border-input">
							{#each permissionGroups as [groupKey, perms]}
								<Collapsible.Root
									class="group/collapsible border-b border-input last:border-b-0"
									open={accordionOpenGroup === groupKey}
									onOpenChange={(open) => (accordionOpenGroup = open ? groupKey : null)}
								>
									<div
										class="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50"
									>
										<label
											class="flex shrink-0 cursor-pointer items-center"
											onclick={(e) => e.stopPropagation()}
											role="presentation"
										>
											<input
												type="checkbox"
												class="h-4 w-4 rounded border-input"
												checked={isGroupAllSelected(perms)}
												indeterminate={isGroupSomeSelected(perms) && !isGroupAllSelected(perms)}
												onchange={() => togglePermissionGroup(perms)}
											/>
										</label>
										<Collapsible.Trigger
											class="flex flex-1 cursor-pointer items-center justify-between gap-2 text-left"
										>
											<span>{groupLabel(groupKey)}</span>
											<ChevronDown
												class="size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180"
											/>
										</Collapsible.Trigger>
									</div>
									<Collapsible.Content>
										<div class="space-y-0.5 border-t border-input bg-muted/20 px-3 py-2">
											{#each perms as perm (perm.id)}
												<label
													class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50"
												>
													<input
														type="checkbox"
														class="h-4 w-4 rounded border-input"
														checked={formSelectedPermissionIds.has(perm.id)}
														onchange={() => togglePermission(perm.id)}
													/>
													<span class="text-sm">{perm.name}</span>
												</label>
											{/each}
										</div>
									</Collapsible.Content>
								</Collapsible.Root>
							{/each}
						</div>
					{/if}
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={() => (sheetOpen = false)}>Cancel</Button>
				<Button type="button" disabled={formSubmitting} onclick={submitForm}>
					{formSubmitting ? 'Saving…' : sheetMode === 'create' ? 'Create' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
