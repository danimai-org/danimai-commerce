<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Receipt from '@lucide/svelte/icons/receipt';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import TaxRegionHeroCard from '$lib/components/organs/tax-region/detail/TaxRegionHeroCard.svelte';
	import TaxRegionOverridesCard from '$lib/components/organs/tax-region/detail/TaxRegionOverridesCard.svelte';
	import TaxRegionProviderCard from '$lib/components/organs/tax-region/detail/TaxRegionProviderCard.svelte';
	import TaxRegionRatesCard from '$lib/components/organs/tax-region/detail/TaxRegionRatesCard.svelte';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';

	const taxRegionId = $derived(page.params?.id ?? '');

	let taxRegion = $state<any | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadTaxRegion() {
		if (!taxRegionId) return;
		loading = true;
		error = null;
		try {
			const res = await client['tax-regions'].get({
				query: {
					limit: 200
				}
			});
			if (res.error) {
				error = String((res.error as any)?.value?.message ?? res.error);
				taxRegion = null;
				return;
			}
			const rows = ((res.data as any)?.rows ?? []) as any[];
			const found = rows.find((row) => row.id === taxRegionId) ?? null;
			if (!found) {
				error = 'Tax region not found';
				taxRegion = null;
				return;
			}
			taxRegion = found;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			taxRegion = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		taxRegionId;
		loadTaxRegion();
	});
</script>

<svelte:head>
	<title>{taxRegion?.name ?? taxRegionId ?? 'Tax Region'} | Tax Regions | Danimai Store</title>
	<meta name="description" content="View tax region details." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/tax-regions')}
			>
				<Receipt class="size-4 shrink-0" />
				<span>Tax Regions</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{taxRegion?.name ?? taxRegionId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !taxRegion}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Tax region not found'}</p>
			<Button variant="outline" onclick={() => goto('/tax-regions')}>Back to Tax Regions</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-6 p-6">
				<TaxRegionHeroCard region={taxRegion} onUpdated={loadTaxRegion} />
				<TaxRegionRatesCard regionId={taxRegion.id} rates={taxRegion.tax_rates ?? []} />
				<TaxRegionOverridesCard regionId={taxRegion.id} />
				<TaxRegionProviderCard providerId={taxRegion.tax_provider_id} />
				<JSONComponent product={taxRegion} options={[]} variants={[]} category={null} />
			</div>
		</div>
	{/if}
</div>
