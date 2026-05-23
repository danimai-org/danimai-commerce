<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { JSONComponent, MetadataComponent } from '$lib/components/organs/index.js';
	import {
		CustomerBreadcrumb,
		CustomerOverviewCard,
		CustomerGroupsCard,
		CustomerOrdersCard,
		CustomerAddressesCard
	} from '$lib/components/organs/customer/detail/index.js';
	import {
		getCustomer,
		listCustomerAddresses,
		type Customer,
		type CustomerAddress
	} from '$lib/customers/api.js';

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
			: (customer?.email ?? 'Customer')
	);

	function goToCustomersList() {
		goto(resolve('/customers', {}), { replaceState: true });
	}
</script>

<svelte:head>
	<title>{customer ? displayTitle : 'Customer'} | Customers | Danimai Store</title>
	<meta name="description" content="Manage customer." />
</svelte:head>

<div class="flex h-full flex-col">
	<CustomerBreadcrumb
		label={customer ? breadcrumbLabel : ''}
		fallbackId={customerId || '…'}
	/>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !customer}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Customer not found'}</p>
			<Button variant="outline" onclick={goToCustomersList}>Back to Customers</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<CustomerOverviewCard
					{customer}
					onDeleted={goToCustomersList}
					onUpdated={loadCustomer}
					onDeleteError={(message) => (error = message)}
				/>
				<CustomerGroupsCard {customer} {customerId} onRefresh={loadCustomer} />
				<CustomerOrdersCard />
				<CustomerAddressesCard
					{customer}
					{customerId}
					{addresses}
					onRefresh={loadAddresses}
				/>
				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={customer.id}
						metadataEntity="customer"
						metadata={(customer.metadata ?? {}) as Record<string, unknown>}
						customerFields={{
							email: customer.email,
							first_name: customer.first_name,
							last_name: customer.last_name,
							phone: customer.phone
						}}
						onSaved={loadCustomer}
					/>
					<JSONComponent product={customer} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
