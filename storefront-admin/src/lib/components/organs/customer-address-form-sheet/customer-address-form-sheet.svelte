<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		createCustomerAddress,
		updateCustomerAddress,
		type CustomerAddress,
		type Customer
	} from '$lib/customers/api.js';

	let {
		open = $bindable(false),
		mode = 'create',
		customerId = '',
		customer = null as Customer | null,
		address = null as CustomerAddress | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'create' | 'edit';
		customerId?: string;
		customer?: Customer | null;
		address?: CustomerAddress | null;
		onSuccess?: () => void;
	} = $props();

	let firstName = $state('');
	let lastName = $state('');
	let phone = $state('');
	let company = $state('');
	let address1 = $state('');
	let address2 = $state('');
	let city = $state('');
	let province = $state('');
	let postalCode = $state('');
	let countryCode = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (open) {
			error = null;
			if (mode === 'edit' && address) {
				firstName = address.first_name ?? '';
				lastName = address.last_name ?? '';
				phone = address.phone ?? '';
				company = address.company ?? '';
				address1 = address.address_1 ?? '';
				address2 = address.address_2 ?? '';
				city = address.city ?? '';
				province = address.province ?? '';
				postalCode = address.postal_code ?? '';
				countryCode = address.country_code ?? '';
			} else {
				firstName = customer?.first_name ?? '';
				lastName = customer?.last_name ?? '';
				phone = customer?.phone ?? '';
				company = (customer?.metadata as { company?: string })?.company ?? '';
				address1 = '';
				address2 = '';
				city = '';
				province = '';
				postalCode = '';
				countryCode = '';
			}
		}
	});

	function close() {
		if (!submitting) open = false;
	}

	async function submit() {
		if (!customerId) return;
		error = null;
		if (!address1.trim()) {
			error = 'Address line 1 is required';
			return;
		}
		if (!city.trim()) {
			error = 'City is required';
			return;
		}
		if (!countryCode.trim()) {
			error = 'Country code is required';
			return;
		}
		submitting = true;
		try {
			const body = {
				first_name: firstName.trim() || null,
				last_name: lastName.trim() || null,
				phone: phone.trim() || null,
				company: company.trim() || null,
				address_1: address1.trim(),
				address_2: address2.trim() || null,
				city: city.trim(),
				province: province.trim() || null,
				postal_code: postalCode.trim() || null,
				country_code: countryCode.trim()
			};
			if (mode === 'edit' && address) {
				await updateCustomerAddress(customerId, address.id, body);
			} else {
				await createCustomerAddress(customerId, body);
			}
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	const title = $derived(mode === 'edit' ? 'Edit address' : 'Add address');
	const subtitle = $derived(
		mode === 'edit' ? 'Update this address.' : 'Add a new address for this customer.'
	);
	const submitLabel = $derived(
		submitting ? (mode === 'edit' ? 'Saving…' : 'Saving…') : mode === 'edit' ? 'Save' : 'Save address'
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>{title}</Sheet.Title>
				<Sheet.Description>{subtitle}</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if error}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="caf-first-name" class="text-sm font-medium">First name</label>
							<Input
								id="caf-first-name"
								bind:value={firstName}
								placeholder="First name"
								class="h-9"
								disabled={submitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="caf-last-name" class="text-sm font-medium">Last name</label>
							<Input
								id="caf-last-name"
								bind:value={lastName}
								placeholder="Last name"
								class="h-9"
								disabled={submitting}
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="caf-address-1" class="text-sm font-medium">Address line 1</label>
						<Input
							id="caf-address-1"
							bind:value={address1}
							placeholder="Street address"
							class="h-9"
							disabled={submitting}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="caf-address-2" class="text-sm font-medium">
							Address line 2 <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<Input
							id="caf-address-2"
							bind:value={address2}
							placeholder="Apartment, suite, etc."
							class="h-9"
							disabled={submitting}
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="caf-city" class="text-sm font-medium">City</label>
							<Input
								id="caf-city"
								bind:value={city}
								placeholder="City"
								class="h-9"
								disabled={submitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="caf-province" class="text-sm font-medium">
								Province / State <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="caf-province"
								bind:value={province}
								placeholder="Province or state"
								class="h-9"
								disabled={submitting}
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="caf-postal-code" class="text-sm font-medium">
								Postal code <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="caf-postal-code"
								bind:value={postalCode}
								placeholder="Postal code"
								class="h-9"
								disabled={submitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="caf-country-code" class="text-sm font-medium">Country code</label>
							<Input
								id="caf-country-code"
								bind:value={countryCode}
								placeholder="e.g. US, GB"
								class="h-9"
								disabled={submitting}
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="caf-phone" class="text-sm font-medium">
								Phone <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="caf-phone"
								type="tel"
								bind:value={phone}
								placeholder="Phone"
								class="h-9"
								disabled={submitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="caf-company" class="text-sm font-medium">
								Company <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="caf-company"
								bind:value={company}
								placeholder="Company"
								class="h-9"
								disabled={submitting}
							/>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close} disabled={submitting}>Cancel</Button>
				<Button onclick={submit} disabled={submitting}>
					{submitLabel}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
