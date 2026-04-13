<script lang="ts">
	import '$lib/styles/section-inset.css';
	import '$lib/styles/product-grid-retail.css';
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import CartSheet from '$lib/components/cart/CartSheet.svelte';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser
			}
		}
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	{@render children()}
	<CartSheet />
</QueryClientProvider>
