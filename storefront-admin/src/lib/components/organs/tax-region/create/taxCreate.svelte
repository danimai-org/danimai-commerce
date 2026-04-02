<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import Info from '@lucide/svelte/icons/info';
	import { Combobox } from '$lib/components/organs/index.js';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { Country } from 'country-state-city';

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

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
					toast.success('Tax region created successfully');
					onSuccess();
				}
			}
		}
	);

	const countries = $derived(
		[...Country.getAllCountries()].sort((a, b) =>
			(a.name ?? '').localeCompare(b.name ?? '')
		)
	);

	let defaultRateName = $state('');
	let defaultRateValue = $state<number | ''>('');
	let defaultRateCode = $state('');

	let initialized = $state(false);

	$effect(() => {
		if (!open) {
			initialized = false;
			return;
		}

		if (initialized) return;
		initialized = true;
		$form = { name: '', tax_provider_id: '' };
		defaultRateName = '';
		defaultRateValue = '';
		defaultRateCode = '';
	});

	function close() {
		open = false;
	}

	const title = $derived('Create Tax Region');
	const subtitle = $derived('Create a new tax region to define tax rates for a specific country.');
	const submitLabel = $derived($delayed ? 'Creating...' : 'Save');
</script>

<Toaster richColors position="top-center" duration={3000} />
<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-lg">
		<form action="?/create" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="name" value={$form.name} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>

				<div class="mt-6 grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label for="tr-country" class="text-sm font-medium">Country</label>
						<Combobox
							id="tr-country"
							bind:value={$form.name}
							class={cn(
								'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
								$errors.name && 'border-destructive'
							)}
							options={countries.map((c) => ({
								id: c.name ?? c.isoCode,
								value: c.name ?? c.isoCode
							}))}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="tr-tax-provider" class="text-sm font-medium">Tax provider</label>
						<Input
							id="tr-tax-provider"
							name="tax_provider_id"
							bind:value={$form.tax_provider_id}
							class={cn('h-9', $errors.tax_provider_id && 'border-destructive')}
							placeholder="Tax provider ID (optional)"
							aria-invalid={$errors.tax_provider_id ? 'true' : undefined}
						/>
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
							<Input id="tr-default-rate-name" bind:value={defaultRateName} class="h-9" />
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
								/>
							</div>
						</div>
					</div>
					<div class="mt-4 flex flex-col gap-2">
						<label for="tr-default-rate-code" class="text-sm font-medium">Tax code</label>
						<Input id="tr-default-rate-code" bind:value={defaultRateCode} class="h-9" />
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
