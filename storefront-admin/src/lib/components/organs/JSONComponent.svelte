<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ProductJsonSheet from '$lib/components/organs/product/detail/ProductJsonSheet.svelte';

	interface Props {
		product: Record<string, unknown> | null;
		options: unknown[];
		variants: unknown[];
		category: unknown;
	}

	let { product, options = [], variants = [], category }: Props = $props();

	let jsonSheetOpen = $state(false);

	const productJsonForView = $derived(
		product
			? {
					...product,
					options,
					variants,
					category
				}
			: null
	);
	const jsonKeysCount = $derived(productJsonForView ? Object.keys(productJsonForView).length : 0);
</script>

<div class="rounded-lg border bg-card p-4 shadow-sm">
	<div class="flex items-center justify-between gap-2">
		<h3 class="font-medium">JSON</h3>
		<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
			{jsonKeysCount} keys
		</span>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={() => (jsonSheetOpen = true)}
		>
			<ExternalLink class="size-4" />
			<span class="sr-only">Open</span>
		</Button>
	</div>
</div>

<ProductJsonSheet
	bind:open={jsonSheetOpen}
	productJsonForView={productJsonForView}
	{jsonKeysCount}
/>
