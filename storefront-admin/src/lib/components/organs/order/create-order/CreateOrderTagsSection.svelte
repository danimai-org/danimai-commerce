<script lang="ts">
	import { CardSection } from '$lib/components/organs/order/card-section/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import X from '@lucide/svelte/icons/x';

	let {
		selectedTagsList,
		onOpenAddTags,
		onRemoveTag
	}: {
		selectedTagsList: string[];
		onOpenAddTags: () => void;
		onRemoveTag: (label: string) => void;
	} = $props();
</script>

<CardSection title="Tags">
	{#snippet headerAction()}
		<button
			type="button"
			class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			onclick={onOpenAddTags}
			aria-label="Add tags"
		>
			<Pencil class="size-3.5" />
		</button>
	{/snippet}
	<button
		type="button"
		class="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-left text-sm text-muted-foreground ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
		onclick={onOpenAddTags}
	>
		<span>Add tags</span>
	</button>
	{#if selectedTagsList.length > 0}
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each selectedTagsList as label (label)}
				<span
					class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm text-muted-foreground"
				>
					{label}
					<button
						type="button"
						class="flex size-4 items-center justify-center rounded-sm hover:bg-muted hover:text-foreground"
						onclick={(e) => {
							e.stopPropagation();
							onRemoveTag(label);
						}}
						aria-label="Remove {label}"
					>
						<X class="size-3" />
					</button>
				</span>
			{/each}
		</div>
	{/if}
</CardSection>
