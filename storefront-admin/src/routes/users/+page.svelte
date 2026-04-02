<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { formatDate } from '$lib/utils';
	import Users from '@lucide/svelte/icons/users';
	import EditUserSheet from '$lib/components/organs/users/EditUserSheet.svelte';
	import InviteUserSheet from '$lib/components/organs/users/InviteUserSheet.svelte';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { SvelteMap } from 'svelte/reactivity';

	type Role = {
		id: string;
		name: string;
		description: string;
		created_at: Date;
		updated_at: Date;
		deleted_at: Date | null;
	};
	type User = {
		id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		avatar_url: string | null;
		metadata: unknown | null;
		created_at: Date;
		updated_at: Date;
		deleted_at: Date | null;
		role_id: string | null;
	};

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(async () => {
		return client.users.get({ query: paginationQuery });
	}, ['users']);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	// Load roles once for Role column and Edit sheet
	$effect(() => {
		if (roles.length > 0) return;
		client.roles
			.get({ query: { limit: 100 } as Record<string, unknown> })
			.then((res) => {
				if (res.error) return;
				const rows = ((res.data as { data?: { rows?: Role[] } } | null)?.data?.rows ??
					[]) as Role[];
				if (rows.length > 0) roles = rows;
			})
			.catch(() => {});
	});

	const rolesById = $derived.by(() => {
		const m = new SvelteMap<string, string>();
		for (const r of roles) m.set(r.id, r.name);
		return m;
	});

	const rows = $derived(paginateState.query.data?.data?.rows ?? []);
	const rowsWithDisplay = $derived(
		(rows as User[]).map((user) => ({
			...user,
			first_name_display: user.first_name ?? '–',
			last_name_display: user.last_name ?? '–',
			role_label: user.role_id ? (rolesById.get(user.role_id) ?? '–') : '–',
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

	let inviteOpen = $state(false);
	let roles = $state<Role[]>([]);

	// Edit user sheet
	let editOpen = $state(false);
	let editUser = $state<User | null>(null);

	$effect(() => {
		if (!editOpen) editUser = null;
	});

	function openEdit(user: User) {
		editUser = user;
		editOpen = true;
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
			<Button size="sm" onclick={() => (inviteOpen = true)}>Invite user</Button>
		</div>
		<PaginationTable searchPlaceholder="Search users">
			<InviteUserSheet bind:open={inviteOpen} onInvited={() => refetch()} />

			<EditUserSheet bind:open={editOpen} user={editUser} {roles} onSaved={() => refetch()} />

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

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>
