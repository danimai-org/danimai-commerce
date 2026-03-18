<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	let {
		open = $bindable(false),
		sku,
		error,
		productId = $bindable(''),
		title = $bindable(''),
		productsList,
		submitting,
		onSubmit
	}: {
		open?: boolean;
		sku: string | null | undefined;
		error: string | null;
		productId?: string;
		title?: string;
		productsList: { id: string; title: string }[];
		submitting: boolean;
		onSubmit: () => void;
	} = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Create associated variant</Sheet.Title>
				<Sheet.Description class="text-sm text-muted-foreground">
					Create a new product variant linked to this inventory item (SKU: {sku ?? '–'}).
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
						<label for="add-variant-product" class="text-sm font-medium">Product</label>
						<select
							id="add-variant-product"
							bind:value={productId}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Select product…</option>
							{#each productsList as prod (prod.id)}
								<option value={prod.id}>{prod.title}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-2">
						<label for="add-variant-title" class="text-sm font-medium">Variant title</label>
						<Input
							id="add-variant-title"
							bind:value={title}
							placeholder="e.g. Small / Red"
							class="h-9"
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (open = false)} disabled={submitting}>
					Cancel
				</Button>
				<Button
					onclick={onSubmit}
					disabled={submitting || !productId || !title.trim()}
				>
					{submitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
