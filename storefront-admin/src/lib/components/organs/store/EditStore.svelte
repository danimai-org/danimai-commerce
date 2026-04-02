<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import type { ComboboxOption } from '$lib/components/organs/combobox/combobox.svelte';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from '../../../../routes/store/$types';
	import { cn } from '$lib/utils.js';

	type Store = Awaited<ReturnType<typeof client.stores.get>>['data'];
	type StoreUpdateForm = PageData['storeUpdateForm'];

	let {
		open = $bindable(false),
		storeUpdateForm,
		store,
		onSuccess = () => {}
	}: {
		open?: boolean;
		storeUpdateForm: StoreUpdateForm;
		store?: Store;
		onSuccess?: () => void;
	} = $props();

	const listQuery = { page: 1, limit: 100 } as const;

	const regionsQuery = createQuery(() => ({
		queryKey: ['edit-store', 'regions', listQuery.page, listQuery.limit],
		queryFn: () => client['regions'].get({ query: listQuery }),
		enabled: open
	}));
	const salesChannelsQuery = createQuery(() => ({
		queryKey: ['edit-store', 'sales-channels', listQuery.page, listQuery.limit],
		queryFn: () => client['sales-channels'].get({ query: listQuery }),
		enabled: open
	}));
	const stockLocationsQuery = createQuery(() => ({
		queryKey: ['edit-store', 'stock-locations', listQuery.page, listQuery.limit],
		queryFn: () => client['stock-locations'].get({ query: listQuery }),
		enabled: open
	}));
	const currenciesQuery = createQuery(() => ({
		queryKey: ['edit-store', 'currencies', listQuery.page, listQuery.limit],
		queryFn: () => client['currencies'].get({ query: listQuery }),
		enabled: open
	}));

	const regionOptions = $derived<ComboboxOption[]>(
		(regionsQuery.data?.data?.rows ?? []).map((r) => ({
			id: r.id,
			value: r.name
		}))
	);
	const salesChannelOptions = $derived<ComboboxOption[]>(
		(salesChannelsQuery.data?.data?.rows ?? []).map((r) => ({
			id: r.id,
			value: r.name
		}))
	);
	const locationOptions = $derived<ComboboxOption[]>(
		(stockLocationsQuery.data?.data?.rows ?? []).map((r) => ({
			id: r.id,
			value: r.name ?? r.id
		}))
	);
	const currencyOptions = $derived<ComboboxOption[]>(
		(currenciesQuery.data?.data?.rows ?? []).map((r) => ({
			id: r.code,
			value: `${r.code} — ${r.name}`
		}))
	);

	const optionsLoading = $derived(
		regionsQuery.isPending ||
			salesChannelsQuery.isPending ||
			stockLocationsQuery.isPending ||
			currenciesQuery.isPending
	);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, delayed, reset, message } = superForm(storeUpdateForm, {
		id: 'edit-store-form',
		resetForm: false,
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				open = false;
				onSuccess();
				return;
			}
			if (result.type === 'failure') {
				const d = result.data as { error?: string } | undefined;
				if (d?.error) message.set(d.error);
			}
		}
	});

	$effect(() => {
		if (!open) return;
		const s = store;
		if (s) {
			reset({
				data: {
					id: s.id,
					name: s.name,
					default_currency_code: s.default_currency_code ?? '',
					default_sales_channel_id: s.default_sales_channel_id ?? '',
					default_region_id: s.default_region_id ?? '',
					default_location_id: s.default_location_id ?? ''
				}
			});
		} else {
			reset({
				data: {
					id: '',
					name: '',
					default_currency_code: '',
					default_sales_channel_id: '',
					default_region_id: '',
					default_location_id: ''
				}
			});
		}
		message.set('');
	});

	function close() {
		open = false;
		message.set('');
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" action="?/updateStore" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" value={$form.id ?? ''} />
			<input type="hidden" name="default_currency_code" value={$form.default_currency_code} />
			<input type="hidden" name="default_sales_channel_id" value={$form.default_sales_channel_id} />
			<input type="hidden" name="default_region_id" value={$form.default_region_id} />
			<input type="hidden" name="default_location_id" value={$form.default_location_id} />

			<div class="flex h-full flex-col">
				<div class="flex-1 overflow-auto p-6 pt-12">
					<h2 class="text-lg font-semibold">Edit store</h2>
					<p class="mt-1 text-sm text-muted-foreground">Update your store's details.</p>
					{#if $message}
						<div
							class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{$message}
						</div>
					{/if}
					<div class="mt-6 flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-store-name" class="text-sm font-medium">Name</label>
							<Input
								id="edit-store-name"
								name="name"
								type="text"
								bind:value={$form.name}
								placeholder="Store name"
								aria-invalid={$errors.name ? 'true' : undefined}
								class={cn('h-9', $errors.name && 'border-destructive')}
							/>
							{#if $errors.name}
								<span class="text-xs text-destructive">{$errors.name}</span>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-store-currency" class="text-sm font-medium">Default currency</label>
							<Combobox
								id="edit-store-currency"
								options={currencyOptions}
								bind:value={$form.default_currency_code}
								placeholder="Select currency"
								disabled={optionsLoading}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-store-region" class="text-sm font-medium">Default region</label>
							<Combobox
								id="edit-store-region"
								options={regionOptions}
								bind:value={$form.default_region_id}
								placeholder="Select region"
								disabled={optionsLoading}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-store-sales-channel" class="text-sm font-medium"
								>Default sales channel</label
							>
							<Combobox
								id="edit-store-sales-channel"
								options={salesChannelOptions}
								bind:value={$form.default_sales_channel_id}
								placeholder="Select sales channel"
								disabled={optionsLoading}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-store-location" class="text-sm font-medium">Default location</label>
							<Combobox
								id="edit-store-location"
								options={locationOptions}
								bind:value={$form.default_location_id}
								placeholder="Select location"
								disabled={optionsLoading}
							/>
						</div>
					</div>
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button type="button" variant="outline" onclick={close} disabled={$delayed}>Cancel</Button>
					<Button type="submit" disabled={$delayed || optionsLoading}>
						{$delayed ? 'Saving…' : 'Save'}
					</Button>
				</div>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
