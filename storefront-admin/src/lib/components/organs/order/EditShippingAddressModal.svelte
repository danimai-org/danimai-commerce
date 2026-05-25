<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Search from '@lucide/svelte/icons/search';
	import BookUser from '@lucide/svelte/icons/book-user';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import {
		createCustomerAddress,
		listCustomerAddresses,
		type CustomerAddress
	} from '$lib/customers/api.js';
	import {
		emptyShippingAddress,
		hasShippingAddress,
		type ShippingAddressValue
	} from './shipping-address.js';
	import { client } from '$lib/client.js';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import type { ComboboxOption } from '$lib/components/organs/combobox/combobox.svelte';
	type CountryOption = { code: string; name: string };
	const STATE_OPTIONS = [
		'Karnataka',
		'Maharashtra',
		'Tamil Nadu',
		'Delhi',
		'Gujarat',
		'California',
		'New York'
	] as const;

	const PHONE_CODES = ['+91', '+1', '+44'] as const;
	let countryOptions = $state<CountryOption[]>([]);
	let countriesLoading = $state(false);
	let countriesCache: CountryOption[] | null = null;

	function countryToCode(country: string): string {
		const match = countryOptions.find(
			(c) => c.name === country || c.code === country.toUpperCase()
		);
		return match?.code ?? country.slice(0, 2).toUpperCase();
	}

	function codeToCountry(code: string): string {
		const match = countryOptions.find((c) => c.code === code.toUpperCase());
		return match?.name ?? code;
	}

	function normalizeFormCountry() {
		const current = form.country.trim();
		if (!current || countryOptions.length === 0) return;
		if (current.length === 2 && current === current.toUpperCase()) {
			const name = codeToCountry(current);
			if (name !== current) form.country = name;
			return;
		}
		const byCode = countryOptions.find((c) => c.code === current.toUpperCase());
		if (byCode) form.country = byCode.name;
	}

	async function fetchAllCountries() {
		if (countriesCache) {
			countryOptions = countriesCache;
			normalizeFormCountry();
			return;
		}
		countriesLoading = true;
		try {
			const all: CountryOption[] = [];
			let page = 1;
			let hasNext = true;
			while (hasNext) {
				const res = await client.regions.countries.get({
					query: { page, limit: 100 }
				});
				if (res.error) break;
				const rows = res.data?.rows ?? [];
				for (const row of rows) {
					const code = String(row.iso_2 ?? '').toUpperCase();
					const name = String(row.display_name ?? row.name ?? '').trim() || code;
					if (code) all.push({ code, name });
				}
				hasNext = res.data?.pagination?.has_next_page ?? false;
				page += 1;
			}
			const seen = new SvelteSet<string>();
			countriesCache = all
				.filter((c) => {
					if (seen.has(c.code)) return false;
					seen.add(c.code);
					return true;
				})
				.sort((a, b) => a.name.localeCompare(b.name));
			countryOptions = countriesCache;
			normalizeFormCountry();
		} catch {
			countryOptions = [];
		} finally {
			countriesLoading = false;
		}
	}

	function initFormFromProps() {
		error = null;
		selectedSavedAddressId = '';
		form = {
			...emptyShippingAddress(),
			...value,
			first_name: value.first_name || customerFirstName || '',
			last_name: value.last_name || customerLastName || '',
			phone: value.phone || customerPhone || ''
		};
		if (!hasShippingAddress(value)) {
			form.first_name = customerFirstName ?? '';
			form.last_name = customerLastName ?? '';
			form.phone = customerPhone ?? '';
		}
		initialSnapshot = snapshotForm(form);
	}

	async function loadSavedAddresses(cid: string) {
		addressesLoading = true;
		try {
			savedAddresses = await listCustomerAddresses(cid);
		} catch {
			savedAddresses = [];
		} finally {
			addressesLoading = false;
		}
	}

	function addressToForm(addr: CustomerAddress): ShippingAddressValue {
		return {
			country: codeToCountry(addr.country_code),
			first_name: addr.first_name ?? '',
			last_name: addr.last_name ?? '',
			company: addr.company ?? '',
			address_1: addr.address_1 ?? '',
			address_2: addr.address_2 ?? '',
			city: addr.city ?? '',
			state: addr.province ?? '',
			postal_code: addr.postal_code ?? '',
			phone_code: '+91',
			phone: addr.phone ?? ''
		};
	}

	function snapshotForm(f: ShippingAddressValue): string {
		return JSON.stringify(f);
	}

	let {
		open = $bindable(false),
		value = $bindable(emptyShippingAddress()),
		customerId = '',
		customerFirstName = null as string | null,
		customerLastName = null as string | null,
		customerPhone = null as string | null,
		saveToCustomerProfile = true,
		title = 'Edit shipping address',
		submitLabel = 'Save',
		idPrefix = 'ship',
		onSave
	}: {
		open?: boolean;
		value?: ShippingAddressValue;
		customerId?: string;
		customerFirstName?: string | null;
		customerLastName?: string | null;
		customerPhone?: string | null;
		saveToCustomerProfile?: boolean;
		title?: string;
		submitLabel?: string;
		idPrefix?: string;
		onSave?: (address: ShippingAddressValue) => void | Promise<void>;
	} = $props();

	let form = $state(emptyShippingAddress());
	let initialSnapshot = $state('');
	let saving = $state(false);
	let error = $state<string | null>(null);
	let savedAddresses = $state<CustomerAddress[]>([]);
	let addressesLoading = $state(false);
	let selectedSavedAddressId = $state('');

	const dirty = $derived(snapshotForm(form) !== initialSnapshot);

	const savedAddressOptions = $derived(
		savedAddresses.map((a) => {
			const label = [a.address_1, a.city, a.province].filter(Boolean).join(', ') || a.id;
			return { id: a.id, label };
		})
	);

	const countryComboboxOptions = $derived.by((): ComboboxOption[] => {
		const base = countryOptions.map((c) => ({ id: c.name, value: c.name }));
		const selected = form.country.trim();
		if (!selected || base.some((o) => o.id === selected)) return base;
		return [{ id: selected, value: selected }, ...base];
	});

	$effect(() => {
		if (!open) return;
		untrack(() => {
			initFormFromProps();
			const cid = customerId;
			void fetchAllCountries();
			if (cid) {
				void loadSavedAddresses(cid);
			} else {
				savedAddresses = [];
			}
		});
	});

	function close() {
		if (saving) return;
		open = false;
	}

	function applySavedAddress(id: string) {
		selectedSavedAddressId = id;
		const addr = savedAddresses.find((a) => a.id === id);
		if (!addr) return;
		form = addressToForm(addr);
		normalizeFormCountry();
	}

	async function save() {
		if (!dirty) return;
		error = null;
		if (!form.address_1.trim()) {
			error = 'Address is required';
			return;
		}
		if (!form.city.trim()) {
			error = 'City is required';
			return;
		}
		saving = true;
		try {
			const next = { ...form };
			value = next;
			if (saveToCustomerProfile && customerId) {
				await createCustomerAddress(customerId, {
					first_name: next.first_name.trim() || null,
					last_name: next.last_name.trim() || null,
					phone: next.phone.trim() || null,
					company: next.company.trim() || null,
					address_1: next.address_1.trim(),
					address_2: next.address_2.trim() || null,
					city: next.city.trim(),
					province: next.state.trim() || null,
					postal_code: next.postal_code.trim() || null,
					country_code: countryToCode(next.country)
				});
			}
			await onSave?.(next);
			open = false;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="top-1/2 left-1/2 flex h-auto max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border p-0 shadow-lg"
	>
		<Dialog.Header class="border-b px-6 py-4">
			<Dialog.Title class="text-base font-semibold">{title}</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-col gap-4 overflow-auto px-6 py-4">
			{#if error}
				<div
					class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{error}
				</div>
			{/if}
			{#if customerId && (savedAddressOptions.length > 0 || addressesLoading)}
				<Select.Root
					type="single"
					value={selectedSavedAddressId || undefined}
					onValueChange={(id) => id && applySavedAddress(id)}
				>
					<Select.Trigger class="h-10 w-full justify-between gap-2">
						<span class="flex items-center gap-2 truncate">
							<BookUser class="size-4 shrink-0 text-muted-foreground" />
							{addressesLoading
								? 'Loading addresses…'
								: selectedSavedAddressId
									? (savedAddressOptions.find((o) => o.id === selectedSavedAddressId)?.label ??
										'Saved address')
									: 'Select from address book'}
						</span>
						<ChevronDown class="size-4 shrink-0 opacity-50" />
					</Select.Trigger>
					<Select.Content>
						{#each savedAddressOptions as opt (opt.id)}
							<Select.Item value={opt.id} label={opt.label}>{opt.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
			<div class="flex flex-col gap-2">
				<label for="{idPrefix}-country" class="text-sm font-medium">Country/region</label>
				<Combobox
					id="{idPrefix}-country"
					options={countryComboboxOptions}
					value={form.country}
					onValueChange={(v) => (form.country = v)}
					placeholder="Search countries"
					loading={countriesLoading}
					emptyMessage="No countries found."
					listboxClass="max-h-72"
					disabled={saving}
					onOpen={() => {
						if (!countriesCache) void fetchAllCountries();
					}}
				/>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="flex flex-col gap-2">
					<label for="{idPrefix}-first-name" class="text-sm font-medium">First name</label>
					<Input
						id="{idPrefix}-first-name"
						bind:value={form.first_name}
						class="h-10"
						disabled={saving}
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label for="{idPrefix}-last-name" class="text-sm font-medium">Last name</label>
					<Input
						id="{idPrefix}-last-name"
						bind:value={form.last_name}
						class="h-10"
						disabled={saving}
					/>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<label for="{idPrefix}-company" class="text-sm font-medium">Company</label>
				<Input id="{idPrefix}-company" bind:value={form.company} class="h-10" disabled={saving} />
			</div>
			<div class="flex flex-col gap-2">
				<label for="{idPrefix}-address" class="text-sm font-medium">Address</label>
				<div class="relative">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						id="{idPrefix}-address"
						bind:value={form.address_1}
						class="h-10 pl-10"
						disabled={saving}
					/>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<label for="{idPrefix}-apartment" class="text-sm font-medium">Apartment, suite, etc</label>
				<Input
					id="{idPrefix}-apartment"
					bind:value={form.address_2}
					class="h-10"
					disabled={saving}
				/>
			</div>
			<div class="grid grid-cols-3 gap-3">
				<div class="flex flex-col gap-2">
					<label for="{idPrefix}-city" class="text-sm font-medium">City</label>
					<Input id="{idPrefix}-city" bind:value={form.city} class="h-10" disabled={saving} />
				</div>
				<div class="flex flex-col gap-2">
					<label for="{idPrefix}-state" class="text-sm font-medium">State</label>
					<Select.Root
						type="single"
						value={form.state || undefined}
						onValueChange={(v) => (form.state = v ?? '')}
					>
						<Select.Trigger class="h-10 w-full" id="{idPrefix}-state">
							{form.state || 'Select a state'}
						</Select.Trigger>
						<Select.Content>
							{#each STATE_OPTIONS as state (state)}
								<Select.Item value={state} label={state}>{state}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-2">
					<label for="{idPrefix}-pin" class="text-sm font-medium">PIN code</label>
					<Input id="{idPrefix}-pin" bind:value={form.postal_code} class="h-10" disabled={saving} />
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<span class="text-sm font-medium">Phone</span>
				<div class="flex gap-2">
					<Select.Root
						type="single"
						value={form.phone_code}
						onValueChange={(v) => v && (form.phone_code = v)}
					>
						<Select.Trigger class="h-10 w-24 shrink-0">{form.phone_code}</Select.Trigger>
						<Select.Content>
							{#each PHONE_CODES as code (code)}
								<Select.Item value={code} label={code}>{code}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Input type="tel" bind:value={form.phone} class="h-10 min-w-0 flex-1" disabled={saving} />
				</div>
			</div>
		</div>
		<Dialog.Footer class="!flex-row justify-end gap-2 border-t px-6 py-4">
			<Button variant="outline" onclick={close} disabled={saving}>Cancel</Button>
			<Button onclick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : submitLabel}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
