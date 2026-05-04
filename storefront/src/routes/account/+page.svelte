<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { formatStoreMoney } from '$lib/money';

	const account = $state({
		name: 'text',
		email: 'test@example.com'
	});
	const orders = $state([
		{
			id: 6,
			date: 'Feb 23, 2026',
			status: 'Pending',	payment: 'Authorized',
			total: 58
		},
		{
			id: 26,
			date: 'Apr 13, 2026',
			status: 'Pending',
			payment: 'Authorized',
			total: 468
		}
	]);


</script>

<svelte:head>
	<title>My Account - Denimai</title>
</svelte:head>

<div class="page-account">
	<SiteHeader />

	<main class="account-main">
		<h1 class="account-title">My Account</h1>

		<section class="account-section">
			<h2>Account Details</h2>
			<p><strong>Name:</strong> {account.name}</p>
			<p><strong>Email:</strong> {account.email}</p>
		</section>

		<section class="account-section">
			<h2>Order History</h2>

			<div class="orders-list">
				{#each orders as order}
					<article class="order-card">
						<div class="order-header">
							<div>
								<h3>Order #{order.id}</h3>
								<p>{order.date}</p>
							</div>
							<strong>{formatStoreMoney(order.total)}</strong>
						</div>
						<p class="order-meta">Status: {order.status}  Payment: {order.payment}</p>
					</article>
				{/each}
			</div>
		</section>
	</main>

	<SiteFooter />
</div>
