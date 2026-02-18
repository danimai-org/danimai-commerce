<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Users from '@lucide/svelte/icons/users';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';

	const API_BASE = 'http://localhost:8000';

	type Role = {
		id: string;
		name: string;
		description: string;
	};

	type User = {
		id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		avatar_url: string | null;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
		role_id: string | null;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let data = $state<{ data: User[]; pagination: Pagination } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchUsers() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/users?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			data = (await res.json()) as { data: User[]; pagination: Pagination };
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
		fetchUsers();
	});

	// Load roles once for Role column and Edit sheet
	$effect(() => {
		if (roles.length > 0) return;
		fetch(`${API_BASE}/roles?limit=100`, { cache: 'no-store' })
			.then((r) => r.json())
			.then((j: { data: Role[] }) => {
				if (j.data?.length) roles = j.data;
			});
	});

	const rolesById = $derived.by(() => {
		const m = new Map<string, string>();
		for (const r of roles) m.set(r.id, r.name);
		return m;
	});
	const users = $derived(data?.data ?? []);
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

	// Invite user dialog
	let inviteOpen = $state(false);
	let inviteEmail = $state('');
	let inviteRoleId = $state<string | null>(null);
	let roles = $state<Role[]>([]);
	let inviteLoading = $state(false);
	let inviteSubmitting = $state(false);
	let inviteError = $state<string | null>(null);

	async function openInviteDialog() {
		inviteOpen = true;
		inviteEmail = '';
		inviteRoleId = null;
		inviteError = null;
		inviteLoading = true;
		try {
			const res = await fetch(`${API_BASE}/roles?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const json = (await res.json()) as { data: Role[] };
				roles = json.data ?? [];
			}
		} finally {
			inviteLoading = false;
		}
	}

	async function submitInvite() {
		inviteError = null;
		const email = inviteEmail.trim();
		if (!email) {
			inviteError = 'Email is required';
			return;
		}
		inviteSubmitting = true;
		try {
			const body: { email: string; role_id?: string } = { email };
			if (inviteRoleId) body.role_id = inviteRoleId;
			const res = await fetch(`${API_BASE}/invites`, {
				method: 'POST',
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
			inviteOpen = false;
			fetchUsers();
		} catch (e) {
			inviteError = e instanceof Error ? e.message : String(e);
		} finally {
			inviteSubmitting = false;
		}
	}

	// Edit user sheet
	let editOpen = $state(false);
	let editUser = $state<User | null>(null);
	let editFirstName = $state('');
	let editLastName = $state('');
	let editRoleId = $state<string | null>(null);
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(user: User) {
		editUser = user;
		editOpen = true;
		editFirstName = user.first_name ?? '';
		editLastName = user.last_name ?? '';
		editRoleId = user.role_id ?? null;
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editUser = null;
	}

	async function submitEdit() {
		if (!editUser) return;
		editError = null;
		editSubmitting = true;
		try {
			const body: { first_name?: string | null; last_name?: string | null; role_id?: string | null } = {};
			if (editFirstName.trim() !== (editUser.first_name ?? '')) body.first_name = editFirstName.trim() || null;
			if (editLastName.trim() !== (editUser.last_name ?? '')) body.last_name = editLastName.trim() || null;
			if (editRoleId !== (editUser.role_id ?? null)) body.role_id = editRoleId;
			if (Object.keys(body).length === 0) {
				closeEdit();
				return;
			}
			const res = await fetch(`${API_BASE}/users/${editUser.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: editFirstName.trim() || null,
					last_name: editLastName.trim() || null,
					role_id: editRoleId
				})
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
			fetchUsers();
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
				<Users class="size-4" />
				<span class="font-semibold">Users</span>
			</div>
			<Button size="sm" onclick={openInviteDialog}>Invite user</Button>
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

		<Sheet.Root bind:open={inviteOpen}>
			<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
				<div class="flex h-full flex-col">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold">Invite user</h2>
						<p class="mt-1 text-sm text-muted-foreground">
							Send an invite by email. Optionally assign a role.
						</p>
					</div>
					<form
						onsubmit={(e) => {
							e.preventDefault();
							submitInvite();
						}}
						class="flex flex-1 flex-col overflow-auto"
					>
						<div class="space-y-4 px-6 py-6">
							<div class="space-y-2">
								<label for="invite-email" class="block text-sm font-medium">Email</label>
								<Input
									id="invite-email"
									type="email"
									placeholder="user@example.com"
									class="w-full"
									bind:value={inviteEmail}
									disabled={inviteSubmitting}
									required
								/>
							</div>
							<div class="space-y-2">
								<label for="invite-role" class="block text-sm font-medium">Role (optional)</label>
								{#if inviteLoading}
									<p class="text-sm text-muted-foreground">Loading roles…</p>
								{:else}
									<Select.Root
										type="single"
										value={inviteRoleId ?? undefined}
										onValueChange={(v) => (inviteRoleId = v ?? null)}
										allowDeselect
										disabled={inviteSubmitting}
									>
										<Select.Trigger id="invite-role" class="w-full">
											{#if inviteRoleId && roles.find((r) => r.id === inviteRoleId)}
												{roles.find((r) => r.id === inviteRoleId)?.name}
											{:else}
												Select role
											{/if}
										</Select.Trigger>
										<Select.Content>
											{#each roles as role (role.id)}
												<Select.Item value={role.id} label={role.name}>{role.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/if}
							</div>
							{#if inviteError}
								<p class="text-sm text-destructive">{inviteError}</p>
							{/if}
						</div>
						<div class="flex justify-end gap-2 border-t p-4">
							<Button type="button" variant="outline" onclick={() => (inviteOpen = false)} disabled={inviteSubmitting}>
								Cancel
							</Button>
							<Button type="submit" disabled={inviteSubmitting}>
								{inviteSubmitting ? 'Sending…' : 'Send invite'}
							</Button>
						</div>
					</form>
				</div>
			</Sheet.Content>
		</Sheet.Root>

		<!-- Edit user sheet -->
		<Sheet.Root bind:open={editOpen}>
			<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
				<div class="flex h-full flex-col">
<div class="border-b px-6 py-4">
					<h2 class="text-lg font-semibold">Edit user</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Update first name, last name, and role.
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
								<label for="edit-first-name" class="block text-sm font-medium">First Name</label>
								<Input
									id="edit-first-name"
									type="text"
									placeholder="First name"
									class="w-full"
									bind:value={editFirstName}
									disabled={editSubmitting}
								/>
							</div>
							<div class="space-y-2">
								<label for="edit-last-name" class="block text-sm font-medium">Last Name</label>
								<Input
									id="edit-last-name"
									type="text"
									placeholder="Last name"
									class="w-full"
									bind:value={editLastName}
									disabled={editSubmitting}
								/>
							</div>
							<div class="space-y-2">
								<label for="edit-role" class="block text-sm font-medium">Role</label>
								<Select.Root
									type="single"
									value={editRoleId ?? undefined}
									onValueChange={(v) => (editRoleId = v ?? null)}
									allowDeselect
									disabled={editSubmitting}
								>
									<Select.Trigger id="edit-role" class="w-full">
										{#if editRoleId && roles.find((r) => r.id === editRoleId)}
											{roles.find((r) => r.id === editRoleId)?.name}
										{:else}
											Select role
										{/if}
									</Select.Trigger>
									<Select.Content>
										{#each roles as role (role.id)}
											<Select.Item value={role.id} label={role.name}>{role.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
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
							<th class="px-4 py-3 text-left font-medium">Email</th>
							<th class="px-4 py-3 text-left font-medium">First Name</th>
							<th class="px-4 py-3 text-left font-medium">Last Name</th>
							<th class="px-4 py-3 text-left font-medium">Role</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if users.length === 0}
							<tr>
								<td colspan="7" class="px-4 py-8 text-center text-muted-foreground">
									No users found.
								</td>
							</tr>
						{:else}
							{#each users as user (user.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">{user.email}</td>
									<td class="px-4 py-3 text-muted-foreground">{user.first_name ?? '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">{user.last_name ?? '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">{user.role_id ? (rolesById.get(user.role_id) ?? '–') : '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(user.created_at)}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(user.updated_at)}</td>
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
														onSelect={() => openEdit(user)}
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
