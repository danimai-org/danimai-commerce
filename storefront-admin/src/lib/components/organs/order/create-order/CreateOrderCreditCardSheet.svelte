<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input/index';
	import * as Select from '$lib/components/ui/select/index';
	import * as Sheet from '$lib/components/ui/sheet/index';
	import { Combobox, type ComboboxOption } from '$lib/components/organs/index.js';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import Search from '@lucide/svelte/icons/search';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import Lock from '@lucide/svelte/icons/lock';
	import User from '@lucide/svelte/icons/user';
	import Calendar from '@lucide/svelte/icons/calendar';
	import DollarSign from '@lucide/svelte/icons/dollar-sign';

	let {
		open = $bindable(false),
		billingCountry = $bindable('India'),
		billingFirstName = $bindable(''),
		billingLastName = $bindable(''),
		billingCompany = $bindable(''),
		billingAddress = $bindable(''),
		billingApartment = $bindable(''),
		billingCity = $bindable(''),
		billingState = $bindable(''),
		billingPinCode = $bindable(''),
		billingPhoneCode = $bindable('+91'),
		billingPhone = $bindable(''),
		totalFormatted,
		creatingOrder,
		canCreate,
		onCreate,
		onCancel
	}: {
		open?: boolean;
		billingCountry?: string;
		billingFirstName?: string;
		billingLastName?: string;
		billingCompany?: string;
		billingAddress?: string;
		billingApartment?: string;
		billingCity?: string;
		billingState?: string;
		billingPinCode?: string;
		billingPhoneCode?: string;
		billingPhone?: string;
		totalFormatted: string;
		creatingOrder: boolean;
		canCreate: boolean;
		onCreate: () => void;
		onCancel: () => void;
	} = $props();

	const DEBOUNCE_MS = 400;
	const listQuery = { page: 1, limit: 100 } as const;

	let countrySearch = $state('');
	let debouncedCountrySearch = $state('');

	$effect(() => {
		const q = countrySearch;
		if (debouncedCountrySearch === q) return;
		const t = setTimeout(() => {
			debouncedCountrySearch = q;
		}, DEBOUNCE_MS);
		return () => clearTimeout(t);
	});

	const countrySearchStale = $derived(countrySearch.trim() !== debouncedCountrySearch.trim());
	const debouncedCountryTrim = $derived(debouncedCountrySearch.trim());

	const countriesQuery = createQuery(() => ({
		queryKey: ['billing-countries', listQuery.page, listQuery.limit, debouncedCountryTrim],
		queryFn: () =>
			client.regions.countries.get({
				query: {
					page: listQuery.page,
					limit: listQuery.limit,
					...(debouncedCountryTrim ? { search: debouncedCountryTrim } : {})
				}
			}),
		enabled: open,
		refetchOnWindowFocus: false
	}));

	type CountryRow = { name: string };
	const countries = $derived.by((): CountryRow[] =>
		(countriesQuery.data?.data?.rows ?? []).map((row) => ({
			name:
				String(row.display_name ?? row.name ?? '').trim() || String(row.iso_2 ?? '').toUpperCase()
		}))
	);

	const countryComboboxOptions = $derived.by((): ComboboxOption[] => {
		const base = countries.map((c) => ({ id: c.name, value: c.name }));
		const selected = billingCountry.trim();
		if (!selected || base.some((o) => o.id === selected)) return base;
		return [{ id: selected, value: selected }, ...base];
	});

	const countryComboboxLoading = $derived(
		countrySearchStale || countriesQuery.isFetching || countriesQuery.isPending
	);

	const passthroughComboboxFilter: (opts: ComboboxOption[], query: string) => ComboboxOption[] = (
		opts
	) => opts;

	$effect(() => {
		if (!open) {
			countrySearch = '';
			debouncedCountrySearch = '';
		}
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<div class="flex items-center gap-2">
					<CreditCard class="size-5 text-muted-foreground" />
					<Sheet.Title>Collect Payment</Sheet.Title>
				</div>
				<Sheet.Description>Process credit card payment for this order.</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto px-6 py-6">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-4">
						<h3 class="text-sm font-semibold">Billing address</h3>
						<div class="flex flex-col gap-3">
							<div class="flex flex-col gap-2">
								<label for="billing-country" class="text-sm font-medium">Country/region</label>
								<Combobox
									id="billing-country"
									bind:value={billingCountry}
									onSearchChange={(q) => {
										countrySearch = q;
									}}
									loading={countryComboboxLoading}
									filterFn={passthroughComboboxFilter}
									triggerClass="h-10 w-full"
									listboxClass="max-h-72"
									placeholder="Search countries"
									emptyMessage="No countries found."
									options={countryComboboxOptions}
								/>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex flex-col gap-2">
									<label for="billing-first-name" class="text-sm font-medium">First name</label>
									<Input
										id="billing-first-name"
										type="text"
										bind:value={billingFirstName}
										class="h-10"
									/>
								</div>
								<div class="flex flex-col gap-2">
									<label for="billing-last-name" class="text-sm font-medium">Last name</label>
									<Input
										id="billing-last-name"
										type="text"
										bind:value={billingLastName}
										class="h-10"
									/>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-company" class="text-sm font-medium">Company</label>
								<Input id="billing-company" type="text" bind:value={billingCompany} class="h-10" />
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-address" class="text-sm font-medium">Address</label>
								<div class="relative">
									<Search
										class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
									/>
									<Input
										id="billing-address"
										type="text"
										bind:value={billingAddress}
										class="h-10 pl-10"
									/>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-apartment" class="text-sm font-medium"
									>Apartment, suite, etc</label
								>
								<Input
									id="billing-apartment"
									type="text"
									bind:value={billingApartment}
									class="h-10"
								/>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex flex-col gap-2">
									<label for="billing-city" class="text-sm font-medium">City</label>
									<Input id="billing-city" type="text" bind:value={billingCity} class="h-10" />
								</div>
								<div class="flex flex-col gap-2">
									<label for="billing-state" class="text-sm font-medium">State</label>
									<Select.Root
										type="single"
										value={billingState || undefined}
										onValueChange={(v) => (billingState = v ?? '')}
									>
										<Select.Trigger class="h-10 w-full" id="billing-state"
											>{billingState || 'Select a state'}</Select.Trigger
										>
										<Select.Content>
											<Select.Item value="Karnataka" label="Karnataka">Karnataka</Select.Item>
											<Select.Item value="Maharashtra" label="Maharashtra">Maharashtra</Select.Item>
											<Select.Item value="Tamil Nadu" label="Tamil Nadu">Tamil Nadu</Select.Item>
											<Select.Item value="California" label="California">California</Select.Item>
											<Select.Item value="New York" label="New York">New York</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-pin" class="text-sm font-medium">PIN code</label>
								<Input id="billing-pin" type="text" bind:value={billingPinCode} class="h-10" />
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-phone" class="text-sm font-medium">Phone</label>
								<div class="flex gap-2">
									<Select.Root
										type="single"
										value={billingPhoneCode}
										onValueChange={(v) => v && (billingPhoneCode = v)}
									>
										<Select.Trigger class="h-10 w-[100px] shrink-0"
											>{billingPhoneCode}</Select.Trigger
										>
										<Select.Content>
											<Select.Item value="+91" label="+91 India">+91</Select.Item>
											<Select.Item value="+1" label="+1">+1</Select.Item>
											<Select.Item value="+44" label="+44">+44</Select.Item>
										</Select.Content>
									</Select.Root>
									<Input
										id="billing-phone"
										type="tel"
										bind:value={billingPhone}
										class="h-10 flex-1"
										placeholder=""
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="rounded-lg border bg-muted/30 p-4">
						<div class="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
							<DollarSign class="size-4" />
							<span>Payment Amount</span>
						</div>
						<div class="text-3xl font-bold">{totalFormatted}</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="card-number" class="flex items-center gap-2 text-sm font-medium">
							<CreditCard class="size-4 text-muted-foreground" />
							Card Number
						</label>
						<div class="relative">
							<CreditCard
								class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id="card-number"
								type="text"
								placeholder="1234 5678 9012 3456"
								class="h-10 pl-10"
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="expiry-date" class="flex items-center gap-2 text-sm font-medium">
								<Calendar class="size-4 text-muted-foreground" />
								Expiry Date
							</label>
							<Input id="expiry-date" type="text" placeholder="MM/YY" class="h-10" />
						</div>
						<div class="flex flex-col gap-2">
							<label for="cvv" class="flex items-center gap-2 text-sm font-medium">
								<Lock class="size-4 text-muted-foreground" />
								CVV
							</label>
							<Input id="cvv" type="text" placeholder="123" class="h-10" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="cardholder-name" class="flex items-center gap-2 text-sm font-medium">
							<User class="size-4 text-muted-foreground" />
							Cardholder Name
						</label>
						<Input id="cardholder-name" type="text" placeholder="John Doe" class="h-10" />
					</div>
					<div
						class="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground"
					>
						<Lock class="mt-0.5 size-4 shrink-0" />
						<span>Your payment information is encrypted and secure.</span>
					</div>
				</div>
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={onCancel} disabled={creatingOrder}>Cancel</Button>
				<Button
					disabled={creatingOrder || !canCreate}
					onclick={onCreate}
					class="flex items-center gap-2"
				>
					{#if creatingOrder}
						<span
							class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></span>
						Creating...
					{:else}
						<CreditCard class="size-4" />
						Process Payment
					{/if}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
