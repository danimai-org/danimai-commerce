<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import FileText from '@lucide/svelte/icons/file-text';
	import Globe from '@lucide/svelte/icons/globe';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Link2 from '@lucide/svelte/icons/link-2';
	import Info from '@lucide/svelte/icons/info';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import X from '@lucide/svelte/icons/x';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ImageIcon from '@lucide/svelte/icons/image';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import Lock from '@lucide/svelte/icons/lock';
	import User from '@lucide/svelte/icons/user';
	import Calendar from '@lucide/svelte/icons/calendar';
	import DollarSign from '@lucide/svelte/icons/dollar-sign';
	import { DropdownMenu } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { goto } from '$app/navigation';

	const API_BASE =
		'http://localhost:8000/admin';
	

	type Order = {
		id: string;
		status: string;
		fulfillment_status: string;
		payment_status: string;
		display_id: number;
		currency_code: string;
		email: string | null;
		customer_id: string | null;
		sales_channel_id: string | null;
		region_id: string | null;
		created_at: string;
		updated_at: string;
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
	let data = $state<{ data: Order[]; pagination: Pagination } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchOrders() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/orders?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			data = (await res.json()) as { data: Order[]; pagination: Pagination };
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			error =
				msg === 'Failed to fetch'
					? 'Could not reach the API. Ensure the backend is running (e.g. bun dev in backend).'
					: msg;
			data = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		page;
		limit;
		fetchOrders();
	});

	const orders = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function statusBadgeClass(status: string): string {
		const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
		switch (status) {
			case 'completed':
			case 'fulfilled':
			case 'captured':
				return `${base} bg-emerald-500/15 text-emerald-700 dark:text-emerald-400`;
			case 'pending':
			case 'not_fulfilled':
			case 'not_paid':
			case 'awaiting':
				return `${base} bg-amber-500/15 text-amber-700 dark:text-amber-400`;
			case 'canceled':
			case 'archived':
			case 'refunded':
			case 'returned':
				return `${base} bg-muted text-muted-foreground`;
			case 'requires_action':
				return `${base} bg-destructive/15 text-destructive`;
			default:
				return `${base} bg-muted text-muted-foreground`;
		}
	}

	// Create order dialog
	type OrderItem = {
		id: string;
		title: string;
		price: number;
		quantity: number;
		currency: string;
		thumbnail: string | null;
	};

	let createOrderOpen = $state(false);
	let productSearch = $state('');
	let customerSearch = $state('');
	let selectedRegion = $state<string>('');
	let selectedCurrency = $state<string>('');
	let notes = $state('');
	let tags = $state('');
	let orderItems = $state<OrderItem[]>([]);
	let discountAmount = $state<number>(0);
	let shippingAmount = $state<number>(0);
	let taxAmount = $state<number>(0);
	let paymentDueLater = $state(false);
	let creditCardSheetOpen = $state(false);
	let billingCountry = $state('India');
	let billingFirstName = $state('');
	let billingLastName = $state('');
	let billingCompany = $state('');
	let billingAddress = $state('');
	let billingApartment = $state('');
	let billingCity = $state('');
	let billingState = $state('');
	let billingPinCode = $state('');
	let billingPhoneCode = $state('+91');
	let billingPhone = $state('');
	let markAsPaidModalOpen = $state(false);
	let notesModalOpen = $state(false);
	let addTagsModalOpen = $state(false);
	let creatingOrder = $state(false);
	const AVAILABLE_TAGS = [
		'Line Item Discount',
		'Order Discount',
		'Custom Item',
		'Custom Shipping Rate',
		'Edited',
		'International Market',
		'Minimal Info',
		'Multiple Fulfillments',
		'Shipping Discount'
	];
	let tagSearch = $state('');
	let selectedTagIds = $state<Set<number>>(new Set());
	function openAddTagsModal() {
		addTagsModalOpen = true;
		tagSearch = '';
		const current = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
		selectedTagIds = new Set(
			AVAILABLE_TAGS.map((t, i) => (current.includes(t) ? i : -1)).filter((i) => i >= 0)
		);
	}
	function saveTagsModal() {
		tags = AVAILABLE_TAGS.filter((_, i) => selectedTagIds.has(i)).join(', ');
		addTagsModalOpen = false;
	}
	function toggleTag(i: number) {
		const next = new Set(selectedTagIds);
		if (next.has(i)) next.delete(i);
		else next.add(i);
		selectedTagIds = next;
	}
	const filteredTags = $derived(
		AVAILABLE_TAGS.map((label, i) => ({ label, i })).filter(
			({ label }) => !tagSearch || label.toLowerCase().includes(tagSearch.toLowerCase())
		)
	);
	const selectedTagsList = $derived(
		tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []
	);
	function removeTag(label: string) {
		tags = selectedTagsList.filter((t) => t !== label).join(', ');
	}
	let selectedCustomer = $state<{
		id: string;
		name: string;
		email: string;
		phone: string | null;
		orderCount: number;
	} | null>(null);
	let regions = $state<{ id: string; name: string; currency_code: string }[]>([]);
	let currencies = $state<{ id: string; code: string; name: string; symbol: string }[]>([]);
	let regionsLoading = $state(false);
	let currenciesLoading = $state(false);

	const subtotal = $derived(
		orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
	);
	const total = $derived(subtotal + discountAmount + shippingAmount + taxAmount);
	const itemCount = $derived(orderItems.reduce((sum, item) => sum + item.quantity, 0));

	function openCreateOrder() {
		createOrderOpen = true;
		productSearch = '';
		customerSearch = '';
		selectedRegion = '';
		selectedCurrency = '';
		notes = '';
		tags = '';
		orderItems = [];
		discountAmount = 0;
		shippingAmount = 0;
		taxAmount = 0;
		paymentDueLater = false;
		selectedCustomer = null;
		fetchRegions();
		fetchCurrencies();
	}

	function addOrderItem(item: OrderItem) {
		orderItems = [...orderItems, item];
		// Calculate tax when items are added (simplified - 9% CGST)
		if (orderItems.length > 0) {
			taxAmount = Math.round(subtotal * 0.09 * 100) / 100;
		}
	}

	function removeOrderItem(id: string) {
		orderItems = orderItems.filter((item) => item.id !== id);
		if (orderItems.length === 0) {
			taxAmount = 0;
		} else {
			taxAmount = Math.round(subtotal * 0.09 * 100) / 100;
		}
	}

	function updateItemQuantity(id: string, quantity: number) {
		orderItems = orderItems.map((item) =>
			item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
		);
		taxAmount = Math.round(subtotal * 0.09 * 100) / 100;
	}

	function formatCurrency(amount: number): string {
		const symbol = selectedCurrencyData?.symbol || '₹';
		return `${symbol}${amount.toFixed(2)}`;
	}

	// Demo function to add sample items (for testing)
	function addSampleItems() {
		if (orderItems.length === 0) {
			orderItems = [
				{
					id: '1',
					title: 'Gift Card',
					price: 100,
					quantity: 1,
					currency: selectedCurrency || 'INR',
					thumbnail: null
				},
				{
					id: '2',
					title: 'The Multi-location Snowboard',
					price: 729.95,
					quantity: 1,
					currency: selectedCurrency || 'INR',
					thumbnail: null
				}
			];
			taxAmount = Math.round(subtotal * 0.09 * 100) / 100;
		}
	}

	function closeCreateOrder() {
		createOrderOpen = false;
	}

	async function fetchRegions() {
		regionsLoading = true;
		try {
			const res = await fetch(`${API_BASE}/regions?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const json = (await res.json()) as { data: { id: string; name: string; currency_code: string }[] };
				regions = json.data;
				if (regions.length > 0 && !selectedRegion) {
					selectedRegion = regions[0].id;
					selectedCurrency = regions[0].currency_code;
				}
			}
		} catch (e) {
			console.error('Failed to fetch regions:', e);
		} finally {
			regionsLoading = false;
		}
	}

	async function fetchCurrencies() {
		currenciesLoading = true;
		try {
			const res = await fetch(`${API_BASE}/currencies?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const json = (await res.json()) as {
					data: { id: string; code: string; name: string; symbol: string }[];
				};
				currencies = json.data;
			}
		} catch (e) {
			console.error('Failed to fetch currencies:', e);
		} finally {
			currenciesLoading = false;
		}
	}

	const selectedRegionData = $derived(regions.find((r) => r.id === selectedRegion));
	const selectedCurrencyData = $derived(
		currencies.find((c) => c.code === selectedCurrency) ||
			currencies.find((c) => c.code === selectedRegionData?.currency_code)
	);

	// Product browser dialog
	type Product = {
		id: string;
		title: string;
		handle: string;
		status: string;
		thumbnail: string | null;
		variants?: Array<{ id: string; title: string; prices?: Array<{ amount: number; currency_code: string }> }>;
	};

	let productBrowserOpen = $state(false);
	let productBrowserPage = $state(1);
	let productBrowserSearch = $state('');
	let productBrowserRawData = $state<{
		products?: Product[];
		count?: number;
		offset?: number;
		limit?: number;
	} | null>(null);
	let productBrowserLoading = $state(false);
	let selectedProductIds = $state<string[]>([]);

	async function fetchProducts() {
		productBrowserLoading = true;
		try {
			const params = new URLSearchParams({
				page: String(productBrowserPage),
				limit: '20',
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			if (productBrowserSearch.trim()) {
				params.append('search', productBrowserSearch.trim());
			}
			const res = await fetch(`${API_BASE}/products?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			productBrowserRawData = (await res.json()) as {
				products?: Product[];
				count?: number;
				offset?: number;
				limit?: number;
			};
		} catch {
			productBrowserRawData = null;
		} finally {
			productBrowserLoading = false;
		}
	}

	function openProductBrowser() {
		selectedProductIds = [];
		productBrowserPage = 1;
		productBrowserSearch = '';
		productBrowserOpen = true;
	}

	function closeProductBrowser() {
		productBrowserOpen = false;
		selectedProductIds = [];
	}

	const productBrowserProducts = $derived(productBrowserRawData?.products ?? []);
	const productBrowserLimit = $derived(productBrowserRawData?.limit ?? 20);
	const productBrowserTotal = $derived(productBrowserRawData?.count ?? 0);
	const productBrowserOffset = $derived(productBrowserRawData?.offset ?? 0);
	const productBrowserPageNum = $derived(
		productBrowserLimit > 0 ? Math.floor(productBrowserOffset / productBrowserLimit) + 1 : 1
	);
	const productBrowserTotalPages = $derived(
		productBrowserLimit > 0 ? Math.ceil(productBrowserTotal / productBrowserLimit) : 1
	);
	const productBrowserPagination = $derived({
		total: productBrowserTotal,
		page: productBrowserPageNum,
		limit: productBrowserLimit,
		total_pages: productBrowserTotalPages,
		has_next_page: productBrowserPageNum < productBrowserTotalPages,
		has_previous_page: productBrowserPageNum > 1
	});
	const productBrowserStart = $derived((productBrowserPageNum - 1) * productBrowserLimit + 1);
	const productBrowserEnd = $derived(Math.min(productBrowserPageNum * productBrowserLimit, productBrowserTotal));

	function toggleProductSelection(productId: string) {
		selectedProductIds = selectedProductIds.includes(productId)
			? selectedProductIds.filter((id) => id !== productId)
			: [...selectedProductIds, productId];
	}

	async function addSelectedProducts() {
		if (selectedProductIds.length === 0) {
			closeProductBrowser();
			return;
		}

		for (const productId of selectedProductIds) {
			const product = productBrowserProducts.find((p) => p.id === productId);
			if (!product) continue;

			try {
				// Fetch variants for this product
				const variantsRes = await fetch(`${API_BASE}/product-variants?limit=100`, { cache: 'no-store' });
				let variants: Array<{
					id: string;
					title: string;
					product_id: string | null;
					thumbnail: string | null;
				}> = [];
				
				if (variantsRes.ok) {
					const variantsData = (await variantsRes.json()) as { data?: Array<{
						id: string;
						title: string;
						product_id: string | null;
						thumbnail: string | null;
					}> };
					variants = (variantsData.data ?? []).filter((v) => v.product_id === productId);
				}

				// Get first variant or use product itself
				const variant = variants[0];
				let price = 0;
				let currency = selectedCurrency || 'INR';

				// Try to fetch prices for the variant
				if (variant) {
					try {
						const variantRes = await fetch(`${API_BASE}/product-variants/${variant.id}`, { cache: 'no-store' });
						if (variantRes.ok) {
							const variantData = (await variantRes.json()) as { prices?: Array<{ amount: string; currency_code: string }> };
							if (variantData.prices && variantData.prices.length > 0) {
								// Find price matching selected currency, or use first available price
								const matchingPrice = variantData.prices.find((p) => p.currency_code.toLowerCase() === currency.toLowerCase());
								const priceToUse = matchingPrice || variantData.prices[0];
								if (priceToUse) {
									// Convert from cents to the actual currency amount
									price = parseFloat(priceToUse.amount) / 100;
									currency = priceToUse.currency_code;
								}
							}
						}
					} catch {
						// Price fetch failed, will use 0
					}
				}

				// Use variant thumbnail or product thumbnail
				const thumbnail = variant?.thumbnail ?? product.thumbnail;

				addOrderItem({
					id: variant?.id ?? productId,
					title: product.title,
					price: price,
					quantity: 1,
					currency,
					thumbnail
				});
			} catch {
				// Fallback: add product without variant details
				addOrderItem({
					id: productId,
					title: product.title,
					price: 0,
					quantity: 1,
					currency: selectedCurrency || 'INR',
					thumbnail: product.thumbnail
				});
			}
		}

		closeProductBrowser();
	}

	let previousProductBrowserSearch = $state('');
	$effect(() => {
		if (productBrowserSearch !== previousProductBrowserSearch) {
			previousProductBrowserSearch = productBrowserSearch;
			productBrowserPage = 1;
		}
	});

	$effect(() => {
		if (!productBrowserOpen) return;
		productBrowserPage;
		productBrowserSearch;
		fetchProducts();
	});

	// Customer browser (for Create Order)
	type CustomerListItem = {
		id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		phone: string | null;
		has_account: boolean;
		created_at: string;
	};
	let customerBrowserOpen = $state(false);
	let customerBrowserPage = $state(1);
	let customerBrowserSearch = $state('');
	let customerBrowserRawData = $state<{
		data?: CustomerListItem[];
		pagination?: Pagination;
	} | null>(null);
	let customerBrowserLoading = $state(false);

	async function fetchCustomersForOrder() {
		customerBrowserLoading = true;
		try {
			const params = new URLSearchParams({
				page: String(customerBrowserPage),
				limit: '20',
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			if (customerBrowserSearch.trim()) {
				params.append('search', customerBrowserSearch.trim());
			}
			const res = await fetch(`${API_BASE}/customers?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			customerBrowserRawData = (await res.json()) as {
				data?: CustomerListItem[];
				pagination?: Pagination;
			};
		} catch {
			customerBrowserRawData = null;
		} finally {
			customerBrowserLoading = false;
		}
	}

	function openCustomerBrowser() {
		customerBrowserPage = 1;
		customerBrowserSearch = '';
		customerBrowserOpen = true;
	}

	function closeCustomerBrowser() {
		customerBrowserOpen = false;
	}

	function selectCustomer(c: CustomerListItem) {
		const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;
		selectedCustomer = {
			id: c.id,
			name,
			email: c.email,
			phone: c.phone ?? null,
			orderCount: 0
		};
		closeCustomerBrowser();
	}

	const customerBrowserCustomers = $derived(customerBrowserRawData?.data ?? []);
	const customerBrowserPagination = $derived(customerBrowserRawData?.pagination ?? null);
	const customerBrowserTotal = $derived(customerBrowserPagination?.total ?? 0);
	const customerBrowserLimit = $derived(customerBrowserPagination?.limit ?? 20);
	const customerBrowserTotalPages = $derived(
		customerBrowserLimit > 0 ? Math.ceil(customerBrowserTotal / customerBrowserLimit) : 1
	);
	const customerBrowserPageNum = $derived(customerBrowserPagination?.page ?? 1);
	const customerBrowserStart = $derived((customerBrowserPageNum - 1) * customerBrowserLimit + 1);
	const customerBrowserEnd = $derived(
		Math.min(customerBrowserPageNum * customerBrowserLimit, customerBrowserTotal)
	);

	let previousCustomerBrowserSearch = $state('');
	$effect(() => {
		if (customerBrowserSearch !== previousCustomerBrowserSearch) {
			previousCustomerBrowserSearch = customerBrowserSearch;
			customerBrowserPage = 1;
		}
	});

	$effect(() => {
		if (!customerBrowserOpen) return;
		customerBrowserPage;
		customerBrowserSearch;
		fetchCustomersForOrder();
	});

	async function createOrder() {
		if (orderItems.length === 0) return;
		if (!selectedCurrency || !selectedRegion) return;

		creatingOrder = true;
		try {
			const orderData = {
				orders: [
					{
						currency_code: selectedCurrency,
						region_id: selectedRegion,
						customer_id: selectedCustomer?.id ?? null,
						email: selectedCustomer?.email ?? null,
						payment_status: 'captured',
						status: 'pending',
						fulfillment_status: 'not_fulfilled',
						metadata: (() => {
							const billing =
								billingFirstName?.trim() || billingLastName?.trim() || billingAddress?.trim()
									? {
											first_name: billingFirstName?.trim() || null,
											last_name: billingLastName?.trim() || null,
											company: billingCompany?.trim() || null,
											address_1: billingAddress?.trim() || null,
											address_2: billingApartment?.trim() || null,
											city: billingCity?.trim() || null,
											state: billingState?.trim() || null,
											postal_code: billingPinCode?.trim() || null,
											country: billingCountry?.trim() || null,
											phone_code: billingPhoneCode?.trim() || null,
											phone: billingPhone?.trim() || null
										}
									: null;
							return {
								notes: notes || null,
								tags: tags || null,
								subtotal: subtotal,
								discount_amount: discountAmount,
								shipping_amount: shippingAmount,
								tax_amount: taxAmount,
								total: total,
								billing_address: billing ? JSON.stringify(billing) : null
							};
						})()
					}
				]
			};

			const res = await fetch(`${API_BASE}/orders`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(orderData)
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(errorText || 'Failed to create order');
			}

			const result = (await res.json()) as { data: Order[] };
			if (result.data && result.data.length > 0) {
				const createdOrder = result.data[0];
				createOrderOpen = false;
				markAsPaidModalOpen = false;
				creditCardSheetOpen = false;
				await fetchOrders();
				goto(`/orders/${createdOrder.id}`);
			}
		} catch (e) {
			console.error('Failed to create order:', e);
			alert(e instanceof Error ? e.message : 'Failed to create order');
		} finally {
			creatingOrder = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ShoppingCart class="size-4" />
				<span class="font-semibold">Orders</span>
			</div>
			<Button size="sm" onclick={openCreateOrder}>Create</Button>
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
							placeholder="Search orders..."
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
							<th class="px-4 py-3 text-left font-medium">Order</th>
							<th class="px-4 py-3 text-left font-medium">Status</th>
							<th class="px-4 py-3 text-left font-medium">Fulfillment</th>
							<th class="px-4 py-3 text-left font-medium">Payment</th>
							<th class="px-4 py-3 text-left font-medium">Customer</th>
							<th class="px-4 py-3 text-left font-medium">Date</th>
						</tr>
					</thead>
					<tbody>
						{#if orders.length === 0}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
									No orders found.
								</td>
							</tr>
						{:else}
							{#each orders as order (order.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">
										<a
											href="/orders/{order.id}"
											class="text-primary hover:underline focus:outline-none focus:underline"
										>
											#{order.display_id}
										</a>
									</td>
									<td class="px-4 py-3">
										<span class={statusBadgeClass(order.status)}>
											{order.status.replace(/_/g, ' ')}
										</span>
									</td>
									<td class="px-4 py-3">
										<span class={statusBadgeClass(order.fulfillment_status)}>
											{order.fulfillment_status.replace(/_/g, ' ')}
										</span>
									</td>
									<td class="px-4 py-3">
										<span class={statusBadgeClass(order.payment_status)}>
											{order.payment_status.replace(/_/g, ' ')}
										</span>
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{order.email ?? '–'}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{formatDate(order.created_at)}
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

<!-- Create Order Dialog -->
<Dialog.Root bind:open={createOrderOpen}>
	<Dialog.Content class="h-full w-full">
		<div class="flex h-full flex-col bg-muted/30">
			<!-- Header with breadcrumb -->
			<div class="flex shrink-0 items-center gap-2 border-b bg-background px-6 py-4">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<FileText class="size-4" />
					<span>></span>
					<span class="text-foreground">Create order</span>
				</div>
			</div>

			<!-- Main content -->
			<div class="flex min-h-0 flex-1 gap-6 overflow-auto p-6">
				<!-- Left Column -->
				<div class="flex min-w-0 flex-1 flex-col gap-6">
					<!-- Products Card -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-sm font-semibold">Products</h3>
							<button
								type="button"
								class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<MoreHorizontal class="size-4" />
							</button>
						</div>
						<div class="flex flex-col gap-3">
							<div class="relative">
								<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									type="search"
									placeholder="Search products"
									bind:value={productSearch}
									class="h-9 rounded-md pl-9"
								/>
							</div>
							<div class="flex gap-2">
								<Button variant="outline" size="sm" class="flex-1" onclick={openProductBrowser}>
									Browse
								</Button>
								<Button variant="outline" size="sm" class="flex-1">
									Add custom item
								</Button>
							</div>
							{#if orderItems.length > 0}
								<div class="mt-4 border-t pt-4">
									<div class="mb-2 grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground">
										<div class="col-span-6">Product</div>
										<div class="col-span-3 text-center">Quantity</div>
										<div class="col-span-3 text-right">Total</div>
									</div>
									<div class="flex flex-col gap-2">
										{#each orderItems as item, i (item.id + '-' + i)}
											<div class="grid grid-cols-12 items-center gap-4 rounded-md border p-2">
												<div class="col-span-6">
													<div class="flex items-center gap-3">
														{#if item.thumbnail}
															<img
																src={item.thumbnail}
																alt=""
																class="size-10 shrink-0 rounded-md object-cover"
															/>
														{:else}
															<div
																class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
															>
																<ImageIcon class="size-5" />
															</div>
														{/if}
														<div class="flex-1 min-w-0">
															<div class="text-sm font-medium truncate">{item.title}</div>
															<div class="text-xs text-muted-foreground">{formatCurrency(item.price)}</div>
														</div>
													</div>
												</div>
												<div class="col-span-3">
													<Input
														type="number"
														min="1"
														value={item.quantity}
														oninput={(e) =>
															updateItemQuantity(item.id, Number((e.target as HTMLInputElement).value))}
														class="h-8 text-center"
													/>
												</div>
												<div class="col-span-2 text-right text-sm font-medium">
													{formatCurrency(item.price * item.quantity)}
												</div>
												<div class="col-span-1">
													<button
														type="button"
														onclick={() => removeOrderItem(item.id)}
														class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<X class="size-4" />
													</button>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Payment Card -->
					<div class="rounded-lg border bg-card p-4">
						<h3 class="mb-4 text-sm font-semibold">Payment</h3>
						<div class="flex flex-col gap-3">
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">
									Subtotal {itemCount > 0 ? `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})` : ''}
								</span>
								<span class="font-medium">{formatCurrency(subtotal)}</span>
							</div>
							<button
								type="button"
								class="flex items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
								onclick={() => {
									// TODO: Open discount dialog
								}}
							>
								<span>Add discount</span>
								<span>{discountAmount === 0 ? '—' : formatCurrency(discountAmount)}</span>
							</button>
							<button
								type="button"
								class="flex items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
								onclick={() => {
									// TODO: Open shipping dialog
								}}
							>
								<span>Add shipping or delivery</span>
								<span>{shippingAmount === 0 ? '—' : formatCurrency(shippingAmount)}</span>
							</button>
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center gap-1">
									<span class="text-muted-foreground">Estimated tax</span>
									<Info class="size-3.5 text-muted-foreground" />
								</div>
								{#if taxAmount > 0}
									<div class="text-right">
										<div class="text-xs text-muted-foreground">CGST 9%</div>
										<div class="font-medium">{formatCurrency(taxAmount)}</div>
									</div>
								{:else}
									<span class="text-muted-foreground">Not calculated</span>
								{/if}
							</div>
							<div class="border-t pt-3">
								<div class="flex items-center justify-between text-sm font-semibold">
									<span>Total</span>
									<span>{formatCurrency(total)}</span>
								</div>
							</div>
						</div>
						{#if orderItems.length > 0}
							<div class="mt-4 flex flex-col gap-3">
								<label class="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										bind:checked={paymentDueLater}
										class="rounded border-input"
									/>
									<span>Payment due later</span>
								</label>
								<div class="flex gap-2">
									<Button variant="outline" size="sm" class="flex-1">
										Send invoice
									</Button>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
										>
											Collect payment
											<ChevronDown class="ml-1 size-4" />
										</DropdownMenu.Trigger>
										<DropdownMenu.Portal>
											<DropdownMenu.Content
												class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
											>
												<DropdownMenu.Item onSelect={() => (creditCardSheetOpen = true)} class="flex items-center gap-2 cursor-pointer">
													<CreditCard class="size-4" />
													Credit card
												</DropdownMenu.Item>
												<DropdownMenu.Item onSelect={() => (markAsPaidModalOpen = true)} class="cursor-pointer">Mark as paid</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								</div>
							</div>
						{:else}
							<p class="mt-4 text-xs text-muted-foreground">
								Add a product to calculate total and view payment options
							</p>
						{/if}
					</div>
				</div>

				<!-- Right Column -->
				<div class="flex w-80 flex-col gap-6">
					<!-- Notes Card -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-sm font-semibold">Notes</h3>
							<button
								type="button"
								onclick={() => (notesModalOpen = true)}
								class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Pencil class="size-3.5" />
							</button>
						</div>
						<p class="text-sm text-muted-foreground">{notes || 'No notes'}</p>
					</div>

					<!-- Customer Card -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-sm font-semibold">Customer</h3>
							<button
								type="button"
								class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<MoreHorizontal class="size-4" />
							</button>
						</div>
						{#if selectedCustomer}
							<div class="flex flex-col gap-3">
								<div class="flex items-start justify-between gap-2">
									<div>
										<button
											type="button"
											class="text-sm font-medium text-primary hover:underline"
											onclick={() => {
												// TODO: Navigate to customer
											}}
										>
											{selectedCustomer.name}
										</button>
										<div class="mt-1 text-xs text-muted-foreground">
											{selectedCustomer.orderCount === 0
												? 'No orders'
												: `${selectedCustomer.orderCount} ${selectedCustomer.orderCount === 1 ? 'order' : 'orders'}`}
										</div>
									</div>
									<button
										type="button"
										class="shrink-0 text-xs text-muted-foreground hover:text-foreground"
										onclick={openCustomerBrowser}
									>
										Change
									</button>
								</div>
								<div class="space-y-1 text-sm">
									<div>
										<button
											type="button"
											class="text-muted-foreground hover:text-foreground hover:underline"
											onclick={() => {
												// TODO: Open email
											}}
										>
											{selectedCustomer.email}
										</button>
									</div>
									{#if selectedCustomer.phone}
										<div class="text-muted-foreground">{selectedCustomer.phone}</div>
									{/if}
								</div>
								<div class="space-y-1 text-sm">
									<div class="text-muted-foreground">No shipping address provided</div>
									<div class="text-muted-foreground">Same as shipping address</div>
								</div>
							</div>
						{:else}
							<div class="flex flex-col gap-2">
								<div class="relative flex gap-2">
									<button
										type="button"
										class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm text-muted-foreground ring-offset-background transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
										onclick={openCustomerBrowser}
									>
										<Search class="size-4 shrink-0 text-muted-foreground" />
										<span class="truncate">Search or create a customer</span>
									</button>
									<Button variant="outline" size="sm" onclick={openCustomerBrowser}>
										Browse
									</Button>
								</div>
							</div>
						{/if}
					</div>

					<!-- Billing address Card -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-sm font-semibold">Billing address</h3>
						</div>
						{#if billingFirstName?.trim() || billingLastName?.trim() || billingAddress?.trim()}
							<div class="space-y-0.5 text-sm text-muted-foreground">
								{#if billingFirstName?.trim() || billingLastName?.trim()}
									<div>{[billingFirstName, billingLastName].filter((s) => s?.trim()).join(' ')}</div>
								{/if}
								{#if billingCompany?.trim()}
									<div>{billingCompany}</div>
								{/if}
								{#if billingAddress?.trim()}
									<div>{billingAddress}</div>
									{#if billingApartment?.trim()}
										<div>{billingApartment}</div>
									{/if}
								{/if}
								{#if billingCity?.trim() || billingState?.trim() || billingPinCode?.trim()}
									<div>
										{[billingCity, billingState, billingPinCode].filter((s) => s?.trim()).join(', ')}
									</div>
								{/if}
								{#if billingCountry?.trim()}
									<div>{billingCountry}</div>
								{/if}
								{#if billingPhone?.trim()}
									<div>{billingPhoneCode}{billingPhoneCode ? ' ' : ''}{billingPhone}</div>
								{/if}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No billing address provided</p>
						{/if}
					</div>

					<!-- Markets Card -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-sm font-semibold">Markets</h3>
							<button
								type="button"
								class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Link2 class="size-3.5" />
							</button>
						</div>
						<div class="flex flex-col gap-3">
							{#if selectedRegionData}
								<div class="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs">
									<Globe class="size-3.5" />
									<span>{selectedRegionData.name}</span>
								</div>
							{/if}
							<div class="flex flex-col gap-2">
								<span class="text-xs text-muted-foreground">Currency</span>
								<Select.Root
									type="single"
									value={selectedCurrency}
									onValueChange={(v) => {
										if (v) selectedCurrency = v;
									}}
								>
									<Select.Trigger class="h-9 w-full">
										{selectedCurrencyData
											? `${selectedCurrencyData.name} (${selectedCurrencyData.code} ${selectedCurrencyData.symbol})`
											: 'Select currency'}
									</Select.Trigger>
									<Select.Content>
										{#each currencies as currency (currency.id)}
											<Select.Item value={currency.code} label={`${currency.name} (${currency.code} ${currency.symbol})`}>
												{currency.name} ({currency.code} {currency.symbol})
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						</div>
					</div>

					<!-- Tags Card -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-sm font-semibold">Tags</h3>
							<button
								type="button"
								class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								onclick={openAddTagsModal}
								aria-label="Add tags"
							>
								<Pencil class="size-3.5" />
							</button>
						</div>
						<button
							type="button"
							class="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-left text-sm text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							onclick={openAddTagsModal}
						>
							<span>Add tags</span>
						</button>
						{#if selectedTagsList.length > 0}
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each selectedTagsList as label}
									<span
										class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm text-muted-foreground"
									>
										{label}
										<button
											type="button"
											class="flex size-4 items-center justify-center rounded-sm hover:bg-muted hover:text-foreground"
											onclick={(e) => { e.stopPropagation(); removeTag(label); }}
											aria-label="Remove {label}"
										>
											<X class="size-3" />
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Product Browser Dialog -->
<Dialog.Root bind:open={productBrowserOpen}>
	<Dialog.Content
		class="max-w-3xl h-auto max-h-[85vh] m-auto flex flex-col rounded-xl border shadow-lg"
	>
		<div class="flex flex-1 flex-col overflow-hidden">
			<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
				<Dialog.Title class="text-base font-semibold">Browse Products</Dialog.Title>
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
							placeholder="Search products"
							bind:value={productBrowserSearch}
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
				{#if productBrowserLoading}
					<div class="flex items-center justify-center py-12">
						<p class="text-sm text-muted-foreground">Loading…</p>
					</div>
				{:else}
					<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
						<table class="w-full text-sm">
							<thead class="sticky top-0 border-b bg-muted/50">
								<tr>
									<th class="w-10 px-4 py-3 text-left font-medium"></th>
									<th class="px-4 py-3 text-left font-medium">Product</th>
									<th class="px-4 py-3 text-left font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{#if productBrowserProducts.length === 0}
									<tr>
										<td colspan="3" class="px-4 py-8 text-center text-muted-foreground">
											No products found.
										</td>
									</tr>
								{:else}
									{#each productBrowserProducts as product (product.id)}
										<tr
											class="border-b transition-colors hover:bg-muted/30 cursor-pointer last:border-b-0"
											role="button"
											tabindex="0"
											onclick={() => toggleProductSelection(product.id)}
											onkeydown={(e) => e.key === 'Enter' && toggleProductSelection(product.id)}
										>
											<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
												<input
													type="checkbox"
													checked={selectedProductIds.includes(product.id)}
													class="size-4 rounded border-input"
													tabindex="-1"
													onclick={(e) => e.stopPropagation()}
													onchange={() => toggleProductSelection(product.id)}
												/>
											</td>
											<td class="px-4 py-3">
												<div class="flex items-center gap-3">
													{#if product.thumbnail}
														<img
															src={product.thumbnail}
															alt=""
															class="size-10 shrink-0 rounded-md object-cover"
														/>
													{:else}
														<div
															class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
														>
															<ImageIcon class="size-5" />
														</div>
													{/if}
													<span class="font-medium">{product.title}</span>
												</div>
											</td>
											<td class="px-4 py-3 text-muted-foreground">
												<span class={statusBadgeClass(product.status)}>
													{product.status.replace(/_/g, ' ')}
												</span>
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
								disabled={!productBrowserPagination?.has_previous_page}
								onclick={() => (productBrowserPage = productBrowserPage - 1)}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{productBrowserPagination?.page ?? 1} of {productBrowserPagination?.total_pages ?? 1} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={!productBrowserPagination?.has_next_page}
								onclick={() => (productBrowserPage = productBrowserPage + 1)}
							>
								Next
							</Button>
						</div>
						<p class="text-sm text-muted-foreground">
							{#if productBrowserPagination && productBrowserPagination.total > 0}
								{productBrowserStart} – {productBrowserEnd} of {productBrowserPagination.total} results
							{:else}
								0 results
							{/if}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2 ml-auto">
					<Button variant="outline" onclick={closeProductBrowser}>Cancel</Button>
					<Button onclick={addSelectedProducts} disabled={selectedProductIds.length === 0}>
						Add {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}
					</Button>
				</div>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Customer Browser Dialog -->
<Dialog.Root bind:open={customerBrowserOpen}>
	<Dialog.Content
		class="max-w-3xl h-auto max-h-[85vh] m-auto flex flex-col rounded-xl border shadow-lg"
	>
		<div class="flex flex-1 flex-col overflow-hidden">
			<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
				<Dialog.Title class="text-base font-semibold">Select customer</Dialog.Title>
			</Dialog.Header>

			<div class="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
				<div class="relative w-64 ml-auto">
					<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search customers"
						bind:value={customerBrowserSearch}
						class="h-9 rounded-md pl-9"
					/>
				</div>
			</div>

			<div class="flex flex-1 flex-col overflow-auto p-6">
				{#if customerBrowserLoading}
					<div class="flex items-center justify-center py-12">
						<p class="text-sm text-muted-foreground">Loading…</p>
					</div>
				{:else}
					<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
						<table class="w-full text-sm">
							<thead class="sticky top-0 border-b bg-muted/50">
								<tr>
									<th class="px-4 py-3 text-left font-medium">Customer</th>
									<th class="px-4 py-3 text-left font-medium">Email</th>
									<th class="px-4 py-3 text-left font-medium">Phone</th>
								</tr>
							</thead>
							<tbody>
								{#if customerBrowserCustomers.length === 0}
									<tr>
										<td colspan="3" class="px-4 py-8 text-center text-muted-foreground">
											No customers found.
										</td>
									</tr>
								{:else}
									{#each customerBrowserCustomers as customer (customer.id)}
										<tr
											class="border-b transition-colors hover:bg-muted/30 cursor-pointer last:border-b-0"
											role="button"
											tabindex="0"
											onclick={() => selectCustomer(customer)}
											onkeydown={(e) => e.key === 'Enter' && selectCustomer(customer)}
										>
											<td class="px-4 py-3 font-medium">
												{[customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email}
											</td>
											<td class="px-4 py-3 text-muted-foreground">{customer.email}</td>
											<td class="px-4 py-3 text-muted-foreground">{customer.phone ?? '–'}</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<Dialog.Footer class="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-4">
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={customerBrowserPageNum <= 1}
							onclick={() => (customerBrowserPage = customerBrowserPageNum - 1)}
						>
							Prev
						</Button>
						<span class="text-sm text-muted-foreground">
							{customerBrowserPageNum} of {customerBrowserTotalPages} pages
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={customerBrowserPageNum >= customerBrowserTotalPages}
							onclick={() => (customerBrowserPage = customerBrowserPageNum + 1)}
						>
							Next
						</Button>
					</div>
					<p class="text-sm text-muted-foreground">
						{#if customerBrowserTotal > 0}
							{customerBrowserStart} – {customerBrowserEnd} of {customerBrowserTotal} results
						{:else}
							0 results
						{/if}
					</p>
				</div>
				<Button variant="outline" onclick={closeCustomerBrowser}>Cancel</Button>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Mark as Paid Modal -->
<Dialog.Root bind:open={markAsPaidModalOpen}>
	<Dialog.Content class="max-w-md h-auto max-h-[85vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex flex-col rounded-xl border shadow-lg p-0">
		<Dialog.Header class="px-6 py-4 border-b">
			<Dialog.Title class="text-base font-semibold">Mark as paid</Dialog.Title>
		</Dialog.Header>
		<div class="px-6 py-4">
			<p class="text-sm text-muted-foreground">
				Mark this order as paid if you received {formatCurrency(total)} from another payment method. This will create an order.
			</p>
		</div>
		<Dialog.Footer class="px-6 py-4 border-t !flex-row justify-end gap-2">
			<Button variant="outline" onclick={() => (markAsPaidModalOpen = false)} disabled={creatingOrder}>
				Cancel
			</Button>
			<Button onclick={createOrder} disabled={creatingOrder || orderItems.length === 0}>
				{creatingOrder ? 'Creating...' : 'Create order'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Credit Card Payment Sheet -->
<Sheet.Root bind:open={creditCardSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<div class="flex items-center gap-2">
					<CreditCard class="size-5 text-muted-foreground" />
					<Sheet.Title>Collect Payment</Sheet.Title>
				</div>
				<Sheet.Description>Process credit card payment for this order.</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto px-6 py-6">
				<div class="flex flex-col gap-6">
					<!-- Billing address -->
					<div class="flex flex-col gap-4">
						<h3 class="text-sm font-semibold">Billing address</h3>
						<div class="flex flex-col gap-3">
							<div class="flex flex-col gap-2">
								<label for="billing-country" class="text-sm font-medium">Country/region</label>
								<Select.Root type="single" value={billingCountry} onValueChange={(v) => v && (billingCountry = v)}>
									<Select.Trigger class="h-10 w-full" id="billing-country">
										{billingCountry}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="India" label="India">India</Select.Item>
										<Select.Item value="United States" label="United States">United States</Select.Item>
										<Select.Item value="United Kingdom" label="United Kingdom">United Kingdom</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex flex-col gap-2">
									<label for="billing-first-name" class="text-sm font-medium">First name</label>
									<Input id="billing-first-name" type="text" bind:value={billingFirstName} class="h-10" />
								</div>
								<div class="flex flex-col gap-2">
									<label for="billing-last-name" class="text-sm font-medium">Last name</label>
									<Input id="billing-last-name" type="text" bind:value={billingLastName} class="h-10" />
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-company" class="text-sm font-medium">Company</label>
								<Input id="billing-company" type="text" bind:value={billingCompany} class="h-10" />
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-address" class="text-sm font-medium">Address</label>
								<div class="relative">
									<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
									<Input id="billing-address" type="text" bind:value={billingAddress} class="h-10 pl-10" />
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-apartment" class="text-sm font-medium">Apartment, suite, etc</label>
								<Input id="billing-apartment" type="text" bind:value={billingApartment} class="h-10" />
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex flex-col gap-2">
									<label for="billing-city" class="text-sm font-medium">City</label>
									<Input id="billing-city" type="text" bind:value={billingCity} class="h-10" />
								</div>
								<div class="flex flex-col gap-2">
									<label for="billing-state" class="text-sm font-medium">State</label>
									<Select.Root type="single" value={billingState || undefined} onValueChange={(v) => (billingState = v ?? '')}>
										<Select.Trigger class="h-10 w-full" id="billing-state">
											{billingState || 'Select a state'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="Karnataka" label="Karnataka">Karnataka</Select.Item>
											<Select.Item value="Maharashtra" label="Maharashtra">Maharashtra</Select.Item>
											<Select.Item value="Tamil Nadu" label="Tamil Nadu">Tamil Nadu</Select.Item>
											<Select.Item value="California" label="California">California</Select.Item>
											<Select.Item value="New York" label="New York">New York</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-pin" class="text-sm font-medium">PIN code</label>
								<Input id="billing-pin" type="text" bind:value={billingPinCode} class="h-10" />
							</div>
							<div class="flex flex-col gap-2">
								<label for="billing-phone" class="text-sm font-medium">Phone</label>
								<div class="flex gap-2">
									<Select.Root type="single" value={billingPhoneCode} onValueChange={(v) => v && (billingPhoneCode = v)}>
										<Select.Trigger class="h-10 w-[100px] shrink-0">
											{billingPhoneCode}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="+91" label="+91 India">+91</Select.Item>
											<Select.Item value="+1" label="+1">+1</Select.Item>
											<Select.Item value="+44" label="+44">+44</Select.Item>
										</Select.Content>
									</Select.Root>
									<Input id="billing-phone" type="tel" bind:value={billingPhone} class="h-10 flex-1" placeholder="" />
								</div>
							</div>
						</div>
					</div>

					<!-- Payment Amount Card -->
					<div class="rounded-lg border bg-muted/30 p-4">
						<div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
							<DollarSign class="size-4" />
							<span>Payment Amount</span>
						</div>
						<div class="text-3xl font-bold">{formatCurrency(total)}</div>
					</div>

					<!-- Card Number -->
					<div class="flex flex-col gap-2">
						<label for="card-number" class="flex items-center gap-2 text-sm font-medium">
							<CreditCard class="size-4 text-muted-foreground" />
							Card Number
						</label>
						<div class="relative">
							<CreditCard class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
							<Input 
								id="card-number" 
								type="text" 
								placeholder="1234 5678 9012 3456" 
								class="h-10 pl-10" 
							/>
						</div>
					</div>

					<!-- Expiry Date and CVV -->
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="expiry-date" class="flex items-center gap-2 text-sm font-medium">
								<Calendar class="size-4 text-muted-foreground" />
								Expiry Date
							</label>
							<Input id="expiry-date" type="text" placeholder="MM/YY" class="h-10" />
						</div>
						<div class="flex flex-col gap-2">
							<label for="cvv" class="flex items-center gap-2 text-sm font-medium">
								<Lock class="size-4 text-muted-foreground" />
								CVV
							</label>
							<Input id="cvv" type="text" placeholder="123" class="h-10" />
						</div>
					</div>

					<!-- Cardholder Name -->
					<div class="flex flex-col gap-2">
						<label for="cardholder-name" class="flex items-center gap-2 text-sm font-medium">
							<User class="size-4 text-muted-foreground" />
							Cardholder Name
						</label>
						<Input id="cardholder-name" type="text" placeholder="John Doe" class="h-10" />
					</div>

					<!-- Security Notice -->
					<div class="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
						<Lock class="size-4 shrink-0 mt-0.5" />
						<span>Your payment information is encrypted and secure.</span>
					</div>
				</div>
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (creditCardSheetOpen = false)} disabled={creatingOrder}>
					Cancel
				</Button>
				<Button
					disabled={creatingOrder || orderItems.length === 0}
					onclick={() => createOrder()}
					class="flex items-center gap-2"
				>
					{#if creatingOrder}
						<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
						Creating...
					{:else}
						<CreditCard class="size-4" />
						Process Payment
					{/if}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Notes Edit Modal -->
<Dialog.Root bind:open={notesModalOpen}>
	<Dialog.Content class="max-w-md h-auto max-h-[85vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex flex-col rounded-xl border shadow-lg p-0">
		<Dialog.Header class="px-6 py-4 border-b">
			<Dialog.Title class="text-base font-semibold">Edit Notes</Dialog.Title>
		</Dialog.Header>
		<div class="px-6 py-4">
			<textarea
				placeholder="Add notes..."
				bind:value={notes}
				class="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
			></textarea>
		</div>
		<Dialog.Footer class="px-6 py-4 border-t !flex-row justify-end gap-2">
			<Button variant="outline" onclick={() => (notesModalOpen = false)}>
				Cancel
			</Button>
			<Button onclick={() => (notesModalOpen = false)}>
				Save
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Add tags Modal -->
<Dialog.Root bind:open={addTagsModalOpen}>
	<Dialog.Content
		class="max-w-lg h-auto max-h-[85vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex flex-col rounded-xl border shadow-lg p-0"
	>
		<Dialog.Header class="flex flex-row items-center justify-between px-6 py-4 border-b">
			<Dialog.Title class="text-base font-semibold">Add tags.</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-1 flex-col overflow-hidden px-6 py-4">
			<div class="flex items-center gap-2">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
					<Input
						type="search"
						placeholder="Search to find or create tags."
						bind:value={tagSearch}
						class="h-10 rounded-md border-primary pl-9"
					/>
				</div>
				<button
					type="button"
					class="flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Frequently used"
				>
					<ArrowUpDown class="size-4 shrink-0" />
					<span class="text-sm whitespace-nowrap">Frequently used</span>
				</button>
			</div>
			<div class="mt-4">
				<h4 class="mb-2 text-sm font-medium">Available</h4>
				<div class="max-h-64 space-y-2 overflow-auto rounded-md border p-2">
					{#each filteredTags as { label, i }}
						<label
							class="flex cursor-pointer items-center gap-2 rounded-sm py-1.5 px-2 hover:bg-muted/50"
						>
							<input
								type="checkbox"
								checked={selectedTagIds.has(i)}
								onchange={() => toggleTag(i)}
								class="size-4 rounded border-input"
							/>
							<span class="text-sm">{label}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
		<Dialog.Footer class="flex flex-row justify-end gap-2 border-t px-6 py-4">
			<Button variant="outline" onclick={() => (addTagsModalOpen = false)}>
				Cancel
			</Button>
			<Button onclick={saveTagsModal}>
				Save
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
