<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		DeleteConfirmationModal,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import RoleCreateSheet from '$lib/components/organs/role/Create/roleCreate.svelte';
	import EditRoleSheet from '$lib/components/organs/role/update/EditRole.svelte';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { formatDate } from '$lib/utils';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	type Role = {
		id: string;
		name: string;
		description: string;
		created_at: Date;
		updated_at: Date;
		deleted_at: Date | null;
	};

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(async () => {
		return client.roles.get({ query: paginationQuery });
	}, ['roles']);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	
	const roles = $derived(paginateState.query.data?.data?.rows ?? []);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const refetch = $derived(paginateState.refetch);

	const tableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Description', key: 'description', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Updated', key: 'updated_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => paginateState.openEdit(item as Parameters<typeof paginateState.openEdit>[0])
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => paginateState.openDeleteConfirm(item as Parameters<typeof paginateState.openDeleteConfirm>[0])
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Roles</title>
	<meta name="description" content="Manage roles." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ShieldCheck class="size-4" />
				<span class="font-semibold">Roles</span>
			</div>
			<Button size="sm" onclick={openCreate}>Add role</Button>
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
							rows={roles.map((role) => ({
								...role,
								created_at: formatDate(role.created_at),
								updated_at: formatDate(role.updated_at),
								actions: role
							}))}
							columns={tableColumns}
							emptyMessage="No roles. Add a role to get started."
						/>
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

{#if formMode === 'edit'}
	<EditRoleSheet
		bind:open={paginateState.formSheetOpen}
		mode="edit"
		role={formItem as Role | null}
		onSuccess={() => refetch()}
	/>
{:else}
	<RoleCreateSheet
		bind:open={paginateState.formSheetOpen}
		mode="create"
		onSuccess={() => refetch()}
	/>
{/if}

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="role"
	entityTitle={(deleteItem as unknown as Role | null)?.name ??
		(deleteItem as unknown as Role | null)?.id ??
		''}
	onConfirm={() =>
		confirmDelete(async (item) => {
			const r = item as unknown as Role;
			await client.roles.delete({
				role_ids: [r.id]
			});
		})}
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
