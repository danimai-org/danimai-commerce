<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import CartSheet from '$lib/components/cart/CartSheet.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
<CartSheet />
