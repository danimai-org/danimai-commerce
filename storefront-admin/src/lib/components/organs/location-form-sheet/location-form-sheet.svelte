<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { createStockLocation, updateStockLocation } from '$lib/stock-locations/api.js';
	import type { StockLocationAddress } from '$lib/stock-locations/api.js';

	type StockLocation = {
		id: string;
		name: string | null;
		address?: StockLocationAddress | null;
		created_at?: string;
		updated_at?: string;
	};

	let {
		open = $bindable(false),
		mode = 'create',
		location = null as StockLocation | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'create' | 'edit';
		location?: StockLocation | null;
		onSuccess?: () => void;
	} = $props();

	let name = $state('');
	let address1 = $state('');
	let address2 = $state('');
	let company = $state('');
	let city = $state('');
	let province = $state('');
	let postalCode = $state('');
	let countryCode = $state('');
	let phone = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (open) {
			error = null;
			if (mode === 'edit' && location) {
				name = location.name ?? '';
				const addr = location.address;
				address1 = addr?.address_1 ?? '';
				address2 = addr?.address_2 ?? '';
				company = addr?.company ?? '';
				city = addr?.city ?? '';
				province = addr?.province ?? '';
				postalCode = addr?.postal_code ?? '';
				countryCode = addr?.country_code ?? '';
				phone = addr?.phone ?? '';
			} else {
				name = '';
				address1 = '';
				address2 = '';
				company = '';
				city = '';
				province = '';
				postalCode = '';
				countryCode = '';
				phone = '';
			}
		}
	});

	function close() {
		if (!submitting) open = false;
	}

	async function submit() {
		error = null;
		submitting = true;
		try {
			const addressFields = {
				address_1: address1.trim() || null,
				address_2: address2.trim() || null,
				company: company.trim() || null,
				city: city.trim() || null,
				province: province.trim() || null,
				postal_code: postalCode.trim() || null,
				country_code: countryCode.trim() || null,
				phone: phone.trim() || null
			};
			const hasAddress = Object.values(addressFields).some((v) => v != null && v !== '');
			const address = hasAddress ? addressFields : undefined;

			if (mode === 'edit' && location) {
				await updateStockLocation(location.id, { name: name.trim() || null, address });
			} else {
				await createStockLocation({ name: name.trim() || null, address });
			}
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	const title = $derived(mode === 'edit' ? 'Edit Location' : 'Create Location');
	const subtitle = $derived(
		mode === 'edit'
			? 'Update the stock location and address.'
			: 'Add a new stock location or warehouse.'
	);
	const submitLabel = $derived(
		submitting ? (mode === 'edit' ? 'Saving…' : 'Creating…') : mode === 'edit' ? 'Save' : 'Create'
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{subtitle}
				</p>
				{#if error && !submitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="loc-name" class="text-sm font-medium">Name</label>
						<Input
							id="loc-name"
							bind:value={name}
							placeholder="e.g. Main Warehouse"
							class="h-9"
						/>
					</div>
					<p class="text-sm font-medium">Address</p>
					<div class="flex flex-col gap-3 rounded-lg border p-3">
						<div class="flex flex-col gap-2">
							<label for="loc-address-1" class="text-xs font-medium text-muted-foreground">Address line 1</label>
							<Input
								id="loc-address-1"
								bind:value={address1}
								placeholder="Street, number"
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="loc-address-2" class="text-xs font-medium text-muted-foreground">Address line 2</label>
							<Input
								id="loc-address-2"
								bind:value={address2}
								placeholder="Apt, suite, etc."
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="loc-company" class="text-xs font-medium text-muted-foreground">Company</label>
							<Input
								id="loc-company"
								bind:value={company}
								placeholder="Company name"
								class="h-9"
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-2">
								<label for="loc-city" class="text-xs font-medium text-muted-foreground">City</label>
								<Input id="loc-city" bind:value={city} placeholder="City" class="h-9" />
							</div>
							<div class="flex flex-col gap-2">
								<label for="loc-province" class="text-xs font-medium text-muted-foreground">Province / State</label>
								<Input
									id="loc-province"
									bind:value={province}
									placeholder="Province or state"
									class="h-9"
								/>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-2">
								<label for="loc-postal-code" class="text-xs font-medium text-muted-foreground">Postal code</label>
								<Input
									id="loc-postal-code"
									bind:value={postalCode}
									placeholder="Postal code"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="loc-country-code" class="text-xs font-medium text-muted-foreground">Country code</label>
								<Input
									id="loc-country-code"
									bind:value={countryCode}
									placeholder="e.g. US"
									class="h-9"
								/>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="loc-phone" class="text-xs font-medium text-muted-foreground">Phone</label>
							<Input
								id="loc-phone"
								bind:value={phone}
								placeholder="Phone number"
								class="h-9"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button onclick={submit} disabled={submitting}>
					{submitLabel}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
