<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Users from '@lucide/svelte/icons/users';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	const API_BASE = 'http://localhost:8000';

	type Customer = {
		id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		phone: string | null;
		has_account: boolean;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type CustomerAddress = {
		id: string;
		customer_id: string;
		first_name: string | null;
		last_name: string | null;
		phone: string | null;
		company: string | null;
		address_1: string;
		address_2: string | null;
		city: string;
		country_code: string;
		province: string | null;
		postal_code: string | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type CustomerGroup = {
		id: string;
		name: string;
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

	const customerId = $derived($page.params.id);

	let customer = $state<Customer | null>(null);
	let addresses = $state<CustomerAddress[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadAddresses() {
		if (!customerId) return;
		try {
			const res = await fetch(`${API_BASE}/customers/${customerId}/addresses`, { cache: 'no-store' });
			if (!res.ok) return;
			addresses = (await res.json()) as CustomerAddress[];
		} catch {
			addresses = [];
		}
	}

	async function loadCustomer() {
		if (!customerId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/customers/${customerId}`, { cache: 'no-store' });
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				error = body?.message ?? (res.status === 404 ? 'Customer not found' : await res.text());
				customer = null;
				return;
			}
			customer = (await res.json()) as Customer;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			customer = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		customerId;
		loadCustomer();
	});

	$effect(() => {
		if (customer && customerId) loadAddresses();
		else addresses = [];
	});

	const displayTitle = $derived(customer?.email ?? 'Customer');

	const breadcrumbLabel = $derived(
		customer?.first_name || customer?.last_name
			? `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim()
			: customer?.email ?? 'Customer'
	);

	const createdDisplay = $derived(
		customer?.created_at ? new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '–'
	);

	type CustomerGroupItem = { id: string | null; name: string };
	const customerGroupsFromApi = $derived((): CustomerGroupItem[] => {
		const meta = customer?.metadata;
		if (!meta || typeof meta !== 'object' || meta === null) return [];
		const m = meta as { customer_groups?: { id: string; name: string }[]; customer_group_name?: string };
		if (Array.isArray(m.customer_groups) && m.customer_groups.length > 0) {
			return m.customer_groups.map((g) => ({ id: g.id, name: g.name }));
		}
		if (typeof m.customer_group_name === 'string' && m.customer_group_name) {
			return [{ id: null, name: m.customer_group_name }];
		}
		return [];
	});

	const customerGroupsForCard = $derived(customerGroupsFromApi());
	const customerGroupName = $derived(
		customerGroupsForCard.length > 0 ? customerGroupsForCard[0].name : '–'
	);
	const groupCardLimit = 5;
	let groupCardPage = $state(1);
	const groupCardTotal = $derived(customerGroupsForCard.length);
	const groupCardTotalPages = $derived(Math.max(1, Math.ceil(groupCardTotal / groupCardLimit)));
	const groupCardStart = $derived((groupCardPage - 1) * groupCardLimit + 1);
	const groupCardEnd = $derived(Math.min(groupCardPage * groupCardLimit, groupCardTotal));
	const groupCardPaginated = $derived(
		customerGroupsForCard.slice((groupCardPage - 1) * groupCardLimit, groupCardPage * groupCardLimit)
	);

	$effect(() => {
		if (groupCardPage > groupCardTotalPages) groupCardPage = 1;
	});

	// Add to group modal
	let addToGroupModalOpen = $state(false);
	let groupModalPage = $state(1);
	let groupModalSearch = $state('');
	let groupModalData = $state<{ data: CustomerGroup[]; pagination: Pagination } | null>(null);
	let groupModalLoading = $state(false);
	let addToGroupSubmitting = $state(false);
	let addToGroupError = $state<string | null>(null);
	let selectedGroupIds = $state<string[]>([]);

	async function fetchGroupModalGroups() {
		groupModalLoading = true;
		try {
			const params = new URLSearchParams({
				page: String(groupModalPage),
				limit: '10',
				sorting_field: 'name',
				sorting_direction: 'asc'
			});
			const res = await fetch(`${API_BASE}/customer-groups?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			groupModalData = (await res.json()) as { data: CustomerGroup[]; pagination: Pagination };
		} catch {
			groupModalData = null;
		} finally {
			groupModalLoading = false;
		}
	}

	function openAddToGroupModal() {
		selectedGroupIds = [];
		groupModalPage = 1;
		groupModalSearch = '';
		addToGroupError = null;
		// Defer so dropdown can close before modal opens (bits-ui focus)
		setTimeout(() => (addToGroupModalOpen = true), 0);
	}

	function closeAddToGroupModal() {
		if (!addToGroupSubmitting) {
			addToGroupModalOpen = false;
			selectedGroupIds = [];
			addToGroupError = null;
		}
	}

	let removeFromGroupSubmitting = $state(false);
	let removeFromGroupModalOpen = $state(false);
	let removeFromGroupError = $state<string | null>(null);
	let removeFromGroupTarget = $state<{ id: string; name: string } | null>(null);

	function openRemoveFromGroupModal(group: { id: string | null; name: string }) {
		removeFromGroupError = null;
		removeFromGroupTarget = group.id != null ? { id: group.id, name: group.name } : null;
		// Defer so dropdown can close before modal opens (bits-ui focus)
		setTimeout(() => (removeFromGroupModalOpen = true), 0);
	}

	function closeRemoveFromGroupModal() {
		if (!removeFromGroupSubmitting) {
			removeFromGroupModalOpen = false;
			removeFromGroupTarget = null;
			removeFromGroupError = null;
		}
	}

	async function removeCustomerFromGroup() {
		if (!customerId || !customer) return;
		removeFromGroupSubmitting = true;
		removeFromGroupError = null;
		try {
			const url =
				removeFromGroupTarget?.id != null
					? `${API_BASE}/customers/${customerId}/customer-groups?customer_group_id=${encodeURIComponent(removeFromGroupTarget.id)}`
					: `${API_BASE}/customers/${customerId}/customer-groups`;
			const res = await fetch(url, { method: 'DELETE' });
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error((err as { message?: string })?.message ?? 'Failed to remove from group');
			}
			await loadCustomer();
			removeFromGroupModalOpen = false;
			removeFromGroupTarget = null;
		} catch (e) {
			removeFromGroupError = e instanceof Error ? e.message : String(e);
		} finally {
			removeFromGroupSubmitting = false;
		}
	}

	const groupModalGroups = $derived(groupModalData?.data ?? []);
	const groupModalPagination = $derived(groupModalData?.pagination ?? null);
	const groupModalFiltered = $derived(
		groupModalSearch.trim()
			? groupModalGroups.filter((g) => g.name.toLowerCase().includes(groupModalSearch.toLowerCase()))
			: groupModalGroups
	);
	const groupModalStart = $derived(
		groupModalPagination ? (groupModalPagination.page - 1) * groupModalPagination.limit + 1 : 0
	);
	const groupModalEnd = $derived(
		groupModalPagination
			? Math.min(groupModalPagination.page * groupModalPagination.limit, groupModalPagination.total)
			: 0
	);

	function toggleGroupSelection(groupId: string) {
		selectedGroupIds = selectedGroupIds.includes(groupId)
			? selectedGroupIds.filter((id) => id !== groupId)
			: [...selectedGroupIds, groupId];
	}

	async function saveAddToGroup() {
		if (!customerId || !customer) return;
		addToGroupError = null;
		if (selectedGroupIds.length === 0) {
			closeAddToGroupModal();
			return;
		}
		addToGroupSubmitting = true;
		try {
			for (const groupId of selectedGroupIds) {
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
			selectedGroupIds = [];
			addToGroupModalOpen = false;
			await loadCustomer();
		} catch (e) {
			addToGroupError = e instanceof Error ? e.message : String(e);
		} finally {
			addToGroupSubmitting = false;
		}
	}

	$effect(() => {
		if (!addToGroupModalOpen) return;
		groupModalPage;
		fetchGroupModalGroups();
	});

	// Edit customer sheet
	let editOpen = $state(false);
	let editFirstName = $state('');
	let editLastName = $state('');
	let editEmail = $state('');
	let editPhone = $state('');
	let editCompany = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit() {
		if (!customer) return;
		editFirstName = customer.first_name || '';
		editLastName = customer.last_name || '';
		editEmail = customer.email;
		editPhone = customer.phone || '';
		editCompany = (customer.metadata as { company?: string })?.company || '';
		editError = null;
		editOpen = true;
	}

	function closeEdit() {
		editOpen = false;
	}

	// Delete confirmation
	let deleteModalOpen = $state(false);
	let deleteSubmitting = $state(false);

	function openDeleteModal() {
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		if (!deleteSubmitting) deleteModalOpen = false;
	}

	async function handleConfirmDelete() {
		if (!customer) return;
		deleteSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/customers/${customer.id}`, { method: 'DELETE' });
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error((err as { message?: string })?.message ?? 'Failed to delete customer');
			}
			closeDeleteModal();
			goto('/customers');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	async function saveEdit() {
		if (!customer) return;
		editError = null;
		editSubmitting = true;

		if (!editEmail.trim()) {
			editError = 'Email is required';
			editSubmitting = false;
			return;
		}

		try {
			const response = await fetch(`${API_BASE}/customers/${customer.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: editEmail.trim(),
					first_name: editFirstName.trim() || null,
					last_name: editLastName.trim() || null,
					phone: editPhone.trim() || null,
					...(editCompany.trim() && { metadata: { company: editCompany.trim() } })
				})
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error((err as { message?: string })?.message ?? 'Failed to update customer');
			}
			closeEdit();
			loadCustomer();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	// Add address sheet
	let addAddressOpen = $state(false);
	let addrFirstName = $state('');
	let addrLastName = $state('');
	let addrPhone = $state('');
	let addrCompany = $state('');
	let addrAddress1 = $state('');
	let addrAddress2 = $state('');
	let addrCity = $state('');
	let addrProvince = $state('');
	let addrPostalCode = $state('');
	let addrCountryCode = $state('');
	let addAddressError = $state<string | null>(null);
	let addAddressSubmitting = $state(false);

	function openAddAddress() {
		addrFirstName = customer?.first_name ?? '';
		addrLastName = customer?.last_name ?? '';
		addrPhone = customer?.phone ?? '';
		addrCompany = (customer?.metadata as { company?: string })?.company ?? '';
		addrAddress1 = '';
		addrAddress2 = '';
		addrCity = '';
		addrProvince = '';
		addrPostalCode = '';
		addrCountryCode = '';
		addAddressError = null;
		addAddressOpen = true;
	}

	function closeAddAddress() {
		addAddressOpen = false;
	}

	async function submitAddAddress() {
		if (!customer) return;
		addAddressError = null;
		addAddressSubmitting = true;
		if (!addrAddress1.trim()) {
			addAddressError = 'Address line 1 is required';
			addAddressSubmitting = false;
			return;
		}
		if (!addrCity.trim()) {
			addAddressError = 'City is required';
			addAddressSubmitting = false;
			return;
		}
		if (!addrCountryCode.trim()) {
			addAddressError = 'Country code is required';
			addAddressSubmitting = false;
			return;
		}
		try {
			const res = await fetch(`${API_BASE}/customers/${customer.id}/addresses`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: addrFirstName.trim() || null,
					last_name: addrLastName.trim() || null,
					phone: addrPhone.trim() || null,
					company: addrCompany.trim() || null,
					address_1: addrAddress1.trim(),
					address_2: addrAddress2.trim() || null,
					city: addrCity.trim(),
					province: addrProvince.trim() || null,
					postal_code: addrPostalCode.trim() || null,
					country_code: addrCountryCode.trim()
				})
			});
			if (!res.ok) {
				const text = await res.text();
				let message: string | null = null;
				try {
					const err = JSON.parse(text) as { message?: string };
					message = err?.message ?? null;
				} catch {
					message = text || null;
				}
				throw new Error(message ?? `Request failed (${res.status})`);
			}
			closeAddAddress();
			loadCustomer();
			loadAddresses();
		} catch (e) {
			addAddressError = e instanceof Error ? e.message : String(e);
		} finally {
			addAddressSubmitting = false;
		}
	}

	// Edit address sheet
	let editAddressOpen = $state(false);
	let editingAddress = $state<CustomerAddress | null>(null);
	let editAddrFirstName = $state('');
	let editAddrLastName = $state('');
	let editAddrPhone = $state('');
	let editAddrCompany = $state('');
	let editAddrAddress1 = $state('');
	let editAddrAddress2 = $state('');
	let editAddrCity = $state('');
	let editAddrProvince = $state('');
	let editAddrPostalCode = $state('');
	let editAddrCountryCode = $state('');
	let editAddressError = $state<string | null>(null);
	let editAddressSubmitting = $state(false);

	function openEditAddress(addr: CustomerAddress) {
		editingAddress = addr;
		editAddrFirstName = addr.first_name ?? '';
		editAddrLastName = addr.last_name ?? '';
		editAddrPhone = addr.phone ?? '';
		editAddrCompany = addr.company ?? '';
		editAddrAddress1 = addr.address_1 ?? '';
		editAddrAddress2 = addr.address_2 ?? '';
		editAddrCity = addr.city ?? '';
		editAddrProvince = addr.province ?? '';
		editAddrPostalCode = addr.postal_code ?? '';
		editAddrCountryCode = addr.country_code ?? '';
		editAddressError = null;
		editAddressOpen = true;
	}

	function closeEditAddress() {
		editAddressOpen = false;
		editingAddress = null;
	}

	async function saveEditAddress() {
		if (!customer || !editingAddress) return;
		editAddressError = null;
		editAddressSubmitting = true;
		if (!editAddrAddress1.trim()) {
			editAddressError = 'Address line 1 is required';
			editAddressSubmitting = false;
			return;
		}
		if (!editAddrCity.trim()) {
			editAddressError = 'City is required';
			editAddressSubmitting = false;
			return;
		}
		if (!editAddrCountryCode.trim()) {
			editAddressError = 'Country code is required';
			editAddressSubmitting = false;
			return;
		}
		try {
			const res = await fetch(`${API_BASE}/customers/${customer.id}/addresses/${editingAddress.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: editAddrFirstName.trim() || null,
					last_name: editAddrLastName.trim() || null,
					phone: editAddrPhone.trim() || null,
					company: editAddrCompany.trim() || null,
					address_1: editAddrAddress1.trim(),
					address_2: editAddrAddress2.trim() || null,
					city: editAddrCity.trim(),
					province: editAddrProvince.trim() || null,
					postal_code: editAddrPostalCode.trim() || null,
					country_code: editAddrCountryCode.trim()
				})
			});
			if (!res.ok) {
				const text = await res.text();
				let message: string | null = null;
				try {
					const err = JSON.parse(text) as { message?: string };
					message = err?.message ?? null;
				} catch {
					message = text || null;
				}
				throw new Error(message ?? `Request failed (${res.status})`);
			}
			closeEditAddress();
			loadAddresses();
		} catch (e) {
			editAddressError = e instanceof Error ? e.message : String(e);
		} finally {
			editAddressSubmitting = false;
		}
	}

	// Delete address modal
	let deleteAddressModalOpen = $state(false);
	let addressToDelete = $state<CustomerAddress | null>(null);
	let deleteAddressSubmitting = $state(false);
	let deleteAddressError = $state<string | null>(null);

	function openDeleteAddressModal(addr: CustomerAddress) {
		addressToDelete = addr;
		deleteAddressError = null;
		deleteAddressModalOpen = true;
	}

	function closeDeleteAddressModal() {
		if (!deleteAddressSubmitting) {
			deleteAddressModalOpen = false;
			addressToDelete = null;
			deleteAddressError = null;
		}
	}

	const deleteAddressTitle = $derived(
		addressToDelete
			? [addressToDelete.address_1, addressToDelete.city, addressToDelete.country_code].filter(Boolean).join(', ')
			: ''
	);

	// Footer: Metadata & JSON
	const metadataKeys = $derived(
		customer?.metadata && typeof customer.metadata === 'object'
			? Object.keys(customer.metadata as object).length
			: 0
	);
	const jsonKeys = $derived(customer ? Object.keys(customer).length : 0);

	let metadataOpen = $state(false);
	let jsonOpen = $state(false);
	let metadataRows = $state<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
	let metadataError = $state<string | null>(null);
	let metadataSubmitting = $state(false);

	function openMetadataSheet() {
		if (!customer) return;
		const meta =
			customer.metadata && typeof customer.metadata === 'object'
				? (customer.metadata as Record<string, unknown>)
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

	async function submitCustomerMetadata() {
		if (!customerId || !customer) return;
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
			const res = await fetch(`${API_BASE}/customers/${customer.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: customer.email,
					first_name: customer.first_name ?? null,
					last_name: customer.last_name ?? null,
					phone: customer.phone ?? null,
					metadata: meta
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeMetadataSheet();
			loadCustomer();
		} catch (e) {
			metadataError = e instanceof Error ? e.message : String(e);
		} finally {
			metadataSubmitting = false;
		}
	}

	async function handleConfirmDeleteAddress() {
		if (!customer || !addressToDelete) return;
		deleteAddressError = null;
		deleteAddressSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/customers/${customer.id}/addresses/${addressToDelete.id}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				const text = await res.text();
				let message: string | null = null;
				try {
					const err = JSON.parse(text) as { message?: string };
					message = err?.message ?? null;
				} catch {
					message = text || null;
				}
				throw new Error(message ?? 'Failed to delete address');
			}
			deleteAddressModalOpen = false;
			addressToDelete = null;
			deleteAddressError = null;
			loadAddresses();
		} catch (e) {
			deleteAddressError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteAddressSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{customer ? displayTitle : 'Customer'} | Customers | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Breadcrumb + actions -->
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/customers')}
			>
				<Users class="size-4 shrink-0" />
				<span>Customers</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{customer ? breadcrumbLabel : (customerId ?? '…')}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !customer}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Customer not found'}</p>
			<Button variant="outline" onclick={() => goto('/customers')}>
				Back to Customers
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<!-- Overview card -->
				<div class="flex gap-6">
					<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
						<section class="flex flex-col gap-6">
							<div class="flex items-center justify-between gap-4">
								<h1 class="text-2xl font-semibold tracking-tight">{customer.email}</h1>
								<div class="flex items-center gap-2">
									{#if !customer.has_account}
										<span
											class="inline-flex items-center rounded-md border border-orange-300 bg-orange-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
											>Guest</span
										>
									{/if}
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
												onSelect={openEdit}
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item
												textValue="Delete"
												class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={openDeleteModal}
											>
												<Trash2 class="size-4" />
												Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
									</DropdownMenu.Root>
								</div>
							</div>
							<table class="w-full text-sm">
								<tbody>
									<tr>
										<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Name</th>
										<td class="py-3 font-medium">
											{customer.first_name || customer.last_name
												? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
												: '–'}
										</td>
									</tr>
									<tr>
										<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Phone</th>
										<td class="py-3 font-medium">{customer.phone ?? '–'}</td>
									</tr>
									<tr>
										<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Account</th>
										<td class="py-3 font-medium">{customer.has_account ? 'Registered' : 'Guest'}</td>
									</tr>
									<tr>
										<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Created</th>
										<td class="py-3 font-medium">{createdDisplay}</td>
									</tr>
								</tbody>
							</table>
						</section>
					</div>
				</div>

				<!-- Customer group card -->
				<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
					<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
						<h2 class="text-base font-semibold flex items-center gap-2">
							<UsersRound class="size-4" />
							Customer group
						</h2>
						<Button variant="outline" size="sm" onclick={openAddToGroupModal}>Add to group</Button>
					</div>
					{#if customerGroupsForCard.length === 0}
						<div class="px-6 py-8 text-center text-sm text-muted-foreground">
							No groups yet.
						</div>
					{:else}
						<ul class="divide-y">
							{#each groupCardPaginated as group (group.id ?? group.name)}
								<li class="flex items-center justify-between gap-4 px-6 py-4">
									<p class="text-sm font-medium">{group.name}</p>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
										>
											<MoreHorizontal class="size-4" />
											<span class="sr-only">Customer group actions</span>
										</DropdownMenu.Trigger>
										<DropdownMenu.Portal>
											<DropdownMenu.Content
												class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
												sideOffset={4}
											>
												<DropdownMenu.Item
													textValue="Edit"
													class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={openAddToGroupModal}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Item
													textValue="Delete"
													class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openRemoveFromGroupModal(group)}
												>
													<Trash2 class="size-4" />
													Delete
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								</li>
							{/each}
						</ul>
						{#if groupCardTotal > 0}
							<div class="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-3">
								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={groupCardPage <= 1}
										onclick={() => (groupCardPage = groupCardPage - 1)}
									>
										Prev
									</Button>
									<span class="text-sm text-muted-foreground">
										{groupCardPage} of {groupCardTotalPages} pages
									</span>
									<Button
										variant="outline"
										size="sm"
										disabled={groupCardPage >= groupCardTotalPages}
										onclick={() => (groupCardPage = groupCardPage + 1)}
									>
										Next
									</Button>
								</div>
								<p class="text-sm text-muted-foreground">
									{groupCardStart} – {groupCardEnd} of {groupCardTotal} results
								</p>
							</div>
						{/if}
					{/if}
				</section>

				<!-- Orders section (placeholder) -->
				<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
					<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
						<h2 class="text-base font-semibold flex items-center gap-2">
							<ShoppingBag class="size-4" />
							Orders
						</h2>
					</div>
					<div class="px-6 py-8 text-center text-sm text-muted-foreground">
						No orders yet.
					</div>
				</section>

				<!-- Addresses section -->
				<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
					<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
						<h2 class="text-base font-semibold flex items-center gap-2">
							<MapPin class="size-4" />
							Addresses
						</h2>
						<Button variant="outline" size="sm" onclick={openAddAddress}>Add address</Button>
					</div>
					{#if addresses.length === 0}
						<div class="px-6 py-8 text-center text-sm text-muted-foreground">
							No addresses yet.
						</div>
					{:else}
						<ul class="divide-y">
							{#each addresses as addr (addr.id)}
								<li class="flex items-start justify-between gap-4 px-6 py-4">
									<div class="min-w-0 flex-1">
										<div class="text-sm font-medium">
											{#if addr.first_name || addr.last_name}
												{addr.first_name ?? ''} {addr.last_name ?? ''}
											{:else}
												Address
											{/if}
										</div>
										<div class="mt-1 text-sm text-muted-foreground">
											{addr.address_1}
											{#if addr.address_2}, {addr.address_2}{/if}
											<br />
											{addr.city}
											{#if addr.province}, {addr.province}{/if}
											{#if addr.postal_code} {addr.postal_code}{/if}
											{addr.country_code}
										</div>
										{#if addr.phone}
											<div class="mt-1 text-sm text-muted-foreground">Phone: {addr.phone}</div>
										{/if}
									</div>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
										>
											<MoreHorizontal class="size-4" />
											<span class="sr-only">Address actions</span>
										</DropdownMenu.Trigger>
										<DropdownMenu.Portal>
											<DropdownMenu.Content
												class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
												sideOffset={4}
											>
												<DropdownMenu.Item
													textValue="Edit"
													class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openEditAddress(addr)}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Item
													textValue="Delete"
													class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openDeleteAddressModal(addr)}
												>
													<Trash2 class="size-4" />
													Delete
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								</li>
							{/each}
						</ul>
					{/if}
				</section>

				<!-- Footer: Metadata & JSON -->
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

<!-- Edit Customer Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Edit Customer</Sheet.Title>
				<Sheet.Description>Update customer details.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if editError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-first-name" class="text-sm font-medium">
								First Name <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-first-name"
								bind:value={editFirstName}
								placeholder="First name"
								class="h-9"
								disabled={editSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-last-name" class="text-sm font-medium">
								Last Name <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-last-name"
								bind:value={editLastName}
								placeholder="Last name"
								class="h-9"
								disabled={editSubmitting}
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-email" class="text-sm font-medium">Email</label>
						<Input
							id="edit-email"
							type="email"
							bind:value={editEmail}
							placeholder="Email"
							class="h-9"
							disabled={editSubmitting}
							required
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-phone" class="text-sm font-medium">
								Phone <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-phone"
								type="tel"
								bind:value={editPhone}
								placeholder="Phone"
								class="h-9"
								disabled={editSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-company" class="text-sm font-medium">
								Company <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-company"
								bind:value={editCompany}
								placeholder="Company"
								class="h-9"
								disabled={editSubmitting}
							/>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit} disabled={editSubmitting}>
					Cancel
				</Button>
				<Button onclick={saveEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving...' : 'Save'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Add Address Sheet -->
<Sheet.Root bind:open={addAddressOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Add address</Sheet.Title>
				<Sheet.Description>Add a new address for this customer.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if addAddressError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{addAddressError}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="addr-first-name" class="text-sm font-medium">First name</label>
							<Input
								id="addr-first-name"
								bind:value={addrFirstName}
								placeholder="First name"
								class="h-9"
								disabled={addAddressSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="addr-last-name" class="text-sm font-medium">Last name</label>
							<Input
								id="addr-last-name"
								bind:value={addrLastName}
								placeholder="Last name"
								class="h-9"
								disabled={addAddressSubmitting}
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="addr-address-1" class="text-sm font-medium">Address line 1</label>
						<Input
							id="addr-address-1"
							bind:value={addrAddress1}
							placeholder="Street address"
							class="h-9"
							disabled={addAddressSubmitting}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="addr-address-2" class="text-sm font-medium">
							Address line 2 <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<Input
							id="addr-address-2"
							bind:value={addrAddress2}
							placeholder="Apartment, suite, etc."
							class="h-9"
							disabled={addAddressSubmitting}
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="addr-city" class="text-sm font-medium">City</label>
							<Input
								id="addr-city"
								bind:value={addrCity}
								placeholder="City"
								class="h-9"
								disabled={addAddressSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="addr-province" class="text-sm font-medium">
								Province / State <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="addr-province"
								bind:value={addrProvince}
								placeholder="Province or state"
								class="h-9"
								disabled={addAddressSubmitting}
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="addr-postal-code" class="text-sm font-medium">
								Postal code <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="addr-postal-code"
								bind:value={addrPostalCode}
								placeholder="Postal code"
								class="h-9"
								disabled={addAddressSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="addr-country-code" class="text-sm font-medium">Country code</label>
							<Input
								id="addr-country-code"
								bind:value={addrCountryCode}
								placeholder="e.g. US, GB"
								class="h-9"
								disabled={addAddressSubmitting}
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="addr-phone" class="text-sm font-medium">
								Phone <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="addr-phone"
								type="tel"
								bind:value={addrPhone}
								placeholder="Phone"
								class="h-9"
								disabled={addAddressSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="addr-company" class="text-sm font-medium">
								Company <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="addr-company"
								bind:value={addrCompany}
								placeholder="Company"
								class="h-9"
								disabled={addAddressSubmitting}
							/>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeAddAddress} disabled={addAddressSubmitting}>
					Cancel
				</Button>
				<Button onclick={submitAddAddress} disabled={addAddressSubmitting}>
					{addAddressSubmitting ? 'Saving...' : 'Save address'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Address Sheet -->
<Sheet.Root bind:open={editAddressOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Edit address</Sheet.Title>
				<Sheet.Description>Update this address.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if editAddressError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editAddressError}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-addr-first-name" class="text-sm font-medium">First name</label>
							<Input
								id="edit-addr-first-name"
								bind:value={editAddrFirstName}
								placeholder="First name"
								class="h-9"
								disabled={editAddressSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-addr-last-name" class="text-sm font-medium">Last name</label>
							<Input
								id="edit-addr-last-name"
								bind:value={editAddrLastName}
								placeholder="Last name"
								class="h-9"
								disabled={editAddressSubmitting}
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-addr-address-1" class="text-sm font-medium">Address line 1</label>
						<Input
							id="edit-addr-address-1"
							bind:value={editAddrAddress1}
							placeholder="Street address"
							class="h-9"
							disabled={editAddressSubmitting}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-addr-address-2" class="text-sm font-medium">
							Address line 2 <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<Input
							id="edit-addr-address-2"
							bind:value={editAddrAddress2}
							placeholder="Apartment, suite, etc."
							class="h-9"
							disabled={editAddressSubmitting}
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-addr-city" class="text-sm font-medium">City</label>
							<Input
								id="edit-addr-city"
								bind:value={editAddrCity}
								placeholder="City"
								class="h-9"
								disabled={editAddressSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-addr-province" class="text-sm font-medium">
								Province / State <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-addr-province"
								bind:value={editAddrProvince}
								placeholder="Province or state"
								class="h-9"
								disabled={editAddressSubmitting}
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-addr-postal-code" class="text-sm font-medium">
								Postal code <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-addr-postal-code"
								bind:value={editAddrPostalCode}
								placeholder="Postal code"
								class="h-9"
								disabled={editAddressSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-addr-country-code" class="text-sm font-medium">Country code</label>
							<Input
								id="edit-addr-country-code"
								bind:value={editAddrCountryCode}
								placeholder="e.g. US, GB"
								class="h-9"
								disabled={editAddressSubmitting}
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-addr-phone" class="text-sm font-medium">
								Phone <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-addr-phone"
								type="tel"
								bind:value={editAddrPhone}
								placeholder="Phone"
								class="h-9"
								disabled={editAddressSubmitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-addr-company" class="text-sm font-medium">
								Company <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="edit-addr-company"
								bind:value={editAddrCompany}
								placeholder="Company"
								class="h-9"
								disabled={editAddressSubmitting}
							/>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEditAddress} disabled={editAddressSubmitting}>
					Cancel
				</Button>
				<Button onclick={saveEditAddress} disabled={editAddressSubmitting}>
					{editAddressSubmitting ? 'Saving...' : 'Save'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="customer"
	entityTitle={customer ? displayTitle : ''}
	onConfirm={handleConfirmDelete}
	onCancel={closeDeleteModal}
	submitting={deleteSubmitting}
/>

<DeleteConfirmationModal
	bind:open={deleteAddressModalOpen}
	entityName="address"
	entityTitle={deleteAddressTitle}
	onConfirm={handleConfirmDeleteAddress}
	onCancel={closeDeleteAddressModal}
	submitting={deleteAddressSubmitting}
	error={deleteAddressError}
/>

<DeleteConfirmationModal
	bind:open={removeFromGroupModalOpen}
	entityName="customer group"
	entityTitle={removeFromGroupTarget?.name ?? customerGroupName}
	onConfirm={removeCustomerFromGroup}
	onCancel={closeRemoveFromGroupModal}
	submitting={removeFromGroupSubmitting}
	error={removeFromGroupError}
/>

<!-- Add to group modal (Sales Channels–style UI) -->
<Dialog.Root bind:open={addToGroupModalOpen}>
	<Dialog.Content
		class="max-w-3xl h-auto max-h-[85vh] m-auto flex flex-col rounded-xl border shadow-lg"
	>
		<div class="flex flex-1 flex-col overflow-hidden">
			<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
				<Dialog.Title class="text-base font-semibold">Customer group</Dialog.Title>
			</Dialog.Header>

			<!-- Filter and search row (Sales Channels style) -->
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
							bind:value={groupModalSearch}
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
				{#if addToGroupError}
					<div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{addToGroupError}
					</div>
				{/if}
				{#if groupModalLoading}
					<div class="flex items-center justify-center py-12">
						<p class="text-sm text-muted-foreground">Loading…</p>
					</div>
				{:else}
					<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
						<table class="w-full text-sm">
							<thead class="sticky top-0 border-b bg-muted/50">
								<tr>
									<th class="w-10 px-4 py-3 text-left font-medium"></th>
									<th class="px-4 py-3 text-left font-medium">Name</th>
									<th class="px-4 py-3 text-left font-medium">Customers</th>
									<th class="px-4 py-3 text-left font-medium">Created</th>
								</tr>
							</thead>
							<tbody>
								{#if groupModalFiltered.length === 0}
									<tr>
										<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
											No customer groups found.
										</td>
									</tr>
								{:else}
									{#each groupModalFiltered as group (group.id)}
										<tr
											class="border-b transition-colors hover:bg-muted/30 cursor-pointer last:border-b-0"
											role="button"
											tabindex="0"
											onclick={() => toggleGroupSelection(group.id)}
											onkeydown={(e) => e.key === 'Enter' && toggleGroupSelection(group.id)}
										>
											<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
												<input
													type="checkbox"
													checked={selectedGroupIds.includes(group.id)}
													class="size-4 rounded border-input"
													tabindex="-1"
													onclick={(e) => e.stopPropagation()}
													onchange={() => toggleGroupSelection(group.id)}
												/>
											</td>
											<td class="px-4 py-3 font-medium">{group.name}</td>
											<td class="px-4 py-3 text-muted-foreground">–</td>
											<td class="px-4 py-3 text-muted-foreground">
												{group.created_at
													? new Date(group.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
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
				<div class="flex items-center justify-between gap-4 px-6 py-4">
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={!groupModalPagination?.has_previous_page}
								onclick={() => (groupModalPage = groupModalPage - 1)}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{groupModalPagination?.page ?? 1} of {groupModalPagination?.total_pages ?? 1} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={!groupModalPagination?.has_next_page}
								onclick={() => (groupModalPage = groupModalPage + 1)}
							>
								Next
							</Button>
						</div>
						<p class="text-sm text-muted-foreground">
							{#if groupModalPagination && groupModalPagination.total > 0}
								{groupModalStart} – {groupModalEnd} of {groupModalPagination.total} results
							{:else}
								0 results
							{/if}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2 ml-auto">
					<Button variant="outline" onclick={closeAddToGroupModal} disabled={addToGroupSubmitting}>Cancel</Button>
					<Button onclick={saveAddToGroup} disabled={addToGroupSubmitting || selectedGroupIds.length === 0}>
						{addToGroupSubmitting ? 'Saving...' : 'Save'}
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
				<Sheet.Description>View and edit customer metadata key-value pairs.</Sheet.Description>
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
				<Button onclick={submitCustomerMetadata} disabled={metadataSubmitting}>
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
				{#if customer}
					<pre
						class="rounded-md border bg-zinc-900 p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-300"
					><code>{JSON.stringify(customer, null, 2)}</code></pre>
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
