<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import FileText from '@lucide/svelte/icons/file-text';
	import Package from '@lucide/svelte/icons/package';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Search from '@lucide/svelte/icons/search';

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
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
	};

	type OrderItem = {
		id: string;
		title: string;
		price: number;
		quantity: number;
		currency: string;
		thumbnail?: string | null;
		sku?: string | null;
	};

	type OrderMetadata = {
		items?: unknown[];
		subtotal?: number;
		discount_amount?: number;
		shipping_amount?: number;
		tax_amount?: number;
		total?: number;
	};

	function normalizeMetaItem(raw: unknown, index: number): OrderItem | null {
		if (!raw || typeof raw !== 'object') return null;
		const o = raw as Record<string, unknown>;
		const id = (o.id as string) ?? (o.variant_id as string) ?? `item-${index}`;
		const title = (o.title as string) ?? (o.product_title as string) ?? 'Unknown';
		let price = 0;
		if (typeof o.price === 'number' && !Number.isNaN(o.price)) price = o.price;
		else if (typeof o.unit_price === 'string') price = parseFloat(o.unit_price) || 0;
		else if (typeof o.unit_price === 'number') price = o.unit_price;
		const quantity = Math.max(0, Math.floor(Number(o.quantity) || 0));
		const currency = (o.currency as string) ?? 'INR';
		const thumbnail = (o.thumbnail as string | null) ?? null;
		const sku = (o.sku as string | null) ?? (o.variant_sku as string | null) ?? null;
		return { id: String(id), title, price, quantity, currency, thumbnail, sku };
	}

	const orderId = $derived($page.params.id);

	let order = $state<Order | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let editItems = $state<OrderItem[]>([]);
	let reasonForEdit = $state('');

	async function loadOrder() {
		if (!orderId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/orders/${orderId}`, { cache: 'no-store' });
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				error = body?.message ?? (res.status === 404 ? 'Order not found' : await res.text());
				order = null;
				return;
			}
			order = (await res.json()) as Order;
			const meta = (order?.metadata ?? {}) as OrderMetadata;
			const rawItems = Array.isArray(meta.items) ? meta.items : [];
			editItems = rawItems
				.map((raw, i) => normalizeMetaItem(raw, i))
				.filter((it): it is OrderItem => it !== null && it.quantity > 0);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			order = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		orderId;
		loadOrder();
	});

	const orderMetadata = $derived((): OrderMetadata => {
		const meta = order?.metadata;
		if (!meta || typeof meta !== 'object' || meta === null) return {};
		return meta as OrderMetadata;
	});

	const calculatedSubtotal = $derived(
		editItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
	);
	const shippingAmount = $derived(orderMetadata().shipping_amount ?? 0);
	const taxRate = 0.09;
	const calculatedTax = $derived(calculatedSubtotal * taxRate);
	const calculatedTotal = $derived(calculatedSubtotal + shippingAmount + calculatedTax);
	const meta = $derived(orderMetadata());
	const displaySubtotal = $derived(editItems.length > 0 ? calculatedSubtotal : (meta.subtotal ?? 0));
	const displayTax = $derived(editItems.length > 0 ? calculatedTax : (meta.tax_amount ?? 0));
	const displayTotal = $derived(editItems.length > 0 ? calculatedTotal : (meta.total ?? calculatedTotal));
	const paidAmount = $derived(order?.payment_status === 'captured' ? (meta.total ?? displayTotal) : 0);

	const origItems = $derived.by(() => {
		const raw = meta.items;
		if (!Array.isArray(raw)) return [];
		return raw
			.map((r, i) => normalizeMetaItem(r, i))
			.filter((it): it is OrderItem => it !== null && it.quantity > 0);
	});
	const hasChanges = $derived.by(() => {
		if (reasonForEdit.trim()) return true;
		if (editItems.length !== origItems.length) return true;
		return editItems.some((it, i) => origItems[i] && (origItems[i].quantity !== it.quantity || origItems[i].id !== it.id));
	});

	function formatCurrency(amount: number): string {
		return `₹${amount.toFixed(2)}`;
	}

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function removeItem(id: string) {
		editItems = editItems.filter((it) => it.id !== id);
	}

	function updateQuantity(id: string, qty: number) {
		const n = Math.max(0, Math.floor(qty));
		editItems = editItems.map((it) => (it.id === id ? { ...it, quantity: n } : it));
		editItems = editItems.filter((it) => it.quantity > 0);
	}

	let updating = $state(false);
	let updateError = $state<string | null>(null);

	async function saveOrder() {
		if (!orderId || !order || !hasChanges) return;
		updating = true;
		updateError = null;
		try {
			const currentMeta = orderMetadata();
			const newSubtotal =
				editItems.length > 0
					? editItems.reduce((s, i) => s + i.price * i.quantity, 0)
					: (currentMeta.subtotal ?? 0);
			const newTax =
				editItems.length > 0 ? newSubtotal * taxRate : (currentMeta.tax_amount ?? 0);
			const newTotal =
				editItems.length > 0
					? newSubtotal + shippingAmount + newTax
					: (currentMeta.total ?? 0);
			const metadata: Record<string, unknown> = {
				...(typeof order.metadata === 'object' && order.metadata !== null
					? (order.metadata as Record<string, unknown>)
					: {}),
				items: editItems,
				subtotal: newSubtotal,
				tax_amount: newTax,
				total: newTotal,
				shipping_amount: shippingAmount,
				discount_amount: currentMeta.discount_amount ?? 0
			};
			if (reasonForEdit.trim()) {
				metadata.reason_for_edit = reasonForEdit.trim();
			}
			const res = await fetch(`${API_BASE}/orders/${orderId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				updateError =
					(body?.message as string) ?? body?.message ?? (await res.text()) ?? 'Failed to update order';
				return;
			}
			goto(`/orders/${orderId}`);
		} catch (e) {
			updateError = e instanceof Error ? e.message : 'Failed to update order';
		} finally {
			updating = false;
		}
	}

	// Add product browser
	type Product = {
		id: string;
		title: string;
		handle: string;
		status: string;
		thumbnail: string | null;
		variants?: Array<{ id: string; title: string; product_id: string | null; thumbnail: string | null }>;
	};
	let addProductOpen = $state(false);
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

	async function fetchProductsForEdit() {
		productBrowserLoading = true;
		try {
			const params = new URLSearchParams({
				page: String(productBrowserPage),
				limit: '20',
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			if (productBrowserSearch.trim()) params.append('search', productBrowserSearch.trim());
			const res = await fetch(`${API_BASE}/products?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			productBrowserRawData = (await res.json()) as typeof productBrowserRawData;
		} catch {
			productBrowserRawData = null;
		} finally {
			productBrowserLoading = false;
		}
	}

	function openAddProduct() {
		selectedProductIds = [];
		productBrowserPage = 1;
		productBrowserSearch = '';
		addProductOpen = true;
	}

	function closeAddProduct() {
		addProductOpen = false;
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

	function toggleProductSelection(productId: string) {
		selectedProductIds = selectedProductIds.includes(productId)
			? selectedProductIds.filter((id) => id !== productId)
			: [...selectedProductIds, productId];
	}

	async function addSelectedProductsToOrder() {
		if (selectedProductIds.length === 0 || !order) {
			closeAddProduct();
			return;
		}
		const currency = order.currency_code || 'INR';
		for (const productId of selectedProductIds) {
			const product = productBrowserProducts.find((p) => p.id === productId);
			if (!product) continue;
			let price = 0;
			let sku: string | null = null;
			let thumbnail = product.thumbnail;
			let variantId = productId;
			try {
				const variantsRes = await fetch(`${API_BASE}/product-variants?limit=100`, { cache: 'no-store' });
				let variants: Array<{ id: string; product_id: string | null; thumbnail: string | null }> = [];
				if (variantsRes.ok) {
					const data = (await variantsRes.json()) as { data?: typeof variants };
					variants = (data.data ?? []).filter((v) => v.product_id === productId);
				}
				const variant = variants[0];
				if (variant) {
					variantId = variant.id;
					thumbnail = variant.thumbnail ?? thumbnail;
					const variantRes = await fetch(`${API_BASE}/product-variants/${variant.id}`, {
						cache: 'no-store'
					});
					if (variantRes.ok) {
						const vData = (await variantRes.json()) as {
							prices?: Array<{ amount: string; currency_code: string }>;
							sku?: string | null;
						};
						sku = vData.sku ?? null;
						if (vData.prices?.length) {
							const p = vData.prices.find((x) => x.currency_code === currency) ?? vData.prices[0];
							price = parseFloat(p.amount) / 100;
						}
					}
				}
			} catch {
				// use defaults
			}
			const newItem: OrderItem = {
				id: `${variantId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
				title: product.title,
				price,
				quantity: 1,
				currency,
				thumbnail,
				sku
			};
			editItems = [...editItems, newItem];
		}
		closeAddProduct();
	}

	$effect(() => {
		if (!addProductOpen) return;
		productBrowserPage;
		productBrowserSearch;
		fetchProductsForEdit();
	});
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col">
		{#if error}
			<div class="p-6">
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{error}
				</div>
			</div>
		{:else if loading}
			<div class="flex min-h-0 flex-1 items-center justify-center">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else if order}
			<!-- Header -->
			<div class="border-b bg-background px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Button variant="ghost" size="icon" class="size-8" onclick={() => goto(`/orders/${orderId}`)}>
							<ArrowLeft class="size-4" />
						</Button>
						<div class="flex items-center gap-2">
							<FileText class="size-4 text-muted-foreground" />
							<span class="text-sm text-muted-foreground">#{order.display_id}</span>
							<span class="text-sm text-muted-foreground">></span>
							<span class="text-lg font-semibold">Edit order</span>
						</div>
					</div>
				</div>
				<div class="mt-2 text-sm text-muted-foreground">
					{formatDate(order.created_at)} from Draft Orders
				</div>
			</div>

			<!-- Main Content -->
			<div class="flex min-h-0 flex-1 gap-6 overflow-auto p-6">
				<!-- Left Column -->
				<div class="flex min-w-0 flex-1 flex-col gap-6">
					<!-- Unfulfilled / Products -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center justify-between">
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
							>
								<Package class="size-3" />
								Unfulfilled
							</span>
							<div class="flex items-center gap-2">
								<Button variant="outline" size="sm" onclick={openAddProduct}>
									<Plus class="size-4" />
									Add product
								</Button>
								<Button variant="outline" size="sm">
									<Plus class="size-4" />
									Add custom item
								</Button>
							</div>
						</div>
						<div class="overflow-hidden rounded-md border">
							<div class="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
								<span>Product</span>
								<span>Price</span>
								<span>Quantity</span>
								<span>Total</span>
								<span></span>
							</div>
							{#if editItems.length > 0}
								<div class="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b">
									<AlertTriangle class="size-3.5 shrink-0" />
									This line item has -2 units in stock
								</div>
							{/if}
							{#each editItems as item (item.id)}
								<div class="border-b bg-background px-3 py-3 last:border-b-0">
									<div class="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 items-center">
										<div class="flex items-center gap-3 min-w-0">
											{#if item.thumbnail}
												<img
													src={item.thumbnail}
													alt={item.title}
													class="size-12 shrink-0 rounded-md object-cover"
												/>
											{:else}
												<div
													class="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
												>
													<ImageIcon class="size-6" />
												</div>
											{/if}
											<div class="min-w-0">
												<div class="font-medium truncate">{item.title}</div>
												{#if item.sku}
													<div class="text-xs text-muted-foreground">{item.sku}</div>
												{/if}
											</div>
										</div>
										<span class="text-sm">{formatCurrency(item.price)}</span>
										<Input
											type="number"
											min="0"
											value={item.quantity}
											oninput={(e) =>
												updateQuantity(item.id, parseInt((e.currentTarget as HTMLInputElement).value, 10))}
											class="h-8 w-20"
										/>
										<span class="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
										<Button
											variant="ghost"
											size="icon"
											class="size-8 text-muted-foreground hover:text-destructive"
											onclick={() => removeItem(item.id)}
											aria-label="Remove"
										>
											<X class="size-4" />
										</Button>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Payment -->
					<div class="rounded-lg border bg-card p-4">
						<h3 class="mb-4 text-sm font-semibold">Payment</h3>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-muted-foreground">Subtotal</span>
								<span class="font-medium">{formatCurrency(displaySubtotal)}</span>
							</div>
							<button type="button" class="text-primary hover:underline text-sm">
								Add shipping fee
							</button>
							<div class="flex justify-between">
								<span class="text-muted-foreground">CGST 9%</span>
								<span class="font-medium">{formatCurrency(displayTax)}</span>
							</div>
							<div class="border-t pt-2 flex justify-between font-semibold">
								<span>Total</span>
								<span>{formatCurrency(displayTotal)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Paid amount</span>
								<span class="font-medium">{formatCurrency(paidAmount)}</span>
							</div>
						</div>
						<p class="mt-3 text-xs text-muted-foreground">
							Taxes are estimated until you update the order
						</p>
					</div>

					<!-- Reason for edit -->
					<div class="rounded-lg border bg-card p-4">
						<h3 class="mb-3 text-sm font-semibold">Reason for edit</h3>
						<textarea
							bind:value={reasonForEdit}
							placeholder="Enter a reason for editing this order..."
							class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
							rows={3}
						></textarea>
						<p class="mt-2 text-xs text-muted-foreground">Only visible to staff</p>
					</div>
				</div>

				<!-- Right Column - Summary -->
				<div class="flex w-80 shrink-0 flex-col">
					<div class="sticky top-6 rounded-lg border bg-card p-4">
						<h3 class="mb-4 text-sm font-semibold">Summary</h3>
						{#if updateError}
							<p class="mb-4 text-sm text-destructive">{updateError}</p>
						{:else}
							<p class="mb-4 text-sm text-muted-foreground">
								{hasChanges ? 'You have unsaved changes' : 'No changes have been made'}
							</p>
						{/if}
						<Button
							class="w-full"
							disabled={!hasChanges || updating}
							onclick={saveOrder}
						>
							{updating ? 'Updating…' : 'Update order'}
						</Button>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t bg-background px-6 py-4 text-center">
				<button type="button" class="text-sm text-primary hover:underline bg-transparent border-none cursor-pointer">Learn more about editing orders</button>
			</div>
		{/if}
	</div>
</div>

<!-- Add product dialog -->
<Dialog.Root bind:open={addProductOpen}>
	<Dialog.Content class="max-w-3xl max-h-[85vh] m-auto flex flex-col rounded-xl border shadow-lg">
		<div class="flex flex-1 flex-col overflow-hidden">
			<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
				<Dialog.Title class="text-base font-semibold">Browse products</Dialog.Title>
			</Dialog.Header>
			<div class="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
				<div class="relative w-64 ml-auto">
					<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search products"
						bind:value={productBrowserSearch}
						class="h-9 rounded-md pl-9"
					/>
				</div>
			</div>
			<div class="flex flex-1 flex-col overflow-auto p-6">
				{#if productBrowserLoading}
					<div class="flex justify-center py-12">
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
											<td class="px-4 py-3">
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
														<div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
															<ImageIcon class="size-5" />
														</div>
													{/if}
													<span class="font-medium">{product.title}</span>
												</div>
											</td>
											<td class="px-4 py-3 text-muted-foreground">
												{product.status?.replace(/_/g, ' ') ?? '–'}
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
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={productBrowserPageNum <= 1}
						onclick={() => (productBrowserPage = productBrowserPage - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{productBrowserPageNum} of {productBrowserTotalPages} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={productBrowserPageNum >= productBrowserTotalPages}
						onclick={() => (productBrowserPage = productBrowserPage + 1)}
					>
						Next
					</Button>
				</div>
				<div class="flex items-center gap-2 ml-auto">
					<Button variant="outline" onclick={closeAddProduct}>Cancel</Button>
					<Button onclick={addSelectedProductsToOrder} disabled={selectedProductIds.length === 0}>
						Add {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}
					</Button>
				</div>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>
