<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

	interface Props {
		open: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	const product = $derived(getProductDetail()?.data ?? null);

	function closeSheet() {
		open = false;
	}

</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
		<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
			<Sheet.Title>Edit Product</Sheet.Title>
		</Sheet.Header>
		<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
			<div class="flex flex-col gap-2">
				<label for="edit-status" class="text-sm font-medium">Status</label>
				<select
					id="edit-status"
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="draft">Draft</option>
					<option value="proposed">Proposed</option>
					<option value="published">Published</option>
					<option value="rejected">Rejected</option>
				</select>
			</div>
			<div class="flex flex-col gap-2">
				<label for="edit-title" class="text-sm font-medium">Title</label>
				<Input id="edit-title" class="h-9" />
			</div>
			<div class="flex flex-col gap-2">
				<label for="edit-subtitle" class="text-sm font-medium">
					Subtitle <span class="font-normal text-muted-foreground">(Optional)</span>
				</label>
				<Input id="edit-subtitle" class="h-9" />
			</div>
			<div class="flex flex-col gap-2">
				<label for="edit-handle" class="text-sm font-medium">Handle</label>
				<div class="relative flex w-full items-center">
					<span class="absolute start-3 text-sm text-muted-foreground">/</span>
					<Input
						id="edit-handle"
						class="h-9 pl-6"
						placeholder="product-handle"
					/>
				</div>
			</div>
			
			<div class="flex flex-col gap-2">
				<label for="edit-description" class="text-sm font-medium">
					Description <span class="font-normal text-muted-foreground">(Optional)</span>
				</label>
				<textarea
					id="edit-description"
					// bind:value={editDescription}
					rows="3"
					class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<button
						id="edit-discountable"
						type="button"
						role="switch"
						// aria-checked={editDiscountable}
						aria-label="Discountable"
						class={cn(
							'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
							// editDiscountable ? 'bg-primary' : 'bg-input'
						)}
						// onclick={() => (editDiscountable = !editDiscountable)}
					>
						<span
							class={cn(
								'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
								// editDiscountable ? 'translate-x-5' : 'translate-x-px'
							)}
						></span>
					</button>
					<label for="edit-discountable" class="text-sm font-medium">Discountable</label>
				</div>
				<p class="text-xs text-muted-foreground">
					When unchecked, discounts will not be applied to this product.
				</p>
			</div>
			<!-- {#if editError}
				<p class="text-sm text-destructive">{editError}</p>
			{/if} -->
		</div>
		<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={closeSheet} disabled={false}>
				Cancel
			</Button>
			<Button onclick={() => {}} disabled={false}>
				Save
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
