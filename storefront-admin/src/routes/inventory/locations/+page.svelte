<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DropdownMenu } from 'bits-ui';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	
	const API_BASE = 'http://localhost:8000/admin';

	type StockLocationAddress = {
		address_1: string | null;
		address_2: string | null;
		company: string | null;
		city: string | null;
		province: string | null;
		postal_code: string | null;
		country_code: string | null;
		phone: string | null;
	};

	type StockLocation = {
		id: string;
		name: string | null;
		address_id: string | null;
		address?: StockLocationAddress | null;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let locationsData = $state<{ data: StockLocation[]; pagination: Pagination } | null>(null);
	let locationsLoading = $state(true);
	let locationsError = $state<string | null>(null);
	let deleteConfirmOpen = $state(false);
	let locationToDelete = $state<StockLocation | null>(null);
	let deleteSubmitting = $state(false);
	let deleteError = $state<string | null>(null);

	async function fetchLocations() {
		locationsLoading = true;
		locationsError = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			if (searchQuery.trim()) {
				params.append('search', searchQuery.trim());
			}
			const res = await fetch(`${API_BASE}/stock-locations?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			locationsData = (await res.json()) as { data: StockLocation[]; pagination: Pagination };
		} catch (e) {
			locationsError = e instanceof Error ? e.message : String(e);
			locationsData = null;
		} finally {
			locationsLoading = false;
		}
	}

	$effect(() => {
		page;
		limit;
		searchQuery;
		fetchLocations();
	});

	const locations = $derived(locationsData?.data ?? []);
	const locationsPagination = $derived(locationsData?.pagination ?? null);
	const locationsStart = $derived(
		locationsPagination ? (locationsPagination.page - 1) * locationsPagination.limit + 1 : 0
	);
	const locationsEnd = $derived(
		locationsPagination ? Math.min(locationsPagination.page * locationsPagination.limit, locationsPagination.total) : 0
	);

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function formatAddress(addr: StockLocationAddress | null | undefined): string {
		if (!addr) return '–';
		const parts = [
			addr.address_1,
			addr.address_2,
			[addr.city, addr.province].filter(Boolean).join(', '),
			addr.postal_code,
			addr.country_code,
			addr.company
		].filter(Boolean);
		return parts.length ? parts.join(' · ') : '–';
	}

	function handleSearch() {
		page = 1;
		fetchLocations();
	}

	// Create location sheet
	let createSheetOpen = $state(false);
	let createName = $state('');
	let createAddress1 = $state('');
	let createAddress2 = $state('');
	let createCompany = $state('');
	let createCity = $state('');
	let createProvince = $state('');
	let createPostalCode = $state('');
	let createCountryCode = $state('');
	let createPhone = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreateSheet() {
		createSheetOpen = true;
		createName = '';
		createAddress1 = '';
		createAddress2 = '';
		createCompany = '';
		createCity = '';
		createProvince = '';
		createPostalCode = '';
		createCountryCode = '';
		createPhone = '';
		createError = null;
	}

	function closeCreateSheet() {
		createSheetOpen = false;
	}

	async function submitCreate() {
		createError = null;
		createSubmitting = true;
		try {
			const addressFields = {
				address_1: createAddress1.trim() || null,
				address_2: createAddress2.trim() || null,
				company: createCompany.trim() || null,
				city: createCity.trim() || null,
				province: createProvince.trim() || null,
				postal_code: createPostalCode.trim() || null,
				country_code: createCountryCode.trim() || null,
				phone: createPhone.trim() || null
			};
			const hasAddress = Object.values(addressFields).some((v) => v != null && v !== '');
			const payload: {
				name: string | null;
				address?: typeof addressFields;
			} = { name: createName.trim() || null };
			if (hasAddress) payload.address = addressFields;

			const res = await fetch(`${API_BASE}/stock-locations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					stock_locations: [payload]
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreateSheet();
			fetchLocations();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit location sheet
	let editSheetOpen = $state(false);
	let editLocation = $state<StockLocation | null>(null);
	let editName = $state('');
	let editAddress1 = $state('');
	let editAddress2 = $state('');
	let editCompany = $state('');
	let editCity = $state('');
	let editProvince = $state('');
	let editPostalCode = $state('');
	let editCountryCode = $state('');
	let editPhone = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEditSheet(location: StockLocation) {
		editLocation = location;
		editSheetOpen = true;
		editName = location.name ?? '';
		const addr = location.address;
		editAddress1 = addr?.address_1 ?? '';
		editAddress2 = addr?.address_2 ?? '';
		editCompany = addr?.company ?? '';
		editCity = addr?.city ?? '';
		editProvince = addr?.province ?? '';
		editPostalCode = addr?.postal_code ?? '';
		editCountryCode = addr?.country_code ?? '';
		editPhone = addr?.phone ?? '';
		editError = null;
	}

	function closeEditSheet() {
		editSheetOpen = false;
		editLocation = null;
	}

	async function submitEdit() {
		if (!editLocation) return;
		editError = null;
		editSubmitting = true;
		try {
			const addressFields = {
				address_1: editAddress1.trim() || null,
				address_2: editAddress2.trim() || null,
				company: editCompany.trim() || null,
				city: editCity.trim() || null,
				province: editProvince.trim() || null,
				postal_code: editPostalCode.trim() || null,
				country_code: editCountryCode.trim() || null,
				phone: editPhone.trim() || null
			};
			const hasAddress = Object.values(addressFields).some((v) => v != null && v !== '');
			const payload: { name: string | null; address?: typeof addressFields } = {
				name: editName.trim() || null
			};
			if (hasAddress) payload.address = addressFields;

			const res = await fetch(`${API_BASE}/stock-locations/${editLocation.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEditSheet();
			fetchLocations();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	function openDeleteConfirm(location: StockLocation) {
		locationToDelete = location;
		locationsError = null;
		deleteError = null;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			locationToDelete = null;
			deleteError = null;
		}
	}

	async function confirmDeleteLocation() {
		const location = locationToDelete;
		if (!location) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			const res = await fetch(`${API_BASE}/stock-locations`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stock_location_ids: [location.id] })
			});
			if (!res.ok) {
				const text = await res.text();
				let message = text;
				try {
					const json = JSON.parse(text) as { message?: string };
					if (json.message) message = json.message;
				} catch {
					// use text as-is
				}
				deleteError = message;
				return;
			}
			deleteConfirmOpen = false;
			locationToDelete = null;
			fetchLocations();
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<MapPin class="size-4" />
				<span class="font-semibold">Location</span>
			</div>
			<Button size="sm" onclick={openCreateSheet}>Create</Button>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2">
					<div class="relative w-64">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={searchQuery}
							class="h-9 rounded-md pl-9"
							onkeydown={(e) => {
								if (e.key === 'Enter') handleSearch();
							}}
						/>
					</div>
					<button
						type="button"
						class="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<ArrowUpDown class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				</div>
			</div>
		</div>

		{#if locationsError}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{locationsError}
			</div>
		{:else if locationsLoading}
			<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else}
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Address</th>
							<th class="px-4 py-3 text-left font-medium">Phone</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
							<th class="w-12 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if locations.length === 0}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
									No locations found.
								</td>
							</tr>
						{:else}
							{#each locations as location (location.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">{location.name ?? '–'}</td>
									<td class="px-4 py-3 text-sm text-muted-foreground">
										{formatAddress(location.address)}
									</td>
									<td class="px-4 py-3 text-muted-foreground">{location.address?.phone ?? '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(location.created_at)}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(location.updated_at)}</td>
									<td class="px-4 py-3">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
											>
												<MoreHorizontal class="size-4" />
												<span class="sr-only">Actions</span>
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content
													class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
													sideOffset={4}
												>
													<DropdownMenu.Item
														textValue="Edit"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openEditSheet(location)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Delete"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openDeleteConfirm(location)}
													>
														<Trash2 class="size-4" />
														Delete
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
				<p class="text-sm text-muted-foreground">
					{#if locationsPagination && locationsPagination.total > 0}
						{locationsStart} – {locationsEnd} of {locationsPagination.total} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!locationsPagination?.has_previous_page}
						onclick={() => (page = page - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{locationsPagination?.page ?? 1} of {locationsPagination?.total_pages ?? 1} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!locationsPagination?.has_next_page}
						onclick={() => (page = page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Delete location confirmation -->
<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="location"
	entityTitle={locationToDelete?.name ?? locationToDelete?.id ?? ''}
	onConfirm={confirmDeleteLocation}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
	error={deleteError}
/>

<!-- Create Location Sheet -->
<Sheet.Root bind:open={createSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Location</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new stock location or warehouse.
				</p>
				{#if createError && !createSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-name" class="text-sm font-medium">Name</label>
						<Input
							id="create-name"
							bind:value={createName}
							placeholder="e.g. Main Warehouse"
							class="h-9"
						/>
					</div>
					<p class="text-sm font-medium">Address</p>
					<div class="flex flex-col gap-3 rounded-lg border p-3">
						<div class="flex flex-col gap-2">
							<label for="create-address-1" class="text-xs font-medium text-muted-foreground">Address line 1</label>
							<Input
								id="create-address-1"
								bind:value={createAddress1}
								placeholder="Street, number"
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-address-2" class="text-xs font-medium text-muted-foreground">Address line 2</label>
							<Input
								id="create-address-2"
								bind:value={createAddress2}
								placeholder="Apt, suite, etc."
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-company" class="text-xs font-medium text-muted-foreground">Company</label>
							<Input
								id="create-company"
								bind:value={createCompany}
								placeholder="Company name"
								class="h-9"
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-2">
								<label for="create-city" class="text-xs font-medium text-muted-foreground">City</label>
								<Input
									id="create-city"
									bind:value={createCity}
									placeholder="City"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-province" class="text-xs font-medium text-muted-foreground">Province / State</label>
								<Input
									id="create-province"
									bind:value={createProvince}
									placeholder="Province or state"
									class="h-9"
								/>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-2">
								<label for="create-postal-code" class="text-xs font-medium text-muted-foreground">Postal code</label>
								<Input
									id="create-postal-code"
									bind:value={createPostalCode}
									placeholder="Postal code"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-country-code" class="text-xs font-medium text-muted-foreground">Country code</label>
								<Input
									id="create-country-code"
									bind:value={createCountryCode}
									placeholder="e.g. US"
									class="h-9"
								/>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-phone" class="text-xs font-medium text-muted-foreground">Phone</label>
							<Input
								id="create-phone"
								bind:value={createPhone}
								placeholder="Phone number"
								class="h-9"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreateSheet} disabled={createSubmitting}>
					Cancel
				</Button>
				<Button onclick={submitCreate} disabled={createSubmitting}>
					{createSubmitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Location Sheet -->
<Sheet.Root bind:open={editSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Location</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the stock location and address.
				</p>
				{#if editError && !editSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-name"
							bind:value={editName}
							placeholder="e.g. Main Warehouse"
							class="h-9"
						/>
					</div>
					<p class="text-sm font-medium">Address</p>
					<div class="flex flex-col gap-3 rounded-lg border p-3">
						<div class="flex flex-col gap-2">
							<label for="edit-address-1" class="text-xs font-medium text-muted-foreground">Address line 1</label>
							<Input
								id="edit-address-1"
								bind:value={editAddress1}
								placeholder="Street, number"
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-address-2" class="text-xs font-medium text-muted-foreground">Address line 2</label>
							<Input
								id="edit-address-2"
								bind:value={editAddress2}
								placeholder="Apt, suite, etc."
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-company" class="text-xs font-medium text-muted-foreground">Company</label>
							<Input
								id="edit-company"
								bind:value={editCompany}
								placeholder="Company name"
								class="h-9"
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-2">
								<label for="edit-city" class="text-xs font-medium text-muted-foreground">City</label>
								<Input
									id="edit-city"
									bind:value={editCity}
									placeholder="City"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="edit-province" class="text-xs font-medium text-muted-foreground">Province / State</label>
								<Input
									id="edit-province"
									bind:value={editProvince}
									placeholder="Province or state"
									class="h-9"
								/>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-2">
								<label for="edit-postal-code" class="text-xs font-medium text-muted-foreground">Postal code</label>
								<Input
									id="edit-postal-code"
									bind:value={editPostalCode}
									placeholder="Postal code"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="edit-country-code" class="text-xs font-medium text-muted-foreground">Country code</label>
								<Input
									id="edit-country-code"
									bind:value={editCountryCode}
									placeholder="e.g. US"
									class="h-9"
								/>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-phone" class="text-xs font-medium text-muted-foreground">Phone</label>
							<Input
								id="edit-phone"
								bind:value={editPhone}
								placeholder="Phone number"
								class="h-9"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEditSheet} disabled={editSubmitting}>
					Cancel
				</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
