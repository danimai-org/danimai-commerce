<script lang="ts">
	import StoreIcon from '@lucide/svelte/icons/store';
	import { StoreListingCard } from '$lib/components/organs/index.js';
	import CurrencySheet from '$lib/components/organs/store/CurrencySheet.svelte';
</script>

<svelte:head>
	<title>Store | Danimai Store</title>
	<meta name="description" content="Manage store details and active currencies." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2">
				<StoreIcon class="size-5 text-foreground" />
				<span class="text-lg font-semibold text-foreground">Store</span>
			</div>
		</div>

		<div class="mb-8">
			<StoreListingCard />
		</div>

		<CurrencySheet />
	</div>
</div>
