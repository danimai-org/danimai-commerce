<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Search from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Country } from 'country-state-city';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import RegionAddCountriesSheet from '../detail/RegionAddCountriesSheet.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast, Toaster } from 'svelte-sonner';

	type RegionCreateFormData = {
		name: string;
		currency_code: string;
	};

	const listQuery = { page: 1, limit: 100 } as const;

	let {
		open = $bindable(false),
		regionCreateForm,
		onSuccess = () => {}
	} = $props<{
		open?: boolean;
		regionCreateForm: SuperValidated<RegionCreateFormData>;
		onSuccess?: () => void;
	}>();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, delayed } = superForm(regionCreateForm, {
		id: 'region-create-form',
		invalidateAll: 'force',
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				const d = result.data as { error?: string } | undefined;
				if (d?.error) toast.error(d.error);
				return;
			}
			if (result.type === 'success') {
				const d = result.data as { createdId?: string } | undefined;
				open = false;
				if (d?.createdId) {
					goto(resolve(`/regions/${d.createdId}`, {}));
				}
				void onSuccess();
			}
		}
	});

	const currenciesQuery = createQuery(() => ({
		queryKey: ['create-region', 'currencies', listQuery.page, listQuery.limit],
		queryFn: () => client['currencies'].get({ query: listQuery }),
		enabled: open
	}));

	const currenciesData = $derived(currenciesQuery.data?.data);
	const currencies = $derived(
		(currenciesData as { rows?: Array<{ code: string; name: string; symbol: string }> } | undefined)
			?.rows ?? []
	);

	let automaticTaxes = $state(true);
	let taxInclusivePricing = $state(false);

	let addCountriesOpen = $state(false);
	let pickedCountryIds = $state<string[]>([]);
	let countriesPreviewSearch = $state('');

	const pickedPreviewRows = $derived.by(() =>
		pickedCountryIds.map((iso) => {
			const code = String(iso).toUpperCase();
			const c = Country.getCountryByCode(code);
			return {
				iso: code,
				name: c?.name ?? code,
				flag: c?.flag
			};
		})
	);

	const filteredPickedPreview = $derived.by(() => {
		const q = countriesPreviewSearch.trim().toLowerCase();
		if (!q) return pickedPreviewRows;
		return pickedPreviewRows.filter(
			(r) => r.name.toLowerCase().includes(q) || r.iso.toLowerCase().includes(q)
		);
	});

	function removePickedCountry(iso: string) {
		pickedCountryIds = pickedCountryIds.filter((x) => String(x).toUpperCase() !== iso);
	}

	$effect(() => {
		if (!open) {
			pickedCountryIds = [];
			countriesPreviewSearch = '';
		}
	});
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-2xl">
		<form action="?/create" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="country_ids" value={JSON.stringify(pickedCountryIds)} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Manage tax rates and providers for a set of countries.
				</p>

				<!-- Basic Information -->
				<div class="mt-6 grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-name" class="text-sm font-medium">Name</label>
						<Input
							id="create-name"
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
						<label for="create-currency" class="text-sm font-medium">Currency</label>
						<Select.Root
							type="single"
							value={$form.currency_code || undefined}
							onValueChange={(v) => ($form.currency_code = v ?? '')}
						>
							<Select.Trigger
								id="create-currency"
								class={cn(
									'flex h-9 w-full items-center gap-2',
									$errors.currency_code && 'border-destructive'
								)}
							>
								{@const selected = currencies.find(
									(c: { code: string }) => c.code === $form.currency_code
								)}
								<span class="min-w-0 flex-1 truncate text-left">
									{selected ? `${selected.name} (${selected.code})` : 'Select currency'}
								</span>
								<ChevronDown class="size-4 shrink-0 opacity-50" />
							</Select.Trigger>
							<Select.Content>
								<Select.Viewport class="max-h-[min(60vh,20rem)]">
									{#each currencies as currency (currency.code)}
										<Select.Item
											value={currency.code}
											label={`${currency.name} (${currency.code})`}
										>
											{currency.name} ({currency.code}
											{currency.symbol})
										</Select.Item>
									{/each}
								</Select.Viewport>
							</Select.Content>
						</Select.Root>
						<input type="hidden" name="currency_code" value={String($form.currency_code)} />
						{#if $errors.currency_code}
							<span class="text-xs text-destructive">{$errors.currency_code}</span>
						{/if}
					</div>
				</div>

				<!-- Tax Settings -->
				<div class="mt-6 space-y-4">
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

				<!-- Countries -->
				<div class="mt-6 border-t pt-6">
					<div class="flex items-start justify-between gap-4">
						<div>
							<span class="text-sm font-medium">Countries</span>
							<p class="mt-0.5 text-sm text-muted-foreground">
								Add the countries included in this region. They will be assigned after the region is
								created.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => (addCountriesOpen = true)}>Add countries</Button
						>
					</div>

					{#if pickedCountryIds.length > 0}
						<div class="mt-4 rounded-xl border bg-card shadow-sm">
							<div class="border-b px-6 py-4">
								<h3 class="text-lg font-semibold text-foreground">Selected countries</h3>
								<p class="text-sm text-muted-foreground">
									{pickedCountryIds.length}
									{pickedCountryIds.length === 1 ? 'country' : 'countries'} will be assigned to this region
								</p>
							</div>
							<div class="border-b bg-muted/5 px-6 py-3">
								<div class="relative">
									<Search
										class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
									/>
									<Input
										placeholder="Search by name or ISO code..."
										bind:value={countriesPreviewSearch}
										class="h-9 w-full max-w-md rounded-md bg-background pl-9"
									/>
								</div>
							</div>
							<div class="overflow-auto">
								<table class="w-full text-left text-sm">
									<thead
										class="border-b bg-muted/20 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
									>
										<tr>
											<th class="px-6 py-3">Country Name</th>
											<th class="px-4 py-3">Country Code</th>
											<th class="w-16 px-4 py-3 text-right">Actions</th>
										</tr>
									</thead>
									<tbody class="divide-y">
										{#each filteredPickedPreview as row (row.iso)}
											<tr class="transition-colors hover:bg-muted/30">
												<td class="px-6 py-3 font-medium text-foreground">
													{#if row.flag}
														<span class="mr-1.5" aria-hidden="true">{row.flag}</span>
													{/if}
													{row.name}
												</td>
												<td class="px-4 py-3">
													<span
														class="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground uppercase"
													>
														{row.iso}
													</span>
												</td>
												<td class="px-4 py-3 text-right">
													<button
														type="button"
														class="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
														aria-label="Remove country"
														onclick={() => removePickedCountry(row.iso)}
													>
														<Trash2 class="size-4" />
													</button>
												</td>
											</tr>
										{:else}
											<tr>
												<td colspan="3" class="px-6 py-12 text-center text-muted-foreground">
													No countries match your search.
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>

<RegionAddCountriesSheet
	bind:open={addCountriesOpen}
	preselectedIds={pickedCountryIds}
	onPick={(ids) => (pickedCountryIds = ids)}
/>
