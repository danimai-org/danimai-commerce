<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		open: boolean;
		editName: string;
		editCurrencyCode: string;
		editError: string | null;
		editSubmitting: boolean;
		closeEdit: () => void;
		submitEdit: () => void;
	}

	let {
		open = $bindable(false),
		editName = $bindable(''),
		editCurrencyCode = $bindable(''),
		editError = null,
		editSubmitting = false,
		closeEdit,
		submitEdit
	}: Props = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the region details.
				</p>
				{#if editError && !editSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-name"
							bind:value={editName}
							placeholder="e.g. South Asia"
							class={cn('h-9', editError === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-currency" class="text-sm font-medium">Currency</label>
						<Input
							id="edit-currency"
							bind:value={editCurrencyCode}
							placeholder="e.g. INR"
							class={cn('h-9', editError === 'Currency code is required' && 'border-destructive')}
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>