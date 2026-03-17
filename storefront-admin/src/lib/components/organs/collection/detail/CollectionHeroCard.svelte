<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditCollectionHero from '$lib/components/organs/collection/update/EditCollectionHero.svelte';

	interface Props {
		collection: any | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { collection, onUpdated = () => {} }: Props = $props();

	let editOpen = $state(false);

	function getHandle(c: any | null): string {
		if (!c) return '';
		return c.handle.startsWith('/') ? c.handle : `/${c.handle}`;
	}

	function openEdit() {
		if (!collection) return;
		editOpen = true;
	}
</script>

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">{collection?.title ?? 'Collection'}</h1>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={openEdit}
				aria-label="Edit collection"
				disabled={!collection}
			>
				<Pencil class="size-4" />
			</Button>
		</div>
		<div class="flex items-center gap-3">
			<label
				for="collection-handle"
				class="shrink-0 text-sm font-medium text-muted-foreground">Handle</label
			>
			<input
				id="collection-handle"
				type="text"
				value={getHandle(collection)}
				readonly
				class="h-9 max-w-xs rounded-md border border-input bg-background px-3 font-mono text-sm"
			/>
		</div>
	</section>

</div>

<EditCollectionHero
	collection={editOpen ? collection : null}
	onSaved={onUpdated}
	onClosed={() => {
		editOpen = false;
	}}
/>

