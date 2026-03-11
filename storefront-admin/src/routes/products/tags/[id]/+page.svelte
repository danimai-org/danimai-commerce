<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { cn } from '$lib/utils.js';
	import type { ProductTag } from '$lib/product-tags/types.js';
	import type { Product } from '$lib/products/types.js';
	import type { PaginationMeta } from '$lib/product-tags/types.js';
	import { TagHeroCard, TagProductsCard } from '$lib/components/organs/index.js';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	

	type TagProduct = Product & { collection?: { id: string; title: string; handle: string } | null };
	type Pagination = PaginationMeta;

	const tagId = $derived($page.params.id);

	let tag = $state<ProductTag | null>(null);
	let productsData = $state<{ data: TagProduct[]; pagination: Pagination } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let productPage = $state(1);
	let productLimit = $state(10);
	let productSearch = $state('');

	async function loadTag() {
		if (!tagId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`http://localhost:8000/admin/product-tags/${tagId}`, {
				cache: 'no-store'
			});
			if (!res.ok) {
				if (res.status === 404) {
					error = 'Tag not found';
					return;
				}
				throw new Error(await res.text());
			}
			tag = (await res.json()) as ProductTag;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			tag = null;
		} finally {
			loading = false;
		}
	}

	async function loadProducts() {
		if (!tagId) return;
		try {
			const params = new URLSearchParams({
				page: String(productPage),
				limit: String(productLimit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(
				`http://localhost:8000/admin/product-tags/${tagId}/products?${params}`,
				{
					cache: 'no-store'
				}
			);
			if (!res.ok) throw new Error(await res.text());
			productsData = (await res.json()) as { data: TagProduct[]; pagination: Pagination };
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
	<!-- Breadcrumb + actions -->
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
					<TagHeroCard tag={tag} onUpdated={loadTag} />
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
					<MetadataComponent productId={tag?.id ?? null} metadata={tag?.metadata as Record<string, unknown> | null} onSaved={loadTag} />
					<JSONComponent product={tag as Record<string, unknown> | null} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
