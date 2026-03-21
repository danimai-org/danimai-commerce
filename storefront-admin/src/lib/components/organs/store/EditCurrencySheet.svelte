<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { client } from '$lib/client.js';
	import type { Currency } from '$lib/currencies/types.js';

	let {
		open = $bindable(false),
		currency = null as Currency | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		currency?: Currency | null;
		onSuccess?: () => void;
	} = $props();

	let taxInclusivePricing = $state(false);
	let editError = $state<string | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (open && currency) {
			taxInclusivePricing = currency.tax_inclusive_pricing;
			editError = null;
		}
	});

	function closeSheet() {
		if (!submitting) open = false;
	}

	async function submitEdit() {
		if (!currency) return;
		editError = null;
		submitting = true;
		try {
			const res = await client.currencies({ id: currency.id }).put({
				tax_inclusive_pricing: taxInclusivePricing
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to update currency'));
			}
			open = false;
			onSuccess();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit currency</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update tax inclusive pricing for {currency?.code ?? ''}.
				</p>
				{#if editError && !submitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id={`currency-tax-inclusive-${currency?.id ?? 'edit'}`}
							bind:checked={taxInclusivePricing}
							class="h-4 w-4 rounded border-input"
						/>
						<label
							for={`currency-tax-inclusive-${currency?.id ?? 'edit'}`}
							class="text-sm font-medium"
							>Tax inclusive pricing</label
						>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet}>Cancel</Button>
				<Button onclick={submitEdit} disabled={submitting || !currency}>
					{submitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
