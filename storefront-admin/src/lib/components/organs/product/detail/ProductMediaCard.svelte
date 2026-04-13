<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import EditProductMediaSheet from './EditProductMediaSheet.svelte';
	import { getDetailContext } from '$lib/hooks';
	import type { Product } from '../type';

	let { productId }: { productId: string } = $props();

	const detailQuery = getDetailContext<Product>();
	const product = $derived(detailQuery?.data ?? null);

	const thumbnail = $derived(
		(product as { thumbnail?: string | null } | null)?.thumbnail?.trim() || ''
	);

	let mediaSheetOpen = $state(false);

	function refetch() {
		void detailQuery?.refetch?.();
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
	{#if thumbnail}
		<button
			type="button"
			class="mt-4 block cursor-pointer rounded-md border-0 bg-transparent p-0 text-left transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			onclick={openMediaSheet}
			aria-label="Edit media"
		>
			<img src={thumbnail} alt="" class="size-24 rounded-md border object-cover" />
		</button>
	{:else}
		<button
			type="button"
			class="mt-4 flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			onclick={openMediaSheet}
			aria-label="Add or edit media"
		>
			<Upload class="size-8" />
			<p>No media yet</p>
			<p class="text-xs">Add media to the product to showcase it in your storefront.</p>
		</button>
	{/if}
</div>

{#if productId}
	<EditProductMediaSheet
		bind:open={mediaSheetOpen}
		{productId}
		thumbnail={thumbnail}
		onSaved={refetch}
	/>
{/if}
