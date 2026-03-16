<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditAttributeHero from '../update/EditAttributeHero.svelte';

	interface Props {
		attribute: any | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { attribute, onUpdated = () => {} }: Props = $props();
	let editAttribute = $state<{ id: string; title: string; type: string } | null>(null);

	function openEditSheet() {
		if (!attribute) return;
		editAttribute = {
			id: attribute.id,
				title: attribute.title ?? '',
			type: attribute.type ?? ''
		} as any as { id: string; title: string; type: string };
	}
</script>

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<ListFilter class="size-5 text-muted-foreground" />
				<h1 class="text-2xl font-semibold tracking-tight">{attribute?.title ?? 'Attribute'}</h1>
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={openEditSheet}
				aria-label="Edit attribute"
				disabled={!attribute}
			>
				<Pencil class="size-4" />
			</Button>
		</div>
	</section>
	<div class="rounded-lg bg-card">
		<dl class="grid gap-3 text-sm sm:grid-cols-2">
			<div>
				<dt class="font-medium text-muted-foreground">Type</dt>
				<dd class="mt-1 font-medium">{attribute?.type ?? '—'}</dd>
			</div>
		</dl>
	</div>
</div>
<EditAttributeHero
	attribute={editAttribute}
	onSaved={onUpdated}
	onClosed={() => {
		editAttribute = null;
	}}
/>
