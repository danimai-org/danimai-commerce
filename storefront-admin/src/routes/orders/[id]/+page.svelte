<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { DropdownMenu } from 'bits-ui';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Package from '@lucide/svelte/icons/package';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import Search from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import AtSign from '@lucide/svelte/icons/at-sign';
	import Hash from '@lucide/svelte/icons/hash';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import FileText from '@lucide/svelte/icons/file-text';
	import Printer from '@lucide/svelte/icons/printer';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import User from '@lucide/svelte/icons/user';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';

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
		billing_address_id: string | null;
		shipping_address_id: string | null;
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
		notes?: string | null;
		tags?: string | null;
		items?: OrderItem[];
		subtotal?: number;
		discount_amount?: number;
		shipping_amount?: number;
		tax_amount?: number;
		total?: number;
	};

	const orderId = $derived($page.params.id);

	let order = $state<Order | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let customerSearch = $state('');
	let timelineComment = $state('');
	let editContactOpen = $state(false);
	let editShippingOpen = $state(false);

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

	const orderItems = $derived(orderMetadata().items ?? []);
	const subtotal = $derived(orderMetadata().subtotal ?? 0);
	const discountAmount = $derived(orderMetadata().discount_amount ?? 0);
	const shippingAmount = $derived(orderMetadata().shipping_amount ?? 0);
	const taxAmount = $derived(orderMetadata().tax_amount ?? 0);
	const total = $derived(orderMetadata().total ?? subtotal + discountAmount + shippingAmount + taxAmount);
	const paidAmount = $derived(order?.payment_status === 'captured' ? total : 0);
	const itemCount = $derived(orderItems.reduce((sum, item) => sum + item.quantity, 0));

	function formatCurrency(amount: number): string {
		const symbol = '₹';
		return `${symbol}${amount.toFixed(2)}`;
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

	function formatDateShort(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}
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
					<div class="flex items-center gap-4">
						<Button variant="ghost" size="icon" class="size-8" onclick={() => goto('/orders')}>
							<ArrowLeft class="size-4" />
						</Button>
						<div class="flex items-center gap-3">
							<div class="flex items-center gap-2">
								<FileText class="size-4 text-muted-foreground" />
								<span class="text-sm text-muted-foreground">></span>
								<h1 class="text-lg font-semibold">#{order.display_id}</h1>
							</div>
							<div class="flex items-center gap-2">
								{#if order.payment_status === 'captured'}
									<span class="inline-flex items-center gap-1.5">
										<span class="size-2 rounded-full bg-emerald-500"></span>
										<span class="text-sm font-medium">Paid</span>
									</span>
								{/if}
								{#if order.fulfillment_status === 'not_fulfilled'}
									<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
										<span class="size-2 rounded-full bg-amber-500"></span>
										Unfulfilled
									</span>
								{/if}
							</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="sm">Refund</Button>
						<Button variant="outline" size="sm">Edit</Button>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								Print
								<ChevronDown class="ml-1 size-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
								>
									<DropdownMenu.Item class="cursor-pointer">Print invoice</DropdownMenu.Item>
									<DropdownMenu.Item class="cursor-pointer">Print packing slip</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								More actions
								<ChevronDown class="ml-1 size-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
								>
									<DropdownMenu.Item class="cursor-pointer">Archive order</DropdownMenu.Item>
									<DropdownMenu.Item class="cursor-pointer">Cancel order</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
						<div class="flex flex-col">
							<Button variant="ghost" size="icon" class="size-6">
								<ArrowUp class="size-3" />
							</Button>
							<Button variant="ghost" size="icon" class="size-6">
								<ArrowDown class="size-3" />
							</Button>
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
					<!-- Fulfillment Section -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center gap-2">
							<span class={statusBadgeClass(order.fulfillment_status)}>
								<Package class="mr-1 size-3" />
								{order.fulfillment_status === 'not_fulfilled' ? 'Unfulfilled' : order.fulfillment_status.replace(/_/g, ' ')}
							</span>
							<span class="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
								<MapPin class="size-3" />
								Shop location
							</span>
						</div>
						<div class="mb-4 text-sm font-medium">Shipping</div>
						{#if orderItems.length > 0}
							<div class="mb-4 space-y-4">
								{#each orderItems as item (item.id)}
									<div class="flex items-start gap-4">
										{#if item.thumbnail}
											<img
												src={item.thumbnail}
												alt={item.title}
												class="size-16 shrink-0 rounded-md object-cover"
											/>
										{:else}
											<div
												class="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
											>
												<ImageIcon class="size-6" />
											</div>
										{/if}
										<div class="flex-1 min-w-0">
											<div class="font-medium">{item.title}</div>
											{#if item.sku}
												<div class="text-sm text-muted-foreground">SKU: {item.sku}</div>
											{/if}
											<div class="mt-1 text-sm text-muted-foreground">
												{formatCurrency(item.price)} × {item.quantity}
											</div>
										</div>
										<div class="font-medium">{formatCurrency(item.price * item.quantity)}</div>
									</div>
								{/each}
							</div>
						{/if}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								class="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
							>
								Mark as fulfilled
								<ChevronDown class="ml-1 size-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
								>
									<DropdownMenu.Item class="cursor-pointer">Create fulfillment</DropdownMenu.Item>
									<DropdownMenu.Item class="cursor-pointer">Mark as fulfilled</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					</div>

					<!-- Payment Section -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center gap-2">
							<CheckCircle2 class="size-4 text-emerald-600" />
							<span class="font-medium">Paid</span>
						</div>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-muted-foreground">
									Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
								</span>
								<span class="font-medium">{formatCurrency(subtotal)}</span>
							</div>
							{#if taxAmount > 0}
								<div class="flex justify-between">
									<div class="flex items-center gap-1">
										<span class="text-muted-foreground">Taxes</span>
									</div>
									<div class="text-right">
										<div class="text-xs text-muted-foreground">CGST 9%</div>
										<div class="font-medium">{formatCurrency(taxAmount)}</div>
									</div>
								</div>
							{/if}
							<div class="border-t pt-2">
								<div class="flex justify-between text-sm font-semibold">
									<span>Total</span>
									<span>{formatCurrency(total)}</span>
								</div>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Paid</span>
								<span class="font-medium">{formatCurrency(paidAmount)}</span>
							</div>
						</div>
					</div>

					<!-- Timeline Section -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 text-sm font-semibold">Timeline</div>
						<div class="flex gap-3">
							<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
								<User class="size-4 text-muted-foreground" />
							</div>
							<div class="flex-1">
								<textarea
									placeholder="Leave a comment..."
									bind:value={timelineComment}
									class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
								></textarea>
								<div class="mt-2 flex items-center gap-2">
									<button
										type="button"
										class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										title="Mention"
									>
										<AtSign class="size-4" />
									</button>
									<button
										type="button"
										class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										title="Hashtag"
									>
										<Hash class="size-4" />
									</button>
									<button
										type="button"
										class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										title="Attach"
									>
										<Paperclip class="size-4" />
									</button>
									<div class="ml-auto">
										<Button size="sm" disabled={!timelineComment.trim()}>Post</Button>
									</div>
								</div>
								<p class="mt-2 text-xs text-muted-foreground">
									Only you and other staff can see comments
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Right Sidebar -->
				<div class="flex w-80 flex-col gap-6">
					<!-- Notes Section -->
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
						<p class="text-sm text-muted-foreground">
							{orderMetadata().notes || 'No notes from customer'}
						</p>
					</div>

					<!-- Customer Section -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-sm font-semibold">Customer</h3>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">Customer actions</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Edit contact information"
											class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={() => (editContactOpen = true)}
										>
											Edit contact information
										</DropdownMenu.Item>
										<DropdownMenu.Item
											textValue="Edit shipping address"
											class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={() => (editShippingOpen = true)}
										>
											Edit shipping address
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						<div class="relative mb-4">
							<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search or create a customer"
								bind:value={customerSearch}
								class="h-9 rounded-md pl-9"
							/>
						</div>
						<div class="space-y-4 text-sm">
							<div>
								<div class="mb-1.5 font-medium">Contact information</div>
								<div class="space-y-1 text-muted-foreground">
									{#if order.email}
										<div>{order.email}</div>
									{:else}
										<div>No email provided</div>
									{/if}
									<div>No phone number</div>
								</div>
							</div>
							<div>
								<div class="mb-1.5 font-medium">Shipping address</div>
								<div class="text-muted-foreground">No shipping address provided</div>
							</div>
							<div>
								<div class="mb-1.5 font-medium">Billing address</div>
								<div class="text-muted-foreground">No billing address provided</div>
							</div>
						</div>
					</div>

					<!-- Conversion Summary -->
					<div class="rounded-lg border bg-card p-4">
						<h3 class="mb-2 text-sm font-semibold">Conversion summary</h3>
						<p class="text-sm text-muted-foreground">
							There aren't any conversion details available for this order yet
						</p>
						<button type="button" class="mt-2 text-xs text-primary hover:underline">Learn more</button>
					</div>

					<!-- Order Risk -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-2 flex items-center gap-2">
							<BarChart3 class="size-4 text-muted-foreground" />
							<h3 class="text-sm font-semibold">Order risk</h3>
						</div>
						<p class="text-sm text-muted-foreground">Analysis not available</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
