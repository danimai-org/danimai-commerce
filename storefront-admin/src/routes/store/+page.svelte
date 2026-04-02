<script lang="ts">
	import type { PageData } from './$types';
	import StoreIcon from '@lucide/svelte/icons/store';
	import {
		JSONComponent,
		MetadataComponent,
		StoreListingCard
	} from '$lib/components/organs/index.js';
	import CurrencySheet from '$lib/components/organs/store/CurrencySheet.svelte';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';

	let { data }: { data: PageData } = $props();

	const storesQuery = createQuery(() => ({
		queryKey: ['store'],
		queryFn: () => client.stores.get()
	}));

	const store = $derived(storesQuery.data?.data ?? null);
</script>

<svelte:head>
	<title>Store | Danimai Store</title>
	<meta name="description" content="Manage store details and active currencies." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-start border-b pb-4">
			<div class="flex items-center gap-2">
				<StoreIcon class="size-5 text-foreground" />
				<h1 class="text-lg font-semibold text-foreground">Store</h1>
			</div>
		</div>

		<div class="mb-8">
			<StoreListingCard storeUpdateForm={data.storeUpdateForm} />
		</div>

		<CurrencySheet />

		{#if store}
			<div class="mt-8 grid gap-4 sm:grid-cols-2">
				<MetadataComponent
					productId={store.id}
					metadataEntity="store"
					metadata={(store.metadata ?? {}) as Record<string, unknown>}
					onSaved={() => {
						void storesQuery.refetch();
					}}
				/>
				<JSONComponent
					product={store as Record<string, unknown>}
					options={[]}
					variants={[]}
					category={null}
				/>
			</div>
		{/if}
	</div>
</div>
