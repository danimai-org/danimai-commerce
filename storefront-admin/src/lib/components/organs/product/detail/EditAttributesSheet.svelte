<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		open: boolean;
	}

	let { open = $bindable(false),  }: Props = $props();

</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
		<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
			<Sheet.Title>Edit Attributes</Sheet.Title>
		</Sheet.Header>
		<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
			<div class="space-y-3">
				<!-- {#each editAttributesList as row, i (row.attribute_id + i)}
					<div class="flex items-center gap-2 rounded-md border p-2">
						<div class="min-w-0 flex-1">
							<span class="text-sm font-medium text-muted-foreground">{row.title}</span>
							<Input bind:value={row.value} class="mt-1 h-9" placeholder="Value" />
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="size-8 shrink-0"
							aria-label="Remove attribute"
							onclick={() => removeAttributeFromEdit(i)}
						>
							<Trash2 class="size-4" />
						</Button>
					</div>
				{/each} -->
			</div>
			<!-- {#if attributesAvailableToAdd.length > 0}
				<div class="flex flex-col gap-2 rounded-md border border-dashed p-3">
					<span class="text-sm font-medium">Add attribute</span>
					<div class="flex flex-wrap items-end gap-2">
						<select
							bind:value={addAttributeId}
							class="flex h-9 min-w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Select…</option>
							{#each attributesAvailableToAdd as att (att.id)}
								<option value={att.id}>{att.title}</option>
							{/each}
						</select>
						<Input
							bind:value={addAttributeValue}
							class="h-9 min-w-24 flex-1"
							placeholder="Value"
						/>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onclick={addAttributeToEdit}
							disabled={!addAttributeId}
						>
							Add
						</Button>
					</div>
				</div>
			{/if}
			{#if editAttributesError}
				<p class="text-sm text-destructive">{editAttributesError}</p>
			{/if} -->
		</div>
		<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
			<Button
				variant="outline"
				onclick={() => open = false}
			>
				Cancel
			</Button>
			<Button onclick={() => open = false}>
				Save
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
