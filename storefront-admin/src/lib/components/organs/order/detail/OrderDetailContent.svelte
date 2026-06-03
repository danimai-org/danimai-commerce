<script lang="ts">
	import OrderDetailHeader from './OrderDetailHeader.svelte';
	import OrderFulfillmentSection from './OrderFulfillmentSection.svelte';
	import OrderPaymentSection from './OrderPaymentSection.svelte';
	import OrderTimelineSection from './OrderTimelineSection.svelte';
	import OrderNotesSection from './OrderNotesSection.svelte';
	import OrderCustomerSection from './OrderCustomerSection.svelte';
	import OrderConversionSummary from './OrderConversionSummary.svelte';
	import OrderRiskSection from './OrderRiskSection.svelte';
	import type { CustomerInfo } from './load-order.js';
	import {
		getOrderAmounts,
		getOrderItems,
		getOrderMetadata,
		type OrderDetailOrder
	} from './types.js';

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

	const metadata = $derived(getOrderMetadata(order));
	const orderItems = $derived(getOrderItems(order));
	const amounts = $derived(getOrderAmounts(order, orderItems));
	const subtotal = $derived(amounts.subtotal);
	const taxAmount = $derived(amounts.taxAmount);
	const total = $derived(amounts.total);
	const paidAmount = $derived(
		order.payment_status === 'captured' || order.payment_status === 'partially_refunded'
			? total
			: 0
	);
	const itemCount = $derived(orderItems.reduce((sum, item) => sum + item.quantity, 0));
</script>

<div class="flex h-full flex-col bg-muted/30">
	<OrderDetailHeader {order} {orderId} />

	<div
		class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]"
	>
		<div class="flex min-w-0 flex-col gap-4 sm:gap-6">
			<OrderFulfillmentSection {order} {orderId} {orderItems} {onOrderUpdated} />
			<OrderPaymentSection
				{order}
				{subtotal}
				{taxAmount}
				{total}
				{paidAmount}
				{itemCount}
			/>
			<OrderTimelineSection />
		</div>

		<div class="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
			<OrderNotesSection notes={metadata.notes} />
			<OrderCustomerSection {order} {orderId} {customer} {onOrderUpdated} />
			<OrderConversionSummary />
			<OrderRiskSection />
		</div>
	</div>
</div>
