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
	import Users from '@lucide/svelte/icons/users';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import {
		createCustomers,
		updateCustomer,
		deleteCustomers,
		type Customer,
	} from '$lib/customers/api.js';
	import { client } from '$lib/client';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			return client['customers'].get({ query: paginationQuery });
		},
		['customers']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data as CustomerListResponse | undefined);
	const rows = $derived((queryData?.data?.rows ?? []) as Customer[]);
	const rowsWithDisplay = $derived(
		rows.map((r: Customer) => ({
			...r,
			name:
				r.first_name || r.last_name
					? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim()
					: '–',
			account_type: r.has_account ? 'Account' : 'Guest'
		}))
	);		
	const pagination = $derived(queryData?.data?.pagination ?? queryData?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const openCreate = $derived(paginateState.openCreate);
	const openEdit = $derived(paginateState.openEdit);
	const closeForm = $derived(paginateState.closeForm);
	const formSheetOpen = $derived(paginateState.formSheetOpen);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem) as Customer | null;
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem) as Customer | null;
	const deleteError = $derived(paginateState.deleteError);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const refetch = $derived(paginateState.refetch);

	const tableColumns: TableColumn[] = [
		{
			label: 'Email',
			key: 'email',
			type: 'link',
			cellHref: (row) => `/customers/${row.id}`,
			textKey: 'email'
		},
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Account type', key: 'account_type', type: 'text' },
		{ label: 'Create date', key: 'created_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => openEdit(item as Customer)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as Customer)
				}
			]
		}
	];

	
		
	

	let formFirstName = $state('');
	let formLastName = $state('');
	let formEmail = $state('');
	let formPhone = $state('');
	let formCompany = $state('');
	let formError = $state<string | null>(null);
	let formSubmitting = $state(false);

	$effect(() => {
		if (formSheetOpen) {
			formError = null;
			if (formMode === 'edit' && formItem) {
				formFirstName = formItem.first_name || '';
				formLastName = formItem.last_name || '';
				formEmail = formItem.email;
				formPhone = formItem.phone || '';
				formCompany = (formItem.metadata as { company?: string })?.company || '';
			} else {
				formFirstName = '';
				formLastName = '';
				formEmail = '';
				formPhone = '';
				formCompany = '';
			}
		}
	});

	function closeFormSheet() {
		if (!formSubmitting) {
			closeForm();
		}
	}

	async function submitForm() {
		formError = null;
		formSubmitting = true;

		if (!formEmail.trim()) {
			formError = 'Email is required';
			formSubmitting = false;
			return;
		}

		try {
			if (formMode === 'edit' && formItem) {
				await updateCustomer(formItem.id, {
					email: formEmail.trim(),
					first_name: formFirstName.trim() || null,
					last_name: formLastName.trim() || null,
					phone: formPhone.trim() || null,
					...(formCompany.trim() && {
						metadata: { company: formCompany.trim() }
					})
				});
			} else {
				await createCustomers([
					{
						email: formEmail.trim(),
						first_name: formFirstName.trim() || null,
						last_name: formLastName.trim() || null,
						phone: formPhone.trim() || null,
						...(formCompany.trim() && {
							metadata: { company: formCompany.trim() }
						})
					}
				]);
			}
			closeForm();
			refetch();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			formSubmitting = false;
		}
	}

	const formTitle = $derived(formMode === 'edit' ? 'Edit Customer' : 'Create Customer');
	const formSubtitle = $derived(
		formMode === 'edit' ? 'Update customer details.' : 'Create a new customer and manage their details.'
	);
	const formSubmitLabel = $derived(
		formSubmitting ? (formMode === 'edit' ? 'Saving...' : 'Creating...') : formMode === 'edit' ? 'Save' : 'Create'
	);
</script>

<svelte:head>
	<title>Customers | Danimai Store</title>
	<meta name="description" content="Manage customers." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Users class="size-4" />
				<span class="font-semibold">Customers</span>
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
							rows={rowsWithDisplay}
							columns={tableColumns}
							emptyMessage="No customers found."
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

<Sheet.Root bind:open={paginateState.formSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>{formTitle}</Sheet.Title>
				<Sheet.Description>{formSubtitle}</Sheet.Description>
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
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="form-first-name" class="text-sm font-medium">
								First Name <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="form-first-name"
								bind:value={formFirstName}
								placeholder="First name"
								class="h-9"
								disabled={formSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="form-last-name" class="text-sm font-medium">
								Last Name <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="form-last-name"
								bind:value={formLastName}
								placeholder="Last name"
								class="h-9"
								disabled={formSubmitting}
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="form-email" class="text-sm font-medium">Email</label>
						<Input
							id="form-email"
							type="email"
							bind:value={formEmail}
							placeholder="Email"
							class="h-9"
							disabled={formSubmitting}
							required
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="form-phone" class="text-sm font-medium">
								Phone <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="form-phone"
								type="tel"
								bind:value={formPhone}
								placeholder="Phone"
								class="h-9"
								disabled={formSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="form-company" class="text-sm font-medium">
								Company <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="form-company"
								bind:value={formCompany}
								placeholder="Company"
								class="h-9"
								disabled={formSubmitting}
							/>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeFormSheet} disabled={formSubmitting}>
					Cancel
				</Button>
				<Button onclick={submitForm} disabled={formSubmitting}>
					{formSubmitLabel}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="customer"
	entityTitle={deleteItem?.email ?? ''}
	onConfirm={() => confirmDelete((c: unknown) => deleteCustomers([(c as { id: string }).id]))}
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
