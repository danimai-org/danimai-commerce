<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import {
		displayOrderNumber,
		loadOrdersForAccount,
		resolveOrderDetail,
		type OrderDetail
	} from '$lib/account/order-data';

	let order = $state<OrderDetail | null>(null);
	let notFound = $state(false);

	const orderRef = $derived($page.url.searchParams.get('order')?.trim() ?? '');

	const summaryForOrder = $derived.by(() => {
		if (!orderRef) return null;
		const orders = loadOrdersForAccount();
		return (
			orders.find((entry) => entry.orderId === orderRef) ??
			orders.find((entry) => entry.id === orderRef) ??
			null
		);
	});

	const orderNumber = $derived(
		order ? displayOrderNumber(order, summaryForOrder) : ''
	);

	$effect(() => {
		if (!browser) return;
		const ref = orderRef;
		if (!ref) {
			order = null;
			notFound = true;
			return;
		}
		const detail = resolveOrderDetail(ref);
		order = detail;
		notFound = !detail;
	});
</script>

<svelte:head>
	<title>Order Details - Denimai</title>
</svelte:head>

<section class="account-panel-inner account-order-details">
	<header class="account-panel-header account-order-details__header">
		<a href="/account/orders" class="account-order-details__back" aria-label="Back to orders">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path d="m15 18-6-6 6-6" />
			</svg>
		</a>
		<h2 class="account-panel-heading">Order Details</h2>
	</header>

	<div class="account-panel-body account-order-details__body">
		{#if notFound || !order}
			<p class="account-empty">Order not found.</p>
			<a href="/account/orders" class="account-order-details__back-link">Back to My Orders</a>
		{:else}
			<div class="order-details-overview">
				<p class="order-details-number">Order #{orderNumber}</p>
				<p><span>Order Date:</span> {order.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
				<p><span>Status:</span> {order.status}</p>
				<p><span>Email:</span> {order.email}</p>
			</div>

			<section class="order-section">
				<h3>Items</h3>
				{#if order.items.length === 0}
					<p class="empty-state">Item details are not available for this order yet.</p>
				{:else}
					<div class="items-list">
						{#each order.items as item}
							<article class="item-row">
								<div class="item-main">
									{#if item.image}
										<img src={item.image} alt={item.imageAlt} loading="lazy" />
									{:else}
										<div class="item-main--placeholder" aria-hidden="true"></div>
									{/if}
									<div class="item-copy">
										<p class="item-title">{item.title}</p>
										{#if item.variant}
											<p class="item-variant">{item.variant}</p>
										{/if}
										<p class="item-qty">Quantity: {item.quantity}</p>
									</div>
								</div>
								<p class="item-price">{item.price}</p>
							</article>
						{/each}
					</div>
				{/if}
			</section>

			<section class="order-section info-grid">
				<div class="info-block">
					<h3>Delivery Information</h3>
					<div class="info-cols">
						<div>
							<h4>Shipping Address</h4>
							{#if order.shippingAddress.length === 0}
								<p>—</p>
							{:else}
								{#each order.shippingAddress as line}
									<p>{line}</p>
								{/each}
							{/if}
						</div>
						<div>
							<h4>Shipping Method</h4>
							<p>{order.shippingMethod}</p>
						</div>
					</div>
				</div>
			</section>

			<section class="order-section info-grid">
				<div class="info-cols">
					<div>
						<h3>Billing Information</h3>
						<h4>Billing Address</h4>
						{#if order.billingAddress.length === 0}
							<p>—</p>
						{:else}
							{#each order.billingAddress as line}
								<p>{line}</p>
							{/each}
						{/if}
					</div>
					<div>
						<h3>Payment Method</h3>
						<h4>Method</h4>
						<p>{order.paymentMethod}</p>
					</div>
				</div>
			</section>

			<section class="order-section summary-block">
				<h3>Summary</h3>
				<div class="summary-rows">
					<p><span>Subtotal</span><strong>{order.totals.subtotal}</strong></p>
					<p><span>Shipping</span><strong>{order.totals.shipping}</strong></p>
					<p><span>Discount</span><strong>{order.totals.discount}</strong></p>
					<p><span>Tax</span><strong>{order.totals.tax}</strong></p>
					<p class="summary-total"><span>Total</span><strong>{order.totals.total}</strong></p>
				</div>
			</section>
		{/if}
	</div>
</section>
