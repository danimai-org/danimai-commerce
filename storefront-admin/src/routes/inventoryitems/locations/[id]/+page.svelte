<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import UpdateLocation from '$lib/components/organs/location/update/UpdateLocation.svelte';

	let { data }: { data: PageData } = $props();

	const displayName = $derived(data.location?.name ?? data.location?.id ?? 'Location');
</script>

<svelte:head>
	<title>{displayName} | Locations | Danimai Store</title>
	<meta name="description" content="Edit stock location." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div
			class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-sm text-muted-foreground"
		>
			<a href={resolve('/inventoryitems/locations', {})} class="hover:text-foreground">Locations</a>
			<span>/</span>
			<span class="text-foreground">{displayName}</span>
		</div>

		{#key data.location.id}
			<UpdateLocation
				variant="page"
				stockLocationForm={data.stockLocationForm}
				location={data.location}
			/>
		{/key}
	</div>
</div>
