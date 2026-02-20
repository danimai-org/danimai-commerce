<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { DropdownMenu } from 'bits-ui';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Users from '@lucide/svelte/icons/users';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';

	const API_BASE = 'http://localhost:8000';

	type CustomerGroupDetail = {
		id: string;
		name: string;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
		customer_count: number;
	};

	type Customer = {
		id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		has_account: boolean;
		created_at: string;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	const groupId = $derived($page.params.id);

	let group = $state<CustomerGroupDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadGroup() {
		if (!groupId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/customer-groups/${groupId}`, { cache: 'no-store' });
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				error = (body as { message?: string })?.message ?? (res.status === 404 ? 'Customer group not found' : await res.text());
				group = null;
				return;
			}
			group = (await res.json()) as CustomerGroupDetail;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			group = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		groupId;
		loadGroup();
	});

	const metadataKeys = $derived(
		group?.metadata && typeof group.metadata === 'object'
			? Object.keys(group.metadata as object).length
			: 0
	);
	const jsonKeys = $derived(group ? Object.keys(group).length : 0);

	// Metadata & JSON sheets
	let metadataOpen = $state(false);
	let jsonOpen = $state(false);
	let metadataRows = $state<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
	let metadataError = $state<string | null>(null);
	let metadataSubmitting = $state(false);

	function openMetadataSheet() {
		if (!group) return;
		const meta =
			group.metadata && typeof group.metadata === 'object'
				? (group.metadata as Record<string, unknown>)
				: {};
		metadataRows = Object.entries(meta).map(([k, v]) => ({ key: k, value: String(v ?? '') }));
		if (metadataRows.length === 0) metadataRows = [{ key: '', value: '' }];
		metadataOpen = true;
		metadataError = null;
	}

	function closeMetadataSheet() {
		metadataOpen = false;
		metadataError = null;
	}

	function addMetadataRow() {
		metadataRows = [...metadataRows, { key: '', value: '' }];
	}

	function removeMetadataRow(index: number) {
		metadataRows = metadataRows.filter((_, i) => i !== index);
	}

	async function submitGroupMetadata() {
		if (!groupId || !group) return;
		metadataError = null;
		metadataSubmitting = true;
		try {
			const meta: Record<string, string | number> = {};
			for (const row of metadataRows) {
				const k = row.key.trim();
				if (!k) continue;
				const num = Number(row.value);
				meta[k] = Number.isNaN(num) ? row.value : num;
			}
			const res = await fetch(`${API_BASE}/customer-groups/${group.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: group.name,
					metadata: meta
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeMetadataSheet();
			loadGroup();
		} catch (e) {
			metadataError = e instanceof Error ? e.message : String(e);
		} finally {
			metadataSubmitting = false;
		}
	}

	// Customers in group list
	let customersPage = $state(1);
	let customersLimit = $state(10);
	let customersData = $state<{ data: Customer[]; pagination: Pagination } | null>(null);
	let customersLoading = $state(false);
	let customersError = $state<string | null>(null);

	async function fetchCustomersInGroup() {
		if (!groupId) return;
		customersLoading = true;
		customersError = null;
		try {
			const params = new URLSearchParams({
				page: String(customersPage),
				limit: String(customersLimit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/customer-groups/${groupId}/customers?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			customersData = (await res.json()) as { data: Customer[]; pagination: Pagination };
		} catch (e) {
			customersError = e instanceof Error ? e.message : String(e);
			customersData = null;
		} finally {
			customersLoading = false;
		}
	}

	$effect(() => {
		if (!group) return;
		customersPage;
		customersLimit;
		fetchCustomersInGroup();
	});

	const customersInGroup = $derived(customersData?.data ?? []);
	const customersPagination = $derived(customersData?.pagination ?? null);
	const customersStart = $derived(
		customersPagination ? (customersPagination.page - 1) * customersPagination.limit + 1 : 0
	);
	const customersEnd = $derived(
		customersPagination ? Math.min(customersPagination.page * customersPagination.limit, customersPagination.total) : 0
	);

	// Add customers modal
	let addCustomersModalOpen = $state(false);
	let customerModalPage = $state(1);
	let customerModalSearch = $state('');
	let customerModalData = $state<{ data: Customer[]; pagination: Pagination } | null>(null);
	let customerModalLoading = $state(false);
	let addCustomersSubmitting = $state(false);
	let addCustomersError = $state<string | null>(null);
	let selectedCustomerIds = $state<string[]>([]);

	async function fetchCustomerModalCustomers() {
		customerModalLoading = true;
		try {
			const params = new URLSearchParams({
				page: String(customerModalPage),
				limit: '10',
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/customers?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			customerModalData = (await res.json()) as { data: Customer[]; pagination: Pagination };
		} catch {
			customerModalData = null;
		} finally {
			customerModalLoading = false;
		}
	}

	function openAddCustomersModal() {
		selectedCustomerIds = [];
		customerModalPage = 1;
		customerModalSearch = '';
		addCustomersError = null;
		setTimeout(() => (addCustomersModalOpen = true), 0);
	}

	function closeAddCustomersModal() {
		if (!addCustomersSubmitting) {
			addCustomersModalOpen = false;
			selectedCustomerIds = [];
			addCustomersError = null;
		}
	}

	function toggleCustomerSelection(customerId: string) {
		selectedCustomerIds = selectedCustomerIds.includes(customerId)
			? selectedCustomerIds.filter((id) => id !== customerId)
			: [...selectedCustomerIds, customerId];
	}

	async function saveAddCustomers() {
		if (!groupId) return;
		addCustomersError = null;
		if (selectedCustomerIds.length === 0) {
			closeAddCustomersModal();
			return;
		}
		addCustomersSubmitting = true;
		try {
			for (const customerId of selectedCustomerIds) {
				const res = await fetch(`${API_BASE}/customers/${customerId}/customer-groups`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ customer_group_id: groupId })
				});
				if (!res.ok) {
					const err = await res.json().catch(() => ({}));
					throw new Error((err as { message?: string })?.message ?? 'Failed to add customer to group');
				}
			}
			selectedCustomerIds = [];
			addCustomersModalOpen = false;
			await loadGroup();
			await fetchCustomersInGroup();
		} catch (e) {
			addCustomersError = e instanceof Error ? e.message : String(e);
		} finally {
			addCustomersSubmitting = false;
		}
	}

	$effect(() => {
		if (!addCustomersModalOpen) return;
		customerModalPage;
		fetchCustomerModalCustomers();
	});

	const customerModalCustomers = $derived(customerModalData?.data ?? []);
	const customerModalPagination = $derived(customerModalData?.pagination ?? null);
	const customerModalFiltered = $derived(
		customerModalSearch.trim()
			? customerModalCustomers.filter((c) =>
					c.email.toLowerCase().includes(customerModalSearch.toLowerCase()) ||
					(c.first_name?.toLowerCase().includes(customerModalSearch.toLowerCase()) ?? false) ||
					(c.last_name?.toLowerCase().includes(customerModalSearch.toLowerCase()) ?? false)
				)
			: customerModalCustomers
	);
	const customerModalStart = $derived(
		customerModalPagination ? (customerModalPagination.page - 1) * customerModalPagination.limit + 1 : 0
	);
	const customerModalEnd = $derived(
		customerModalPagination
			? Math.min(customerModalPagination.page * customerModalPagination.limit, customerModalPagination.total)
			: 0
	);
</script>

<svelte:head>
	<title>{group ? group.name : 'Customer group'} | Customer Groups | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Breadcrumb + actions -->
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/customers/groups')}
			>
				<SlidersHorizontal class="size-4 shrink-0" />
				<span>Customer Groups</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{group ? group.name : (groupId ?? '…')}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !group}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Customer group not found'}</p>
			<Button variant="outline" onclick={() => goto('/customers/groups')}>
				Back to Customer Groups
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<!-- Header card -->
				<div class="flex gap-6">
					<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
						<section class="flex flex-col gap-6">
							<div class="flex items-center justify-between gap-4">
								<div>
									<h1 class="text-2xl font-semibold tracking-tight">{group.name}</h1>
									<p class="mt-1 text-sm text-muted-foreground">
										Customers – {group.customer_count}
									</p>
								</div>
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
												class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item
												textValue="Delete"
												class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
											>
												<Trash2 class="size-4" />
												Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</div>
						</section>
					</div>
				</div>

				<!-- Customers section -->
				<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
					<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
						<h2 class="text-base font-semibold flex items-center gap-2">
							<Users class="size-4" />
							Customers
						</h2>
						<Button variant="outline" size="sm" onclick={openAddCustomersModal}>Add</Button>
					</div>
					{#if customersLoading}
						<div class="flex items-center justify-center px-6 py-12">
							<p class="text-sm text-muted-foreground">Loading…</p>
						</div>
					{:else if customersError}
						<div class="px-6 py-4 text-sm text-destructive">
							{customersError}
						</div>
					{:else if group.customer_count === 0}
						<div class="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
							<span class="text-muted-foreground">No records</span>
							<p class="text-sm text-muted-foreground">This group doesn't have customers.</p>
						</div>
					{:else}
						<div class="min-h-0 flex-1 overflow-auto">
							<table class="w-full text-sm">
								<thead class="sticky top-0 border-b bg-muted/50">
									<tr>
										<th class="px-4 py-3 text-left font-medium">Email</th>
										<th class="px-4 py-3 text-left font-medium">Name</th>
										<th class="px-4 py-3 text-left font-medium">Account</th>
										<th class="px-4 py-3 text-left font-medium">Created</th>
									</tr>
								</thead>
								<tbody>
									{#if customersInGroup.length === 0}
										<tr>
											<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
												No customers found.
											</td>
										</tr>
									{:else}
										{#each customersInGroup as customer (customer.id)}
											<tr class="border-b transition-colors hover:bg-muted/30">
												<td class="px-4 py-3 font-medium">{customer.email}</td>
												<td class="px-4 py-3 text-muted-foreground">
													{customer.first_name || customer.last_name
														? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
														: '–'}
												</td>
												<td class="px-4 py-3 text-muted-foreground">
													{#if !customer.has_account}
														<span
															class="inline-flex items-center rounded-md border border-orange-300 bg-orange-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
															>Guest</span
														>
													{:else}
														Registered
													{/if}
												</td>
												<td class="px-4 py-3 text-muted-foreground">
													{customer.created_at
														? new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
														: '–'}
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
						{#if customersPagination && customersPagination.total > 0}
							<div class="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-4">
								<p class="text-sm text-muted-foreground">
									{customersStart} – {customersEnd} of {customersPagination.total} results
								</p>
								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={!customersPagination.has_previous_page}
										onclick={() => (customersPage = customersPage - 1)}
									>
										Prev
									</Button>
									<span class="text-sm text-muted-foreground">
										{customersPagination.page} of {customersPagination.total_pages} pages
									</span>
									<Button
										variant="outline"
										size="sm"
										disabled={!customersPagination.has_next_page}
										onclick={() => (customersPage = customersPage + 1)}
									>
										Next
									</Button>
								</div>
							</div>
						{/if}
					{/if}
				</section>

				<!-- Metadata & JSON -->
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-lg border bg-card p-4 shadow-sm">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-medium">Metadata</h3>
							<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{metadataKeys} keys
							</span>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={openMetadataSheet}
							>
								<ExternalLink class="size-4" />
								<span class="sr-only">Open</span>
							</Button>
						</div>
					</div>
					<div class="rounded-lg border bg-card p-4 shadow-sm">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-medium">JSON</h3>
							<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{jsonKeys} keys
							</span>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={() => (jsonOpen = true)}
							>
								<ExternalLink class="size-4" />
								<span class="sr-only">Open</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Add customers modal -->
<Dialog.Root bind:open={addCustomersModalOpen}>
	<Dialog.Content
		class="max-w-3xl h-auto max-h-[85vh] m-auto flex flex-col rounded-xl border shadow-lg"
	>
		<div class="flex flex-1 flex-col overflow-hidden">
			<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
				<Dialog.Title class="text-base font-semibold">Customers</Dialog.Title>
			</Dialog.Header>

			<!-- Filter and search row -->
			<div class="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2 ml-auto">
					<div class="relative w-64">
						<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={customerModalSearch}
							class="h-9 rounded-md pl-9"
						/>
					</div>
					<button
						type="button"
						class="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Sort"
					>
						<ArrowUpDown class="size-4" />
					</button>
				</div>
			</div>

			<div class="flex flex-1 flex-col overflow-auto p-6">
				{#if addCustomersError}
					<div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{addCustomersError}
					</div>
				{/if}
				{#if customerModalLoading}
					<div class="flex items-center justify-center py-12">
						<p class="text-sm text-muted-foreground">Loading…</p>
					</div>
				{:else}
					<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
						<table class="w-full text-sm">
							<thead class="sticky top-0 border-b bg-muted/50">
								<tr>
									<th class="w-10 px-4 py-3 text-left font-medium"></th>
									<th class="px-4 py-3 text-left font-medium">Email</th>
									<th class="px-4 py-3 text-left font-medium">Name</th>
									<th class="px-4 py-3 text-left font-medium">Account</th>
									<th class="px-4 py-3 text-left font-medium">Created</th>
								</tr>
							</thead>
							<tbody>
								{#if customerModalFiltered.length === 0}
									<tr>
										<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
											No customers found.
										</td>
									</tr>
								{:else}
									{#each customerModalFiltered as customer (customer.id)}
										<tr
											class="border-b transition-colors hover:bg-muted/30 cursor-pointer last:border-b-0"
											role="button"
											tabindex="0"
											onclick={() => toggleCustomerSelection(customer.id)}
											onkeydown={(e) => e.key === 'Enter' && toggleCustomerSelection(customer.id)}
										>
											<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
												<input
													type="checkbox"
													checked={selectedCustomerIds.includes(customer.id)}
													class="size-4 rounded border-input"
													tabindex="-1"
													onclick={(e) => e.stopPropagation()}
													onchange={() => toggleCustomerSelection(customer.id)}
												/>
											</td>
											<td class="px-4 py-3 font-medium">{customer.email}</td>
											<td class="px-4 py-3 text-muted-foreground">
												{customer.first_name || customer.last_name
													? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
													: '–'}
											</td>
											<td class="px-4 py-3 text-muted-foreground">
												{#if !customer.has_account}
													<span
														class="inline-flex items-center rounded-md border border-orange-300 bg-orange-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
														>Guest</span
													>
												{:else}
													Registered
												{/if}
											</td>
											<td class="px-4 py-3 text-muted-foreground">
												{customer.created_at
													? new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
													: '–'}
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<Dialog.Footer class="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-4">
				<div class="flex items-center justify-between gap-4">
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={!customerModalPagination?.has_previous_page}
								onclick={() => (customerModalPage = customerModalPage - 1)}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{customerModalPagination?.page ?? 1} of {customerModalPagination?.total_pages ?? 1} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={!customerModalPagination?.has_next_page}
								onclick={() => (customerModalPage = customerModalPage + 1)}
							>
								Next
							</Button>
						</div>
						<p class="text-sm text-muted-foreground">
							{#if customerModalPagination && customerModalPagination.total > 0}
								{customerModalStart} – {customerModalEnd} of {customerModalPagination.total} results
							{:else}
								0 results
							{/if}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2 ml-auto">
					<Button variant="outline" onclick={closeAddCustomersModal} disabled={addCustomersSubmitting}>Cancel</Button>
					<Button onclick={saveAddCustomers} disabled={addCustomersSubmitting || selectedCustomerIds.length === 0}>
						{addCustomersSubmitting ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Metadata sheet -->
<Sheet.Root bind:open={metadataOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Edit Metadata</Sheet.Title>
				<Sheet.Description>View and edit customer group metadata key-value pairs.</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto px-6 py-6">
				{#if metadataError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{metadataError}
					</div>
				{/if}

				<div class="overflow-hidden rounded-md border">
					<table class="w-full text-sm">
						<thead class="border-b bg-muted/50">
							<tr>
								<th class="px-4 py-3 text-left font-medium">Key</th>
								<th class="px-4 py-3 text-left font-medium">Value</th>
								<th class="w-10 px-4 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{#each metadataRows as row, i}
								<tr class="border-b last:border-0">
									<td class="px-4 py-2">
										<Input bind:value={row.key} placeholder="Key" class="h-9 w-full" />
									</td>
									<td class="px-4 py-2">
										<Input bind:value={row.value} placeholder="Value" class="h-9 w-full" />
									</td>
									<td class="px-4 py-2">
										<Button
											variant="ghost"
											size="icon"
											class="size-8 shrink-0 text-destructive hover:bg-destructive/10"
											onclick={() => removeMetadataRow(i)}
											aria-label="Remove row"
										>
											<Trash2 class="size-4" />
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<Button variant="outline" size="sm" class="mt-4" onclick={addMetadataRow}>Add row</Button>
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeMetadataSheet} disabled={metadataSubmitting}>Cancel</Button>
				<Button onclick={submitGroupMetadata} disabled={metadataSubmitting}>
					{metadataSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- JSON view sheet -->
<Sheet.Root bind:open={jsonOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<Sheet.Header class="shrink-0 border-b px-6 py-4">
				<Sheet.Title>JSON — {jsonKeys} keys</Sheet.Title>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if group}
					<pre
						class="rounded-md border bg-zinc-900 p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-300"
					><code>{JSON.stringify(group, null, 2)}</code></pre>
				{:else}
					<p class="text-sm text-muted-foreground">No data</p>
				{/if}
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (jsonOpen = false)}>Close</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
