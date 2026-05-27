<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import {
		ACCOUNT_STORAGE_KEY,
		ADDRESSES_STORAGE_KEY_PREFIX,
		parseStoredAccount,
		storageKeyForEmail
	} from '$lib/account/storage';
	import { AddAddressModal, type AddressFormValues } from '$lib/components/account';

	type SavedAddress = {
		id: string;
		name: string;
		line1: string;
		line2: string;
		city: string;
		state: string;
		postal: string;
		phone: string;
		isDefault: boolean;
	};

	const defaultEmail = 'guest@denimai.com';

	let addresses = $state<SavedAddress[]>([]);
	let selectedId = $state('');
	let addressModalOpen = $state(false);
	let editingId = $state<string | null>(null);

	const emailForAddresses = $derived.by(() => {
		const fromUrl = $page.url.searchParams.get('email')?.trim();
		if (fromUrl) return fromUrl;
		if (!browser) return defaultEmail;
		return parseStoredAccount(localStorage.getItem(ACCOUNT_STORAGE_KEY))?.email ?? defaultEmail;
	});

	const addressesStorageKey = $derived(
		storageKeyForEmail(ADDRESSES_STORAGE_KEY_PREFIX, emailForAddresses, defaultEmail)
	);

	const parseAddresses = (raw: string | null): SavedAddress[] => {
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed
				.map((item) => ({
					id: String(item?.id ?? ''),
					name: String(item?.name ?? ''),
					line1: String(item?.line1 ?? ''),
					line2: String(item?.line2 ?? ''),
					city: String(item?.city ?? ''),
					state: String(item?.state ?? ''),
					postal: String(item?.postal ?? ''),
					phone: String(item?.phone ?? ''),
					isDefault: Boolean(item?.isDefault)
				}))
				.filter((entry) => entry.id && entry.name && entry.line1);
		} catch {
			return [];
		}
	};

	const persistAddresses = () => {
		if (!browser) return;
		localStorage.setItem(addressesStorageKey, JSON.stringify(addresses));
	};

	$effect(() => {
		if (!browser) return;
		const parsed = parseAddresses(localStorage.getItem(addressesStorageKey));
		const defaultEntry = parsed.find((entry) => entry.isDefault) ?? parsed[0];
		addresses = parsed;
		selectedId = defaultEntry?.id ?? '';
	});

	const modalTitle = $derived(editingId ? 'Edit Address' : 'Add Address');

	const modalInitial = $derived.by((): Partial<AddressFormValues> => {
		if (!editingId) {
			return { isDefault: addresses.length === 0 };
		}
		const entry = addresses.find((item) => item.id === editingId);
		if (!entry) return {};
		return {
			name: entry.name,
			line1: entry.line1,
			line2: entry.line2,
			city: entry.city,
			state: entry.state,
			postal: entry.postal,
			phone: entry.phone,
			isDefault: entry.isDefault
		};
	});

	const openAddModal = () => {
		editingId = null;
		addressModalOpen = true;
	};

	const openEditModal = (entry: SavedAddress) => {
		editingId = entry.id;
		addressModalOpen = true;
	};

	const closeModal = () => {
		addressModalOpen = false;
		editingId = null;
	};

	const formatAddressLines = (entry: SavedAddress): string => {
		const parts = [
			entry.line1,
			entry.line2,
			[entry.postal, entry.city].filter(Boolean).join(', '),
			entry.state
		].filter(Boolean);
		return parts.join(', ');
	};

	const saveAddress = (values: AddressFormValues) => {
		const payload: SavedAddress = {
			id: editingId ?? crypto.randomUUID(),
			name: values.name,
			line1: values.line1,
			line2: values.line2,
			city: values.city,
			state: values.state,
			postal: values.postal,
			phone: values.phone,
			isDefault: values.isDefault
		};

		if (editingId) {
			addresses = addresses.map((entry) => {
				if (entry.id === editingId) return payload;
				if (values.isDefault) return { ...entry, isDefault: false };
				return entry;
			});
		} else {
			addresses = values.isDefault
				? [...addresses.map((entry) => ({ ...entry, isDefault: false })), payload]
				: [...addresses, payload];
		}

		if (payload.isDefault) selectedId = payload.id;
		persistAddresses();
		closeModal();
	};

	const removeAddress = (id: string) => {
		const removed = addresses.find((entry) => entry.id === id);
		addresses = addresses.filter((entry) => entry.id !== id);
		if (removed?.isDefault && addresses.length > 0) {
			addresses = addresses.map((entry, index) => ({
				...entry,
				isDefault: index === 0
			}));
		}
		if (selectedId === id) {
			selectedId = addresses.find((entry) => entry.isDefault)?.id ?? addresses[0]?.id ?? '';
		}
		persistAddresses();
	};

	const setDefault = (id: string) => {
		addresses = addresses.map((entry) => ({
			...entry,
			isDefault: entry.id === id
		}));
		selectedId = id;
		persistAddresses();
	};

	const selectAddress = (id: string) => {
		selectedId = id;
	};
</script>

<svelte:head>
	<title>My Addresses - Denimai</title>
</svelte:head>

<section class="account-panel-inner">
	<header class="account-panel-header">
		<h2 class="account-panel-heading">My Addresses</h2>
	</header>

	<div class="account-panel-toolbar">
		<h3 class="account-panel-subtitle">All Addresses</h3>
		<button type="button" class="account-add-link" onclick={openAddModal}>+ Add New Address</button>
	</div>

	<div class="account-panel-body">
		{#if addresses.length === 0}
			<p class="account-empty">No saved addresses yet.</p>
		{:else}
			<ul class="account-address-list">
				{#each addresses as entry (entry.id)}
					<li class="account-address-card" class:account-address-card--selected={selectedId === entry.id}>
						<label class="account-address-select">
							<input
								type="radio"
								name="default-address"
								checked={selectedId === entry.id}
								onchange={() => selectAddress(entry.id)}
							/>
							<span class="account-address-radio" aria-hidden="true"></span>
							<span class="account-address-copy">
								<strong>{entry.name}</strong>
								<span>{formatAddressLines(entry)}</span>
								{#if entry.phone}
									<span class="account-address-phone">{entry.phone}</span>
								{/if}
							</span>
						</label>
						<div class="account-address-actions">
							{#if !entry.isDefault}
								<button type="button" class="account-text-link" onclick={() => setDefault(entry.id)}>
									Set as Default
								</button>
								<span class="account-action-sep">|</span>
							{/if}
							<button type="button" class="account-text-link" onclick={() => openEditModal(entry)}>Edit</button>
							<span class="account-action-sep">|</span>
							<button type="button" class="account-text-link" onclick={() => removeAddress(entry.id)}>Remove</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<AddAddressModal
	open={addressModalOpen}
	title={modalTitle}
	seed={editingId ?? 'new'}
	initial={modalInitial}
	onClose={closeModal}
	onSave={saveAddress}
/>
