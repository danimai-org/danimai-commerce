<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { SearchInput } from '../search-input/index.js';
	import { CardSection } from '../card-section/index.js';
	import EditContactModal from '../EditContactModal.svelte';
	import EditShippingAddressModal from '../EditShippingAddressModal.svelte';
	import AddressDisplay from './AddressDisplay.svelte';
	import type { CustomerInfo } from './load-order.js';
	import {
		getOrderMetadata,
		hasOrderAddress,
		parseMetadataAddress,
		toShippingAddressValue,
		type OrderAddress,
		type OrderDetailOrder
	} from './types.js';
	import type { ShippingAddressValue } from '../shipping-address.js';
	import { updateCustomer } from '$lib/customers/api.js';
	import { client } from '$lib/client';

	let {
		order,
		orderId,
		customer,
		onOrderUpdated
	}: {
		order: OrderDetailOrder;
		orderId: string;
		customer: CustomerInfo;
		onOrderUpdated?: () => void | Promise<void>;
	} = $props();

	let customerSearch = $state('');
	let editContactModalOpen = $state(false);
	let editContactEmail = $state('');
	let editContactPhone = $state('');
	let editContactEmailInitial = $state('');
	let editContactPhoneInitial = $state('');
	let editContactSaving = $state(false);
	let editShippingModalOpen = $state(false);

	const editContactDirty = $derived(
		editContactEmail.trim() !== editContactEmailInitial.trim() ||
			editContactPhone.trim() !== editContactPhoneInitial.trim()
	);

	const metadata = $derived(getOrderMetadata(order));

	const billingAddress = $derived(parseMetadataAddress(metadata.billing_address));

	const shippingAddress = $derived.by((): OrderAddress | null => {
		const fromShipping = parseMetadataAddress(metadata.shipping_address);
		if (hasOrderAddress(fromShipping)) return fromShipping;
		return parseMetadataAddress(metadata.billing_address);
	});

	const hasBillingAddress = $derived(hasOrderAddress(billingAddress));
	const hasShippingAddress = $derived(hasOrderAddress(shippingAddress));

	let shippingAddressForm = $derived(toShippingAddressValue(shippingAddress));

	function openEditContactModal() {
		editContactEmail = order.email ?? '';
		editContactPhone = customer.phone ?? '';
		editContactEmailInitial = editContactEmail;
		editContactPhoneInitial = editContactPhone;
		editContactModalOpen = true;
	}

	function closeEditContactModal() {
		if (editContactSaving) return;
		editContactModalOpen = false;
	}

	async function saveEditContact() {
		if (!editContactDirty) return;
		editContactSaving = true;
		try {
			const email = editContactEmail.trim() || null;
			const phone = editContactPhone.trim() || null;
			const orderRes = await client.orders({ id: orderId }).patch({ email });
			if (orderRes.error) {
				throw new Error('Failed to update contact information');
			}
			if (order.customer_id) {
				await updateCustomer(order.customer_id, {
					email: email ?? '',
					first_name: customer.firstName,
					last_name: customer.lastName,
					phone
				});
			}
			editContactModalOpen = false;
			await onOrderUpdated?.();
		} finally {
			editContactSaving = false;
		}
	}

	async function saveShippingAddress(addr: ShippingAddressValue) {
		const currentMeta =
			typeof order.metadata === 'object' && order.metadata !== null
				? (order.metadata as Record<string, unknown>)
				: {};
		const res = await client.orders({ id: orderId }).patch({
			metadata: {
				...currentMeta,
				shipping_address: JSON.stringify(addr)
			}
		});
		if (res.error) {
			throw new Error('Failed to update shipping address');
		}
		await onOrderUpdated?.();
	}
</script>

<CardSection title="Customer">
	{#snippet headerAction()}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<MoreHorizontal class="size-4" />
				<span class="sr-only">Customer actions</span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					class="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
					sideOffset={4}
				>
					<DropdownMenu.Item
						textValue="Edit contact information"
						class="relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
						onSelect={openEditContactModal}
					>
						Edit contact information
					</DropdownMenu.Item>
					<DropdownMenu.Item
						textValue="Edit shipping address"
						class="relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
						onSelect={() => (editShippingModalOpen = true)}
					>
						Edit shipping address
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	{/snippet}

	<SearchInput bind:value={customerSearch} placeholder="Search or create a customer" class="mb-4" />

	<div class="space-y-4 text-sm">
		<div>
			<div class="mb-1.5 font-medium">Contact information</div>
			<div class="space-y-1 text-muted-foreground">
				{#if order.email}
					<div>{order.email}</div>
				{:else}
					<div>No email provided</div>
				{/if}
				{#if customer.phone}
					<div>{customer.phone}</div>
				{:else}
					<div>No phone number</div>
				{/if}
			</div>
		</div>
		<div>
			<div class="mb-1.5 font-medium">Shipping address</div>
			<AddressDisplay
				address={hasShippingAddress ? shippingAddress : null}
				emptyLabel="No shipping address provided"
			/>
		</div>
		<div>
			<div class="mb-1.5 font-medium">Billing address</div>
			<AddressDisplay
				address={hasBillingAddress ? billingAddress : null}
				emptyLabel="No billing address provided"
			/>
		</div>
	</div>
</CardSection>

<EditContactModal
	bind:open={editContactModalOpen}
	bind:email={editContactEmail}
	bind:phone={editContactPhone}
	saving={editContactSaving}
	canSave={editContactDirty}
	onSave={saveEditContact}
	onCancel={closeEditContactModal}
/>
<EditShippingAddressModal
	bind:open={editShippingModalOpen}
	bind:value={shippingAddressForm}
	customerId={order.customer_id ?? ''}
	customerFirstName={customer.firstName}
	customerLastName={customer.lastName}
	customerPhone={customer.phone}
	saveToCustomerProfile={Boolean(order.customer_id)}
	onSave={saveShippingAddress}
/>
