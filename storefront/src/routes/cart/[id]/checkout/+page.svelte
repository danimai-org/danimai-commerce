<script lang="ts">
    import { page } from "$app/state";
    import CheckoutPage from "$lib/components/checkout/CheckoutPage.svelte";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();
    const routeCartId = $derived(page.params.id ?? "");
</script>

<CheckoutPage {data} routeCartId={routeCartId} />
