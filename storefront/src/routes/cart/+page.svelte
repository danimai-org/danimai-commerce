<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { getCartPagePath, initCartState } from "$lib/cart/cart-state.svelte";

    $effect(() => {
        if (!browser) return;
        void (async () => {
            const cart = await initCartState();
            goto(getCartPagePath(cart?.id), { replaceState: true });
        })();
    });
</script>
