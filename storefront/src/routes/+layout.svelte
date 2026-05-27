<script lang="ts">
    import "./layout.css";
    import "$lib/styles/section-inset.css";
    import "$lib/styles/product-grid-retail.css";
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import favicon from "$lib/assets/favicon.svg";
    import CartSheet from "$lib/components/cart/CartSheet.svelte";
    import { initCartState } from "$lib/cart/cart-state.svelte";
    import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";

    const queryClient = new QueryClient({
        defaultOptions: { queries: { enabled: browser } },
    });
    let { children } = $props();

    onMount(() => {
        if (!browser) return;

        void initCartState();
    });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<QueryClientProvider client={queryClient}
    >{@render children()}<CartSheet /></QueryClientProvider
>
