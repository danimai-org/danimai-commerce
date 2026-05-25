<script lang="ts">
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import type { ComboboxOption } from '$lib/components/organs/combobox/combobox.svelte';
	import { CardSection } from '$lib/components/organs/order/card-section/index.js';
	import Globe from '@lucide/svelte/icons/globe';
	import Link2 from '@lucide/svelte/icons/link-2';
	import type { RegionRow } from './types.js';

	let {
		selectedRegionData,
		selectedCurrency = $bindable(''),
		currencyComboboxOptions,
		currencyComboboxLoading,
		onCurrencyChange,
		onCurrencySearchChange,
		onCurrencyOpen,
		filterFn
	}: {
		selectedRegionData: RegionRow | undefined;
		selectedCurrency?: string;
		currencyComboboxOptions: ComboboxOption[];
		currencyComboboxLoading: boolean;
		onCurrencyChange: (v: string) => void;
		onCurrencySearchChange: (v: string) => void;
		onCurrencyOpen: () => void;
		filterFn: (opts: ComboboxOption[]) => ComboboxOption[];
	} = $props();
</script>

<CardSection title="Markets">
	{#snippet headerAction()}
		<button
			type="button"
			class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<Link2 class="size-3.5" />
		</button>
	{/snippet}
	<div class="flex flex-col gap-3">
		{#if selectedRegionData}
			<div
				class="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs"
			>
				<Globe class="size-3.5" />
				<span>{selectedRegionData.name}</span>
			</div>
		{/if}
		<div class="flex flex-col gap-2">
			<span class="text-xs text-muted-foreground">Currency</span>
			<Combobox
				id="create-order-currency"
				options={currencyComboboxOptions}
				value={selectedCurrency}
				onValueChange={onCurrencyChange}
				placeholder="Select currency"
				loading={currencyComboboxLoading}
				emptyMessage="No currencies found."
				{filterFn}
				listboxClass="max-h-72"
				onSearchChange={onCurrencySearchChange}
				onOpen={onCurrencyOpen}
			/>
		</div>
	</div>
</CardSection>
