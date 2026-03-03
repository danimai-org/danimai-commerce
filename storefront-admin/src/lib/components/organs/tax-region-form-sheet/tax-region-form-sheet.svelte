<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { createTaxRegion, updateTaxRegion } from '$lib/tax-regions/api.js';
	import type { TaxRegion } from '$lib/tax-regions/types.js';
	import { cn } from '$lib/utils.js';

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

	let {
		open = $bindable(false),
		mode = 'create',
		region = null as TaxRegion | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'create' | 'edit';
		region?: TaxRegion | null;
		onSuccess?: () => void;
	} = $props();

	let name = $state('');
	let taxProviderId = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	function isValidUUID(str: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(str);
	}

	$effect(() => {
		if (open) {
			error = null;
			if (mode === 'edit' && region) {
				name = region.name;
				taxProviderId = region.tax_provider_id ?? '';
			} else {
				name = '';
				taxProviderId = '';
			}
		}
	});

	function close() {
		if (!submitting) open = false;
	}

	async function submit() {
		error = null;
		if (!name.trim()) {
			error = mode === 'edit' ? 'Name is required' : 'Country is required';
			return;
		}
		const trimmedTaxProviderId = taxProviderId.trim();
		if (trimmedTaxProviderId && !isValidUUID(trimmedTaxProviderId)) {
			error = 'Tax provider ID must be a valid UUID';
			return;
		}
		submitting = true;
		try {
			const payload = {
				name: name.trim(),
				tax_provider_id: trimmedTaxProviderId || null
			};
			if (mode === 'edit' && region) {
				await updateTaxRegion(region.id, payload);
			} else {
				await createTaxRegion(payload);
			}
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	const title = $derived(mode === 'edit' ? 'Edit Tax Region' : 'Create Tax Region');
	const subtitle = $derived(
		mode === 'edit'
			? 'Update the tax region details.'
			: 'Create a new tax region to define tax rates for a specific country.'
	);
	const submitLabel = $derived(
		submitting ? (mode === 'edit' ? 'Saving…' : 'Creating…') : mode === 'edit' ? 'Save' : 'Save'
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
					{#if mode === 'create'}
						<div class="flex flex-col gap-2">
							<label for="tr-country" class="text-sm font-medium">Country</label>
							<select
								id="tr-country"
								bind:value={name}
								class={cn(
									'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
									error && 'border-destructive'
								)}
							>
								{#each COUNTRY_OPTIONS as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
					{:else}
						<div class="flex flex-col gap-2">
							<label for="tr-name" class="text-sm font-medium">Name</label>
							<Input
								id="tr-name"
								bind:value={name}
								placeholder="e.g. India"
								class={cn('h-9', error === 'Name is required' && 'border-destructive')}
							/>
						</div>
					{/if}
					<div class="flex flex-col gap-2">
						<label for="tr-tax-provider" class="text-sm font-medium">Tax provider</label>
						<Input
							id="tr-tax-provider"
							bind:value={taxProviderId}
							placeholder="Tax provider ID (optional, UUID format)"
							class={cn(
								'h-9',
								error === 'Tax provider ID must be a valid UUID' && 'border-destructive'
							)}
						/>
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
