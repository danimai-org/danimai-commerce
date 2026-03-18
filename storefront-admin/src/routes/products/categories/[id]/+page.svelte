<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import { client } from '$lib/client.js';
	import {
		CategoryHeroCard,
		CategoryStatusCard
	} from '$lib/components/organs/category/detail/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { ProductListingCard } from '$lib/components/organs/index.js';
	const categoryId = $derived($page.params.id);
	let selectedIds = $state<Set<string>>(new Set());

	let category = $state<any | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	async function loadCategory() {
		if (!categoryId) return;
		loading = true;
		error = null;
		try {
			const res = await client['product-categories']({ id: categoryId }).get();
			if (res.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					error = 'Category not found';
					return;
				}
				error = err?.value?.message ?? String(res.error);
				category = null;
				return;
			}
			category = (res.data ?? null) as any | null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			category = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		categoryId;
		loadCategory();
	});
</script>

<svelte:head>
	<title>{category ? category.value : 'Category'} | Categories | Danimai Store</title>
	<meta name="description" content="Manage product categories." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/categories')}
			>
				<FolderTree class="size-4 shrink-0" />
				<span>Categories</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{category?.value ?? categoryId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !category}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Category not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/categories')}>
				Back to Categories
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<div class="flex gap-6">
					<CategoryHeroCard category={category as any | null} onUpdated={loadCategory} />
					<CategoryStatusCard category={category as any | null} onUpdated={loadCategory} />
				</div>

				<ProductListingCard
					title="Category Products"
					filter={{ category_id: categoryId }}
					bind:selectedIds
				/>
				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={category?.id ?? null}
						metadata={category?.metadata as Record<string, unknown> | null}
						onSaved={loadCategory}
					/>
					<JSONComponent product={category} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
