<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Folder from '@lucide/svelte/icons/folder';
	import Clock from '@lucide/svelte/icons/clock';
	import { cn } from '$lib/utils.js';

	type Campaign = {
		id: string;
		name: string;
		description: string | null;
		identifier: string;
		start_date: string | null;
		end_date: string | null;
	};

	// Load from localStorage or use default
	function loadCampaigns(): Campaign[] {
		if (typeof window === 'undefined') {
			return [
				{
					id: '1',
					name: 'Big Bang sale',
					description: null,
					identifier: 'BIGBANG',
					start_date: null,
					end_date: null
				}
			];
		}
		try {
			const stored = localStorage.getItem('campaigns');
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (e) {
			console.error('Failed to load campaigns from localStorage:', e);
		}
		return [
			{
				id: '1',
				name: 'Big Bang sale',
				description: null,
				identifier: 'BIGBANG',
				start_date: null,
				end_date: null
			}
		];
	}

	function saveCampaignsToStorage(camps: Campaign[]) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('campaigns', JSON.stringify(camps));
			} catch (e) {
				console.error('Failed to save campaigns to localStorage:', e);
			}
		}
	}

	let campaigns = $state<Campaign[]>(loadCampaigns());
	let searchQuery = $state('');
	let page = $state(1);
	const limit = 10;

	const filtered = $derived(
		searchQuery.trim()
			? campaigns.filter(
					(c) =>
						c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						c.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
				)
			: campaigns
	);
	const total = $derived(filtered.length);
	const totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	const start = $derived(total > 0 ? (page - 1) * limit + 1 : 0);
	const end = $derived(Math.min(page * limit, total));
	const pageData = $derived(filtered.slice((page - 1) * limit, page * limit));

	// Create campaign sheet
	let createOpen = $state(false);
	let createName = $state('');
	let createIdentifier = $state('');
	let createDescription = $state('');
	let createStartDate = $state('');
	let createEndDate = $state('');
	let budgetType = $state<'usage' | 'spend'>('usage');
	let budgetLimit = $state<number | ''>('');
	let createError = $state<string | null>(null);

	// Edit campaign sheet
	let editOpen = $state(false);
	let editingCampaign = $state<Campaign | null>(null);
	let editName = $state('');
	let editIdentifier = $state('');
	let editDescription = $state('');
	let editStartDate = $state('');
	let editEndDate = $state('');
	let editError = $state<string | null>(null);

	// Delete confirmation
	let deleteModalOpen = $state(false);
	let campaignToDelete = $state<Campaign | null>(null);

	function openCreate() {
		createOpen = true;
		createName = '';
		createIdentifier = '';
		createDescription = '';
		createStartDate = '';
		createEndDate = '';
		budgetType = 'usage';
		budgetLimit = '';
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	function submitCreate() {
		createError = null;
		if (!createName.trim()) {
			createError = 'Name is required';
			return;
		}
		if (!createIdentifier.trim()) {
			createError = 'Identifier is required';
			return;
		}
		const newCampaign: Campaign = {
			id: crypto.randomUUID(),
			name: createName.trim(),
			description: createDescription.trim() || null,
			identifier: createIdentifier.trim(),
			start_date: createStartDate || null,
			end_date: createEndDate || null
		};
		campaigns = [...campaigns, newCampaign];
		saveCampaignsToStorage(campaigns);
		closeCreate();
	}

	function openEdit(c: Campaign) {
		editingCampaign = c;
		editName = c.name;
		editIdentifier = c.identifier;
		editDescription = c.description || '';
		editStartDate = c.start_date ? new Date(c.start_date).toISOString().slice(0, 16) : '';
		editEndDate = c.end_date ? new Date(c.end_date).toISOString().slice(0, 16) : '';
		editError = null;
		editOpen = true;
	}

	function closeEdit() {
		editOpen = false;
		editingCampaign = null;
	}

	function saveEdit() {
		if (!editingCampaign) return;
		editError = null;
		if (!editName.trim()) {
			editError = 'Name is required';
			return;
		}
		if (!editIdentifier.trim()) {
			editError = 'Identifier is required';
			return;
		}
		campaigns = campaigns.map((x) =>
			x.id === editingCampaign!.id
				? {
						...x,
						name: editName.trim(),
						identifier: editIdentifier.trim(),
						description: editDescription.trim() || null,
						start_date: editStartDate || null,
						end_date: editEndDate || null
					}
				: x
		);
		saveCampaignsToStorage(campaigns);
		closeEdit();
	}

	function deleteCampaign(c: Campaign) {
		campaigns = campaigns.filter((x) => x.id !== c.id);
		saveCampaignsToStorage(campaigns);
	}

	function openDeleteModal(c: Campaign) {
		campaignToDelete = c;
		deleteModalOpen = true;
	}

	function handleConfirmDelete() {
		if (campaignToDelete) {
			deleteCampaign(campaignToDelete);
			campaignToDelete = null;
			deleteModalOpen = false;
		}
	}

	$effect(() => {
		if (!editOpen) editingCampaign = null;
	});

	function formatDate(value: string | null) {
		if (!value) return '';
		return new Date(value).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Campaigns | Promotions | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex flex-col gap-4">
			<div class="flex items-center justify-between gap-4 border-b pb-4">
				<h1 class="relative flex items-center gap-2 text-xl font-semibold">
					<Folder class="relative size-5 shrink-0" />
					Campaigns
				</h1>
				<Button size="sm" onclick={openCreate}>Create</Button>
			</div>
			<div class="flex flex-wrap items-center justify-end gap-2">
				<div class="relative w-64">
					<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search"
						bind:value={searchQuery}
						class="h-9 rounded-md pl-9"
					/>
				</div>
				<Button variant="outline" size="icon" class="size-9">
					<SlidersHorizontal class="size-4" />
					<span class="sr-only">Filters</span>
				</Button>
			</div>
		</div>

		<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
			<table class="w-full text-sm">
				<thead class="sticky top-0 border-b bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium">Name</th>
						<th class="px-4 py-3 text-left font-medium">Description</th>
						<th class="px-4 py-3 text-left font-medium">Identifier</th>
						<th class="px-4 py-3 text-left font-medium">Start date</th>
						<th class="px-4 py-3 text-left font-medium">End date</th>
						<th class="w-10 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#if pageData.length === 0}
						<tr>
							<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
								No campaigns found.
							</td>
						</tr>
					{:else}
						{#each pageData as campaign (campaign.id)}
							<tr class="border-b transition-colors hover:bg-muted/30">
								<td class="px-4 py-3 font-medium">{campaign.name}</td>
								<td class="px-4 py-3 text-muted-foreground">
									{campaign.description ?? '-'}
								</td>
								<td class="px-4 py-3 text-muted-foreground">{campaign.identifier}</td>
								<td class="px-4 py-3 text-muted-foreground">
									{formatDate(campaign.start_date) || '-'}
								</td>
								<td class="px-4 py-3 text-muted-foreground">
									{formatDate(campaign.end_date) || '-'}
								</td>
								<td class="px-4 py-3">
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
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openEdit(campaign)}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Item
													textValue="Delete"
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openDeleteModal(campaign)}
												>
													<Trash2 class="size-4" />
													Delete
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
			<p class="text-sm text-muted-foreground">
				{#if total > 0}
					{start} – {end} of {total} results
				{:else}
					0 results
				{/if}
			</p>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" disabled={page <= 1} onclick={() => (page = page - 1)}>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">
					{page} of {totalPages} pages
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={page >= totalPages}
					onclick={() => (page = page + 1)}
				>
					Next
				</Button>
			</div>
		</div>
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
				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
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
							<label for="create-campaign-identifier" class="text-sm font-medium">Identifier</label>
							<Input
								id="create-campaign-identifier"
								bind:value={createIdentifier}
								placeholder="e.g. SUMMER24"
								class="h-9"
							/>
						</div>
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

				<!-- Campaign Budget -->
				<div class="mt-8 flex flex-col gap-4">
					<div>
						<h3 class="text-sm font-semibold">Campaign Budget</h3>
						<p class="mt-0.5 text-sm text-muted-foreground">Create a budget for the campaign.</p>
					</div>
					<div class="flex flex-col gap-3">
						<span class="text-sm font-medium">Type</span>
						<div class="flex flex-col gap-2">
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									budgetType === 'usage'
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="budget-type"
									value="usage"
									checked={budgetType === 'usage'}
									onchange={() => (budgetType = 'usage')}
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
									budgetType === 'spend'
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="budget-type"
									value="spend"
									checked={budgetType === 'spend'}
									onchange={() => (budgetType = 'spend')}
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
						<label for="create-campaign-limit" class="text-sm font-medium">Limit</label>
						<Input
							id="create-campaign-limit"
							type="number"
							min="0"
							step={budgetType === 'usage' ? 1 : 0.01}
							bind:value={budgetLimit}
							placeholder={budgetType === 'usage' ? 'e.g. 100' : 'e.g. 1000'}
							class="h-9"
						/>
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

<!-- Edit Campaign Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Edit Campaign</h2>
				<p class="text-sm text-muted-foreground">Edit campaign details.</p>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if editError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}

				<!-- Campaign details -->
				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-campaign-name" class="text-sm font-medium">Name</label>
							<Input
								id="edit-campaign-name"
								bind:value={editName}
								placeholder="e.g. Summer Sale"
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-campaign-identifier" class="text-sm font-medium">Identifier</label>
							<Input
								id="edit-campaign-identifier"
								bind:value={editIdentifier}
								placeholder="e.g. SUMMER24"
								class="h-9"
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-campaign-description" class="text-sm font-medium">
							Description <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<textarea
							id="edit-campaign-description"
							bind:value={editDescription}
							rows="3"
							class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="Campaign description"
						></textarea>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex min-w-0 flex-col gap-2">
							<label for="edit-campaign-start" class="text-sm font-medium">
								Start date <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<div class="relative">
								<Clock
									class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="edit-campaign-start"
									type="datetime-local"
									bind:value={editStartDate}
									class="h-9 w-full pl-[18px]"
								/>
							</div>
						</div>
						<div class="flex min-w-0 flex-col gap-2">
							<label for="edit-campaign-end" class="text-sm font-medium">
								End date <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<div class="relative">
								<Clock
									class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="edit-campaign-end"
									type="datetime-local"
									bind:value={editEndDate}
									class="h-9 w-full pl-[18px]"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={saveEdit}>Save</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="campaign"
	entityTitle={campaignToDelete?.name ?? ''}
	onConfirm={handleConfirmDelete}
	onCancel={() => (campaignToDelete = null)}
/>
