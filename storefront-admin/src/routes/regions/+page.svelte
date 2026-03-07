<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import CreateRegion from '$lib/components/organs/region/create-region.svelte';
	import EditRegion from '$lib/components/organs/region/edit-region.svelte';
	import Globe from '@lucide/svelte/icons/globe';
	import { client } from '$lib/client.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { deleteRegions } from '$lib/regions/api.js';

	type Region = {
		id: string;
		name: string;
		currency_code: string;
		created_at: string;
		updated_at: string;
	};

	const API_BASE = 'http://localhost:8000/admin';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () =>
			client.regions.get({
				query: paginationQuery as Record<string, unknown>
			}),
		['regions']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const rows = $derived(paginateState.query.data?.data?.rows ?? []);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(
		pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

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

	const tableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Currency', key: 'currency_code', type: 'text' },
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
					onClick: (item) => handleOpenEdit(item as Region)
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

	// Create sheet (local state; sync open with paginateState via handlers)
	let createOpen = $state(false);
	let createName = $state('');
	let createCurrencyCode = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function handleOpenCreate() {
		createOpen = true;
		createName = '';
		createCurrencyCode = '';
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
		closeForm();
	}

	async function submitCreate() {
		createError = null;
		if (!createName.trim()) {
			createError = 'Name is required';
			return;
		}
		if (!createCurrencyCode.trim()) {
			createError = 'Currency code is required';
			return;
		}
		createSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/regions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					regions: [
						{
							name: createName.trim(),
							currency_code: createCurrencyCode.trim().toUpperCase()
						}
					]
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreate();
			refetch();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit sheet
	let editOpen = $state(false);
	let editRegion = $state<Region | null>(null);
	let editName = $state('');
	let editCurrencyCode = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function handleOpenEdit(region: Region) {
		editRegion = region;
		editOpen = true;
		editName = region.name;
		editCurrencyCode = region.currency_code;
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editRegion = null;
		closeForm();
	}

	async function submitEdit() {
		if (!editRegion) return;
		editError = null;
		if (!editName.trim()) {
			editError = 'Name is required';
			return;
		}
		if (!editCurrencyCode.trim()) {
			editError = 'Currency code is required';
			return;
		}
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/regions/${editRegion.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: editName.trim(),
					currency_code: editCurrencyCode.trim().toUpperCase()
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
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

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Globe class="size-4" />
				<span class="font-semibold">Regions</span>
			</div>
			<Button size="sm" onclick={handleOpenCreate}>Create</Button>
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
							emptyMessage="No regions found."
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

<CreateRegion
	bind:open={createOpen}
	bind:createName={createName}
	bind:createCurrencyCode={createCurrencyCode}
	createError={createError}
	createSubmitting={createSubmitting}
	closeCreate={closeCreate}
	submitCreate={submitCreate}
/>

<EditRegion
	bind:open={editOpen}
	bind:editName={editName}
	bind:editCurrencyCode={editCurrencyCode}
	editError={editError}
	editSubmitting={editSubmitting}
	closeEdit={closeEdit}
	submitEdit={submitEdit}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="region"
	entityTitle={String((deleteItem as Record<string, unknown>)?.name ?? (deleteItem as Record<string, unknown>)?.id ?? '')}
	onConfirm={() => confirmDelete((r: unknown) => deleteRegions([(r as { id: string }).id]))}
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
