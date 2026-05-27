<script lang="ts">
	import { formatStoreMoney } from '$lib/money';
	import { browser } from '$app/environment';
	import {
		ACCOUNT_STORAGE_KEY,
		ORDERS_STORAGE_KEY_PREFIX,
		parseStoredAccount,
		storageKeyForEmail
	} from '$lib/account/storage';
	import {
		displayOrderNumber,
		loadOrderDetails,
		orderDetailsHref,
		parseStoredOrders,
		type OrderDetail,
		type OrderSummary
	} from '$lib/account/order-data';

	const defaultEmail = 'guest@denimai.com';

	let orders = $state<OrderSummary[]>([]);
	let shipToOpenId = $state<string | null>(null);

	const currentAccountEmail = (): string => {
		if (!browser) return defaultEmail;
		return parseStoredAccount(localStorage.getItem(ACCOUNT_STORAGE_KEY))?.email ?? defaultEmail;
	};

	const formatLongDate = (value: string | Date): string => {
		const parsed = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(parsed.getTime())) return String(value);
		return parsed.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

	const addDays = (value: string | Date, days: number): Date => {
		const parsed = value instanceof Date ? new Date(value) : new Date(value);
		parsed.setDate(parsed.getDate() + days);
		return parsed;
	};

	const shipToName = (detail: OrderDetail): string => {
		const first = detail.shippingAddress[0]?.trim();
		if (first) return first;
		return 'Customer';
	};

	const statusHeading = (detail: OrderDetail): string => {
		const normalized = detail.status.toLowerCase();
		const placed = formatLongDate(detail.date);
		if (normalized.includes('deliver')) {
			return `Delivered ${formatLongDate(addDays(detail.date, 2))}`;
		}
		if (normalized.includes('ship')) {
			return `Shipped ${formatLongDate(addDays(detail.date, 1))}`;
		}
		if (normalized.includes('cancel')) {
			return 'Cancelled';
		}
		return `Order placed ${placed}`;
	};

	const statusSubtext = (detail: OrderDetail): string => {
		const normalized = detail.status.toLowerCase();
		if (normalized.includes('deliver')) return 'Package was handed to resident';
		if (normalized.includes('ship')) return 'Your package is on the way';
		if (normalized.includes('cancel')) return 'This order was cancelled';
		if (normalized.includes('pending')) return 'We are preparing your order';
		return `Payment: ${detail.paymentMethod}`;
	};

	const returnWindowText = (detail: OrderDetail): string => {
		const closedOn = formatLongDate(addDays(detail.date, 12));
		return `Return window closed on ${closedOn}`;
	};

	const lineItemsForOrder = (summary: OrderSummary): OrderDetail['items'] => {
		const detail = loadOrderDetails(summary);
		if (detail.items.length > 0) return detail.items;
		return [
			{
				image: '',
				imageAlt: 'Order item',
				title: `Order #${summary.id}`,
				variant: detail.paymentMethod,
				quantity: 1,
				price: formatStoreMoney(summary.total)
			}
		];
	};

	const toggleShipTo = (orderId: string) => {
		shipToOpenId = shipToOpenId === orderId ? null : orderId;
	};

	$effect(() => {
		if (!browser) return;
		const ordersKey = storageKeyForEmail(
			ORDERS_STORAGE_KEY_PREFIX,
			currentAccountEmail(),
			defaultEmail
		);
		orders = parseStoredOrders(localStorage.getItem(ordersKey));
	});
</script>

<svelte:head>
	<title>My Orders - Denimai</title>
</svelte:head>

<section class="account-panel-inner account-panel-inner--orders">
	<header class="account-panel-header">
		<h2 class="account-panel-heading">My Orders</h2>
	</header>

	<div class="account-panel-body account-panel-body--orders">
		{#if orders.length === 0}
			<p class="account-empty">No orders yet.</p>
		{:else}
			<div class="orders-feed">
				{#each orders as order (order.id)}
					{@const detail = loadOrderDetails(order)}
					{@const items = lineItemsForOrder(order)}
					<article class="order-amazon-card">
						<header class="order-amazon-card__meta">
							<div class="order-meta-block">
								<span class="order-meta-label">Order placed</span>
								<strong class="order-meta-value">{formatLongDate(order.date)}</strong>
							</div>
							<div class="order-meta-block">
								<span class="order-meta-label">Total</span>
								<strong class="order-meta-value">{formatStoreMoney(order.total)}</strong>
							</div>
							<div class="order-meta-block order-meta-block--ship">
								<span class="order-meta-label">Ship to</span>
								<div class="order-ship-to">
									<button
										type="button"
										class="order-ship-to__trigger"
										aria-expanded={shipToOpenId === order.id}
										onclick={() => toggleShipTo(order.id)}
									>
										{shipToName(detail)}
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
											<path d="m6 9 6 6 6-6" />
										</svg>
									</button>
									{#if shipToOpenId === order.id && detail.shippingAddress.length > 0}
										<div class="order-ship-to__popover">
											{#each detail.shippingAddress as line}
												<p>{line}</p>
											{/each}
										</div>
									{/if}
								</div>
							</div>
							<div class="order-meta-block order-meta-block--actions">
								<p class="order-meta-order-id">
									<span class="order-meta-label">Order #</span>
									<span class="order-meta-order-number">{displayOrderNumber(detail, order)}</span>
								</p>
								<p class="order-meta-links">
									<a href={orderDetailsHref(order)} class="order-link-btn">View order details</a>
									<span class="order-action-sep" aria-hidden="true">|</span>
									<button type="button" class="order-link-btn order-link-btn--caret">
										Invoice
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
											<path d="m6 9 6 6 6-6" />
										</svg>
									</button>
								</p>
							</div>
						</header>

						<div class="order-amazon-card__body">
							<div class="order-delivery-status">
								<h3>{statusHeading(detail)}</h3>
								<p>{statusSubtext(detail)}</p>
							</div>

							<aside class="order-amazon-card__aside" aria-label="Order actions">
								<button type="button" class="order-pill-btn order-pill-btn--full">Track package</button>
							</aside>

							<div class="order-lines">
								{#each items as item, index (index)}
									<div class="order-line">
										{#if item.image}
											<img class="order-line__thumb" src={item.image} alt={item.imageAlt} loading="lazy" />
										{:else}
											<div class="order-line__thumb order-line__thumb--placeholder" aria-hidden="true"></div>
										{/if}
										<div class="order-line__content">
											{#if item.productHandle}
												<a href="/products/{item.productHandle}" class="order-line__title">{item.title}</a>
											{:else}
												<p class="order-line__title order-line__title--plain">{item.title}</p>
											{/if}
											{#if item.variant}
												<p class="order-line__variant">{item.variant}</p>
											{/if}
											<p class="order-line__return">{returnWindowText(detail)}</p>
											<div class="order-line__cta">
												<a href="/store" class="order-pill-btn order-pill-btn--primary">Buy it again</a>
												<a href="/store" class="order-pill-btn">View your item</a>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>
