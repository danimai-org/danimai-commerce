<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditAttributesSheet from './EditAttributesSheet.svelte';
	import type { ProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

	interface Props {
		attributes?: Array<{ id: string; title: string; value?: string }>;
		product: ProductDetail | null;
		onSaved: () => void | Promise<void>;
	}

	let { attributes = [], product, onSaved }: Props = $props();

	let editAttributesSheetOpen = $state(false);
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Attributes</h2>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={() => (editAttributesSheetOpen = true)}
			aria-label="Edit attributes"
		>
			<Pencil class="size-4" />
		</Button>
	</div>
	<dl class="mt-4 space-y-3 text-sm">
		{#if attributes.length > 0}
			{#each attributes as attr (attr.id)}
				<div>
					<dt class="font-medium text-muted-foreground">{attr.title}</dt>
					<dd class="wrap-break-word text-foreground">{attr.value ?? '—'}</dd>
				</div>
			{/each}
		{:else}
			<div>
				<dt class="font-medium text-muted-foreground">No attributes</dt>
				<dd>—</dd>
			</div>
		{/if}
	</dl>
</div>

<EditAttributesSheet bind:open={editAttributesSheetOpen} {product} onSaved={onSaved} />
