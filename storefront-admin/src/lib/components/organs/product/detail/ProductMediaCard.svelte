<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import EditProductMediaSheet from './EditProductMediaSheet.svelte';
	import ProductMediaImage from './ProductMediaImage.svelte';
	import { getDetailContext } from '$lib/hooks';
	import type { Product } from '../type';
	let { productId }: { productId: string } = $props();
	const detailQuery = getDetailContext<Product>();
	const product = $derived(detailQuery?.data ?? null);
	const thumbnail = $derived(
		(product as { thumbnail?: string | null } | null)?.thumbnail?.trim() || ''
	);
	const mediaItems = $derived.by(() => {
		const current = (
			product as { media?: Array<{ id?: string; url?: string; rank?: number }> } | null
		)?.media;
		const items = Array.isArray(current)
			? current
					.map((item, index) => {
						const url = typeof item?.url === 'string' ? item.url.trim() : '';
						if (!url) return null;
						return {
							id: item?.id ?? `${index}`,
							url,
							rank: typeof item?.rank === 'number' && Number.isFinite(item.rank) ? item.rank : index
						};
					})
					.filter((item): item is { id: string; url: string; rank: number } => item !== null)
					.sort((a, b) => a.rank - b.rank)
			: [];
		if (!thumbnail) return items;
		const hasThumbnail = items.some((item) => item.url === thumbnail);
		if (hasThumbnail) return items;
		// Ensure the card always shows the primary thumbnail, even if it isn't part of `product.media`.
		return [{ id: 'thumbnail', url: thumbnail, rank: -1 }, ...items].sort(
			(a, b) => a.rank - b.rank
		);
	});

	let mediaSheetOpen = $state(false);

	async function refetch() {
		await detailQuery?.refetch?.();
	}

	function openMediaSheet() {
		if (!productId) return;
		mediaSheetOpen = true;
	}
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Media</h2>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={openMediaSheet}
			aria-label="Edit media"
		>
			<Pencil class="size-4" />
		</Button>
	</div>
	{#if mediaItems.length > 0}
		<button
			type="button"
			class="mt-4 block w-full rounded-md border-0 bg-transparent p-0 text-left transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			aria-label="Edit media"
		>
			<div class="mt-4 flex flex-wrap gap-4">
				{#each mediaItems as mediaItem (mediaItem.id)}
					<ProductMediaImage
						src={mediaItem.url}
						alt=""
						class="size-36 rounded-xl border bg-muted object-cover"
					/>
				{/each}
			</div>
		</button>
	{:else}
		<button
			type="button"
			class="mt-4 flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			aria-label="Add or edit media"
		>
			<Upload class="size-8" />
			<p>No media yet</p>
			<p class="text-xs">Add media to the product to showcase it in your storefront.</p>
		</button>
	{/if}
</div>

{#if productId}
	<EditProductMediaSheet bind:open={mediaSheetOpen} {productId} {thumbnail} onSaved={refetch} />
{/if}
