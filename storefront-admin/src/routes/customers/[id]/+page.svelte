<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		CustomerFormSheet,
		CustomerAddressFormSheet,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Users from '@lucide/svelte/icons/users';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import {
		getCustomer,
		listCustomerAddresses,
		addCustomerToGroup,
		removeCustomerFromGroup as removeCustomerFromGroupApi,
		updateCustomer,
		deleteCustomer,
		deleteCustomerAddress,
		type Customer,
		type CustomerAddress
	} from '$lib/customers/api.js';
	import { listCustomerGroups, type CustomerGroup } from '$lib/customer-groups/api.js';

	const customerId = $derived(page.params?.id ?? '');

	let customer = $state<Customer | null>(null);
	let addresses = $state<CustomerAddress[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadAddresses() {
		if (!customerId) return;
		try {
			addresses = await listCustomerAddresses(customerId);
		} catch {
			addresses = [];
		}
	}

	async function loadCustomer() {
		if (!customerId) return;
		loading = true;
		error = null;
		try {
			customer = await getCustomer(customerId);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			customer = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		customerId;
		loadCustomer();
	});

	$effect(() => {
		if (customer && customerId) loadAddresses();
		else addresses = [];
	});

	const displayTitle = $derived(customer?.email ?? 'Customer');

	const breadcrumbLabel = $derived(
		customer?.first_name || customer?.last_name
			? `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim()
			: customer?.email ?? 'Customer'
	);

	const createdDisplay = $derived(
		customer?.created_at ? new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '–'
	);

	type CustomerGroupItem = { id: string | null; name: string };
	const customerGroupsFromApi = $derived((): CustomerGroupItem[] => {
		const meta = customer?.metadata;
		if (!meta || typeof meta !== 'object' || meta === null) return [];
		const m = meta as { customer_groups?: { id: string; name: string }[]; customer_group_name?: string };
		if (Array.isArray(m.customer_groups) && m.customer_groups.length > 0) {
			return m.customer_groups.map((g) => ({ id: g.id, name: g.name }));
		}
		if (typeof m.customer_group_name === 'string' && m.customer_group_name) {
			return [{ id: null, name: m.customer_group_name }];
		}
		return [];
	});

	const customerGroupsForCard = $derived(customerGroupsFromApi());
	const customerGroupName = $derived(
		customerGroupsForCard.length > 0 ? customerGroupsForCard[0].name : '–'
	);
	const groupCardLimit = 5;
	let groupCardPage = $state(1);
	const groupCardTotal = $derived(customerGroupsForCard.length);
	const groupCardTotalPages = $derived(Math.max(1, Math.ceil(groupCardTotal / groupCardLimit)));
	const groupCardStart = $derived((groupCardPage - 1) * groupCardLimit + 1);
	const groupCardEnd = $derived(Math.min(groupCardPage * groupCardLimit, groupCardTotal));
	const groupCardPaginated = $derived(
		customerGroupsForCard.slice((groupCardPage - 1) * groupCardLimit, groupCardPage * groupCardLimit)
	);

	$effect(() => {
		if (groupCardPage > groupCardTotalPages) groupCardPage = 1;
	});

	// Add to group modal
	let addToGroupModalOpen = $state(false);
	let groupModalPage = $state(1);
	let groupModalSearch = $state('');
	let groupModalData = $state<{ data: { rows: CustomerGroup[]; pagination: { total: number; page: number; limit: number; total_pages: number; has_next_page: boolean; has_previous_page: boolean } }; pagination: { total: number; page: number; limit: number; total_pages: number; has_next_page: boolean; has_previous_page: boolean } } | null>(null);
	let groupModalLoading = $state(false);
	let addToGroupSubmitting = $state(false);
	let addToGroupError = $state<string | null>(null);
	let selectedGroupIds = $state<string[]>([]);

	async function fetchGroupModalGroups() {
		groupModalLoading = true;
		try {
			groupModalData = await listCustomerGroups({
				page: groupModalPage,
				limit: 10,
				sorting_field: 'name',
				sorting_direction: 'asc'
			});
		} catch {
			groupModalData = null;
		} finally {
			groupModalLoading = false;
		}
	}

	function openAddToGroupModal() {
		selectedGroupIds = [];
		groupModalPage = 1;
		groupModalSearch = '';
		addToGroupError = null;
		// Defer so dropdown can close before modal opens (bits-ui focus)
		setTimeout(() => (addToGroupModalOpen = true), 0);
	}

	function closeAddToGroupModal() {
		if (!addToGroupSubmitting) {
			addToGroupModalOpen = false;
			selectedGroupIds = [];
			addToGroupError = null;
		}
	}

	let removeFromGroupSubmitting = $state(false);
	let removeFromGroupModalOpen = $state(false);
	let removeFromGroupError = $state<string | null>(null);
	let removeFromGroupTarget = $state<{ id: string; name: string } | null>(null);

	function openRemoveFromGroupModal(group: { id: string | null; name: string }) {
		removeFromGroupError = null;
		removeFromGroupTarget = group.id != null ? { id: group.id, name: group.name } : null;
		// Defer so dropdown can close before modal opens (bits-ui focus)
		setTimeout(() => (removeFromGroupModalOpen = true), 0);
	}

	function closeRemoveFromGroupModal() {
		if (!removeFromGroupSubmitting) {
			removeFromGroupModalOpen = false;
			removeFromGroupTarget = null;
			removeFromGroupError = null;
		}
	}

	async function removeCustomerFromGroup() {
		if (!customerId || !customer) return;
		removeFromGroupSubmitting = true;
		removeFromGroupError = null;
		try {
			await removeCustomerFromGroupApi(customerId, removeFromGroupTarget?.id);
			await loadCustomer();
			removeFromGroupModalOpen = false;
			removeFromGroupTarget = null;
		} catch (e) {
			removeFromGroupError = e instanceof Error ? e.message : String(e);
		} finally {
			removeFromGroupSubmitting = false;
		}
	}

	const groupModalGroups = $derived(groupModalData?.data?.rows ?? []);
	const groupModalPagination = $derived(groupModalData?.pagination ?? null);
	const groupModalFiltered = $derived(
		groupModalSearch.trim()
			? groupModalGroups.filter((g) => g.name.toLowerCase().includes(groupModalSearch.toLowerCase()))
			: groupModalGroups
	);
	const groupModalStart = $derived(
		groupModalPagination ? (groupModalPagination.page - 1) * groupModalPagination.limit + 1 : 0
	);
	const groupModalEnd = $derived(
		groupModalPagination
			? Math.min(groupModalPagination.page * groupModalPagination.limit, groupModalPagination.total)
			: 0
	);

	function toggleGroupSelection(groupId: string) {
		selectedGroupIds = selectedGroupIds.includes(groupId)
			? selectedGroupIds.filter((id) => id !== groupId)
			: [...selectedGroupIds, groupId];
	}

	async function saveAddToGroup() {
		if (!customerId || !customer) return;
		addToGroupError = null;
		if (selectedGroupIds.length === 0) {
			closeAddToGroupModal();
			return;
		}
		addToGroupSubmitting = true;
		try {
			for (const groupId of selectedGroupIds) {
				await addCustomerToGroup(customerId, groupId);
			}
			selectedGroupIds = [];
			addToGroupModalOpen = false;
			await loadCustomer();
		} catch (e) {
			addToGroupError = e instanceof Error ? e.message : String(e);
		} finally {
			addToGroupSubmitting = false;
		}
	}

	$effect(() => {
		if (!addToGroupModalOpen) return;
		groupModalPage;
		fetchGroupModalGroups();
	});

	// Edit customer sheet
	let editOpen = $state(false);

	function openEdit() {
		if (!customer) return;
		editOpen = true;
	}

	// Delete confirmation
	let deleteModalOpen = $state(false);
	let deleteSubmitting = $state(false);

	function openDeleteModal() {
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		if (!deleteSubmitting) deleteModalOpen = false;
	}

	async function handleConfirmDelete() {
		if (!customer) return;
		deleteSubmitting = true;
		try {
			await deleteCustomer(customer.id);
			closeDeleteModal();
			goto('/customers');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	// Address form sheets
	let addAddressOpen = $state(false);
	let editAddressOpen = $state(false);
	let editingAddress = $state<CustomerAddress | null>(null);

	function openAddAddress() {
		editingAddress = null;
		addAddressOpen = true;
	}

	function openEditAddress(addr: CustomerAddress) {
		editingAddress = addr;
		editAddressOpen = true;
	}

	function onAddressSuccess() {
		loadAddresses();
	}

	const addressTableColumns: TableColumn[] = [
		{
			label: 'Address',
			key: 'address_line',
			type: 'text'
		},
		{ label: 'City', key: 'city', type: 'text' },
		{ label: 'Country', key: 'country_code', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => openEditAddress(item as CustomerAddress)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteAddressModal(item as CustomerAddress)
				}
			]
		}
	];

	const addressesWithDisplay = $derived(
		addresses.map((addr) => ({
			...addr,
			address_line: [addr.address_1, addr.address_2].filter(Boolean).join(', ')
		}))
	);

	// Delete address modal
	let deleteAddressModalOpen = $state(false);
	let addressToDelete = $state<CustomerAddress | null>(null);
	let deleteAddressSubmitting = $state(false);
	let deleteAddressError = $state<string | null>(null);

	function openDeleteAddressModal(addr: CustomerAddress) {
		addressToDelete = addr;
		deleteAddressError = null;
		deleteAddressModalOpen = true;
	}

	function closeDeleteAddressModal() {
		if (!deleteAddressSubmitting) {
			deleteAddressModalOpen = false;
			addressToDelete = null;
			deleteAddressError = null;
		}
	}

	const deleteAddressTitle = $derived(
		addressToDelete
			? [addressToDelete.address_1, addressToDelete.city, addressToDelete.country_code].filter(Boolean).join(', ')
			: ''
	);

	// Footer: Metadata & JSON
	const metadataKeys = $derived(
		customer?.metadata && typeof customer.metadata === 'object'
			? Object.keys(customer.metadata as object).length
			: 0
	);
	const jsonKeys = $derived(customer ? Object.keys(customer).length : 0);

	let metadataOpen = $state(false);
	let jsonOpen = $state(false);
	let metadataRows = $state<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
	let metadataError = $state<string | null>(null);
	let metadataSubmitting = $state(false);

	function openMetadataSheet() {
		if (!customer) return;
		const meta =
			customer.metadata && typeof customer.metadata === 'object'
				? (customer.metadata as Record<string, unknown>)
				: {};
		metadataRows = Object.entries(meta).map(([k, v]) => ({ key: k, value: String(v ?? '') }));
		if (metadataRows.length === 0) metadataRows = [{ key: '', value: '' }];
		metadataOpen = true;
		metadataError = null;
	}

	function closeMetadataSheet() {
		metadataOpen = false;
		metadataError = null;
	}

	function addMetadataRow() {
		metadataRows = [...metadataRows, { key: '', value: '' }];
	}

	function removeMetadataRow(index: number) {
		metadataRows = metadataRows.filter((_, i) => i !== index);
	}

	async function submitCustomerMetadata() {
		if (!customerId || !customer) return;
		metadataError = null;
		metadataSubmitting = true;
		try {
			const meta: Record<string, string | number> = {};
			for (const row of metadataRows) {
				const k = row.key.trim();
				if (!k) continue;
				const num = Number(row.value);
				meta[k] = Number.isNaN(num) ? row.value : num;
			}
			await updateCustomer(customer.id, {
				email: customer.email,
				first_name: customer.first_name ?? null,
				last_name: customer.last_name ?? null,
				phone: customer.phone ?? null,
				metadata: meta
			});
			closeMetadataSheet();
			loadCustomer();
		} catch (e) {
			metadataError = e instanceof Error ? e.message : String(e);
		} finally {
			metadataSubmitting = false;
		}
	}

	async function handleConfirmDeleteAddress() {
		if (!customer || !addressToDelete) return;
		deleteAddressError = null;
		deleteAddressSubmitting = true;
		try {
			await deleteCustomerAddress(customer.id, addressToDelete.id);
			deleteAddressModalOpen = false;
			addressToDelete = null;
			deleteAddressError = null;
			loadAddresses();
		} catch (e) {
			deleteAddressError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteAddressSubmitting = false;
		}
	}

	const groupModalTableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' }
	];

	const selectedGroupIdSet = $derived(new Set(selectedGroupIds));

	function goToGroupModalPage(pageNum: number) {
		groupModalPage = Math.max(1, pageNum);
	}
</script>

<svelte:head>
	<title>{customer ? displayTitle : 'Customer'} | Customers | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Breadcrumb + actions -->
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/customers')}
			>
				<Users class="size-4 shrink-0" />
				<span>Customers</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{customer ? breadcrumbLabel : (customerId ?? '…')}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !customer}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Customer not found'}</p>
			<Button variant="outline" onclick={() => goto('/customers')}>
				Back to Customers
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<!-- Overview card -->
				<div class="flex gap-6">
					<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
						<section class="flex flex-col gap-6">
							<div class="flex items-center justify-between gap-4">
								<h1 class="text-2xl font-semibold tracking-tight">{customer.email}</h1>
								<div class="flex items-center gap-2">
									{#if !customer.has_account}
										<span
											class="inline-flex items-center rounded-md border border-orange-300 bg-orange-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
											>Guest</span
										>
									{/if}
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
												class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={openEdit}
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item
												textValue="Delete"
												class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={openDeleteModal}
											>
												<Trash2 class="size-4" />
												Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
									</DropdownMenu.Root>
								</div>
							</div>
							<table class="w-full text-sm">
								<tbody>
									<tr>
										<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Name</th>
										<td class="py-3 font-medium">
											{customer.first_name || customer.last_name
												? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
												: '–'}
										</td>
									</tr>
									<tr>
										<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Phone</th>
										<td class="py-3 font-medium">{customer.phone ?? '–'}</td>
									</tr>
									<tr>
										<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Account</th>
										<td class="py-3 font-medium">{customer.has_account ? 'Registered' : 'Guest'}</td>
									</tr>
									<tr>
										<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Created</th>
										<td class="py-3 font-medium">{createdDisplay}</td>
									</tr>
								</tbody>
							</table>
						</section>
					</div>
				</div>

				<!-- Customer group card -->
				<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
					<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
						<h2 class="text-base font-semibold flex items-center gap-2">
							<UsersRound class="size-4" />
							Customer group
						</h2>
						<Button variant="outline" size="sm" onclick={openAddToGroupModal}>Add to group</Button>
					</div>
					{#if customerGroupsForCard.length === 0}
						<div class="px-6 py-8 text-center text-sm text-muted-foreground">
							No groups yet.
						</div>
					{:else}
						<ul class="divide-y">
							{#each groupCardPaginated as group (group.id ?? group.name)}
								<li class="flex items-center justify-between gap-4 px-6 py-4">
									<p class="text-sm font-medium">{group.name}</p>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
										>
											<MoreHorizontal class="size-4" />
											<span class="sr-only">Customer group actions</span>
										</DropdownMenu.Trigger>
										<DropdownMenu.Portal>
											<DropdownMenu.Content
												class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
												sideOffset={4}
											>
												<DropdownMenu.Item
													textValue="Edit"
													class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={openAddToGroupModal}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Item
													textValue="Delete"
													class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openRemoveFromGroupModal(group)}
												>
													<Trash2 class="size-4" />
													Delete
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								</li>
							{/each}
						</ul>
						{#if groupCardTotal > 0}
							<div class="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-3">
								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={groupCardPage <= 1}
										onclick={() => (groupCardPage = groupCardPage - 1)}
									>
										Prev
									</Button>
									<span class="text-sm text-muted-foreground">
										{groupCardPage} of {groupCardTotalPages} pages
									</span>
									<Button
										variant="outline"
										size="sm"
										disabled={groupCardPage >= groupCardTotalPages}
										onclick={() => (groupCardPage = groupCardPage + 1)}
									>
										Next
									</Button>
								</div>
								<p class="text-sm text-muted-foreground">
									{groupCardStart} – {groupCardEnd} of {groupCardTotal} results
								</p>
							</div>
						{/if}
					{/if}
				</section>

				<!-- Orders section (placeholder) -->
				<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
					<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
						<h2 class="text-base font-semibold flex items-center gap-2">
							<ShoppingBag class="size-4" />
							Orders
						</h2>
					</div>
					<div class="px-6 py-8 text-center text-sm text-muted-foreground">
						No orders yet.
					</div>
				</section>

				<!-- Addresses section -->
				<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
					<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
						<h2 class="text-base font-semibold flex items-center gap-2">
							<MapPin class="size-4" />
							Addresses
						</h2>
						<Button variant="outline" size="sm" onclick={openAddAddress}>Add address</Button>
					</div>
					<PaginationTable showToolbar={false}>
						<div class="min-h-0 flex-1 overflow-auto">
							<table class="w-full text-sm">
								<TableHead columns={addressTableColumns} />
								<TableBody
									rows={addressesWithDisplay}
									columns={addressTableColumns}
									emptyMessage="No addresses yet."
								/>
							</table>
						</div>
					</PaginationTable>
				</section>

				<!-- Footer: Metadata & JSON -->
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-lg border bg-card p-4 shadow-sm">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-medium">Metadata</h3>
							<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{metadataKeys} keys
							</span>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={openMetadataSheet}
							>
								<ExternalLink class="size-4" />
								<span class="sr-only">Open</span>
							</Button>
						</div>
					</div>
					<div class="rounded-lg border bg-card p-4 shadow-sm">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-medium">JSON</h3>
							<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{jsonKeys} keys
							</span>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={() => (jsonOpen = true)}
							>
								<ExternalLink class="size-4" />
								<span class="sr-only">Open</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<CustomerFormSheet bind:open={editOpen} customer={customer} onSuccess={loadCustomer} />

<CustomerAddressFormSheet
	bind:open={addAddressOpen}
	mode="create"
	customerId={customerId}
	customer={customer}
	onSuccess={onAddressSuccess}
/>
<CustomerAddressFormSheet
	bind:open={editAddressOpen}
	mode="edit"
	customerId={customerId}
	address={editingAddress}
	onSuccess={onAddressSuccess}
/>

<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="customer"
	entityTitle={customer ? displayTitle : ''}
	onConfirm={handleConfirmDelete}
	onCancel={closeDeleteModal}
	submitting={deleteSubmitting}
/>

<DeleteConfirmationModal
	bind:open={deleteAddressModalOpen}
	entityName="address"
	entityTitle={deleteAddressTitle}
	onConfirm={handleConfirmDeleteAddress}
	onCancel={closeDeleteAddressModal}
	submitting={deleteAddressSubmitting}
	error={deleteAddressError}
/>

<DeleteConfirmationModal
	bind:open={removeFromGroupModalOpen}
	entityName="customer group"
	entityTitle={removeFromGroupTarget?.name ?? customerGroupName}
	onConfirm={removeCustomerFromGroup}
	onCancel={closeRemoveFromGroupModal}
	submitting={removeFromGroupSubmitting}
	error={removeFromGroupError}
/>

<!-- Add to group modal (Sales Channels–style UI) -->
<Dialog.Root bind:open={addToGroupModalOpen}>
	<Dialog.Content
		class="max-w-3xl h-auto max-h-[85vh] m-auto flex flex-col rounded-xl border shadow-lg"
	>
		<div class="flex flex-1 flex-col overflow-hidden">
			<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
				<Dialog.Title class="text-base font-semibold">Customer group</Dialog.Title>
			</Dialog.Header>

			<!-- Filter and search row (Sales Channels style) -->
			<div class="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2 ml-auto">
					<div class="relative w-64">
						<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={groupModalSearch}
							class="h-9 rounded-md pl-9"
						/>
					</div>
					<button
						type="button"
						class="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Sort"
					>
						<ArrowUpDown class="size-4" />
					</button>
				</div>
			</div>

			<div class="flex flex-1 flex-col overflow-auto p-6">
				{#if addToGroupError}
					<div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{addToGroupError}
					</div>
				{/if}
				{#if groupModalLoading}
					<div class="flex items-center justify-center py-12">
						<p class="text-sm text-muted-foreground">Loading…</p>
					</div>
				{:else}
					<PaginationTable showToolbar={false}>
						<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
							<table class="w-full text-sm">
								<TableHead columns={groupModalTableColumns} />
								<TableBody
									rows={groupModalFiltered}
									columns={groupModalTableColumns}
									emptyMessage="No customer groups found."
									selectedIds={selectedGroupIdSet}
									onToggleSelect={toggleGroupSelection}
								/>
							</table>
						</div>
						{#if groupModalPagination && groupModalPagination.total > 0}
							<TablePagination
								pagination={groupModalPagination}
								start={groupModalStart}
								end={groupModalEnd}
								onPageChange={goToGroupModalPage}
							/>
						{/if}
					</PaginationTable>
				{/if}
			</div>

			<Dialog.Footer class="flex-row flex-wrap items-center justify-end gap-2 border-t px-6 py-4">
				<Button variant="outline" onclick={closeAddToGroupModal} disabled={addToGroupSubmitting}>Cancel</Button>
				<Button onclick={saveAddToGroup} disabled={addToGroupSubmitting || selectedGroupIds.length === 0}>
					{addToGroupSubmitting ? 'Saving...' : 'Save'}
				</Button>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Metadata sheet -->
<Sheet.Root bind:open={metadataOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Edit Metadata</Sheet.Title>
				<Sheet.Description>View and edit customer metadata key-value pairs.</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto px-6 py-6">
				{#if metadataError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{metadataError}
					</div>
				{/if}

				<div class="overflow-hidden rounded-md border">
					<table class="w-full text-sm">
						<thead class="border-b bg-muted/50">
							<tr>
								<th class="px-4 py-3 text-left font-medium">Key</th>
								<th class="px-4 py-3 text-left font-medium">Value</th>
								<th class="w-10 px-4 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{#each metadataRows as row, i}
								<tr class="border-b last:border-0">
									<td class="px-4 py-2">
										<Input bind:value={row.key} placeholder="Key" class="h-9 w-full" />
									</td>
									<td class="px-4 py-2">
										<Input bind:value={row.value} placeholder="Value" class="h-9 w-full" />
									</td>
									<td class="px-4 py-2">
										<Button
											variant="ghost"
											size="icon"
											class="size-8 shrink-0 text-destructive hover:bg-destructive/10"
											onclick={() => removeMetadataRow(i)}
											aria-label="Remove row"
										>
											<Trash2 class="size-4" />
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<Button variant="outline" size="sm" class="mt-4" onclick={addMetadataRow}>Add row</Button>
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeMetadataSheet} disabled={metadataSubmitting}>Cancel</Button>
				<Button onclick={submitCustomerMetadata} disabled={metadataSubmitting}>
					{metadataSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- JSON view sheet -->
<Sheet.Root bind:open={jsonOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<Sheet.Header class="shrink-0 border-b px-6 py-4">
				<Sheet.Title>JSON — {jsonKeys} keys</Sheet.Title>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if customer}
					<pre
						class="rounded-md border bg-zinc-900 p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-300"
					><code>{JSON.stringify(customer, null, 2)}</code></pre>
				{:else}
					<p class="text-sm text-muted-foreground">No data</p>
				{/if}
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (jsonOpen = false)}>Close</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
