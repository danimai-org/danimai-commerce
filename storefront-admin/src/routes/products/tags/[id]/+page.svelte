<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { cn } from '$lib/utils.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { TagHeroCard, TagProductsCard } from '$lib/components/organs/index.js';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import { client } from '$lib/client';
	

	type TagProduct = any & { collection?: { id: string; title: string; handle: string } | null };

	const tagId = $derived($page.params.id);

	let tag = $state< Record<string, unknown> | null | undefined>(null);
	let productsData = $state<{ data: Record<string, unknown>[]; pagination: PaginationMeta } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let productPage = $state(1);
	let productLimit = $state(10);
	

	async function loadTag() {
		if (!tagId) return;
		loading = true;
		error = null;
		try {
		const result = await (client as any)['product-tags']({ id: tagId }).get();
		const payload = (result as any)?.data ?? result;
		tag = payload?.product_tag ?? payload ?? null;
		} catch (e) {
			const err = e as any;
			if (err?.status === 404) {
				error = 'Tag not found';
			} else {
				error = err instanceof Error ? err.message : String(err);
			}
			tag = null;
		} finally {
			loading = false;
		}
	}

	async function loadProducts() {
		if (!tagId) return;
		try {
			const result = (await (client as any)['product-tags-products']({ id: tagId }).get({
				query: {
					page: productPage,
					limit: productLimit,
					sorting_field: 'created_at',
					sorting_direction: 'desc'
				}
			})) as { products: any[]; pagination: PaginationMeta } | { data: any[]; pagination: PaginationMeta };

			productsData =
				'products' in result
					? { data: result.products, pagination: result.pagination }
					: { data: result.data, pagination: result.pagination };
		} catch (e) {
			productsData = null;
		}
	}

	$effect(() => {
		tagId;
		loadTag();
	});

	$effect(() => {
		if (tagId) {
			productPage;
			productLimit;
			loadProducts();
		} else {
			productsData = null;
		}
	});

	const products = $derived(productsData?.data ?? []);
	const pagination = $derived(productsData?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
</script>

<svelte:head>
	<title>{tag ? `# ${tag.value} | Tag` : 'Tag'} | Danimai Store</title>
	<meta name="description" content="Manage product tags." />
</svelte:head>

<div class="flex h-full flex-col">
	
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] text-sm pl-[10px]">
			<button
				type="button"
				class="flex items-center gap-1 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/tags')}
			>
				<ChevronLeft class="size-4" />
				Products
			</button>
			<span class="text-muted-foreground">/</span>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/tags')}
			>
				Tags
			</button>
			<span class="text-muted-foreground">/</span>
			<span class="font-medium">{tag?.value ?? tagId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !tag}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Tag not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/tags')}>Back to Tags</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<div class="flex gap-6">
					<TagHeroCard tag={tag as any} onUpdated={loadTag} />
				</div>

				<TagProductsCard
					tagId={tagId ?? null}
					products={products}
					{pagination}
					{start}
					{end}
					onPageChange={(pageNum) => (productPage = Math.max(1, pageNum))}
					onProductsUpdated={loadProducts}
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent productId={(tag?.id as string | undefined) ?? null} metadata={tag?.metadata as Record<string, unknown> | null} onSaved={() => void loadTag()} />
					<JSONComponent product={tag as any} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
