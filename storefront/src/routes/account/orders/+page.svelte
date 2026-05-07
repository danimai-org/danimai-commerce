<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { formatStoreMoney } from "$lib/money";
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    type OrderSummary = {
        id: string;
        orderId: string;
        date: string;
        total: number;
        status: string;
        payment: string;
    };

    type OrderDetail = {
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

    const ACCOUNT_STORAGE_KEY = "dm_sf_account";
    const ORDERS_STORAGE_KEY_PREFIX = "dm_sf_orders_";
    const ORDER_CACHE_KEY_PREFIX = "dm_sf_order_";
    let orders: OrderSummary[] = [];
    let selectedOrderId = "";
    let selectedOrder: OrderDetail | null = null;

    const parseStoredOrders = (raw: string | null): OrderSummary[] => {
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
                    id: String(item?.id ?? ""),
                    orderId: String(item?.orderId ?? ""),
                    date: String(item?.date ?? ""),
                    total: Number(item?.total ?? 0),
                    status: String(item?.status ?? ""),
                    payment: String(item?.payment ?? ""),
                }))
                .filter((order) => order.id && order.date);
        } catch {
            return [];
        }
    };

    const currentAccountEmail = (): string => {
        if (!browser) {
            return "guest@denimai.com";
        }
        try {
            const parsed = JSON.parse(
                localStorage.getItem(ACCOUNT_STORAGE_KEY) ?? "{}",
            ) as { email?: unknown };
            const email = String(parsed?.email ?? "")
                .trim()
                .toLowerCase();
            return email || "guest@denimai.com";
        } catch {
            return "guest@denimai.com";
        }
    };

    const ordersStorageKeyForEmail = (email: string): string => {
        const normalized = email.trim().toLowerCase();
        return `${ORDERS_STORAGE_KEY_PREFIX}${normalized || "guest@denimai.com"}`;
    };

    const formatDate = (value: string): string => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString();
    };

    const placeholderDetailsFromSummary = (summary: OrderSummary): OrderDetail => ({
        id: summary.orderId || summary.id,
        number: summary.id,
        date: new Date(summary.date),
        status: summary.status || "pending",
        email: "—",
        items: [],
        shippingAddress: [],
        shippingMethod: "—",
        billingAddress: [],
        paymentMethod: summary.payment || "—",
        totals: {
            subtotal: formatStoreMoney(summary.total),
            shipping: formatStoreMoney(0),
            discount: formatStoreMoney(0),
            tax: formatStoreMoney(0),
            total: formatStoreMoney(summary.total),
        },
    });

    const loadOrderDetails = (summary: OrderSummary): OrderDetail => {
        const cacheId = summary.orderId;
        if (!cacheId || !browser) {
            return placeholderDetailsFromSummary(summary);
        }
        try {
            const raw = sessionStorage.getItem(`${ORDER_CACHE_KEY_PREFIX}${cacheId}`);
            if (!raw) {
                return placeholderDetailsFromSummary(summary);
            }
            const parsed = JSON.parse(raw) as Omit<OrderDetail, "date"> & {
                date: string;
            };
            return {
                ...parsed,
                date: new Date(parsed.date),
            };
        } catch {
            return placeholderDetailsFromSummary(summary);
        }
    };

    const selectOrder = (orderId: string) => {
        selectedOrderId = orderId;
        const summary = orders.find((entry) => entry.id === orderId);
        selectedOrder = summary ? loadOrderDetails(summary) : null;
    };

    onMount(() => {
        if (!browser) return;
        const ordersKey = ordersStorageKeyForEmail(currentAccountEmail());
        orders = parseStoredOrders(localStorage.getItem(ordersKey));
        if (orders.length > 0) {
            selectOrder(orders[0].id);
        }
    });

    $: if (orders.length > 0 && !orders.some((order) => order.id === selectedOrderId)) {
        selectOrder(orders[0].id);
    }
</script>

<svelte:head>
    <title>My Orders - Denimai</title>
</svelte:head>

<div class="page-account">
    <SiteHeader />

    <main class="account-main">
        <h1 class="account-title">My Orders</h1>
        <p><a href="/account">Back to Account</a></p>

        <section class="account-section">
            {#if orders.length === 0}
                <p>No orders yet.</p>
            {:else}
                <div class="orders-list">
                    {#each orders as order}
                        <article class="order-card">
                            <div class="order-header">
                                <div>
                                    <h3>Order #{order.id}</h3>
                                    <p>{formatDate(order.date)}</p>
                                </div>
                                <strong>{formatStoreMoney(order.total)}</strong>
                            </div>
                            <p class="order-meta">
                                Status: {order.status} Payment: {order.payment}
                            </p>
                            <button
                                class="auth-submit"
                                type="button"
                                onclick={() => selectOrder(order.id)}
                                disabled={selectedOrderId === order.id}
                            >
                                {selectedOrderId === order.id ? "Viewing details" : "View details"}
                            </button>
                        </article>
                    {/each}
                </div>

                {#if selectedOrder}
                    <section class="order-section">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                        <p><strong>Order Date:</strong> {selectedOrder.date.toLocaleDateString()}</p>
                        <p><strong>Order Status:</strong> {selectedOrder.status}</p>
                        <p><strong>Order Email:</strong> {selectedOrder.email}</p>
                    </section>

                    <section class="order-section">
                        <h3>Items</h3>
                        {#if selectedOrder.items.length === 0}
                            <p>Item details are not available for this order yet.</p>
                        {:else}
                            <div class="items-list">
                                {#each selectedOrder.items as item}
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
                        <div class="info-cols">
                            <div>
                                <h3>Delivery Information</h3>
                                <h4>Shipping Address</h4>
                                {#if selectedOrder.shippingAddress.length === 0}
                                    <p>—</p>
                                {:else}
                                    {#each selectedOrder.shippingAddress as line}
                                        <p>{line}</p>
                                    {/each}
                                {/if}
                            </div>
                            <div>
                                <h3>Shipping Method</h3>
                                <h4>Method</h4>
                                <p>{selectedOrder.shippingMethod}</p>
                            </div>
                        </div>
                    </section>

                    <section class="order-section info-grid">
                        <div class="info-cols">
                            <div>
                                <h3>Billing Information</h3>
                                <h4>Billing Address</h4>
                                {#if selectedOrder.billingAddress.length === 0}
                                    <p>—</p>
                                {:else}
                                    {#each selectedOrder.billingAddress as line}
                                        <p>{line}</p>
                                    {/each}
                                {/if}
                            </div>
                            <div>
                                <h3>Payment Method</h3>
                                <h4>Method</h4>
                                <p>{selectedOrder.paymentMethod}</p>
                            </div>
                        </div>
                    </section>

                    <section class="order-section summary-block">
                        <h3>Summary</h3>
                        <div class="summary-rows">
                            <p><span>Subtotal</span><strong>{selectedOrder.totals.subtotal}</strong></p>
                            <p><span>Shipping</span><strong>{selectedOrder.totals.shipping}</strong></p>
                            <p><span>Discount</span><strong>{selectedOrder.totals.discount}</strong></p>
                            <p><span>Tax</span><strong>{selectedOrder.totals.tax}</strong></p>
                            <p class="summary-total">
                                <span>Total</span><strong>{selectedOrder.totals.total}</strong>
                            </p>
                        </div>
                    </section>
                {/if}
            {/if}
        </section>
    </main>

    <SiteFooter />
</div>
