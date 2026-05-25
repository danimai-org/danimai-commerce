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
	import { getOrderItems, getOrderMetadata, type OrderDetailOrder } from './types.js';

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
	const subtotal = $derived(metadata.subtotal ?? 0);
	const discountAmount = $derived(metadata.discount_amount ?? 0);
	const shippingAmount = $derived(metadata.shipping_amount ?? 0);
	const taxAmount = $derived(metadata.tax_amount ?? 0);
	const total = $derived(
		metadata.total ?? subtotal + discountAmount + shippingAmount + taxAmount
	);
	const paidAmount = $derived(order.payment_status === 'captured' ? total : 0);
	const itemCount = $derived(orderItems.reduce((sum, item) => sum + item.quantity, 0));
</script>

<OrderDetailHeader {order} {orderId} />

<div class="flex min-h-0 flex-1 gap-6 overflow-auto p-6">
	<div class="flex min-w-0 flex-1 flex-col gap-6">
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

	<div class="flex w-80 flex-col gap-6">
		<OrderNotesSection notes={metadata.notes} />
		<OrderCustomerSection {order} {orderId} {customer} {onOrderUpdated} />
		<OrderConversionSummary />
		<OrderRiskSection />
	</div>
</div>
