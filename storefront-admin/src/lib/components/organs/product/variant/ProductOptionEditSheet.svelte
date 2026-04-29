<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import X from '@lucide/svelte/icons/x';

	type Props = {
		open: boolean;
		optionTitle: string;
		variationsInput: string;
		submitting?: boolean;
		error?: string | null;
		onOptionTitleChange: (value: string) => void;
		onVariationsInputChange: (value: string) => void;
		onRemoveVariation: (value: string) => void;
		onCancel: () => void;
		onSave: () => void;
	};

	let {
		open = $bindable(false),
		optionTitle = '',
		variationsInput = '',
		submitting = false,
		error = null,
		onOptionTitleChange,
		onVariationsInputChange,
		onRemoveVariation,
		onCancel,
		onSave
	}: Props = $props();

	const variationChips = $derived.by(() =>
		variationsInput
			.split(',')
			.map((v) => v.trim())
			.filter(Boolean)
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex w-full flex-col sm:max-w-3xl">
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title>Edit Option</Sheet.Title>
		</Sheet.Header>

		<div class="flex min-h-0 flex-1 flex-col overflow-auto p-6">
			<div class="flex flex-col gap-5">
				<div class="flex flex-col gap-2">
					<label for="edit-option-title" class="text-sm font-medium">Option title</label>
					<Input
						id="edit-option-title"
						class="h-10"
						value={optionTitle}
						oninput={(e) => onOptionTitleChange((e.currentTarget as HTMLInputElement).value)}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<label for="edit-option-variations" class="text-sm font-medium">
						Variations (comma-separated)
					</label>
					<div class="rounded-md border px-2 py-2 focus-within:ring-2 focus-within:ring-ring">
						<div class="mb-2 flex flex-wrap gap-1.5">
							{#each variationChips as chip (chip)}
								<span
									class="inline-flex items-center gap-1 rounded-md border bg-muted/60 px-2 py-0.5 text-sm"
								>
									{chip}
									<button
										type="button"
										class="text-muted-foreground hover:text-foreground"
										onclick={() => onRemoveVariation(chip)}
										aria-label={`Remove ${chip}`}
									>
										<X class="size-3" />
									</button>
								</span>
							{/each}
						</div>
						<Input
							id="edit-option-variations"
							class="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
							value={variationsInput}
							oninput={(e) =>
								onVariationsInputChange((e.currentTarget as HTMLInputElement).value)}
						/>
					</div>
				</div>

				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
			</div>
		</div>

		<Sheet.Footer class="border-t p-4">
			<div class="flex w-full justify-end gap-2">
				<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>
				<Button onclick={onSave} disabled={submitting}>
					{submitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
