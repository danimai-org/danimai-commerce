<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import EditTag from '$lib/components/organs/tag/update/EditTag.svelte';
	import Pencil from '@lucide/svelte/icons/pencil';

	type ProductTag = {
		id: string;
		value: string;
	};

	interface Props {
		tag: ProductTag | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { tag, onUpdated = () => {} }: Props = $props();
	let editingTag = $state<ProductTag | null>(null);

	function openEditTagSheet() {
		if (!tag) return;
		editingTag = tag;
	}
</script>

<div class="shrink-0 rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex min-w-0 items-center gap-3">
		<h1
			class="flex min-w-0 flex-1 flex-wrap items-baseline gap-1.5 text-3xl font-semibold tracking-tight"
		>
			<span class="shrink-0 text-muted-foreground">#</span>
			<span class="min-w-0 break-words text-foreground">{tag?.value ?? 'Tag'}</span>
		</h1>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={openEditTagSheet}
			aria-label="Edit tag"
			disabled={!tag}
		>
			<Pencil class="size-4" />
		</Button>
	</div>
</div>
<EditTag
	tag={editingTag}
	onSaved={async () => {
		editingTag = null;
		await onUpdated();
	}}
	onClosed={() => {
		editingTag = null;
	}}
/>
