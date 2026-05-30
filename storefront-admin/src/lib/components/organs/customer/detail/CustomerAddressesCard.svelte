<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		CustomerAddressFormSheet,
		DeleteConfirmationModal,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import {
		deleteCustomerAddress,
		type Customer,
		type CustomerAddress
	} from '$lib/customers/api.js';

	let {
		customer,
		customerId,
		addresses,
		onRefresh
	}: {
		customer: Customer;
		customerId: string;
		addresses: CustomerAddress[];
		onRefresh: () => void | Promise<void>;
	} = $props();

	let addAddressOpen = $state(false);
	let editAddressOpen = $state(false);
	let editingAddress = $state<CustomerAddress | null>(null);

	let deleteAddressModalOpen = $state(false);
	let addressToDelete = $state<CustomerAddress | null>(null);
	let deleteAddressSubmitting = $state(false);
	let deleteAddressError = $state<string | null>(null);

	function openAddAddress() {
		editingAddress = null;
		addAddressOpen = true;
	}

	function openEditAddress(addr: CustomerAddress) {
		editingAddress = addr;
		editAddressOpen = true;
	}

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
			? [addressToDelete.address_1, addressToDelete.city, addressToDelete.country_code]
					.filter(Boolean)
					.join(', ')
			: ''
	);

	type AddressTableRow = CustomerAddress & {
		address_line: string;
		is_default_label: string;
	};

	const addressTableColumns: TableColumn<AddressTableRow>[] = [
		{ label: 'Address', key: 'address_line', type: 'text' },
		{ label: 'Default', key: 'is_default_label', type: 'text' },
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
					onClick: (item) => openEditAddress(item)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteAddressModal(item)
				}
			]
		}
	];

	const addressesWithDisplay = $derived(
		addresses.map((addr) => ({
			...addr,
			address_line: [addr.address_1, addr.address_2].filter(Boolean).join(', '),
			is_default_label: addr.is_default ? 'Yes' : '—'
		}))
	);

	async function handleConfirmDeleteAddress() {
		if (!addressToDelete) return;
		deleteAddressError = null;
		deleteAddressSubmitting = true;
		try {
			await deleteCustomerAddress(customer.id, addressToDelete.id);
			deleteAddressModalOpen = false;
			addressToDelete = null;
			deleteAddressError = null;
			await onRefresh();
		} catch (e) {
			deleteAddressError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteAddressSubmitting = false;
		}
	}
</script>

<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="flex items-center gap-2 text-base font-semibold">
			<MapPin class="size-4" />
			Addresses
		</h2>
		<Button variant="outline" size="sm" onclick={openAddAddress}>Add address</Button>
	</div>
	<PaginationTable showToolbar={false}>
		<div class="min-h-0 flex-1 overflow-auto">
			<table class="w-full text-sm">
				<TableHead columns={addressTableColumns as TableColumn[]} />
				<TableBody
					rows={addressesWithDisplay}
					columns={addressTableColumns as TableColumn[]}
					emptyMessage="No addresses yet."
				/>
			</table>
		</div>
	</PaginationTable>
</section>

<CustomerAddressFormSheet
	bind:open={addAddressOpen}
	mode="create"
	{customerId}
	{customer}
	onSuccess={onRefresh}
/>
<CustomerAddressFormSheet
	bind:open={editAddressOpen}
	mode="edit"
	{customerId}
	address={editingAddress}
	onSuccess={onRefresh}
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
