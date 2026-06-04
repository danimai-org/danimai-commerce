<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { get } from "svelte/store";
    import { superForm } from "sveltekit-superforms/client";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import {
        CheckoutOrderSummary,
        CheckoutAddressStep,
        CheckoutDeliveryStep,
        CheckoutPaymentStep,
    } from "$lib/components/checkout";
    import {
        checkoutFormSchema,
        type CheckoutFormData,
    } from "$lib/checkout/checkout-form-schema";
    import type { PageProps } from "./$types";
    import { client } from "$lib/api/client.js";
    import {
        cartState,
        initCartState,
        ensureCartId,
    } from "$lib/cart/cart-state.svelte";
    import {
        fetchVariantDisplayMap,
        variantDisplayLabel,
        type VariantDisplayRow,
    } from "$lib/cart/variant-display-map";
    import { formatStoreMoney } from "$lib/money";
    import { useCart } from "$lib/hooks/use-cart.hook";
    import { cacheOrderDetail } from "$lib/account/order-data";
    import { CustomerAuthError, hasCustomerAuthSession } from "$lib/account/storage";
    import {
        createOrderPayment,
        findPaymentProvider,
        isApiPaymentMethod,
        paymentMethodLabel,
        resolvePaymentAuthHeaders,
        savePendingStripePayment,
        type PaymentProviderOption,
    } from "$lib/checkout/payment-api";
    import {
        checkoutCountryLabel,
        type CheckoutCountryOption,
    } from "$lib/checkout/countries-api";
    import type { Cart, CartLineItem } from "$lib/types/cart";

    type LineItemPut = Pick<
        CartLineItem,
        | "title"
        | "description"
        | "thumbnail"
        | "variant_id"
        | "product_id"
        | "quantity"
        | "unit_price"
    >;

    let { data }: PageProps = $props();

    const paymentProviders = $derived(
        (data.paymentProviders ?? []) as PaymentProviderOption[],
    );
    const countries = $derived(
        (data.countries ?? []) as CheckoutCountryOption[],
    );

    type CheckoutStep = "addresses" | "delivery" | "payment" | "review";
    const CART_STORAGE_KEY = "dm_sf_cart_id";
    const SESSION_STORAGE_KEY = "dm_sf_session_id";
    const ACCOUNT_STORAGE_KEY = "dm_sf_account";
    const ORDERS_STORAGE_KEY_PREFIX = "dm_sf_orders_";
    const DEFAULT_CART_CURRENCY_CODE = "eur";

    type CheckoutCartItem = {
        key: string;
        name: string;
        variant: string;
        image: string | null;
        quantity: number;
        priceValue: number;
        priceDisplay: string;
    };

    let variantDisplayById = $state(new Map<string, VariantDisplayRow>());

    $effect(() => {
        const lineItems = cartState.cart?.line_items;
        if (!lineItems?.length) {
            variantDisplayById = new Map();
            return;
        }
        let cancelled = false;
        void (async () => {
            const next = await fetchVariantDisplayMap(lineItems);
            if (!cancelled) variantDisplayById = next;
        })();
        return () => {
            cancelled = true;
        };
    });

    const cartItems = $derived.by((): CheckoutCartItem[] => {
        const lineItems = cartState.cart?.line_items ?? [];
        const vmap = variantDisplayById;
        return lineItems.map((item) => {
            const amount = Number.parseFloat(String(item.unit_price ?? "0"));
            const priceValue = Number.isFinite(amount) ? amount : 0;
            const vd = item.variant_id ? vmap.get(item.variant_id) : undefined;
            const desc =
                typeof item.description === "string"
                    ? item.description.trim()
                    : "";
            const variantLabel =
                desc || variantDisplayLabel(vd) || (item.variant_id ? "" : "—");
            return {
                key:
                    item.id ??
                    `${item.variant_id ?? "variant"}-${item.title ?? "item"}`,
                name: item.title ?? "Item",
                variant: variantLabel,
                image: item.thumbnail ?? vd?.thumbnail ?? null,
                quantity: item.quantity ?? 0,
                priceValue,
                priceDisplay: formatStoreMoney(priceValue),
            };
        });
    });

    const subtotal = $derived(
        cartItems.reduce((sum, i) => sum + i.priceValue * i.quantity, 0),
    );
    const subtotalDisplay = $derived(formatStoreMoney(subtotal));
    const discountDisplay = $derived(formatStoreMoney(0));
    const totalDisplay = $derived(formatStoreMoney(subtotal));

    const steps = [
        { id: "addresses" as const, label: "Addresses" },
        { id: "delivery" as const, label: "Delivery" },
        { id: "payment" as const, label: "Payment" },
        { id: "review" as const, label: "Review" },
    ];

    let currentStep = $state<CheckoutStep>("addresses");
    let placeOrderError = $state("");
    let paymentStepError = $state("");
    let isPlacingOrder = $state(false);
    let isLoggedIn = $state(false);

    $effect(() => {
        if (
            cartItems.length === 0 &&
            typeof window !== "undefined" &&
            !isPlacingOrder &&
            currentStep !== "review"
        ) {
            goto("/cart");
        }
    });

    $effect(() => {
        if (!browser) return;
        isLoggedIn = hasCustomerAuthSession();
        const step = page.url.searchParams.get("step");
        if (step === "payment") currentStep = "payment";
    });

    const { updateCartAddresses } = useCart();

    const { form, errors, constraints, enhance } = superForm<CheckoutFormData>(
        data.checkoutForm,
        {
            SPA: true,
            resetForm: false,
            id: "checkout",
            validators: zod4Client(checkoutFormSchema),
            applyAction: false,
            invalidateAll: false,
            onUpdated: async ({ form: validated }) => {
                if (!validated.valid || !validated.posted) return;

                if (currentStep === "addresses") {
                    if (typeof window === "undefined") {
                        currentStep = "delivery";
                        return;
                    }

                    // Persist checkout addresses to the backend cart so later steps (delivery/payment/review)
                    // and order creation have the correct address data.
                    try {
                        const cartId = await ensureCartId();
                        const f = get(form);
                        const shippingAddress = {
                            address_1: f.address1 || null,
                            address_2: f.address2 || null,
                            company: f.company || null,
                            city: f.city,
                            province: f.state,
                            postal_code: f.postalCode,
                            country_code: f.country || null,
                            phone: f.phone || null,
                            metadata: {
                                first_name: f.firstName,
                                last_name: f.lastName,
                                email: f.email,
                            },
                        };
                        await updateCartAddresses.mutateAsync({
                            id: cartId,
                            addresses: [shippingAddress],
                        });
                    } catch (e) {
                        console.error("Failed to save checkout addresses:", e);
                    }

                    currentStep = "delivery";
                    return;
                }

                if (currentStep === "delivery") {
                    paymentStepError = "";
                    currentStep = "payment";
                    return;
                }
                if (currentStep === "payment") {
                    const f = get(form);
                    if (
                        isApiPaymentMethod(f.paymentMethod, paymentProviders) &&
                        !hasCustomerAuthSession()
                    ) {
                        paymentStepError =
                            "Please log in to use this payment method.";
                        return;
                    }
                    paymentStepError = "";
                    currentStep = "review";
                }
            },
        },
    );

    function shippingMethodLabelFrom(
        method: string,
    ): "Standard Worldwide Shipping" | string {
        return method === "standard-worldwide"
            ? "Standard Worldwide Shipping"
            : method;
    }
    function paymentMethodLabelFrom(method: string): string {
        return paymentMethodLabel(method, paymentProviders);
    }

    function ordersStorageKeyForEmail(email: string): string {
        const normalized = email.trim().toLowerCase();
        return `${ORDERS_STORAGE_KEY_PREFIX}${normalized || "guest@denimai.com"}`;
    }

    function currentAccountEmail(): string {
        try {
            const parsed = JSON.parse(
                localStorage.getItem(ACCOUNT_STORAGE_KEY) ?? "{}",
            ) as { email?: unknown };
            const email = String(parsed?.email ?? "")
                .trim()
                .toLowerCase();
            return email;
        } catch {
            return "";
        }
    }

    function goBack() {
        if (currentStep === "delivery") currentStep = "addresses";
        else if (currentStep === "payment") currentStep = "delivery";
        else if (currentStep === "review") currentStep = "payment";
    }

    function orderAddressLines(): string[] {
        const f = get(form);
        const name = `${f.firstName} ${f.lastName}`.trim() || "—";
        return [
            name,
            f.address1 || f.address2 || "—",
            [f.city, f.state, f.postalCode].filter(Boolean).join(", ") || "—",
            checkoutCountryLabel(f.country, countries) || "—",
        ];
    }

    function orderTotals() {
        const zero = formatStoreMoney(0);
        return {
            subtotal: subtotalDisplay,
            shipping: zero,
            discount: zero,
            tax: zero,
            total: totalDisplay,
        };
    }

    function treatyErrorMessage(err: unknown): string {
        const o = err as { value?: { message?: string } };
        return o?.value?.message ?? String(err);
    }

    async function fetchCartJson(cartId: string): Promise<Cart> {
        const res = await client.storefront.carts({ id: cartId }).get();
        if (res.error) throw new Error(treatyErrorMessage(res.error));
        if (!res.data) throw new Error("Cart not found");
        return res.data;
    }

    async function putLineItems(cartId: string, line_items: LineItemPut[]) {
        const res = await client.storefront
            .carts({ id: cartId })
            ["line-items"].put({ line_items });
        if (res.error) throw new Error(treatyErrorMessage(res.error));
    }

    async function createCartWithCurrency(sessionId: string): Promise<string> {
        const res = await client.storefront.carts.post({
            session_id: sessionId,
            currency_code: DEFAULT_CART_CURRENCY_CODE,
        });
        if (res.error) throw new Error(treatyErrorMessage(res.error));
        return (res.data as { id: string }).id;
    }

    function lineItemsFromApiCart(apiCart: Cart): LineItemPut[] {
        return (apiCart.line_items ?? []).map((item) => ({
            title: item.title ?? null,
            description: item.description ?? null,
            thumbnail: item.thumbnail ?? null,
            variant_id: item.variant_id ?? null,
            product_id: item.product_id ?? null,
            quantity: item.quantity ?? 0,
            unit_price: item.unit_price ?? null,
        }));
    }

    async function ensureCartHasLineItems(cartId: string) {
        const apiCart = await fetchCartJson(cartId);
        if ((apiCart.line_items?.length ?? 0) > 0) return;
        const raw = cartState.cart?.line_items ?? [];
        if (raw.length === 0) return;

        const line_items: LineItemPut[] = raw
            .filter((item) => (item.quantity ?? 0) > 0)
            .map((item) => ({
                title: item.title ?? null,
                description: item.description ?? null,
                thumbnail: item.thumbnail ?? null,
                variant_id: item.variant_id ?? null,
                product_id: item.product_id ?? null,
                quantity: item.quantity ?? 0,
                unit_price: item.unit_price ?? null,
            }));

        if (line_items.length === 0) return;
        await putLineItems(cartId, line_items);
    }

    async function ensureCheckoutCartReady(cartId: string): Promise<string> {
        const apiCart = await fetchCartJson(cartId);
        if (apiCart.currency_code) {
            await ensureCartHasLineItems(cartId);
            return cartId;
        }

        const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionId) {
            throw new Error(
                "Cart currency is missing. Please return to cart and try again.",
            );
        }

        const replacementCartId = await createCartWithCurrency(sessionId);
        const apiLineItems = lineItemsFromApiCart(apiCart).filter(
            (item) => (item.quantity ?? 0) > 0,
        );
        if (apiLineItems.length > 0) {
            await putLineItems(replacementCartId, apiLineItems);
        } else {
            await ensureCartHasLineItems(replacementCartId);
        }
        localStorage.setItem(CART_STORAGE_KEY, replacementCartId);
        const replacementCart = await fetchCartJson(replacementCartId);
        cartState.cart = replacementCart;
        return replacementCartId;
    }

    async function placeOrder() {
        if (isPlacingOrder) return;
        placeOrderError = "";

        const cartId = localStorage.getItem(CART_STORAGE_KEY);
        if (!cartId) {
            placeOrderError =
                "Cart not found. Please return to cart and try again.";
            return;
        }

        isPlacingOrder = true;
        try {
            const f = get(form);
            const shipLabel = shippingMethodLabelFrom(f.shippingMethod);
            const payLabel = paymentMethodLabelFrom(f.paymentMethod);
            const selectedProvider = findPaymentProvider(
                f.paymentMethod,
                paymentProviders,
            );
            const useStripeCheckout =
                selectedProvider?.name === "stripe" &&
                isApiPaymentMethod(f.paymentMethod, paymentProviders);

            if (useStripeCheckout && !hasCustomerAuthSession()) {
                throw new CustomerAuthError(
                    "Please log in to pay with this method.",
                );
            }

            const readyCartId = await ensureCheckoutCartReady(cartId);
            const orderMetadata: Record<string, string> = {
                shipping_method: shipLabel,
                payment_method: payLabel,
                checkout_email: f.email,
            };
            if (selectedProvider) {
                orderMetadata.provider_id = selectedProvider.id;
            }
            const res = await client.storefront.orders["from-cart"].post({
                cart_id: readyCartId,
                metadata: orderMetadata,
            });
            if (res.error) throw new Error(treatyErrorMessage(res.error));
            const created = res.data as {
                id: string;
                display_id?: number;
                status?: string;
                email?: string | null;
            };
            const orderId = created.id;
            const number =
                typeof created.display_id === "number"
                    ? String(created.display_id)
                    : "Pending";
            cacheOrderDetail({
                id: orderId,
                number,
                date: new Date(),
                status: created.status ?? "pending",
                email: (created.email ?? f.email ?? "—") as string,
                items: cartItems.map((item) => ({
                    image: item.image ?? "",
                    imageAlt: item.name,
                    title: item.name,
                    variant: item.variant,
                    quantity: item.quantity,
                    price: item.priceDisplay,
                })),
                shippingAddress: orderAddressLines(),
                shippingMethod: shipLabel,
                billingAddress: orderAddressLines(),
                paymentMethod: payLabel,
                totals: orderTotals(),
            });
            let existingOrders: Array<{
                id?: string;
                date?: string;
                total?: string | number;
                status?: string;
                payment?: string;
            }> = [];
            const ordersStorageKey = ordersStorageKeyForEmail(
                currentAccountEmail() || String(created.email ?? f.email ?? ""),
            );
            try {
                existingOrders = JSON.parse(
                    localStorage.getItem(ordersStorageKey) ?? "[]",
                ) as Array<{
                    id?: string;
                    date?: string;
                    total?: string | number;
                    status?: string;
                    payment?: string;
                }>;
            } catch {
                existingOrders = [];
            }
            const nextOrders = [
                {
                    id: number,
                    orderId,
                    date: new Date().toISOString().slice(0, 10),
                    total: subtotal,
                    status: created.status ?? "pending",
                    payment: payLabel,
                },
                ...existingOrders.filter((entry) => entry.id !== number),
            ];
            localStorage.setItem(ordersStorageKey, JSON.stringify(nextOrders));

            if (useStripeCheckout && selectedProvider) {
                const headers = await resolvePaymentAuthHeaders();
                const payment = await createOrderPayment(
                    orderId,
                    selectedProvider.id,
                    headers,
                );
                savePendingStripePayment(orderId, payment.id);
                await goto(
                    `/checkout/pay?order=${orderId}&payment=${payment.id}`,
                );
                return;
            }

            localStorage.removeItem(CART_STORAGE_KEY);
            cartState.cart = null;
            cartState.initialized = false;
            cartState.loading = false;
            cartState.error = null;
            cartState.sheetOpen = false;
            await initCartState(true);

            if (
                isApiPaymentMethod(f.paymentMethod, paymentProviders) &&
                selectedProvider?.name !== "stripe"
            ) {
                throw new Error(
                    "Online payment is not available for this provider.",
                );
            }

            await goto(`/order/confirmation?order=${orderId}`);
        } catch (error) {
            placeOrderError =
                error instanceof CustomerAuthError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Failed to place order.";
        } finally {
            isPlacingOrder = false;
        }
    }

    function sectionTitle(step: CheckoutStep): string {
        switch (step) {
            case "addresses":
                return "Addresses";
            case "delivery":
                return "Delivery";
            case "payment":
                return "Payment";
            case "review":
                return "Review";
        }
    }
    function sectionSubtitle(step: CheckoutStep): string | null {
        switch (step) {
            case "addresses":
                return "Enter your shipping and billing addresses.";
            case "delivery":
                return "Select a shipping method.";
            case "payment":
                return null;
            case "review":
                return "Confirm your order details.";
        }
    }
