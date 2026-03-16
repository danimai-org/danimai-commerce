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

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">
				# {tag?.value ?? 'Tag'}
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
	</section>
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

