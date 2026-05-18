<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import X from '@lucide/svelte/icons/x';

	export type OptionEditDraft = {
		id: string;
		title: string;
		variationsInput: string;
	};

	type VariantPreview = {
		id: string;
		title: string;
	};

	type Props = {
		open: boolean;
		optionDrafts: OptionEditDraft[];
		variants?: VariantPreview[];
		submitting?: boolean;
		error?: string | null;
		onOptionTitleChange: (optionId: string, value: string) => void;
		onVariationsInputChange: (optionId: string, value: string) => void;
		onRemoveVariation: (optionId: string, value: string) => void;
		onCancel: () => void;
		onSave: () => void;
	};

	let {
		open = $bindable(false),
		optionDrafts = [],
		variants = [],
		submitting = false,
		error = null,
		onOptionTitleChange,
		onVariationsInputChange,
		onRemoveVariation,
		onCancel,
		onSave
	}: Props = $props();

	function variationChips(input: string): string[] {
		return input
			.split(',')
			.map((v) => v.trim())
			.filter(Boolean);
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex w-full flex-col sm:max-w-3xl">
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title>Edit Options & Variants</Sheet.Title>
		</Sheet.Header>

		<div class="flex min-h-0 flex-1 flex-col overflow-auto p-6">
			<div class="flex flex-col gap-8">
				{#if optionDrafts.length === 0}
					<p class="text-sm text-muted-foreground">No options defined.</p>
				{:else}
					<div class="flex flex-col gap-6">
						{#each optionDrafts as draft (draft.id)}
							{@const chips = variationChips(draft.variationsInput)}
							<div class="flex flex-col gap-4 rounded-lg border p-4">
								<p class="text-sm font-semibold">Option</p>
								<div class="flex flex-col gap-2">
									<label for="edit-option-title-{draft.id}" class="text-sm font-medium">
										Option title
									</label>
									<Input
										id="edit-option-title-{draft.id}"
										class="h-10"
										value={draft.title}
										oninput={(e) =>
											onOptionTitleChange(
												draft.id,
												(e.currentTarget as HTMLInputElement).value
											)}
									/>
								</div>

								<div class="flex flex-col gap-2">
									<label for="edit-option-variations-{draft.id}" class="text-sm font-medium">
										Variations (comma-separated)
									</label>
									<div
										class="rounded-md border px-2 py-2 focus-within:ring-2 focus-within:ring-ring"
									>
										<div class="mb-2 flex flex-wrap gap-1.5">
											{#each chips as chip, chipIndex (`${draft.id}-${chipIndex}`)}
												<span
													class="inline-flex items-center gap-1 rounded-md border bg-muted/60 px-2 py-0.5 text-sm"
												>
													{chip}
													<button
														type="button"
														class="text-muted-foreground hover:text-foreground"
														onclick={() => onRemoveVariation(draft.id, chip)}
														aria-label={`Remove ${chip}`}
													>
														<X class="size-3" />
													</button>
												</span>
											{/each}
										</div>
										<Input
											id="edit-option-variations-{draft.id}"
											class="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
											value={draft.variationsInput}
											oninput={(e) =>
												onVariationsInputChange(
													draft.id,
													(e.currentTarget as HTMLInputElement).value
												)}
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<div class="flex flex-col gap-3">
					<p class="text-sm font-semibold">Variants ({variants.length})</p>
					{#if variants.length === 0}
						<p class="text-sm text-muted-foreground">No variants yet.</p>
					{:else}
						<ul class="divide-y rounded-lg border">
							{#each variants as variant (variant.id)}
								<li class="px-4 py-3 text-sm">{variant.title || 'Untitled variant'}</li>
							{/each}
						</ul>
					{/if}
					<p class="text-xs text-muted-foreground">
						Saving options regenerates variant combinations from the option values above.
					</p>
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
