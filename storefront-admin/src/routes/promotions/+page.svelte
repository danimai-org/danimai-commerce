<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CreatePromotionSheet,
		DeleteConfirmationModal,
		EditPromotionSheet,
		PromotionDetailsSheet,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn,
		type Promotion,
		type Campaign
	} from '$lib/components/organs/index.js';
	import { client } from '$lib/client.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import Folder from '@lucide/svelte/icons/folder';

	let campaigns = $state<Campaign[]>([]);
	let searchQuery = $state('');

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () =>
			client['promotions'].get({
				query: {
					...(paginationQuery as Record<string, unknown>),
					search: searchQuery.trim() || undefined
				}
			}),
		['promotions']
	);

	let lastRefetchKey = $state<string | null>(null);

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

	async function fetchCampaigns() {
		const res = await client['campaigns'].get({
			query: { page: 1, limit: 100 }
		});
		campaigns = ((res as { data?: { rows?: Campaign[] } })?.data?.rows ?? []) as Campaign[];
	}

	let campaignsLoaded = $state(false);
	$effect(() => {
		if (campaignsLoaded) return;
		campaignsLoaded = true;
		void fetchCampaigns();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const rows = $derived((paginateState.query.data?.data?.rows ?? []) as Record<string, unknown>[]);
	const listPagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(
		listPagination ? (listPagination.page - 1) * listPagination.limit + 1 : 0
	);
	const end = $derived(
		listPagination ? Math.min(listPagination.page * listPagination.limit, listPagination.total) : 0
	);

	// Create promotion flow
	let createOpen = $state(false);
	let detailsOpen = $state(false);
	let viewingPromotion = $state<Promotion | null>(null);
	let editOpen = $state(false);
	let editingPromotion = $state<Promotion | null>(null);
	let deleteModalOpen = $state(false);
	let promotionToDelete = $state<Promotion | null>(null);

	function openCreate() {
		createOpen = true;
	}

	async function handleCreateSave(payload: { promotion: Promotion; newCampaign?: Campaign }) {
		let campaignId = payload.promotion.campaign_id ?? null;

		if (payload.newCampaign) {
			const campaignRes = await client['campaigns'].post({
				name: payload.newCampaign.name,
				description: payload.newCampaign.description,
				identifier: payload.newCampaign.identifier,
				start_date: payload.newCampaign.start_date,
				end_date: payload.newCampaign.end_date
			});
			campaignId = (campaignRes as { data?: Campaign })?.data?.id ?? null;
			await fetchCampaigns();
		}

		await client['promotions'].post({
			code: payload.promotion.code,
			method: payload.promotion.method,
			status: payload.promotion.status,
			campaign_id: campaignId
		});
		await paginateState.refetch();
	}

	function openDetails(p: Promotion) {
		viewingPromotion = p;
		detailsOpen = true;
	}

	function closeDetails() {
		detailsOpen = false;
		viewingPromotion = null;
	}

	function openEdit(p: Promotion) {
		editingPromotion = p;
		editOpen = true;
	}

	async function handleEditSave(updated: Pick<Promotion, 'id' | 'code' | 'method' | 'status'>) {
		await client['promotions']({ id: updated.id }).put({
			code: updated.code,
			method: updated.method,
			status: updated.status
		});
		editingPromotion = null;
		await paginateState.refetch();
	}

	$effect(() => {
		if (!editOpen) editingPromotion = null;
	});

	function openDeleteModal(p: Promotion) {
		promotionToDelete = p;
		deleteModalOpen = true;
	}

	async function handleConfirmDelete() {
		if (promotionToDelete) {
			await client['promotions'].delete({
				promotion_ids: [promotionToDelete.id]
			});
			promotionToDelete = null;
			deleteModalOpen = false;
			await paginateState.refetch();
		}
	}

	const tableColumns: TableColumn[] = [
		{ label: 'Code', key: 'code', type: 'text' },
		{ label: 'Method', key: 'method', type: 'text' },
		{ label: 'Campaign', key: 'campaign_name', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{ label: 'View', key: 'view', type: 'button', onClick: (item) => openDetails(item as Promotion) },
				{ label: 'Edit', key: 'edit', type: 'button', onClick: (item) => openEdit(item as Promotion) },
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteModal(item as Promotion)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Promotions | Danimai Store</title>
	<meta name="description" content="Manage promotions." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Folder class="size-4" />
				<span class="font-semibold">Promotions</span>
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
							rows={rows}
							columns={tableColumns}
							emptyMessage="No promotions found."
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


<!-- Create Promotion Sheet -->
<CreatePromotionSheet bind:open={createOpen} campaigns={campaigns} onSave={handleCreateSave} />

<!-- Details Promotion Sheet -->
<PromotionDetailsSheet bind:open={detailsOpen} promotion={viewingPromotion} campaigns={campaigns} onEdit={openEdit} />

<!-- Edit Promotion Sheet -->
<EditPromotionSheet bind:open={editOpen} promotion={editingPromotion} onSave={handleEditSave} />


<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="promotion"
	entityTitle={promotionToDelete?.code ?? ''}
	onConfirm={handleConfirmDelete}
	onCancel={() => (promotionToDelete = null)}
/>
