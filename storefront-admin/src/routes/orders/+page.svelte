<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
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
	import { DropdownMenu } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	const API_BASE =
		import.meta.env.VITE_API_BASE ??
		(import.meta.env.DEV ? '/api' : 'http://localhost:8000');

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
					currency: selectedCurrency || 'INR'
				},
				{
					id: '2',
					title: 'The Multi-location Snowboard',
					price: 729.95,
					quantity: 1,
					currency: selectedCurrency || 'INR'
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
										<span class="text-muted-foreground">#{order.display_id}</span>
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
								<Button variant="outline" size="sm" class="flex-1">
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
										{#each orderItems as item (item.id)}
											<div class="grid grid-cols-12 items-center gap-4 rounded-md border p-2">
												<div class="col-span-6">
													<div class="text-sm font-medium">{item.title}</div>
													<div class="text-xs text-muted-foreground">{formatCurrency(item.price)}</div>
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
												<DropdownMenu.Item>Credit card</DropdownMenu.Item>
												<DropdownMenu.Item>Mark as paid</DropdownMenu.Item>
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
								class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Pencil class="size-3.5" />
							</button>
						</div>
						<p class="text-sm text-muted-foreground">No notes</p>
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
							<div class="relative">
								<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									type="search"
									placeholder="Search or create a customer"
									bind:value={customerSearch}
									class="h-9 rounded-md pl-9"
								/>
							</div>
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
							>
								<Pencil class="size-3.5" />
							</button>
						</div>
						<Input
							type="text"
							placeholder="Add tags"
							bind:value={tags}
							class="h-9 rounded-md"
						/>
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
