<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	let {
		open = $bindable(false),
		error,
		sku = $bindable(''),
		requiresShipping = $bindable(true),
		saving,
		onSave
	}: {
		open?: boolean;
		error: string | null;
		sku?: string;
		requiresShipping?: boolean;
		saving: boolean;
		onSave: () => void;
	} = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Edit details</Sheet.Title>
				<Sheet.Description class="text-sm text-muted-foreground">
					Update SKU and shipping settings for this inventory item.
				</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if error}
					<div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{error}
					</div>
				{/if}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-details-sku" class="text-sm font-medium">SKU</label>
						<Input
							id="edit-details-sku"
							bind:value={sku}
							placeholder="e.g. SKU-001"
							class="h-9"
						/>
						<p class="text-xs text-muted-foreground">Optional. Leave blank for non-shippable items.</p>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="edit-details-requires-shipping"
							bind:checked={requiresShipping}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="edit-details-requires-shipping" class="text-sm font-medium">Requires shipping</label>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (open = false)} disabled={saving}>
					Cancel
				</Button>
				<Button onclick={onSave} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
