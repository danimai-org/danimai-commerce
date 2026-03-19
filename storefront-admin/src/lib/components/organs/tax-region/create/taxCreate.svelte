<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import Info from '@lucide/svelte/icons/info';

	const COUNTRY_OPTIONS = [
		{ value: '', label: 'Select country' },
		{ value: 'India', label: 'India' },
		{ value: 'United States', label: 'United States' },
		{ value: 'United Kingdom', label: 'United Kingdom' },
		{ value: 'Germany', label: 'Germany' },
		{ value: 'France', label: 'France' },
		{ value: 'Canada', label: 'Canada' },
		{ value: 'Australia', label: 'Australia' },
		{ value: 'Japan', label: 'Japan' },
		{ value: 'Spain', label: 'Spain' },
		{ value: 'Italy', label: 'Italy' },
		{ value: 'Brazil', label: 'Brazil' },
		{ value: 'Mexico', label: 'Mexico' },
		{ value: 'Netherlands', label: 'Netherlands' },
		{ value: 'Singapore', label: 'Singapore' }
	];

	const TAX_PROVIDER_OPTIONS = [{ value: '', label: 'Select provider' }];

	let {
		open = $bindable(false),
		mode = 'create',
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'create';
		onSuccess?: () => void;
	} = $props();

	let selectedCountry = $state('');
	let selectedTaxProvider = $state('');
	let defaultRateName = $state('');
	let defaultRateValue = $state('');
	let defaultRateCode = $state('');

	const { form, errors, enhance, delayed } = superForm(
		{
			name: '',
			tax_provider_id: ''
		},
		{
			resetForm: true,
			onResult: ({ result }) => {
				if (result.status === 200) {
					open = false;
					onSuccess();
				}
			}
		}
	);

	let initialized = $state(false);

	$effect(() => {
		if (!open) {
			initialized = false;
			return;
		}

		if (initialized) return;
		initialized = true;
		selectedCountry = '';
		selectedTaxProvider = '';
		defaultRateName = '';
		defaultRateValue = '';
		defaultRateCode = '';
		$form = {
			name: '',
			tax_provider_id: ''
		};
	});

	function close() {
		open = false;
	}

	$effect(() => {
		const country = selectedCountry.trim();
		$form.name = country;
	});

	$effect(() => {
		$form.tax_provider_id = selectedTaxProvider;
	});

	const title = $derived('Create Tax Region');
	const subtitle = $derived('Create a new tax region to define tax rates for a specific country.');
	const submitLabel = $derived($delayed ? 'Creating...' : 'Save');
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-lg">
		<form action="?/create" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="name" value={$form.name} />
			<input type="hidden" name="tax_provider_id" value={$form.tax_provider_id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>

				<div class="mt-6 grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label for="tr-country" class="text-sm font-medium">Country</label>
						<select
							id="tr-country"
							bind:value={selectedCountry}
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn(
								'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
								$errors.name && 'border-destructive'
							)}
						>
							{#each COUNTRY_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="tr-tax-provider" class="text-sm font-medium">Tax provider</label>
						<select
							id="tr-tax-provider"
							bind:value={selectedTaxProvider}
							aria-invalid={$errors.tax_provider_id ? 'true' : undefined}
							class={cn(
								'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
								$errors.tax_provider_id && 'border-destructive'
							)}
						>
							{#each TAX_PROVIDER_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						{#if $errors.tax_provider_id}
							<span class="text-xs text-destructive">{$errors.tax_provider_id}</span>
						{/if}
					</div>
				</div>

				<div class="mt-6">
					<div class="mb-4 flex items-center gap-1.5">
						<span class="text-sm font-semibold">Default tax rate (Optional)</span>
						<button
							type="button"
							class="rounded-full text-muted-foreground hover:text-foreground"
							aria-label="Info"
						>
							<Info class="size-4 text-muted-foreground" />
						</button>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="tr-default-rate-name" class="text-sm font-medium">Name</label>
							<Input
								id="tr-default-rate-name"
								bind:value={defaultRateName}
								class="h-9"
								placeholder=""
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="tr-default-rate-value" class="text-sm font-medium">Tax rate</label>
							<div class="flex items-center gap-0">
								<span
									class="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground"
								>
									%
								</span>
								<Input
									id="tr-default-rate-value"
									bind:value={defaultRateValue}
									class="h-9 rounded-l-none rounded-r-md"
									type="number"
									step="0.01"
									min="0"
									placeholder=""
								/>
							</div>
						</div>
					</div>
					<div class="mt-4 flex flex-col gap-2">
						<label for="tr-default-rate-code" class="text-sm font-medium">Tax code</label>
						<Input
							id="tr-default-rate-code"
							bind:value={defaultRateCode}
							class="h-9"
							placeholder=""
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{submitLabel}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
