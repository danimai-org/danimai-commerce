<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import Users from '@lucide/svelte/icons/users';
	import MultiSelectCombobox from '$lib/components/organs/multi-select-combobox/multi-select-combobox.svelte';

	type Role = {
		id: string;
		name: string;
		description: string;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date | null;
	};

	type User = {
		id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		avatar_url: string | null;
		metadata: unknown | null;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date | null;
		role_id: string | null;
	};

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			return client.users.get({ query: paginationQuery });
		},
		['users']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	// Load roles once for Role column and Edit sheet
	$effect(() => {
		if (roles.length > 0) return;
		client.roles
			.get({ query: { limit: 100 } as any })
			.then((res) => {
				if (res.error) return;
				const rows = ((res.data as { rows?: Role[] } | null)?.rows ?? []) as Role[];
				if (rows.length > 0) roles = rows;
			})
			.catch(() => {});
	});

	const rolesById = $derived.by(() => {
		const m = new Map<string, string>();
		for (const r of roles) m.set(r.id, r.name);
		return m;
	});

	const rows = $derived(paginateState.query.data?.data?.rows ?? []);
	const rowsWithDisplay = $derived(
		(rows as User[]).map((user) => ({
			...user,
			first_name_display: user.first_name ?? '–',
			last_name_display: user.last_name ?? '–',
			role_label: user.role_id ? rolesById.get(user.role_id) ?? '–' : '–',
			created_at_display: formatDate(user.created_at),
			updated_at_display: formatDate(user.updated_at),
			actions: user
		}))
	);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const refetch = $derived(paginateState.refetch);

	const tableColumns: TableColumn[] = [
		{ label: 'Email', key: 'email', type: 'text' },
		{ label: 'First Name', key: 'first_name_display', type: 'text' },
		{ label: 'Last Name', key: 'last_name_display', type: 'text' },
		{ label: 'Role', key: 'role_label', type: 'text' },
		{ label: 'Created', key: 'created_at_display', type: 'text' },
		{ label: 'Updated', key: 'updated_at_display', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => openEdit(item as User)
				}
			]
		}
	];

	function formatDate(iso: string | Date) {
		if (iso instanceof Date) {
			return iso.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: '2-digit'
			});
		}
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

	function parseClientError(result: any, fallback: string) {
		const msg = result?.error?.value?.message;
		return typeof msg === 'string' && msg.trim().length > 0 ? msg : fallback;
	}

	// Invite user dialog
	let inviteOpen = $state(false);
	let inviteEmail = $state('');
	let inviteRoleIds = $state<string[]>([]);
	let roles = $state<Role[]>([]);
	let inviteLoading = $state(false);
	let inviteSubmitting = $state(false);
	let inviteError = $state<string | null>(null);

	async function openInviteDialog() {
		inviteOpen = true;
		inviteEmail = '';
		inviteRoleIds = [];
		inviteError = null;
		inviteLoading = true;
		try {
			const res = await client.roles.get({ query: { limit: 100 } as any });
			if (res.error) {
				throw new Error(parseClientError(res, 'Failed to load roles'));
			}
			roles = ((res.data as { rows?: Role[] } | null)?.rows ?? []) as Role[];
		} catch (e) {
			inviteError = e instanceof Error ? e.message : String(e);
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
			if (inviteRoleIds.length > 0) body.role_id = inviteRoleIds[0];
			const res = await client.invites.post(body as any);
			if (res.error) {
				throw new Error(parseClientError(res, 'Failed to send invite'));
			}
			inviteOpen = false;
			refetch();
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
	let editRoleIds = $state<string[]>([]);
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(user: User) {
		editUser = user;
		editOpen = true;
		editFirstName = user.first_name ?? '';
		editLastName = user.last_name ?? '';
		editRoleIds = user.role_id ? [user.role_id] : [];
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
			const body: { first_name?: string; last_name?: string; role_id?: string | null } = {};
			const nextFirstName = editFirstName.trim();
			const nextLastName = editLastName.trim();

			if (nextFirstName !== (editUser.first_name ?? '')) {
				body.first_name = nextFirstName;
			}
			if (nextLastName !== (editUser.last_name ?? '')) {
				body.last_name = nextLastName;
			}
			if ((editRoleIds[0] ?? null) !== (editUser.role_id ?? null)) {
				body.role_id = editRoleIds[0] ?? null;
			}
			if (Object.keys(body).length === 0) {
				closeEdit();
				return;
			}
			const res = await (client as any).users({ id: editUser.id }).put(body as any);
			if (res.error) {
				throw new Error(parseClientError(res, 'Failed to update user'));
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
    <title>Users</title>
    <meta name="description" content="Manage users." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Users class="size-4" />
				<span class="font-semibold">Users</span>
			</div>
			<Button size="sm" onclick={openInviteDialog}>Invite user</Button>
		</div>
		<PaginationTable searchPlaceholder="Search users">

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
						class="flex h-full flex-col"
					>
						<div class="min-h-0 flex-1 overflow-auto space-y-4 px-6 py-6">
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
									<MultiSelectCombobox
										id="invite-role"
										options={roles.map((r) => ({ id: r.id, value: r.name }))}
										bind:value={inviteRoleIds}
										placeholder="Select role"
										disabled={inviteSubmitting}
									/>
								{/if}
							</div>
							{#if inviteError}
								<p class="text-sm text-destructive">{inviteError}</p>
							{/if}
						</div>
						<div class="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
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
								<MultiSelectCombobox
									id="edit-role"
									options={roles.map((r) => ({ id: r.id, value: r.name }))}
									bind:value={editRoleIds}
									placeholder="Select role"
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
						rows={rowsWithDisplay}
						columns={tableColumns}
						emptyMessage="No users found."
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
