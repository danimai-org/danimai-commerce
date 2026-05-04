<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { page } from "$app/stores";
    import { onMount } from "svelte";

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
    const orderId = $derived($page.url.searchParams.get("order") ?? "");
    const ORDER_CACHE_KEY_PREFIX = "dm_sf_order_";
    let order = $state<Order | null>(null);
    let isLoading = $state(false);
    let errorMessage = $state("");

    function createPlaceholderOrder(id: string): Order {
        return {
            id,
            number: "Pending",
            date: new Date(),
            status: "pending",
            email: "—",
            items: [],
            shippingAddress: [],
            shippingMethod: "—",
            billingAddress: [],
            paymentMethod: "—",
            totals: {
                subtotal: "—",
                shipping: "—",
                discount: "—",
                tax: "—",
                total: "—",
            },
        };
    }

    onMount(() => {
        if (!orderId) {
            order = null;
            errorMessage = "Missing order id in URL.";
            return;
        }
        try {
            const raw = sessionStorage.getItem(
                `${ORDER_CACHE_KEY_PREFIX}${orderId}`,
            );
            if (!raw) {
                errorMessage = "";
                order = createPlaceholderOrder(orderId);
                return;
            }
            const parsed = JSON.parse(raw) as Omit<Order, "date"> & {
                date: string;
            };
            order = {
                ...parsed,
                date: new Date(parsed.date),
            };
            errorMessage = "";
        } catch {
            errorMessage = "";
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
                <p class="order-number">
                    {errorMessage || "Unable to display this order right now."}
                </p>
            </section>
        {:else}
            <section class="order-overview">
                <h1>Thank you for your order</h1>
                <p class="order-number">Order #{order.number}</p>

                <div class="order-details">
                    <h2>Order Details</h2>
                    <p><span>Order ID:</span> {order.id}</p>
                    <p>
                        <span>Order Date:</span>
                        {order.date.toLocaleDateString()}
                    </p>
                    <p><span>Order Status:</span> {order.status}</p>
                    <p><span>Order Email:</span> {order.email}</p>
                </div>
            </section>

            <section class="order-section">
                <h3>Items</h3>
                {#if order.items.length === 0}
                    <p class="empty-state">
                        Item details are not available for this order yet.
                    </p>
                {:else}
                    <div class="items-list">
                        {#each order.items as item}
                            <article class="item-row">
                                <div class="item-main">
                                    <img
                                        src={item.image}
                                        alt={item.imageAlt}
                                        loading="lazy"
                                    />
                                    <div class="item-copy">
                                        <p class="item-title">{item.title}</p>
                                        <p class="item-variant">
                                            {item.variant}
                                        </p>
                                        <p class="item-qty">
                                            Quantity: {item.quantity}
                                        </p>
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
                    <p>
                        <span>Subtotal</span><strong
                            >{order.totals.subtotal}</strong
                        >
                    </p>
                    <p>
                        <span>Shipping</span><strong
                            >{order.totals.shipping}</strong
                        >
                    </p>
                    <p>
                        <span>Discount</span><strong
                            >{order.totals.discount}</strong
                        >
                    </p>
                    <p><span>Tax</span><strong>{order.totals.tax}</strong></p>
                    <p class="summary-total">
                        <span>Total</span><strong>{order.totals.total}</strong>
                    </p>
                </div>
            </section>
        {/if}
    </div>
</main>

<SiteFooter />
