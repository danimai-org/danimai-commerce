<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Info from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils.js';

	// Common countries for Country dropdown (region name)
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

	const API_BASE = 'http://localhost:8000';

	type TaxRegion = {
		id: string;
		name: string;
		tax_provider_id: string | null;
		parent_id: string | null;
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

	type TaxRegionsResponse = {
		data: TaxRegion[];
		pagination: Pagination;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let sortingField = $state('created_at');
	let sortingDirection = $state<'asc' | 'desc'>('desc');

	let data = $state<TaxRegionsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchTaxRegions() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: sortingField,
				sorting_direction: sortingDirection
			});
			const res = await fetch(`${API_BASE}/tax-regions?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			data = (await res.json()) as TaxRegionsResponse;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			data = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		page;
		limit;
		sortingField;
		sortingDirection;
		fetchTaxRegions();
	});

	const taxRegions = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	const filteredTaxRegions = $derived(
		searchQuery.trim()
			? taxRegions.filter((r) =>
					r.name.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: taxRegions
	);

	let deleteConfirmOpen = $state(false);
	let regionToDelete = $state<TaxRegion | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteConfirm(region: TaxRegion) {
		regionToDelete = region;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			regionToDelete = null;
		}
	}

	async function confirmDeleteTaxRegion() {
		if (!regionToDelete) return;
		deleteSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/tax-regions`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tax_region_ids: [regionToDelete.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			deleteConfirmOpen = false;
			regionToDelete = null;
			fetchTaxRegions();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	// Create sheet
	let createOpen = $state(false);
	let createCountry = $state('');
	let createTaxProviderId = $state('');
	let createDefaultRateName = $state('');
	let createDefaultRateValue = $state('');
	let createDefaultRateCode = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createCountry = '';
		createTaxProviderId = '';
		createDefaultRateName = '';
		createDefaultRateValue = '';
		createDefaultRateCode = '';
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	async function submitCreate() {
		createError = null;
		if (!createCountry.trim()) {
			createError = 'Country is required';
			return;
		}
		createSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/tax-regions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tax_regions: [
						{
							name: createCountry.trim(),
							tax_provider_id: createTaxProviderId.trim() || null
						}
					]
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreate();
			fetchTaxRegions();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit sheet
	let editOpen = $state(false);
	let editRegion = $state<TaxRegion | null>(null);
	let editName = $state('');
	let editTaxProviderId = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(region: TaxRegion) {
		editRegion = region;
		editOpen = true;
		editName = region.name;
		editTaxProviderId = region.tax_provider_id ?? '';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editRegion = null;
	}

	async function submitEdit() {
		if (!editRegion) return;
		editError = null;
		if (!editName.trim()) {
			editError = 'Name is required';
			return;
		}
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/tax-regions/${editRegion.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: editName.trim(),
					tax_provider_id: editTaxProviderId.trim() || null
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			fetchTaxRegions();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListFilter class="size-4" />
				<span class="font-semibold">Tax Regions</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
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

		{#if error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{error}
			</div>
		{:else if loading}
			<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else}
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Tax provider</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if filteredTaxRegions.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
									No tax regions found.
								</td>
							</tr>
						{:else}
							{#each filteredTaxRegions as region (region.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">{region.name}</td>
									<td class="px-4 py-3 text-muted-foreground">
										{region.tax_provider_id ?? '—'}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{formatDate(region.created_at)}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{formatDate(region.updated_at)}
									</td>
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
															onSelect={() => openEdit(region)}
														>
															<Pencil class="size-4" />
															Edit
														</DropdownMenu.Item>
														<DropdownMenu.Item
															textValue="Delete"
															class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
															onSelect={() => openDeleteConfirm(region)}
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
					{#if pagination && pagination.total > 0}
						{start} – {end} of {pagination.total} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_previous_page}
						onclick={() => (page = page - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{pagination?.page ?? 1} of {pagination?.total_pages ?? 1} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_next_page}
						onclick={() => (page = page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create Tax Region Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Tax Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Create a new tax region to define tax rates for a specific country.
				</p>
				{#if createError && !createSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-2">
							<label for="create-country" class="text-sm font-medium">Country</label>
							<select
								id="create-country"
								bind:value={createCountry}
								class={cn(
									'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
									createError === 'Country is required' && 'border-destructive'
								)}
							>
								{#each COUNTRY_OPTIONS as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-tax-provider" class="text-sm font-medium">Tax provider</label>
							<Input
								id="create-tax-provider"
								bind:value={createTaxProviderId}
								placeholder="Tax provider ID (optional)"
								class="h-9"
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2 pt-2">
						<div class="flex items-center gap-1.5">
							<span class="text-sm font-medium">Default tax rate (Optional)</span>
							<button
								type="button"
								class="text-muted-foreground hover:text-foreground"
								aria-label="More info"
							>
								<Info class="size-4" />
							</button>
						</div>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div class="flex flex-col gap-2">
								<label for="create-default-rate-name" class="text-sm font-medium">Name</label>
								<Input
									id="create-default-rate-name"
									bind:value={createDefaultRateName}
									placeholder="Default rate name"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-default-rate-value" class="text-sm font-medium">Tax rate</label>
								<div class="relative">
									<Input
										id="create-default-rate-value"
										type="text"
										inputmode="decimal"
										bind:value={createDefaultRateValue}
										placeholder="0"
										class="h-9 pr-8"
									/>
									<span
										class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground"
									>
										%
									</span>
								</div>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-default-rate-code" class="text-sm font-medium">Tax code</label>
							<Input
								id="create-default-rate-code"
								bind:value={createDefaultRateCode}
								placeholder="e.g. VAT"
								class="h-9"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				<Button onclick={submitCreate} disabled={createSubmitting}>
					{createSubmitting ? 'Creating…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Tax Region Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Tax Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the tax region details.
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
							placeholder="e.g. India"
							class={cn('h-9', editError === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-tax-provider" class="text-sm font-medium">Tax provider</label>
						<Input
							id="edit-tax-provider"
							bind:value={editTaxProviderId}
							placeholder="Tax provider ID (optional)"
							class="h-9"
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Delete tax region confirmation -->
<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="tax region"
	entityTitle={regionToDelete?.name ?? regionToDelete?.id ?? ''}
	onConfirm={confirmDeleteTaxRegion}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
