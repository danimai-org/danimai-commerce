<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';
	import { onMount } from 'svelte';
	import { rowsFromPaginated } from '$lib/api/storefront-api';
	import { client } from '$lib/api/client.js';

	type ProductGridItem = {
		name: string;
		price: {
			amount: number;
			currency_code: string;
		};
		href: string;
		bg: string;
		image?: string | null;
		currency_code?: string | null;
	};

	const FALLBACK_BGS = ['#e8e0d5', '#4a4a4a', '#f5f0eb', '#6b7c5c'];

	function pickBg(index: number): string {
		return FALLBACK_BGS[index % FALLBACK_BGS.length];
	}

	async function fetchVariantPrice(
		variantId: string
	): Promise<{ amount: number; currency_code: string } | null> {
		try {
			const res = await client['product-variants']({ id: variantId }).get();
			if (res.error) return null;
			const data = res.data as unknown;
			const prices =
				(data as { prices?: Array<{ amount: string; currency_code: string }> }).prices ?? [];
			if (prices.length === 0) return null;
			const p = prices[0];
			const amount = parseInt(p.amount, 10) / 100;
			return { amount, currency_code: p.currency_code };
		} catch {
			return null;
		}
	}

	let products = $state<ProductGridItem[]>([]);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const res = await client.products.get({
				query: { limit: '100', page: '1' }
			});
			if (res.error) {
				error = 'Products failed';
				return;
			}
			const data = res.data as unknown;
			const { rows: list } = rowsFromPaginated<{
				id: string;
				title: string;
				handle: string;
				thumbnail?: string | null;
				variants?: Array<{ id: string }>;
			}>(data);
			const variantMap = await client['product-variants'].get({
				query: {
					limit: '100',
					page: '1',
					filters: { product_id: list.map((p) => p.id) }
				}
			});
			if (variantMap.error) throw new Error('Failed to load variants');
			const variantMapData = variantMap.data as unknown;
			const variantIds =
				(variantMapData as { rows?: Array<{ id: string }> }).rows?.map((v: { id: string }) => v.id) ?? [];
			const pricePromises = variantIds.map((id: string) => fetchVariantPrice(id as string));
			const prices = await Promise.all(pricePromises);

			let priceIndex = 0;
			for (let i = 0; i < list.length; i++) {
				const p = list[i];
				const price = prices[priceIndex];
				priceIndex++;
				products.push({
					name: p.title,
					price: {
						amount: price?.amount ?? 0,
						currency_code: price?.currency_code ?? 'USD'
					},
					href: `/products/${p.handle}`,
					bg: pickBg(i),
					image: p.thumbnail || null
				});
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load products';
		}
	});

</script>

<SiteHeader />

<main class="store-main">
	<section class="store-hero">
		<h1 class="store-hero-title">Shop All</h1>
	</section>
	{#if error}
		<p class="store-error">{error}</p>
	{/if}
	<ProductGridSection
		products={products}
	/>
</main>

<SiteFooter />

<style>
	.store-main {
		min-height: 40vh;
	}
	.store-hero {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		background: linear-gradient(180deg, #e8e0d5 0%, #d4c8bc 100%);
		padding: 3rem 1.5rem;
	}
	.store-hero-title {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		color: #fff;
		text-align: center;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	.store-error {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #c00;
		text-align: center;
	}
</style>
