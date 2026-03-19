<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import X from '@lucide/svelte/icons/x';

	const BASE_CURRENCY_OPTIONS = [
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
		{ id: 'manual', name: 'Manual' },
		{ id: 'stripe', name: 'Stripe' },
		{ id: 'paypal', name: 'PayPal' }
	];

	type Region = {
		id: string;
		name: string;
		currency_code: string;
	};

	interface Props {
		open: boolean;
		region: Region | null;
		onSuccess?: () => void;
	}

	let {
		open = $bindable(false),
		region = null,
		onSuccess = () => {}
	}: Props = $props();

	const { form, errors, enhance, delayed } = superForm({
		id: '',
		name: '',
		currency_code: ''
	}, {
		resetForm: false,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				open = false;
				onSuccess();
			}
		}
	});

	let initializedForId = $state<string | null>(null);
	let automaticTaxes = $state(true);
	let taxInclusivePricing = $state(false);
	let paymentProviderIds = $state<string[]>([]);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			return;
		}

		const nextId = region?.id ?? '';
		if (initializedForId === nextId) return;
		initializedForId = nextId;

		$form = {
			id: nextId,
			name: region?.name ?? '',
			currency_code: region?.currency_code ?? ''
		};
		automaticTaxes = true;
		taxInclusivePricing = false;
		paymentProviderIds = [];
		$errors = {};
	});

	function close() {
		open = false;
	}

	function removePaymentProvider(id: string) {
		paymentProviderIds = paymentProviderIds.filter((p) => p !== id);
	}

	const currencyOptions = $derived(
		region?.currency_code && !BASE_CURRENCY_OPTIONS.some((c) => c.code === region!.currency_code)
			? [
					{ code: region!.currency_code, name: region!.currency_code, symbol: '' },
					...BASE_CURRENCY_OPTIONS
				]
			: BASE_CURRENCY_OPTIONS
	);

	const selectedProvidersLabel = $derived(
		paymentProviderIds.length === 0 ? 'Select providers' : 'Selected'
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the region details.
				</p>
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
						<Select.Root
							type="single"
							value={$form.currency_code || undefined}
							onValueChange={(v) => ($form.currency_code = v ?? '')}
						>
							<Select.Trigger
								id="edit-currency"
								class={cn(
									'h-9 w-full',
									$errors.currency_code && 'border-destructive'
								)}
							>
								{@const selected = currencyOptions.find((c) => c.code === $form.currency_code)}
								{selected ? `${selected.name} (${selected.code})` : 'Select currency'}
								<ChevronDown class="ml-auto size-4 opacity-50" />
							</Select.Trigger>
							<Select.Content>
								{#each currencyOptions as currency (currency.code)}
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

					<!-- Tax Settings -->
					<div class="space-y-4">
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

					<!-- Providers -->
					<div class="border-t pt-6">
						<span class="text-sm font-medium">Providers</span>
						<p class="mt-0.5 text-sm text-muted-foreground">
							Add which payment providers are available in this region.
						</p>
						<div class="mt-4 flex flex-col gap-2">
							<label for="edit-payment-providers" class="text-sm font-medium">Payment Providers</label>
							<Select.Root
								type="multiple"
								value={paymentProviderIds}
								onValueChange={(v) => (paymentProviderIds = v ?? [])}
							>
								<Select.Trigger id="edit-payment-providers" class="h-auto min-h-9 w-full flex-wrap gap-1.5 py-1.5">
									{#if paymentProviderIds.length > 0}
										{#each paymentProviderIds as id}
											{@const provider = PAYMENT_PROVIDER_OPTIONS.find((p) => p.id === id)}
											<span
												class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
											>
												{provider?.name ?? id}
												<button
													type="button"
													class="rounded-sm opacity-70 hover:opacity-100"
													onclick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														removePaymentProvider(id);
													}}
													aria-label="Remove {provider?.name ?? id}"
												>
													<X class="size-3" />
												</button>
											</span>
										{/each}
									{/if}
									<span class="text-muted-foreground">{selectedProvidersLabel}</span>
									<ChevronDown class="ml-auto size-4 shrink-0 opacity-50" />
								</Select.Trigger>
								<Select.Content>
									{#each PAYMENT_PROVIDER_OPTIONS as provider (provider.id)}
										<Select.Item
											value={provider.id}
											label={provider.name}
										>
											{provider.name}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
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