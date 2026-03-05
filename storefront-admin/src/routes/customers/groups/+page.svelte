<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Folder from '@lucide/svelte/icons/folder';
	import {
		listCustomerGroups,
		deleteCustomerGroups,
		createCustomerGroup,
		updateCustomerGroup,
		type ListCustomerGroupsParams,
		type ListCustomerGroupsResponse
	} from '$lib/customer-groups/api.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => listCustomerGroups(paginationQuery as ListCustomerGroupsParams),
		['customer-groups']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data as ListCustomerGroupsResponse | undefined);
	const rows = $derived(queryData?.data?.rows ?? []);
	const pagination = $derived(queryData?.data?.pagination ?? queryData?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const openCreate = $derived(paginateState.openCreate);
	const openEdit = $derived(paginateState.openEdit);
	const closeForm = $derived(paginateState.closeForm);
	const deleteConfirmOpen = $derived(paginateState.deleteConfirmOpen);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const refetch = $derived(paginateState.refetch);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);

	const tableColumns: TableColumn[] = [
		{
			label: 'Name',
			key: 'name',
			type: 'link',
			cellHref: (row) => `/customers/groups/${row.id}`,
			textKey: 'name'
		},
		{ label: 'Customers', key: 'customer_count', type: 'text' },
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
					onClick: (item) => openEdit(item as Parameters<typeof openEdit>[0])
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as Parameters<typeof openDeleteConfirm>[0])
				}
			]
		}
	];

	// Single form sheet state (create/edit)
	let formName = $state('');
	let formError = $state<string | null>(null);
	let formSubmitting = $state(false);

	$effect(() => {
		if (paginateState.formSheetOpen) {
			const item = formItem as { name?: string } | null;
			formName = formMode === 'create' ? '' : (item?.name ?? '');
			formError = null;
		}
	});

	async function submitForm() {
		formError = null;
		formSubmitting = true;
		try {
			if (formMode === 'create') {
				if (!formName.trim()) {
					formError = 'Name is required';
					formSubmitting = false;
					return;
				}
				await createCustomerGroup({ name: formName.trim() });
			} else {
				const item = formItem as { id: string } | null;
				if (!item) return;
				if (!formName.trim()) {
					formError = 'Name is required';
					formSubmitting = false;
					return;
				}
				await updateCustomerGroup(item.id, { name: formName.trim() });
			}
			closeForm();
			await refetch();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			formSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Folder class="size-4" />
				<span class="font-semibold">Customer Groups</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
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
							rows={rows}
							columns={tableColumns}
							emptyMessage="No customer groups found."
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

<!-- Create/Edit Customer Group Sheet -->
<Sheet.Root bind:open={paginateState.formSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>{formMode === 'create' ? 'Create' : 'Edit'} Customer Group</Sheet.Title>
				<Sheet.Description>
					{formMode === 'create'
						? 'Create a new customer group to segment your customers.'
						: 'Update customer group details.'}
				</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if formError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{formError}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="form-name" class="text-sm font-medium">Name</label>
						<Input
							id="form-name"
							bind:value={formName}
							placeholder="Customer group name"
							class="h-9"
							disabled={formSubmitting}
							required
						/>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeForm} disabled={formSubmitting}>
					Cancel
				</Button>
				<Button onclick={submitForm} disabled={formSubmitting}>
					{formSubmitting
						? formMode === 'create'
							? 'Creating...'
							: 'Saving...'
						: formMode === 'create'
							? 'Create'
							: 'Save'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="customer group"
	entityTitle={(deleteItem as { name?: string })?.name ?? ''}
	onConfirm={() => confirmDelete((item) => deleteCustomerGroups([(item as unknown as { id: string }).id]))}
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
