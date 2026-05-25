<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
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
	<Dialog.Content
		class="top-1/2 left-1/2 flex h-auto max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border p-0 shadow-lg"
	>
		<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
			<Dialog.Title class="text-base font-semibold">Add tags.</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-1 flex-col overflow-hidden px-6 py-4">
			<div class="flex items-center gap-2">
				<div class="relative flex-1">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						placeholder="Search to find or create tags."
						bind:value={tagSearch}
						class="h-10 rounded-md border-primary pl-9"
					/>
				</div>
				<button
					type="button"
					class="flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Frequently used"
				>
					<ArrowUpDown class="size-4 shrink-0" />
					<span class="text-sm whitespace-nowrap">Frequently used</span>
				</button>
			</div>
			<div class="mt-4">
				<h4 class="mb-2 text-sm font-medium">Available</h4>
				<div class="max-h-64 space-y-2 overflow-auto rounded-md border p-2">
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
		<Dialog.Footer class="flex flex-row justify-end gap-2 border-t px-6 py-4">
			<Button variant="outline" onclick={onCancel}>Cancel</Button>
			<Button onclick={onSave}>Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
