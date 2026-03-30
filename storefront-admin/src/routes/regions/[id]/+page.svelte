<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Globe from '@lucide/svelte/icons/globe';

	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import RegionHeroCard from '$lib/components/organs/region/detail/RegionHeroCard.svelte';
	import RegionCountriesCard from '$lib/components/organs/region/detail/RegionCountriesCard.svelte';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { resolve } from '$app/paths';
	import { setDetailContext, useDetailQuery } from '$lib/hooks';

	const regionId = $derived(page.params?.id ?? '');
	const detailQuery = useDetailQuery(
		async () => {
			const res = await client.regions({ id: regionId }).get();
			return res.data;
		},
		() => ['region-detail', regionId]
	);

	setDetailContext(detailQuery);

	const region = $derived(detailQuery?.data ?? null);
	const loading = $derived(detailQuery?.isPending);
	const error = $derived(
		detailQuery?.error != null
			? detailQuery.error instanceof Error
				? detailQuery.error.message
				: String(detailQuery.error)
			: null
	);

	async function refreshData() {
		await detailQuery.refetch();
	}
</script>

<svelte:head>
	<title>{region?.name ?? 'Loading...'} | Regions</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<a
				href={resolve('/regions', {})}
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
			>
				<Globe class="size-4 shrink-0" />
				<span>Regions</span>
			</a>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
			<span class="font-medium text-foreground">{region?.name ?? '...'}</span>
		</nav>
	</div>

	{#if loading && !region}
		<div class="flex flex-1 items-center justify-center p-6">
			<span class="animate-pulse text-muted-foreground">Loading Region Details...</span>
		</div>
	{:else if error}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">Error: {error}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/regions', {}), { replaceState: true })}
				>Back to Regions</Button
			>
		</div>
	{:else if region}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-6 p-6">
				<RegionHeroCard />

				<RegionCountriesCard regionId={region.id} />

				<div class="grid gap-4 sm:grid-cols-2">
					<JSONComponent product={region} options={[]} variants={[]} category={null} />

					<MetadataComponent
						productId={region.id}
						metadata={region.metadata as Record<string, unknown> | null}
						metadataEntity="region"
						onSaved={refreshData}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
