<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	const CURRENCY_OPTIONS = [
		{ code: 'USD', name: 'US Dollar', symbol: '$' },
		{ code: 'INR', name: 'Indian Rupee', symbol: '₹' },
		{ code: 'EUR', name: 'Euro', symbol: '€' },
		{ code: 'GBP', name: 'British Pound', symbol: '£' },
		{ code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
		{ code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
		{ code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
		{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' }
	];

	const PAYMENT_PROVIDER_OPTIONS = [
		{ id: '', name: 'Select provider' },
		{ id: 'manual', name: 'Manual' },
		{ id: 'stripe', name: 'Stripe' },
		{ id: 'paypal', name: 'PayPal' }
	];

	interface Props {
		open: boolean;
		onSuccess?: () => void;
	}

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: Props = $props();

	const { form, errors, enhance, delayed } = superForm({
		name: '',
		currency_code: ''
	}, {
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				open = false;
				onSuccess();
			}
		}
	});

	let initialized = $state(false);
	let automaticTaxes = $state(true);
	let taxInclusivePricing = $state(false);
	let paymentProviderId = $state('');

	$effect(() => {
		if (!open) {
			initialized = false;
			return;
		}

		if (initialized) return;
		initialized = true;
		automaticTaxes = true;
		taxInclusivePricing = false;
		paymentProviderId = '';
		$form = {
			name: '',
			currency_code: ''
		};
		$errors = {};
	});

	function close() {
		open = false;
	}

	function addCountries() {

		// Placeholder - countries modal/sheet would open here
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-2xl">
		<form action="?/create" method="POST" use:enhance class="flex h-full flex-col">
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
									'h-9 w-full',
									$errors.currency_code && 'border-destructive'
								)}
							>
								{@const selected = CURRENCY_OPTIONS.find((c) => c.code === $form.currency_code)}
								{selected ? `${selected.name} (${selected.code})` : 'Select currency'}
								<ChevronDown class="ml-auto size-4 opacity-50" />
							</Select.Trigger>
							<Select.Content>
								{#each CURRENCY_OPTIONS as currency (currency.code)}
									<Select.Item
										value={currency.code}
										label={`${currency.name} (${currency.code})`}
									>
										{currency.name} ({currency.code} {currency.symbol})
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input type="hidden" name="currency_code" value={$form.currency_code} />
						{#if $errors.currency_code}
							<span class="text-xs text-destructive">{$errors.currency_code}</span>
						{/if}
					</div>
				</div>

				<!-- Tax Settings -->
				<div class="mt-6 space-y-4">
					<div class="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
						<div class="flex flex-col gap-0.5">
							<span class="text-sm font-medium">Automatic Taxes</span>
							<span class="text-sm text-muted-foreground">
								When enabled, taxes will only be calculated at checkout based on the shipping address.
							</span>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={automaticTaxes}
							aria-label="Toggle automatic taxes"
							class="relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {automaticTaxes
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
					<div class="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
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
							class="relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {taxInclusivePricing
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
								Add the countries included in this region.
							</p>
						</div>
						<Button type="button" variant="outline" size="sm" onclick={addCountries}>
							Add countries
						</Button>
					</div>
				</div>

				<!-- Providers -->
				<div class="mt-6 border-t pt-6">
					<span class="text-sm font-medium">Providers</span>
					<p class="mt-0.5 text-sm text-muted-foreground">
						Add which payment providers are available in this region.
					</p>
					<div class="mt-4 flex flex-col gap-2">
						<label for="create-payment-providers" class="text-sm font-medium">Payment Providers</label>
						<Select.Root
							type="single"
							value={paymentProviderId || undefined}
							onValueChange={(v) => (paymentProviderId = v ?? '')}
						>
							<Select.Trigger id="create-payment-providers" class="h-9 w-full">
								{@const provider = PAYMENT_PROVIDER_OPTIONS.find((p) => p.id === paymentProviderId)}
								{provider?.name ?? 'Select provider'}
								<ChevronDown class="ml-auto size-4 opacity-50" />
							</Select.Trigger>
							<Select.Content>
								{#each PAYMENT_PROVIDER_OPTIONS.filter((p) => p.id) as provider (provider.id)}
									<Select.Item value={provider.id} label={provider.name}>
										{provider.name}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Creating...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
