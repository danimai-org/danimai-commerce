<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { formatStoreMoney } from '$lib/money';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	type Account = {
		name: string;
		email: string;
	};

	type Order = {
		id: string;
		date: string;
		total: number;
		status: string;
		payment: string;
	};

	const ACCOUNT_STORAGE_KEY = 'dm_sf_account';
	const ORDERS_STORAGE_KEY_PREFIX = 'dm_sf_orders_';

	const defaultAccount: Account = {
		name: 'Customer',
		email: 'guest@denimai.com'
	};

	const defaultOrders: Order[] = [];

	let account: Account = defaultAccount;
	let orders: Order[] = defaultOrders;

	const ordersStorageKeyForEmail = (email: string): string => {
		const normalized = email.trim().toLowerCase();
		return `${ORDERS_STORAGE_KEY_PREFIX}${normalized || defaultAccount.email}`;
	};

	const parseStoredOrders = (raw: string | null): Order[] => {
		if (!raw) {
			return [];
		}

		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				return [];
			}

			return parsed
				.map((item) => ({
					id: String(item?.id ?? ''),
					date: String(item?.date ?? ''),
					total: Number(item?.total ?? 0),
					status: String(item?.status ?? ''),
					payment: String(item?.payment ?? '')
				}))
				.filter((order) => order.id && order.date);
		} catch {
			return [];
		}
	};

	const parseStoredAccount = (raw: string | null): Account | null => {
		if (!raw) {
			return null;
		}

		try {
			const parsed = JSON.parse(raw);
			const name = String(parsed?.name ?? '').trim();
			const email = String(parsed?.email ?? '').trim();
			if (!email) {
				return null;
			}

			return {
				name: name || defaultAccount.name,
				email
			};
		} catch {
			return null;
		}
	};

	$: {
		const name = $page.url.searchParams.get('name')?.trim();
		const email = $page.url.searchParams.get('email')?.trim();
		const storedAccount = browser ? parseStoredAccount(localStorage.getItem(ACCOUNT_STORAGE_KEY)) : null;

		account = {
			name: name || storedAccount?.name || defaultAccount.name,
			email: email || storedAccount?.email || defaultAccount.email
		};
	}

	$: if (browser) {
		const savedOrders = parseStoredOrders(localStorage.getItem(ordersStorageKeyForEmail(account.email)));
		orders = savedOrders;
	}
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

			{#if orders.length === 0}
				<p>No orders yet.</p>
			{:else}
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
							<p class="order-meta">Status: {order.status} Payment: {order.payment}</p>
						</article>
					{/each}
				</div>
			{/if}
			<button class="auth-submit" type="button" onclick={() => goto('/account/orders')}>View all orders</button>
        </section>
    </main>

    <SiteFooter />
</div>
