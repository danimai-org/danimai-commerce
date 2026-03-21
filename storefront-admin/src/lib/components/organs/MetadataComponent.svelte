<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditMetadataSheet from './EditMetadataSheet.svelte';

	type MetadataEntity =
		| 'product'
		| 'product-tag'
		| 'product-category'
		| 'collection'
		| 'product-attribute'
		| 'product-attribute-group'
		| 'region'
		| 'sales-channel';

	interface Props {
		productId: string | null | undefined;
		metadata: Record<string, unknown> | null | undefined;
		metadataEntity?: MetadataEntity;
		onSaved: () => void | Promise<void>;
	}

	let { productId, metadata, metadataEntity = 'product', onSaved }: Props = $props();

	let metadataSheetOpen = $state(false);
</script>

<div class="rounded-lg border bg-card p-4 shadow-sm">
	<div class="flex items-center justify-between gap-2">
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<h3 class="font-medium">Metadata</h3>
			<span class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
				{Object.keys(metadata ?? {}).length} keys
			</span>
		</div>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			disabled={!productId}
			onclick={() => (metadataSheetOpen = true)}
			aria-label="Edit metadata"
		>
			<Pencil class="size-4" />
			<span class="sr-only">Edit metadata</span>
		</Button>
	</div>
</div>

<EditMetadataSheet
	bind:open={metadataSheetOpen}
	{productId}
	{metadata}
	{metadataEntity}
	onSaved={onSaved}
/>
