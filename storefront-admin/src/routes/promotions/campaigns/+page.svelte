<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import Folder from '@lucide/svelte/icons/folder';
	import { resolve } from '$app/paths';
	import { client } from '$lib/client.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import CreateCampaignPromotionSheet from '$lib/components/organs/campaign/create/CreateCampaignPromotionSheet.svelte';
	import { EditCampaignSheet } from '$lib/components/organs/campaign/detail/index.js';
	import Clock from '@lucide/svelte/icons/clock';
	import Info from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils.js';

	type Campaign = {
		id: string;
		name: string;
		description: string | null;
		identifier: string;
		start_date: string | null;
		end_date: string | null;
		budget_type?: 'usage' | 'spend' | null;
		budget_limit?: number | null;
		budget_limit_per?: number | null;
	};

	let searchQuery = $state('');

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () =>
			client['campaigns'].get({
				query: {
					...(paginationQuery as Record<string, unknown>),
					search: searchQuery.trim() || undefined
				}
			}),
		['campaigns']
	);

	let lastRefetchKey = $state<string | null>(null);
	let lastEditQueryHandled = $state<string | null>(null);

	$effect(() => {
		const editId = page.url.searchParams.get('edit');
		if (!editId) {
			lastEditQueryHandled = null;
			return;
		}
		if (editId === lastEditQueryHandled) return;
		lastEditQueryHandled = editId;
		void (async () => {
			const res = await client['campaigns']({ id: editId }).get();
			const c = (res as { data?: Campaign })?.data;
			const params = new SvelteURLSearchParams(page.url.searchParams);
			params.delete('edit');
			const q = params.toString();
			const nextPath = `${page.url.pathname}${q ? `?${q}` : ''}`;
			if (!c) {
				lastEditQueryHandled = null;
				goto(resolve(nextPath, {}), { replaceState: true });
				return;
			}
			openEdit(c);
			goto(resolve(nextPath, {}), { replaceState: true });
		})();
	});

	$effect(() => {
		const currentRefetchKey = `${searchQuery.trim()}::${page.url.searchParams.toString()}`;
		if (lastRefetchKey === null) {
			lastRefetchKey = currentRefetchKey;
			return;
		}
		if (lastRefetchKey === currentRefetchKey) return;
		lastRefetchKey = currentRefetchKey;
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	const rows = $derived((paginateState.query.data?.data?.rows ?? []) as Record<string, unknown>[]);
	const listPagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(listPagination ? (listPagination.page - 1) * listPagination.limit + 1 : 0);
	const end = $derived(
		listPagination ? Math.min(listPagination.page * listPagination.limit, listPagination.total) : 0
	);

	const tableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Description', key: 'description', type: 'text' },
		{ label: 'Identifier', key: 'identifier', type: 'text' },
		{ label: 'Start date', key: 'start_date', type: 'date' },
		{ label: 'End date', key: 'end_date', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => goToCampaignDetails(item)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteModal(item as Campaign)
				}
			]
		}
	];

	// Create campaign sheet
	let createOpen = $state(false);
	let createName = $state('');
	let createIdentifier = $state('');
	let createDescription = $state('');
	let createStartDate = $state('');
	let createEndDate = $state('');
	let createBudgetType = $state<'usage' | 'spend'>('usage');
	let createBudgetLimit = $state('');
	let createBudgetLimitPer = $state<number>(10);
	let createError = $state<string | null>(null);

	let editSheetOpen = $state(false);
	let editSheetCampaign = $state<Campaign | null>(null);

	// Delete confirmation
	let deleteModalOpen = $state(false);
	let campaignToDelete = $state<Campaign | null>(null);

	// View campaign sheet

	// Create promotion flow
	let createPromotionOpen = $state(false);
	let createPromotionCampaignId = $state<string | null>(null);

	const createPromotionCampaignName = $derived.by(() => {
		const id = createPromotionCampaignId;
		if (!id) return 'Unknown';
		if (editSheetCampaign?.id === id) return editSheetCampaign.name;
		const row = rows.find((r) => r.id === id);
		const name = row?.name;
		return typeof name === 'string' ? name : 'Unknown';
	});

	$effect(() => {
		if (!createPromotionOpen) createPromotionCampaignId = null;
	});

	function openCreate() {
		createOpen = true;
		createName = '';
		createIdentifier = '';
		createDescription = '';
		createStartDate = '';
		createEndDate = '';
		createBudgetType = 'usage';
		createBudgetLimit = '';
		createBudgetLimitPer = 10;
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	async function submitCreate() {
		createError = null;
		if (!createName.trim()) {
			createError = 'Name is required';
			return;
		}
		if (!createIdentifier.trim()) {
			createError = 'Identifier is required';
			return;
		}
		await client['campaigns'].post({
			name: createName.trim(),
			description: createDescription.trim() || null,
			identifier: createIdentifier.trim(),
			start_date: createStartDate || null,
			end_date: createEndDate || null
		});
		closeCreate();
		await paginateState.refetch();
	}

	function openEdit(c: Campaign) {
		editSheetCampaign = c;
		editSheetOpen = true;
	}

	function openDeleteModal(c: Campaign) {
		campaignToDelete = c;
		deleteModalOpen = true;
	}

	async function handleConfirmDelete() {
		if (campaignToDelete) {
			await client['campaigns'].delete({
				campaign_ids: [campaignToDelete.id]
			});
			campaignToDelete = null;
			deleteModalOpen = false;
			await paginateState.refetch();
		}
	}

	function goToCampaignDetails(row: Record<string, unknown>) {
		const id = row.id;
		if (typeof id !== 'string' || !id) return;
		goto(resolve(`/promotions/campaigns/${id}`, {}));
	}

	async function savePromotion(payload: {
		code: string;
		method: 'Automatic' | 'Manual';
		status: 'Active' | 'Draft' | 'Inactive';
		campaign_id: string | null;
	}) {
		await client['promotions'].post({
			code: payload.code,
			method: payload.method,
			status: payload.status,
			campaign_id: payload.campaign_id
		});
	}

	$effect(() => {
		if (!editSheetOpen) editSheetCampaign = null;
	});
</script>

<svelte:head>
	<title>Campaigns | Promotions | Danimai Store</title>
	<meta name="description" content="Manage promotional campaigns." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Folder class="size-4" />
				<span class="font-semibold">Campaigns</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>
		<PaginationTable searchPlaceholder="Search" bind:searchQuery>
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
							{rows}
							columns={tableColumns}
							emptyMessage="No campaigns found."
							onRowClick={goToCampaignDetails}
						/>
					</table>
				</div>

				<TablePagination pagination={listPagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

<!-- Create Campaign Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Create Campaign</h2>
				<p class="text-sm text-muted-foreground">Create a promotional campaign.</p>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if createError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}

				<!-- Campaign details -->
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-2">
								<label for="create-campaign-name" class="text-sm font-medium">Name</label>
								<Input
									id="create-campaign-name"
									bind:value={createName}
									placeholder="e.g. Summer Sale"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-campaign-identifier" class="text-sm font-medium"
									>Identifier</label
								>
								<Input
									id="create-campaign-identifier"
									bind:value={createIdentifier}
									placeholder="e.g. SUMMER24"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-campaign-description" class="text-sm font-medium">
									Description <span class="font-normal text-muted-foreground">(Optional)</span>
								</label>
								<textarea
									id="create-campaign-description"
									bind:value={createDescription}
									rows="3"
									class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
									placeholder="Campaign description"
								></textarea>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex min-w-0 flex-col gap-2">
									<label for="create-campaign-start" class="text-sm font-medium">
										Start date <span class="font-normal text-muted-foreground">(Optional)</span>
									</label>
									<div class="relative">
										<Clock
											class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="create-campaign-start"
											type="datetime-local"
											bind:value={createStartDate}
											class="h-9 w-full pl-[18px]"
										/>
									</div>
								</div>
								<div class="flex min-w-0 flex-col gap-2">
									<label for="create-campaign-end" class="text-sm font-medium">
										End date <span class="font-normal text-muted-foreground">(Optional)</span>
									</label>
									<div class="relative">
										<Clock
											class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="create-campaign-end"
											type="datetime-local"
											bind:value={createEndDate}
											class="h-9 w-full pl-[18px]"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Campaign Budget -->
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-1">
							<h3 class="text-sm font-semibold">Campaign Budget</h3>
							<p class="text-xs text-muted-foreground">Create a budget for the campaign.</p>
						</div>
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-2">
								<div class="text-sm font-medium">Type</div>
								<div class="flex flex-col gap-2">
									<label
										class={cn(
											'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
											createBudgetType === 'usage'
												? 'border-primary bg-primary/5'
												: 'border-input hover:bg-muted/30'
										)}
									>
										<input
											type="radio"
											name="create-budget-type"
											value="usage"
											checked={createBudgetType === 'usage'}
											onchange={() => (createBudgetType = 'usage')}
											class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
										/>
										<div>
											<span class="font-medium">Usage</span>
											<p class="mt-0.5 text-sm text-muted-foreground">
												Set a limit on how many times the promotion can be used.
											</p>
										</div>
									</label>
									<label
										class={cn(
											'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
											createBudgetType === 'spend'
												? 'border-primary bg-primary/5'
												: 'border-input hover:bg-muted/30'
										)}
									>
										<input
											type="radio"
											name="create-budget-type"
											value="spend"
											checked={createBudgetType === 'spend'}
											onchange={() => (createBudgetType = 'spend')}
											class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
										/>
										<div>
											<span class="font-medium">Spend</span>
											<p class="mt-0.5 text-sm text-muted-foreground">
												Set a limit on the total discounted amount of all promotion usages.
											</p>
										</div>
									</label>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-budget-limit" class="text-sm font-medium">Limit</label>
								<Input
									id="create-budget-limit"
									type="number"
									bind:value={createBudgetLimit}
									placeholder="Enter limit"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<label for="create-budget-limit-per" class="text-sm font-medium"
										>Limit usage per</label
									>
									<Info class="size-4 text-muted-foreground" />
								</div>
								<Input
									id="create-budget-limit-per"
									type="number"
									bind:value={createBudgetLimitPer}
									min="1"
									placeholder="10"
									class="h-9"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				<Button onclick={submitCreate}>Create</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<EditCampaignSheet
	bind:open={editSheetOpen}
	campaign={editSheetCampaign}
	onSaved={async () => {
		await paginateState.refetch();
	}}
/>

<!-- Create Promotion Sheet -->
<CreateCampaignPromotionSheet
	bind:open={createPromotionOpen}
	campaignId={createPromotionCampaignId}
	campaignName={createPromotionCampaignName}
	onSave={savePromotion}
/>

<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="campaign"
	entityTitle={campaignToDelete?.name ?? ''}
	onConfirm={handleConfirmDelete}
	onCancel={() => (campaignToDelete = null)}
/>
