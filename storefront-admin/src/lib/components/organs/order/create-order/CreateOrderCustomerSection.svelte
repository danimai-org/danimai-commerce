<script lang="ts">
	import { DropdownMenu } from '$lib/components/ui/dropdown-menu/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import type { ComboboxOption } from '$lib/components/organs/combobox/combobox.svelte';
	import { CardSection } from '$lib/components/organs/order/card-section/index.js';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import {
		hasShippingAddress,
		formatShippingAddressSummary,
		type ShippingAddressValue
	} from '../shipping-address.js';
	import { CUSTOMER_MENU_ITEM_CLASS, type SelectedCustomer } from './types.js';

	let {
		selectedCustomer,
		selectedCustomerId = $bindable(''),
		customerComboboxOptions,
		customerComboboxLoading,
		shippingAddress,
		billingAddressDisplay,
		onCustomerValueChange,
		onCustomerSearchChange,
		onCustomerComboboxOpen,
		onEditContact,
		onEditShipping,
		onEditBilling,
		onRemoveCustomer,
		filterFn
	}: {
		selectedCustomer: SelectedCustomer | null;
		selectedCustomerId?: string;
		customerComboboxOptions: ComboboxOption[];
		customerComboboxLoading: boolean;
		shippingAddress: ShippingAddressValue;
		billingAddressDisplay: ShippingAddressValue;
		onCustomerValueChange: (id: string) => void;
		onCustomerSearchChange: (v: string) => void;
		onCustomerComboboxOpen: () => void;
		onEditContact: () => void;
		onEditShipping: () => void;
		onEditBilling: () => void;
		onRemoveCustomer: () => void;
		filterFn: (opts: ComboboxOption[]) => ComboboxOption[];
	} = $props();
</script>

<CardSection title="Customer">
	{#snippet headerAction()}
		{#if selectedCustomer}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="flex size-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
							class={CUSTOMER_MENU_ITEM_CLASS}
							onSelect={onEditContact}
						>
							Edit contact information
						</DropdownMenu.Item>
						<DropdownMenu.Item
							textValue="Edit shipping address"
							class={CUSTOMER_MENU_ITEM_CLASS}
							onSelect={onEditShipping}
						>
							Edit shipping address
						</DropdownMenu.Item>
						<DropdownMenu.Item
							textValue="Edit billing address"
							class={CUSTOMER_MENU_ITEM_CLASS}
							onSelect={onEditBilling}
						>
							Edit billing address
						</DropdownMenu.Item>
						<DropdownMenu.Item
							textValue="Remove customer"
							class={`${CUSTOMER_MENU_ITEM_CLASS} text-destructive focus:text-destructive`}
							onSelect={onRemoveCustomer}
						>
							Remove customer
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		{/if}
	{/snippet}
	{#if selectedCustomer}
		<div class="flex flex-col gap-4">
			<div>
				<button type="button" class="text-sm font-medium text-primary hover:underline">
					{selectedCustomer.name}
				</button>
				<div class="mt-0.5">
					<button type="button" class="text-sm text-primary hover:underline">
						{selectedCustomer.orderCount === 0
							? 'No orders'
							: `${selectedCustomer.orderCount} ${selectedCustomer.orderCount === 1 ? 'order' : 'orders'}`}
					</button>
				</div>
			</div>
			<div class="space-y-1 text-sm">
				<div class="font-semibold">Contact information</div>
				<button type="button" class="block text-left text-primary hover:underline">
					{selectedCustomer.email}
				</button>
				{#if selectedCustomer.phone}
					<div class="text-foreground">{selectedCustomer.phone}</div>
				{/if}
			</div>
			<div class="space-y-1 text-sm">
				<div class="font-semibold">Shipping address</div>
				{#if hasShippingAddress(shippingAddress)}
					<div class="whitespace-pre-line text-muted-foreground">
						{formatShippingAddressSummary(shippingAddress)}
					</div>
				{:else}
					<div class="text-muted-foreground">No shipping address provided</div>
				{/if}
			</div>
			<div class="space-y-1 text-sm">
				<div class="font-semibold">Billing address</div>
				{#if hasShippingAddress(billingAddressDisplay)}
					<div class="whitespace-pre-line text-muted-foreground">
						{formatShippingAddressSummary(billingAddressDisplay)}
					</div>
				{:else if hasShippingAddress(shippingAddress)}
					<div class="text-muted-foreground">Same as shipping address</div>
				{:else}
					<div class="text-muted-foreground">No billing address provided</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			<div class="flex gap-2">
				<Combobox
					id="create-order-customer"
					class="min-w-0 flex-1"
					options={customerComboboxOptions}
					bind:value={selectedCustomerId}
					onValueChange={onCustomerValueChange}
					placeholder="Search or create a customer"
					loading={customerComboboxLoading}
					emptyMessage="No customers found."
					{filterFn}
					onSearchChange={onCustomerSearchChange}
					onOpen={onCustomerComboboxOpen}
				/>
			</div>
		</div>
	{/if}
</CardSection>