</script>

<SiteHeader />

<main class="checkout-page">
    <nav class="checkout-steps" aria-label="Checkout progress">
        {#each steps as step}
            <span class="step {step.id === currentStep ? 'step-current' : ''}"
                >{step.label}</span
            >
            {#if step !== steps[steps.length - 1]}
                <span class="step-sep" aria-hidden="true">|</span>
            {/if}
        {/each}
    </nav>

    <div class="checkout-container">
        <div class="checkout-columns-scroll">
            <div class="checkout-main">
                <header class="checkout-section-header">
                    <h1 class="checkout-title">{sectionTitle(currentStep)}</h1>
                    {#if sectionSubtitle(currentStep)}
                        <p class="checkout-subtitle">
                            {sectionSubtitle(currentStep)}
                        </p>
                    {/if}
                </header>

                {#if currentStep !== "review"}
                    <form class="checkout-flow-form" method="POST" use:enhance>
                        {#if currentStep === "addresses"}
                            <CheckoutAddressStep
                                {form}
                                {errors}
                                {constraints}
                                {countries}
                            />
                        {:else if currentStep === "delivery"}
                            <CheckoutDeliveryStep {form} onBack={goBack} />
                        {:else if currentStep === "payment"}
                            <CheckoutPaymentStep
                                {form}
                                providers={paymentProviders}
                                {isLoggedIn}
                                {paymentStepError}
                                onBack={goBack}
                            />
                        {/if}
                    </form>
                {:else}
                    <div class="review-step">
                        <section class="review-block">
                            <h2 class="review-block-title">Shipping Address</h2>
                            <p class="review-line">
                                {`${$form.firstName} ${$form.lastName}`.trim() ||
                                    "—"}
                            </p>
                            <p class="review-line">
                                {$form.address1 || "—"}
                            </p>
                            {#if $form.address2}
                                <p class="review-line">{$form.address2}</p>
                            {/if}
                            <p class="review-line">
                                {[$form.city, $form.state, $form.postalCode]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                            </p>
                            <p class="review-line">
                                {checkoutCountryLabel($form.country, countries) ||
                                    "—"}
                            </p>
                        </section>
                        <section class="review-block">
                            <h2 class="review-block-title">Shipping Method</h2>
                            <p class="review-method">
                                {shippingMethodLabelFrom($form.shippingMethod)}
                                <strong>{formatStoreMoney(0)}</strong>
                            </p>
                        </section>
                        <section class="review-block">
                            <h2 class="review-block-title">Billing Address</h2>
                            <p class="review-line">
                                {`${$form.firstName} ${$form.lastName}`.trim() ||
                                    "—"}
                            </p>
                            <p class="review-line">
                                {$form.address1 || "—"}
                            </p>
                            {#if $form.address2}
                                <p class="review-line">{$form.address2}</p>
                            {/if}
                            <p class="review-line">
                                {[$form.city, $form.state, $form.postalCode]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                            </p>
                            <p class="review-line">
                                {checkoutCountryLabel($form.country, countries) ||
                                    "—"}
                            </p>
                        </section>
                        <section class="review-block">
                            <h2 class="review-block-title">Payment Method</h2>
                            <p class="review-method">
                                {paymentMethodLabelFrom($form.paymentMethod)}
                            </p>
                        </section>
                        <p class="review-note">
                            When you place your order, your payment will be
                            authorized and we'll start processing your order.
                        </p>
                        <div class="review-actions">
                            <button
                                type="button"
                                class="back-btn"
                                onclick={goBack}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                class="place-order-btn"
                                onclick={placeOrder}
                                disabled={isPlacingOrder}
                            >
                                {isPlacingOrder
                                    ? "Placing order..."
                                    : "Place order"}
                            </button>
                        </div>
                        {#if placeOrderError}
                            <p class="place-order-error">{placeOrderError}</p>
                        {/if}
                    </div>
                {/if}
            </div>

            <CheckoutOrderSummary
                items={cartItems}
                {subtotalDisplay}
                {discountDisplay}
                {totalDisplay}
            />
        </div>
    </div>
</main>

<SiteFooter />
