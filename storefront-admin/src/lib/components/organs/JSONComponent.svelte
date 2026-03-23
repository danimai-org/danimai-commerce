<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ProductJsonSheet from '$lib/components/organs/product/detail/ProductJsonSheet.svelte';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';
	import { onMount } from 'svelte';
	interface Props {
		product: Record<string, unknown> | null;
		options: unknown[];
		variants: unknown[];
		category: unknown;
	}

	let { product, options = [], variants = [], category }: Props = $props();

	$effect(() => {
		onMount(() => {
			if (productJsonForView) {
				hljs.highlightAll();
			}
		});
	});

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
	const highlightedJson = $derived.by(() => {
        if (!productJsonForView) return '';
        const jsonString = JSON.stringify(productJsonForView, null, 2);
		return hljs.highlight(jsonString, { language: 'json' }).value;
	});
</script>

<div class="rounded-lg border bg-card p-4 shadow-sm">
	<div class="flex items-center justify-between gap-3">
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<h3 class="shrink-0 font-medium">JSON</h3>
			<span
				class="shrink-0 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
			>
				{jsonKeysCount} keys
			</span>
		</div>
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

<ProductJsonSheet bind:open={jsonSheetOpen} {productJsonForView} {jsonKeysCount} highlightedJson={highlightedJson} />
