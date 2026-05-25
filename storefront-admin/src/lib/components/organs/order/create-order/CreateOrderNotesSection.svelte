<script lang="ts">
	import { CardSection } from '$lib/components/organs/order/card-section/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';

	let {
		notes,
		onEdit
	}: {
		notes: string;
		onEdit: () => void;
	} = $props();
</script>

<CardSection title="Notes">
	{#snippet headerAction()}
		<button
			type="button"
			onclick={onEdit}
			class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<Pencil class="size-3.5" />
		</button>
	{/snippet}
	<p class="text-sm text-muted-foreground">{notes || 'No notes'}</p>
</CardSection>
