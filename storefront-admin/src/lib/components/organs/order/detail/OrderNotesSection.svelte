<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { CardSection } from '../card-section/index.js';

	let { notes = '' }: { notes?: string | null } = $props();
</script>

<CardSection title="Notes">
	{#snippet headerAction()}
		<button
			type="button"
			class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<Pencil class="size-3.5" />
		</button>
	{/snippet}
	<p class="text-sm text-muted-foreground">{notes || 'No notes from customer'}</p>
</CardSection>
