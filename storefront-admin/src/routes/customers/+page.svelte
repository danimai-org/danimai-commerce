<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

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

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	let page = $state(1);
	let limit = $state(10);
	let searchQuery = $state('');
	let data = $state<{ data: Customer[]; pagination: Pagination } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchCustomers() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/customers?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			data = (await res.json()) as { data: Customer[]; pagination: Pagination };
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
		fetchCustomers();
	});

	const customers = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	const filteredCustomers = $derived(
		searchQuery.trim()
			? customers.filter(
					(c) =>
						c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(c.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
						(c.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
				)
			: customers
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
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-foreground">Customers</span>
			</div>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h1 class="text-lg font-semibold leading-none">Customers</h1>
					<p class="mt-1 text-sm text-muted-foreground">
						View and manage your store customers.
					</p>
				</div>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="relative w-64">
					<svg
						class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<Input
						type="search"
						placeholder="Search by email or name"
						bind:value={searchQuery}
						class="h-9 rounded-md pl-9"
					/>
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
							<th class="px-4 py-3 text-left font-medium">Email</th>
							<th class="px-4 py-3 text-left font-medium">First Name</th>
							<th class="px-4 py-3 text-left font-medium">Last Name</th>
							<th class="px-4 py-3 text-left font-medium">Phone</th>
							<th class="px-4 py-3 text-left font-medium">Account</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
						</tr>
					</thead>
					<tbody>
						{#if filteredCustomers.length === 0}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
									No customers found.
								</td>
							</tr>
						{:else}
							{#each filteredCustomers as customer (customer.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 font-medium">{customer.email}</td>
									<td class="px-4 py-3 text-muted-foreground">{customer.first_name ?? '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">{customer.last_name ?? '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">{customer.phone ?? '–'}</td>
									<td class="px-4 py-3 text-muted-foreground">
										{customer.has_account ? 'Yes' : 'No'}
									</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(customer.created_at)}</td>
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
