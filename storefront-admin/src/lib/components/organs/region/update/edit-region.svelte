<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import type { ComboboxOption } from '$lib/components/organs/combobox/combobox.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { Toaster, toast } from 'svelte-sonner';

	const listQuery = { page: 1, limit: 100 } as const;
	const DEBOUNCE_MS = 400;

	let {
		open = $bindable(false),
		region = null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		region?: Record<string, unknown> | null;
		onSuccess?: () => void;
	} = $props();

	let currencySearch = $state('');
	let debouncedCurrencySearch = $state('');
	let currencyOpenAwaitFetch = $state(false);
	let currencyOpenSeq = 0;
	let currencyOpenRafId = 0;

	function debouncedLane(
		live: () => string,
		debounced: () => string,
		setDebounced: (v: string) => void
	) {
		const q = live();
		if (debounced() === q) return;
		const t = setTimeout(() => setDebounced(q), DEBOUNCE_MS);
		return () => clearTimeout(t);
	}

	$effect(() =>
		debouncedLane(() => currencySearch, () => debouncedCurrencySearch, (v) => (debouncedCurrencySearch = v))
	);

	const currencyStale = $derived(currencySearch.trim() !== debouncedCurrencySearch.trim());
	const currencyDebouncedTrim = $derived(debouncedCurrencySearch.trim());

	const currenciesQuery = createQuery(() => ({
		queryKey: ['update-region', 'currencies', 'v2', open, currencyDebouncedTrim, listQuery.page, listQuery.limit],
		queryFn: ({ signal }) =>
			client['currencies'].get({
				query: {
					page: listQuery.page,
					limit: listQuery.limit,
					...(currencyDebouncedTrim ? { search: currencyDebouncedTrim } : {})
				},
				...(signal ? { fetch: { signal } } : {})
			}),
		enabled: open,
		refetchOnWindowFocus: false
	}));

	const currenciesData = $derived(currenciesQuery.data?.data);
	const currencies = $derived(currenciesData?.rows ?? []);

	function cancelCurrencyCombRaf() {
		if (currencyOpenRafId) cancelAnimationFrame(currencyOpenRafId);
		currencyOpenRafId = 0;
	}

	function onCurrencyOpenChange(opened: boolean) {
		if (opened) {
			cancelCurrencyCombRaf();
			currencyOpenAwaitFetch = true;
			const id = ++currencyOpenSeq;
			currencyOpenRafId = requestAnimationFrame(() => {
				currencyOpenRafId = 0;
				void currenciesQuery.refetch().finally(() => {
					if (id === currencyOpenSeq) currencyOpenAwaitFetch = false;
				});
			});
		} else {
			currencyOpenSeq++;
			cancelCurrencyCombRaf();
			currencyOpenAwaitFetch = false;
		}
	}

	const currencyComboboxLoading = $derived(
		currencyStale || currenciesQuery.isFetching || currencyOpenAwaitFetch
	);

	const { form, errors, enhance, delayed } = superForm(
		{
			id: '',
			name: '',
			currency_code: ''
		},
		{
			resetForm: false,
			onResult: async ({ result }) => {
				if (result.type === 'success') {
					open = false;
					toast.success('Region updated successfully');
					if (onSuccess) await onSuccess();
				}
			}
		}
	);

	let initializedForId = $state<string | null>(null);
	let automaticTaxes = $state<boolean>(false);
	let taxInclusivePricing = $state<boolean>(false);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			currencySearch = '';
			debouncedCurrencySearch = '';
			currencyOpenSeq++;
			cancelCurrencyCombRaf();
			currencyOpenAwaitFetch = false;
			return;
		}

		const nextId = region?.id ?? '';
		if (initializedForId === nextId) return;
		initializedForId = String(nextId);

		$form = {
			id: String(nextId),
			name: String(region?.name ?? ''),
			currency_code: String(region?.currency_code ?? '')
		};
		automaticTaxes = Boolean(region?.automatic_taxes ?? false);
		taxInclusivePricing = Boolean(region?.tax_inclusive_pricing ?? false);
		$errors = {};
	});

	function close() {
		open = false;
	}

	function currencyParenContent(c: { code: string; symbol: string }) {
		if (!c.symbol || c.symbol === c.code) return c.code;
		return `${c.code} ${c.symbol}`;
	}

	function withSelectedFallback(mapped: ComboboxOption[], selectedId: string): ComboboxOption[] {
		const id = selectedId.trim();
		if (!id || mapped.some((o) => o.id === id)) return mapped;
		return [{ id, value: `${id}` }, ...mapped];
	}

	const passthroughOpts = (opts: ComboboxOption[]): ComboboxOption[] => opts;

	const currencyOptions = $derived.by((): ComboboxOption[] =>
		withSelectedFallback(
			currencies.map((row) => ({
				id: String(row.code),
				value: `${String(row.name)} (${currencyParenContent({ code: String(row.code), symbol: String(row.symbol) })})`
			})),
			String($form.currency_code ?? '')
		)
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the region details.</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. South Asia"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn('h-9', $errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-currency" class="text-sm font-medium">Currency</label>
						<Combobox
							id="edit-currency"
							options={currencyOptions}
							bind:value={$form.currency_code}
							placeholder="Select currency"
							loading={currencyComboboxLoading}
							emptyMessage="No currencies match your search."
							filterFn={passthroughOpts}
							class={cn($errors.currency_code && 'border-destructive')}
							listboxClass="max-h-[min(60vh,20rem)]"
							onSearchChange={(v) => (currencySearch = v)}
							onOpenChange={onCurrencyOpenChange}
						/>
						<input type="hidden" name="currency_code" value={String($form.currency_code)} />
						{#if $errors.currency_code}
							<span class="text-xs text-destructive">{$errors.currency_code}</span>
						{/if}
					</div>

					<!-- Tax Settings -->
					<div class="space-y-4">
						<div
							class="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3"
						>
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium">Automatic Taxes</span>
								<span class="text-sm text-muted-foreground">
									When enabled, taxes will only be calculated at checkout based on the shipping
									address.
								</span>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={automaticTaxes}
								aria-label="Toggle automatic taxes"
								class="relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none {automaticTaxes
									? 'bg-primary'
									: 'bg-input'}"
								onclick={() => (automaticTaxes = !automaticTaxes)}
							>
								<span
									class="pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out {automaticTaxes
										? 'translate-x-4'
										: 'translate-x-0'}"
								></span>
							</button>
						</div>
						<div
							class="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3"
						>
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium">Tax inclusive pricing</span>
								<span class="text-sm text-muted-foreground">
									When enabled, prices in the region will be tax inclusive.
								</span>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={taxInclusivePricing}
								aria-label="Toggle tax inclusive pricing"
								class="relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none {taxInclusivePricing
									? 'bg-primary'
									: 'bg-input'}"
								onclick={() => (taxInclusivePricing = !taxInclusivePricing)}
							>
								<span
									class="pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out {taxInclusivePricing
										? 'translate-x-4'
										: 'translate-x-0'}"
								></span>
							</button>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
<Toaster position="top-center" richColors={true} />
