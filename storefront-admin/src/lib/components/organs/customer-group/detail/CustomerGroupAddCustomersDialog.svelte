<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { addCustomerToGroup } from '$lib/customers/api.js';
	import { listCustomers } from '$lib/customers/api.js';
	import { listCustomersInGroup } from '$lib/customer-groups/api.js';
	import { customersWithDisplayFields } from './types.js';

	let {
		open = $bindable(false),
		groupId,
		onSaved
	}: {
		open?: boolean;
		groupId: string;
		onSaved: () => void | Promise<void>;
	} = $props();

	let customerModalPage = $state(1);
	let customerModalSearch = $state('');
	let customerModalData = $state<Awaited<ReturnType<typeof listCustomers>> | null>(null);
	let customerModalLoading = $state(false);
	let addCustomersSubmitting = $state(false);
	let addCustomersError = $state<string | null>(null);
	let selectedCustomerIds = $state<string[]>([]);
	let memberCustomerIds = $state<Set<string>>(new Set());

	const customerModalTableColumns: TableColumn[] = [
		{ label: 'Email', key: 'email', type: 'text' },
		{ label: 'Name', key: 'display_name', type: 'text' },
		{ label: 'Account', key: 'account_display', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' }
	];

	const customerModalCustomers = $derived(customerModalData?.data?.rows ?? []);
	const customerModalPagination = $derived(
		customerModalData?.data?.pagination ?? customerModalData?.pagination ?? null
	);
	const customerModalFiltered = $derived(
		customerModalSearch.trim()
			? customerModalCustomers.filter(
					(c) =>
						c.email.toLowerCase().includes(customerModalSearch.toLowerCase()) ||
						(c.first_name?.toLowerCase().includes(customerModalSearch.toLowerCase()) ?? false) ||
						(c.last_name?.toLowerCase().includes(customerModalSearch.toLowerCase()) ?? false)
				)
			: customerModalCustomers
	);
	const customerModalStart = $derived(
		customerModalPagination
			? (customerModalPagination.page - 1) * customerModalPagination.limit + 1
			: 0
	);
	const customerModalEnd = $derived(
		customerModalPagination
			? Math.min(
					customerModalPagination.page * customerModalPagination.limit,
					customerModalPagination.total
				)
			: 0
	);
	const customerModalRowsWithDisplay = $derived(customersWithDisplayFields(customerModalFiltered));

	const disabledCustomerIds = $derived(
		new Set(customerModalFiltered.filter((c) => memberCustomerIds.has(c.id)).map((c) => c.id))
	);
	const selectableSelectedIds = $derived(
		new Set([...selectedCustomerIds].filter((id) => !disabledCustomerIds.has(id)))
	);

	const customerModalSelectAllChecked = $derived(
		customerModalRowsWithDisplay.filter((r) => !disabledCustomerIds.has(r.id)).length > 0 &&
			customerModalRowsWithDisplay
				.filter((r) => !disabledCustomerIds.has(r.id))
				.every((r) => selectedCustomerIds.includes(r.id))
	);
	const customerModalSelectAllIndeterminate = $derived(
		customerModalRowsWithDisplay.some(
			(r) => !disabledCustomerIds.has(r.id) && selectedCustomerIds.includes(r.id)
		) && !customerModalSelectAllChecked
	);

	async function fetchMemberIds() {
		try {
			const res = await listCustomersInGroup(groupId, { page: 1, limit: 500 });
			memberCustomerIds = new Set(res.data.rows.map((c) => c.id));
		} catch {
			memberCustomerIds = new Set();
		}
	}

	async function fetchCustomerModalCustomers() {
		customerModalLoading = true;
		try {
			customerModalData = await listCustomers({
				page: customerModalPage,
				limit: 10,
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
		} catch {
			customerModalData = null;
		} finally {
			customerModalLoading = false;
		}
	}

	function closeAddCustomersModal() {
		if (!addCustomersSubmitting) {
			open = false;
			selectedCustomerIds = [];
			addCustomersError = null;
		}
	}

	function toggleCustomerSelection(customerId: string) {
		if (disabledCustomerIds.has(customerId)) return;
		selectedCustomerIds = selectedCustomerIds.includes(customerId)
			? selectedCustomerIds.filter((id) => id !== customerId)
			: [...selectedCustomerIds, customerId];
	}

	function toggleSelectAllCustomers() {
		const ids = customerModalRowsWithDisplay
			.filter((r) => !disabledCustomerIds.has(r.id))
			.map((r) => r.id);
		const allSelected = ids.length > 0 && ids.every((id) => selectedCustomerIds.includes(id));
		if (allSelected) {
			selectedCustomerIds = selectedCustomerIds.filter((id) => !ids.includes(id));
		} else {
			selectedCustomerIds = [...new Set([...selectedCustomerIds, ...ids])];
		}
	}

	function goToCustomerModalPage(pageNum: number) {
		customerModalPage = Math.max(1, pageNum);
	}

	async function saveAddCustomers() {
		addCustomersError = null;
		const idsToAdd = selectedCustomerIds.filter((id) => !disabledCustomerIds.has(id));
		if (idsToAdd.length === 0) {
			closeAddCustomersModal();
			return;
		}
		addCustomersSubmitting = true;
		try {
			for (const customerId of idsToAdd) {
				await addCustomerToGroup(customerId, groupId);
			}
			selectedCustomerIds = [];
			open = false;
			await onSaved();
		} catch (e) {
			addCustomersError = e instanceof Error ? e.message : String(e);
		} finally {
			addCustomersSubmitting = false;
		}
	}

	$effect(() => {
		if (!open) return;
		void groupId;
		void customerModalPage;
		fetchCustomerModalCustomers();
	});

	$effect(() => {
		if (!open) return;
		void groupId;
		fetchMemberIds();
	});

	$effect(() => {
		if (!open) return;
		const disabled = disabledCustomerIds;
		if (disabled.size === 0) return;
		const next = selectedCustomerIds.filter((id) => !disabled.has(id));
		if (next.length !== selectedCustomerIds.length) selectedCustomerIds = next;
	});

	$effect(() => {
		if (open) return;
		selectedCustomerIds = [];
		customerModalPage = 1;
		customerModalSearch = '';
		addCustomersError = null;
		memberCustomerIds = new Set();
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="m-auto flex h-auto max-h-[85vh] max-w-3xl flex-col rounded-xl border shadow-lg"
	>
		<div class="flex flex-1 flex-col overflow-hidden">
			<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
				<Dialog.Title class="text-base font-semibold">Customers</Dialog.Title>
			</Dialog.Header>

			<div class="flex min-w-0 flex-wrap items-center gap-2 border-b px-6 py-4 sm:justify-between">
				<Button
					variant="outline"
					size="sm"
					class="h-9 shrink-0 rounded-md max-sm:w-9 max-sm:justify-center max-sm:gap-0 max-sm:px-0 sm:min-h-9"
					aria-label="Add filter"
					title="Add filter"
				>
					<SlidersHorizontal class="size-4 shrink-0 sm:mr-1.5" />
					<span class="hidden sm:inline">Add filter</span>
				</Button>
				<div class="flex min-w-0 flex-1 items-center gap-2 sm:w-auto sm:flex-none">
					<div class="relative w-full min-w-0 flex-1 sm:w-64 sm:flex-none">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={customerModalSearch}
							class="h-9 w-full min-w-0 rounded-md pl-9"
						/>
					</div>
					<button
						type="button"
						class="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Sort"
					>
						<ArrowUpDown class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				</div>
			</div>

			<div class="flex flex-1 flex-col overflow-auto p-6">
				{#if addCustomersError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{addCustomersError}
					</div>
				{/if}
				{#if customerModalLoading}
					<div class="flex items-center justify-center py-12">
						<p class="text-sm text-muted-foreground">Loading…</p>
					</div>
				{:else}
					<PaginationTable showToolbar={false}>
						<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
							<table class="w-full text-sm">
								<TableHead
									columns={customerModalTableColumns}
									showSelectAll={true}
									selectAllChecked={customerModalSelectAllChecked}
									selectAllIndeterminate={customerModalSelectAllIndeterminate}
									onToggleSelectAll={toggleSelectAllCustomers}
								/>
								<TableBody
									rows={customerModalRowsWithDisplay}
									columns={customerModalTableColumns}
									emptyMessage="No customers found."
									selectedIds={selectableSelectedIds}
									disabledIds={disabledCustomerIds}
									disabledRowLabel="Already in group"
									onToggleSelect={toggleCustomerSelection}
								/>
							</table>
						</div>
						{#if customerModalPagination && customerModalPagination.total > 0}
							<TablePagination
								pagination={customerModalPagination}
								start={customerModalStart}
								end={customerModalEnd}
								onPageChange={goToCustomerModalPage}
							/>
						{/if}
					</PaginationTable>
				{/if}
			</div>

			<Dialog.Footer class="flex-row flex-wrap items-center justify-end gap-2 border-t px-6 py-4">
				<Button variant="outline" onclick={closeAddCustomersModal} disabled={addCustomersSubmitting}
					>Cancel</Button
				>
				<Button
					onclick={saveAddCustomers}
					disabled={addCustomersSubmitting || selectableSelectedIds.size === 0}
				>
					{addCustomersSubmitting ? 'Saving...' : 'Save'}
				</Button>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>
