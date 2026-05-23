<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Users from '@lucide/svelte/icons/users';
	import { listCustomersInGroup, type ListCustomersInGroupResponse } from '$lib/customer-groups/api.js';
	import { removeCustomerFromGroup, type Customer } from '$lib/customers/api.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { customerTableColumns, customersWithDisplayFields } from './types.js';
	import CustomerGroupAddCustomersDialog from './CustomerGroupAddCustomersDialog.svelte';

	let {
		groupId,
		onGroupRefresh
	}: {
		groupId: string;
		onGroupRefresh: () => void | Promise<void>;
	} = $props();

	const emptyCustomersResponse = {
		data: {
			rows: [] as Customer[],
			pagination: {
				total: 0,
				page: 1,
				limit: 10,
				total_pages: 1,
				has_next_page: false,
				has_previous_page: false
			}
		},
		pagination: {
			total: 0,
			page: 1,
			limit: 10,
			total_pages: 1,
			has_next_page: false,
			has_previous_page: false
		}
	};

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));
	const customersQueryKey = $derived([
		'pagination',
		'customer-group-customers',
		groupId,
		paginationQuery
	] as const);
	const customersQuery = createQuery(() => ({
		queryKey: customersQueryKey,
		queryFn: async ({ queryKey }) => {
			const id = queryKey[2];
			const params = queryKey[3] as import('$lib/customer-groups/api.js').ListCustomersInGroupParams;
			return id ? listCustomersInGroup(id, params) : Promise.resolve(emptyCustomersResponse);
		}
	}));

	const paginateState = $derived({
		get loading() {
			return customersQuery.isPending;
		},
		get error() {
			return customersQuery.error != null
				? customersQuery.error instanceof Error
					? customersQuery.error.message
					: String(customersQuery.error)
				: null;
		},
		get start() {
			const p =
				(customersQuery.data as ListCustomersInGroupResponse | undefined)?.data?.pagination ??
				(customersQuery.data as ListCustomersInGroupResponse | undefined)?.pagination;
			return p ? (p.page - 1) * p.limit + 1 : 0;
		},
		get end() {
			const p =
				(customersQuery.data as ListCustomersInGroupResponse | undefined)?.data?.pagination ??
				(customersQuery.data as ListCustomersInGroupResponse | undefined)?.pagination;
			return p ? Math.min(p.page * p.limit, p.total) : 0;
		}
	});

	const customersQueryData = $derived(
		customersQuery.data as ListCustomersInGroupResponse | undefined
	);
	const customersRows = $derived(customersQueryData?.data?.rows ?? []);
	const customersPagination = $derived(
		customersQueryData?.data?.pagination ?? customersQueryData?.pagination ?? null
	);
	const customersRowsWithDisplay = $derived(customersWithDisplayFields(customersRows));

	let addCustomersModalOpen = $state(false);
	let removeCustomerModalOpen = $state(false);
	let removeCustomerSubmitting = $state(false);
	let removeCustomerError = $state<string | null>(null);
	let removeCustomerTarget = $state<Customer | null>(null);

	const customerTableColumnsWithActions = $derived<TableColumn[]>([
		...customerTableColumns,
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Remove',
					key: 'remove',
					type: 'button',
					onClick: (item) => openRemoveCustomerModal(item as Customer)
				}
			]
		}
	]);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	function openAddCustomersModal() {
		setTimeout(() => (addCustomersModalOpen = true), 0);
	}

	async function onCustomersSaved() {
		await customersQuery.refetch();
		await onGroupRefresh();
	}

	function openRemoveCustomerModal(customer: Customer) {
		removeCustomerError = null;
		removeCustomerTarget = customer;
		setTimeout(() => (removeCustomerModalOpen = true), 0);
	}

	function closeRemoveCustomerModal() {
		if (!removeCustomerSubmitting) {
			removeCustomerModalOpen = false;
			removeCustomerTarget = null;
			removeCustomerError = null;
		}
	}

	async function confirmRemoveCustomer() {
		if (!removeCustomerTarget) return;
		removeCustomerSubmitting = true;
		removeCustomerError = null;
		try {
			await removeCustomerFromGroup(removeCustomerTarget.id, groupId);
			removeCustomerModalOpen = false;
			removeCustomerTarget = null;
			await customersQuery.refetch();
			await onGroupRefresh();
		} catch (e) {
			removeCustomerError = e instanceof Error ? e.message : String(e);
		} finally {
			removeCustomerSubmitting = false;
		}
	}

	const removeCustomerTitle = $derived(
		removeCustomerTarget?.email ??
			`${removeCustomerTarget?.first_name ?? ''} ${removeCustomerTarget?.last_name ?? ''}`.trim() ??
			''
	);
</script>

<section class="w-full min-w-0 overflow-hidden rounded-lg border bg-card shadow-sm">
	<div
		class="flex flex-wrap items-center justify-between gap-4 rounded-t-lg border-b bg-card px-6 py-4"
	>
		<h2 class="flex items-center gap-2 text-base font-semibold">
			<Users class="size-4" />
			Customers
		</h2>
		<Button variant="outline" size="sm" onclick={openAddCustomersModal}>Add</Button>
	</div>
	<PaginationTable showToolbar={false}>
		{#if paginateState.error}
			<div class="px-6 py-4 text-sm text-destructive">{paginateState.error}</div>
		{:else if paginateState.loading}
			<div class="flex items-center justify-center px-6 py-12">
				<p class="text-sm text-muted-foreground">Loading…</p>
			</div>
		{:else}
			<div class="min-h-0 flex-1 overflow-auto">
				<table class="w-full text-sm">
					<TableHead columns={customerTableColumnsWithActions} />
					<TableBody
						rows={customersRowsWithDisplay}
						columns={customerTableColumnsWithActions}
						emptyMessage="No customers found."
					/>
				</table>
			</div>
			<div class="px-6">
				<TablePagination
					pagination={customersPagination}
					start={paginateState.start}
					end={paginateState.end}
					onPageChange={goToPage}
				/>
			</div>
		{/if}
	</PaginationTable>
</section>

<CustomerGroupAddCustomersDialog
	bind:open={addCustomersModalOpen}
	{groupId}
	onSaved={onCustomersSaved}
/>

<DeleteConfirmationModal
	bind:open={removeCustomerModalOpen}
	entityName="customer"
	entityTitle={removeCustomerTitle}
	customMessage="Are you sure you want to remove this customer from the group? They will not be deleted."
	onConfirm={confirmRemoveCustomer}
	onCancel={closeRemoveCustomerModal}
	submitting={removeCustomerSubmitting}
	error={removeCustomerError}
/>
