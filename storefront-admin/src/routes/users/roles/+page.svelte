<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { PaginationTable, TableHead, TableBody, TablePagination, DeleteConfirmationModal, RoleFormSheet, type TableColumn } from '$lib/components/organs/index.js';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';


	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			return client.roles.get({ query: paginationQuery });
		},
		['roles']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const roles = $derived(paginateState.query.data?.data?.rows ?? []);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const openEdit = $derived(paginateState.openEdit);
	const deleteConfirmOpen = $derived(paginateState.deleteConfirmOpen);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const refetch = $derived(paginateState.refetch);

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

	
	const tableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Description', key: 'description', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Updated', key: 'updated_at', type: 'date' },
		{ label: 'Actions',key: 'actions', type: 'actions',
			actions: [
				{ label: 'Edit', key: 'edit', type: 'button', onClick: (item) => paginateState.openEdit(item as any) },
				{ label: 'Delete', key: 'delete', type: 'button', onClick: (item) => paginateState.openDeleteConfirm(item as any) }
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

<RoleFormSheet
	bind:open={paginateState.formSheetOpen}
	mode={formMode}
	role={formItem as any}
	on:success={() => refetch()}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="role"
	entityTitle={(deleteItem as any)?.name ?? (deleteItem as any)?.id ?? ''}
	onConfirm={() =>
		confirmDelete(async (r: any) => {
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