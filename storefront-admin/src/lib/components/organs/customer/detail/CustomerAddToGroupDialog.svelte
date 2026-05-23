<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { addCustomerToGroup } from '$lib/customers/api.js';
	import { listCustomerGroups, type CustomerGroup } from '$lib/customer-groups/api.js';
	import type { CustomerGroupItem } from './types.js';

	let {
		open = $bindable(false),
		customerId,
		assignedGroups = [],
		onSaved
	}: {
		open?: boolean;
		customerId: string;
		assignedGroups?: CustomerGroupItem[];
		onSaved: () => void | Promise<void>;
	} = $props();

	let groupModalPage = $state(1);
	let groupModalSearch = $state('');
	let groupModalData = $state<{
		data: {
			rows: CustomerGroup[];
			pagination: {
				total: number;
				page: number;
				limit: number;
				total_pages: number;
				has_next_page: boolean;
				has_previous_page: boolean;
			};
		};
		pagination: {
			total: number;
			page: number;
			limit: number;
			total_pages: number;
			has_next_page: boolean;
			has_previous_page: boolean;
		};
	} | null>(null);
	let groupModalLoading = $state(false);
	let addToGroupSubmitting = $state(false);
	let addToGroupError = $state<string | null>(null);
	let selectedGroupIds = $state<string[]>([]);

	const groupModalTableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' }
	];

	const groupModalGroups = $derived(groupModalData?.data?.rows ?? []);
	const groupModalPagination = $derived(groupModalData?.pagination ?? null);
	const groupModalFiltered = $derived(
		groupModalSearch.trim()
			? groupModalGroups.filter((g) =>
					g.name.toLowerCase().includes(groupModalSearch.toLowerCase())
				)
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
	const assignedGroupIds = $derived(
		new Set(
			assignedGroups.map((g) => g.id).filter((id): id is string => id != null && id !== '')
		)
	);
	const assignedGroupNames = $derived(
		new Set(
			assignedGroups
				.map((g) => g.name.trim().toLowerCase())
				.filter((name) => name.length > 0)
		)
	);

	function isGroupAlreadyAssigned(group: CustomerGroup): boolean {
		if (assignedGroupIds.has(group.id)) return true;
		return assignedGroupNames.has(group.name.trim().toLowerCase());
	}

	const disabledGroupIds = $derived(
		new Set(groupModalFiltered.filter(isGroupAlreadyAssigned).map((g) => g.id))
	);

	const selectableSelectedIds = $derived(
		new Set([...selectedGroupIds].filter((id) => !disabledGroupIds.has(id)))
	);

	async function fetchGroupModalGroups() {
		groupModalLoading = true;
		try {
			groupModalData = await listCustomerGroups({
				page: groupModalPage,
				limit: 10,
				sorting_field: 'name',
				sorting_direction: 'asc'
			});
		} catch {
			groupModalData = null;
		} finally {
			groupModalLoading = false;
		}
	}

	function closeAddToGroupModal() {
		if (!addToGroupSubmitting) {
			open = false;
			selectedGroupIds = [];
			addToGroupError = null;
		}
	}

	function toggleGroupSelection(groupId: string) {
		if (disabledGroupIds.has(groupId)) return;
		selectedGroupIds = selectedGroupIds.includes(groupId)
			? selectedGroupIds.filter((id) => id !== groupId)
			: [...selectedGroupIds, groupId];
		if (selectedGroupIds.length > 0) addToGroupError = null;
	}

	function goToGroupModalPage(pageNum: number) {
		groupModalPage = Math.max(1, pageNum);
	}

	async function saveAddToGroup() {
		if (selectedGroupIds.length === 0) {
			addToGroupError = 'Select a customer group is required.';
			return;
		}
		addToGroupError = null;
		addToGroupSubmitting = true;
		try {
			const idsToAdd = selectedGroupIds.filter((id) => !disabledGroupIds.has(id));
			for (const groupId of idsToAdd) {
				await addCustomerToGroup(customerId, groupId);
			}
			selectedGroupIds = [];
			open = false;
			await onSaved();
		} catch (e) {
			addToGroupError = e instanceof Error ? e.message : String(e);
		} finally {
			addToGroupSubmitting = false;
		}
	}

	$effect(() => {
		if (!open) return;
		void groupModalPage;
		fetchGroupModalGroups();
	});

	$effect(() => {
		if (!open) return;
		const disabled = disabledGroupIds;
		if (disabled.size === 0) return;
		const next = selectedGroupIds.filter((id) => !disabled.has(id));
		if (next.length !== selectedGroupIds.length) selectedGroupIds = next;
	});

	$effect(() => {
		if (open) return;
		selectedGroupIds = [];
		groupModalPage = 1;
		groupModalSearch = '';
		addToGroupError = null;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="m-auto flex h-auto max-h-[85vh] max-w-3xl flex-col rounded-xl border shadow-lg"
	>
		<div class="flex flex-1 flex-col overflow-hidden">
			<Dialog.Header class="flex flex-row items-center justify-between border-b px-6 py-4">
				<Dialog.Title class="text-base font-semibold">Customer group</Dialog.Title>
			</Dialog.Header>

			<div class="flex min-w-0 flex-wrap items-center gap-2 border-b px-6 py-4 sm:justify-between">
				<Button
					variant="outline"
					size="sm"
					class="h-9 shrink-0 rounded-md max-sm:w-9 max-sm:justify-center max-sm:gap-0 max-sm:px-0 sm:min-h-9"
					aria-label="Add filter"
					title="Add filter"
				>
					<SlidersHorizontal class="size-4 shrink-0 sm:mr-1.5" />
					<span class="hidden sm:inline">Add filter</span>
				</Button>
				<div class="flex min-w-0 flex-1 items-center gap-2 sm:w-auto sm:flex-none">
					<div class="relative min-w-0 w-full flex-1 sm:w-64 sm:flex-none">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={groupModalSearch}
							class="h-9 w-full min-w-0 rounded-md pl-9"
						/>
					</div>
					<button
						type="button"
						class="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Sort"
					>
						<ArrowUpDown class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				</div>
			</div>

			<div class="flex flex-1 flex-col overflow-auto p-6">
				{#if groupModalLoading}
					<div class="flex items-center justify-center py-12">
						<p class="text-sm text-muted-foreground">Loading…</p>
					</div>
				{:else}
					<PaginationTable showToolbar={false}>
						<div
							class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card {addToGroupError &&
							selectedGroupIds.length === 0
								? 'border-destructive'
								: ''}"
						>
							<table class="w-full text-sm">
								<TableHead columns={groupModalTableColumns} />
								<TableBody
									rows={groupModalFiltered}
									columns={groupModalTableColumns}
									emptyMessage="No customer groups found."
									selectedIds={selectableSelectedIds}
									disabledIds={disabledGroupIds}
									onToggleSelect={toggleGroupSelection}
								/>
							</table>
						</div>
						{#if groupModalPagination && groupModalPagination.total > 0}
							<TablePagination
								pagination={groupModalPagination}
								start={groupModalStart}
								end={groupModalEnd}
								onPageChange={goToGroupModalPage}
							/>
						{/if}
					</PaginationTable>
				{/if}
			</div>

			<Dialog.Footer
				class="flex-row flex-wrap items-center justify-between gap-2 border-t px-6 py-4"
			>
				{#if addToGroupError}
					<p class="text-sm text-destructive" role="alert">{addToGroupError}</p>
				{:else}
					<span class="hidden sm:block" aria-hidden="true"></span>
				{/if}
				<div class="ml-auto flex flex-wrap items-center justify-end gap-2">
					<Button variant="outline" onclick={closeAddToGroupModal} disabled={addToGroupSubmitting}
						>Cancel</Button
					>
					<Button onclick={saveAddToGroup} disabled={addToGroupSubmitting}>
						{addToGroupSubmitting ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>
