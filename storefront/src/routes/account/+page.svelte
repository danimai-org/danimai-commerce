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

<style>
	.page-account {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.account-main {
		flex: 1;
		max-width: 56rem;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
		width: 100%;
		box-sizing: border-box;
	}

	.account-title {
		font-size: clamp(2rem, 5vw, 2.75rem);
		margin: 0 0 2rem;
	}

	.account-section {
		margin-bottom: 2.25rem;
	}

	.account-section h2 {
		font-size: 1.5rem;
		margin: 0 0 1rem;
	}

	.account-section p {
		margin: 0.25rem 0;
	}

	.orders-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.order-card {
		border: 1px solid #e6e6e6;
		border-radius: 0.5rem;
		padding: 1rem 1.25rem;
		background: #fff;
	}

	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.order-header h3 {
		margin: 0;
		font-size: 1rem;
	}

	.order-header p {
		margin: 0.2rem 0 0;
		color: #5c5c5c;
	}

	.order-meta {
		color: #3f3f3f;
	}
</style>
