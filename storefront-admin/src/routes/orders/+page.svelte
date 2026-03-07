<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		PageHeader,
		CreateOrderDialog,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';

	const API_BASE = 'http://localhost:8000/admin';

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

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			const base = {
				page: '1',
				limit: '10',
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			};
			const fromUrl = paginationQuery as Record<string, unknown>;
			const q: Record<string, string> = { ...base };
			for (const [k, v] of Object.entries(fromUrl)) {
				if (v != null && v !== '') q[k] = String(v);
			}
			const params = new URLSearchParams(q);
			const res = await fetch(`${API_BASE}/orders?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			return (await res.json()) as { rows: Order[]; pagination: Pagination };
		},
		['orders']
	);

	$effect(() => {
		page.url.searchParams.toString();
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const rawRows = $derived((paginateState.query.data?.rows ?? []) as Order[]);
	const rows = $derived(
		rawRows.map((r) => ({ ...r, order_label: `#${r.display_id}` })) as Record<string, unknown>[]
	);
	const listPagination = $derived(paginateState.query.data?.pagination ?? null);
	const start = $derived(
		listPagination ? (listPagination.page - 1) * listPagination.limit + 1 : 0
	);
	const end = $derived(
		listPagination
			? Math.min(listPagination.page * listPagination.limit, listPagination.total)
			: 0
	);

	let searchQuery = $state('');
	let createOrderOpen = $state(false);

	const tableColumns: TableColumn[] = [
		{
			label: 'Order',
			key: 'order_label',
			type: 'link',
			cellHref: (row) => `/orders/${row.id}`,
			textKey: 'order_label'
		},
		{ label: 'Status', key: 'status', type: 'text' },
		{ label: 'Fulfillment', key: 'fulfillment_status', type: 'text' },
		{ label: 'Payment', key: 'payment_status', type: 'text' },
		{ label: 'Customer', key: 'email', type: 'text' },
		{ label: 'Date', key: 'created_at', type: 'date' }
	];
	
</script>

<svelte:head>
	<title>Orders | Danimai Store</title>
	<meta name="description" content="Manage orders." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<PageHeader title="Orders">
			{#snippet icon()}
				<ShoppingCart class="size-4" />
			{/snippet}
			{#snippet action()}
				<Button size="sm" onclick={() => (createOrderOpen = true)}>Create</Button>
			{/snippet}
		</PageHeader>
		<PaginationTable searchPlaceholder="Search orders..." bind:searchQuery>
			{#if paginateState.error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{paginateState.error}
				</div>
			{:else if paginateState.loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={rows}
							columns={tableColumns}
							emptyMessage="No orders found."
						/>
					</table>
				</div>

				<TablePagination
					pagination={listPagination}
					{start}
					{end}
					onPageChange={goToPage}
				/>
			{/if}
		</PaginationTable>
	</div>
</div>

<CreateOrderDialog
	bind:open={createOrderOpen}
	apiBase={API_BASE}
	onSuccess={(id) => goto(`/orders/${id}`)}
/>
