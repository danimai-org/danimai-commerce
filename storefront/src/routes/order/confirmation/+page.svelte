<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	type Order = {
		id: string;
		number: string;
		date: Date;
		status: string;
		email: string;
		items: Array<{
			image: string;
			imageAlt: string;
			title: string;
			variant: string;
			quantity: number;
			price: string;
		}>;
		shippingAddress: string[];
		shippingMethod: string;
		billingAddress: string[];
		paymentMethod: string;
		totals: {
			subtotal: string;
			shipping: string;
			discount: string;
			tax: string;
			total: string;
		};
	};

	const orderId = $derived($page.url.searchParams.get('order') ?? '');
	const ORDER_CACHE_KEY_PREFIX = 'dm_sf_order_';
	let order = $state<Order | null>(null);
	let isLoading = $state(false);
	let errorMessage = $state('');

	function createPlaceholderOrder(id: string): Order {
		return {
			id,
			number: 'Pending',
			date: new Date(),
			status: 'pending',
			email: '—',
			items: [],
			shippingAddress: [],
			shippingMethod: '—',
			billingAddress: [],
			paymentMethod: '—',
			totals: {
				subtotal: '—',
				shipping: '—',
				discount: '—',
				tax: '—',
				total: '—'
			}
		};
	}

	onMount(() => {
		if (!orderId) {
			order = null;
			errorMessage = 'Missing order id in URL.';
			return;
		}
		try {
			const raw = sessionStorage.getItem(`${ORDER_CACHE_KEY_PREFIX}${orderId}`);
			if (!raw) {
				errorMessage = '';
				order = createPlaceholderOrder(orderId);
				return;
			}
			const parsed = JSON.parse(raw) as Omit<Order, 'date'> & { date: string };
			order = {
				...parsed,
				date: new Date(parsed.date)
			};
			errorMessage = '';
		} catch {
			errorMessage = '';
			order = createPlaceholderOrder(orderId);
		}
	});

</script>

<SiteHeader />

<main class="order-confirmation-page">
	<div class="confirmation-container">
		{#if isLoading}
			<section class="order-overview">
				<h1>Thank you for your order</h1>
				<p class="order-number">Loading order...</p>
			</section>
		{:else if errorMessage || !order}
			<section class="order-overview">
				<h1>Thank you for your order</h1>
				<p class="order-number">{errorMessage || 'Unable to display this order right now.'}</p>
			</section>
		{:else}
			<section class="order-overview">
				<h1>Thank you for your order</h1>
				<p class="order-number">Order #{order.number}</p>

				<div class="order-details">
					<h2>Order Details</h2>
					<p><span>Order ID:</span> {order.id}</p>
					<p><span>Order Date:</span> {order.date.toLocaleDateString()}</p>
					<p><span>Order Status:</span> {order.status}</p>
					<p><span>Order Email:</span> {order.email}</p>
				</div>
			</section>

			<section class="order-section">
				<h3>Items</h3>
				{#if order.items.length === 0}
					<p class="empty-state">Item details are not available for this order yet.</p>
				{:else}
					<div class="items-list">
						{#each order.items as item}
							<article class="item-row">
								<div class="item-main">
									<img src={item.image} alt={item.imageAlt} loading="lazy" />
									<div class="item-copy">
										<p class="item-title">{item.title}</p>
										<p class="item-variant">{item.variant}</p>
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
						<h4>Payment Method</h4>
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
</main>

<SiteFooter />

<style>
	.order-confirmation-page {
		background: #fff;
		min-height: 100vh;
	}

	.confirmation-container {
		max-width: 1180px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 0;
		color: #171717;
	}

	.order-overview h1 {
		font-size: 2rem;
		line-height: 1.2;
		font-weight: 500;
		margin: 0;
	}

	.order-number {
		margin: 0.45rem 0 1.65rem;
		font-size: 0.95rem;
		color: #222;
	}

	.order-details h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.85rem;
	}

	.order-details p {
		margin: 0 0 0.35rem;
		font-size: 0.9rem;
		color: #333;
	}

	.order-details p span {
		font-weight: 500;
		margin-right: 0.3rem;
	}

	.order-section {
		border-top: 1px solid #cfcfcf;
		padding: 1rem 0 1.3rem;
	}

	h3 {
		margin: 0 0 1.1rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.item-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.item-main {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.item-main img {
		width: 52px;
		height: 64px;
		object-fit: cover;
		background: #efefef;
	}

	.item-copy p {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.5;
	}

	.item-title {
		font-weight: 600;
		color: #111;
		margin-bottom: 0.1rem;
	}

	.item-variant,
	.item-qty {
		color: #676767;
	}

	.item-price {
		margin: 0;
		font-size: 0.92rem;
		color: #111;
		white-space: nowrap;
	}

	.info-cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	h4 {
		margin: 0 0 0.35rem;
		font-size: 0.88rem;
		font-weight: 600;
	}

	.info-cols p {
		margin: 0;
		font-size: 0.86rem;
		line-height: 1.4;
		color: #3b3b3b;
	}

	.summary-rows {
		max-width: 100%;
	}

	.summary-rows p {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 0 0 0.45rem;
		font-size: 0.9rem;
		color: #383838;
	}

	.summary-rows p strong {
		font-weight: 500;
		color: #101010;
	}

	.summary-total {
		margin-top: 0.8rem;
		padding-top: 0.7rem;
		border-top: 1px solid #cfcfcf;
	}

	.empty-state {
		margin: 0;
		font-size: 0.9rem;
		color: #555;
	}

	@media (max-width: 900px) {
		.confirmation-container {
			padding-top: 1.8rem;
		}

		.info-cols {
			grid-template-columns: 1fr;
			gap: 1.2rem;
		}
	}

	@media (max-width: 640px) {
		.order-overview h1 {
			font-size: 1.65rem;
		}

		.item-row {
			flex-direction: column;
			gap: 0.55rem;
		}

		.item-price {
			padding-left: 68px;
		}
	}
</style>
