<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { cn } from '$lib/utils.js';

	type StockLocationFormData = {
		id: string;
		name: string;
		address_1: string;
		address_2: string;
		company: string;
		city: string;
		province: string;
		postal_code: string;
		country_code: string;
		phone: string;
	};

	let {
		open = $bindable(false),
		stockLocationForm,
		onSuccess = () => {}
	}: {
		open?: boolean;
		stockLocationForm: SuperValidated<StockLocationFormData>;
		onSuccess?: () => void | Promise<void>;
	} = $props();

	let apiError = $state<string | null>(null);

	// SuperValidated from `load` is stable for this route; superForm only needs the initial snapshot.
	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, delayed, reset } = superForm(stockLocationForm, {
		resetForm: true,
		invalidateAll: false,
		onResult: async ({ result }) => {
			if (result.type === 'failure') {
				const d = result.data as { error?: string } | undefined;
				apiError = d?.error ?? null;
				return;
			}
			if (result.type === 'error') {
				apiError =
					result.error instanceof Error
						? result.error.message
						: String(result.error ?? 'Something went wrong');
				return;
			}
			if (result.type === 'success') {
				apiError = null;
				open = false;
				await onSuccess();
			}
		}
	});

	const emptyData: StockLocationFormData = {
		id: '',
		name: '',
		address_1: '',
		address_2: '',
		company: '',
		city: '',
		province: '',
		postal_code: '',
		country_code: '',
		phone: ''
	};

	let initializedCreate = $state(false);

	$effect(() => {
		if (!open) {
			initializedCreate = false;
			return;
		}
		if (initializedCreate) return;
		initializedCreate = true;
		apiError = null;
		reset({ data: { ...emptyData } });
	});

	function close() {
		if (!$delayed) open = false;
	}

	const submitLabel = $derived($delayed ? 'Creating…' : 'Create');
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" action="?/create" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Location</h2>
				<p class="mt-1 text-sm text-muted-foreground">Add a new stock location or warehouse.</p>
				{#if apiError && !$delayed}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{apiError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="loc-name" class="text-sm font-medium">Name</label>
						<Input
							id="loc-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. Main Warehouse"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn('h-9', $errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<p class="text-sm font-medium">Address</p>
					<div class="flex flex-col gap-3 rounded-lg border p-3">
						<div class="flex flex-col gap-2">
							<label for="loc-address-1" class="text-xs font-medium text-muted-foreground"
								>Address line 1</label
							>
							<Input
								id="loc-address-1"
								name="address_1"
								bind:value={$form.address_1}
								placeholder="Street, number"
								aria-invalid={$errors.address_1 ? 'true' : undefined}
								class={cn('h-9', $errors.address_1 && 'border-destructive')}
							/>
							{#if $errors.address_1}
								<span class="text-xs text-destructive">{$errors.address_1}</span>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label for="loc-address-2" class="text-xs font-medium text-muted-foreground"
								>Address line 2</label
							>
							<Input
								id="loc-address-2"
								name="address_2"
								bind:value={$form.address_2}
								placeholder="Apt, suite, etc."
								aria-invalid={$errors.address_2 ? 'true' : undefined}
								class={cn('h-9', $errors.address_2 && 'border-destructive')}
							/>
							{#if $errors.address_2}
								<span class="text-xs text-destructive">{$errors.address_2}</span>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label for="loc-company" class="text-xs font-medium text-muted-foreground">Company</label>
							<Input
								id="loc-company"
								name="company"
								bind:value={$form.company}
								placeholder="Company name"
								aria-invalid={$errors.company ? 'true' : undefined}
								class={cn('h-9', $errors.company && 'border-destructive')}
							/>
							{#if $errors.company}
								<span class="text-xs text-destructive">{$errors.company}</span>
							{/if}
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-2">
								<label for="loc-city" class="text-xs font-medium text-muted-foreground">City</label>
								<Input
									id="loc-city"
									name="city"
									bind:value={$form.city}
									placeholder="City"
									aria-invalid={$errors.city ? 'true' : undefined}
									class={cn('h-9', $errors.city && 'border-destructive')}
								/>
								{#if $errors.city}
									<span class="text-xs text-destructive">{$errors.city}</span>
								{/if}
							</div>
							<div class="flex flex-col gap-2">
								<label for="loc-province" class="text-xs font-medium text-muted-foreground"
									>Province / State</label
								>
								<Input
									id="loc-province"
									name="province"
									bind:value={$form.province}
									placeholder="Province or state"
									aria-invalid={$errors.province ? 'true' : undefined}
									class={cn('h-9', $errors.province && 'border-destructive')}
								/>
								{#if $errors.province}
									<span class="text-xs text-destructive">{$errors.province}</span>
								{/if}
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-2">
								<label for="loc-postal-code" class="text-xs font-medium text-muted-foreground"
									>Postal code</label
								>
								<Input
									id="loc-postal-code"
									name="postal_code"
									bind:value={$form.postal_code}
									placeholder="Postal code"
									aria-invalid={$errors.postal_code ? 'true' : undefined}
									class={cn('h-9', $errors.postal_code && 'border-destructive')}
								/>
								{#if $errors.postal_code}
									<span class="text-xs text-destructive">{$errors.postal_code}</span>
								{/if}
							</div>
							<div class="flex flex-col gap-2">
								<label for="loc-country-code" class="text-xs font-medium text-muted-foreground"
									>Country code</label
								>
								<Input
									id="loc-country-code"
									name="country_code"
									bind:value={$form.country_code}
									placeholder="e.g. US"
									aria-invalid={$errors.country_code ? 'true' : undefined}
									class={cn('h-9', $errors.country_code && 'border-destructive')}
								/>
								{#if $errors.country_code}
									<span class="text-xs text-destructive">{$errors.country_code}</span>
								{/if}
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="loc-phone" class="text-xs font-medium text-muted-foreground">Phone</label>
							<Input
								id="loc-phone"
								name="phone"
								bind:value={$form.phone}
								placeholder="Phone number"
								aria-invalid={$errors.phone ? 'true' : undefined}
								class={cn('h-9', $errors.phone && 'border-destructive')}
							/>
							{#if $errors.phone}
								<span class="text-xs text-destructive">{$errors.phone}</span>
							{/if}
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={close} disabled={$delayed}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{submitLabel}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
