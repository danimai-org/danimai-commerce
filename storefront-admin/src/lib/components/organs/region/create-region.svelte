<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		open: boolean;
		createName: string;
		createCurrencyCode: string;
		createError: string | null;
		createSubmitting: boolean;
		closeCreate: () => void;
		submitCreate: () => void;
	}

	let {
		open = $bindable(false),
		createName = $bindable(''),
		createCurrencyCode = $bindable(''),
		createError = null,
		createSubmitting = false,
		closeCreate,
		submitCreate
	}: Props = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Manage tax rates and providers for a set of countries.
				</p>
				{#if createError && !createSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-name" class="text-sm font-medium">Name</label>
						<Input
							id="create-name"
							bind:value={createName}
							placeholder="e.g. South Asia"
							class={cn('h-9', createError === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-currency" class="text-sm font-medium">Currency</label>
						<Input
							id="create-currency"
							bind:value={createCurrencyCode}
							placeholder="e.g. INR"
							class={cn('h-9', createError === 'Currency code is required' && 'border-destructive')}
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				<Button onclick={submitCreate} disabled={createSubmitting}>
					{createSubmitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>