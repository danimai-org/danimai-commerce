<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		orderDialogBody,
		orderDialogFooter,
		orderDialogHeader,
		orderDialogLg,
		orderDialogTitle
	} from '../dialog-classes.js';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';

	let {
		open = $bindable(false),
		tagSearch = $bindable(''),
		filteredTags,
		selectedTagIds,
		onToggleTag,
		onSave,
		onCancel
	}: {
		open?: boolean;
		tagSearch?: string;
		filteredTags: { label: string; i: number }[];
		selectedTagIds: Set<number>;
		onToggleTag: (i: number) => void;
		onSave: () => void;
		onCancel: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class={orderDialogLg}>
		<Dialog.Header class={orderDialogHeader}>
			<Dialog.Title class={orderDialogTitle}>Add tags.</Dialog.Title>
		</Dialog.Header>
		<div class="{orderDialogBody} flex flex-col gap-4">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div class="relative min-w-0 flex-1">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						placeholder="Search to find or create tags."
						bind:value={tagSearch}
						class="h-10 pl-9"
					/>
				</div>
				<button
					type="button"
					class="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-auto"
					aria-label="Frequently used"
				>
					<ArrowUpDown class="size-4 shrink-0" />
					<span class="whitespace-nowrap">Frequently used</span>
				</button>
			</div>
			<div>
				<h4 class="mb-2 text-sm font-medium">Available</h4>
				<div class="max-h-48 space-y-0.5 overflow-y-auto overscroll-contain rounded-md border p-1">
					{#each filteredTags as { label, i } (i)}
						<label
							class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50"
						>
							<input
								type="checkbox"
								checked={selectedTagIds.has(i)}
								onchange={() => onToggleTag(i)}
								class="size-4 rounded border-input"
							/>
							<span class="text-sm">{label}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
		<Dialog.Footer class={orderDialogFooter}>
			<Button variant="outline" onclick={onCancel}>Cancel</Button>
			<Button onclick={onSave}>Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
