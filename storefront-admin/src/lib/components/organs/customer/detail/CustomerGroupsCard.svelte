<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import {
		removeCustomerFromGroup as removeCustomerFromGroupApi,
		type Customer
	} from '$lib/customers/api.js';
	import { customerGroupsFromMetadata, type CustomerGroupItem } from './types.js';
	import CustomerAddToGroupDialog from './CustomerAddToGroupDialog.svelte';

	let {
		customer,
		customerId,
		onRefresh
	}: {
		customer: Customer;
		customerId: string;
		onRefresh: () => void | Promise<void>;
	} = $props();

	const customerGroupsForCard = $derived(customerGroupsFromMetadata(customer));
	const customerGroupName = $derived(
		customerGroupsForCard.length > 0 ? customerGroupsForCard[0].name : '–'
	);

	const groupCardLimit = 5;
	let groupCardPage = $state(1);
	const groupCardTotal = $derived(customerGroupsForCard.length);
	const groupCardTotalPages = $derived(Math.max(1, Math.ceil(groupCardTotal / groupCardLimit)));
	const groupCardStart = $derived((groupCardPage - 1) * groupCardLimit + 1);
	const groupCardEnd = $derived(Math.min(groupCardPage * groupCardLimit, groupCardTotal));
	const groupCardPaginated = $derived(
		customerGroupsForCard.slice(
			(groupCardPage - 1) * groupCardLimit,
			groupCardPage * groupCardLimit
		)
	);

	$effect(() => {
		if (groupCardPage > groupCardTotalPages) groupCardPage = 1;
	});

	let addToGroupModalOpen = $state(false);
	let removeFromGroupSubmitting = $state(false);
	let removeFromGroupModalOpen = $state(false);
	let removeFromGroupError = $state<string | null>(null);
	let removeFromGroupTarget = $state<{ id: string; name: string } | null>(null);

	function openAddToGroupModal() {
		setTimeout(() => (addToGroupModalOpen = true), 0);
	}

	function openRemoveFromGroupModal(group: CustomerGroupItem) {
		removeFromGroupError = null;
		removeFromGroupTarget = group.id != null ? { id: group.id, name: group.name } : null;
		setTimeout(() => (removeFromGroupModalOpen = true), 0);
	}

	function closeRemoveFromGroupModal() {
		if (!removeFromGroupSubmitting) {
			removeFromGroupModalOpen = false;
			removeFromGroupTarget = null;
			removeFromGroupError = null;
		}
	}

	async function removeCustomerFromGroup() {
		removeFromGroupSubmitting = true;
		removeFromGroupError = null;
		try {
			await removeCustomerFromGroupApi(customerId, removeFromGroupTarget?.id);
			await onRefresh();
			removeFromGroupModalOpen = false;
			removeFromGroupTarget = null;
		} catch (e) {
			removeFromGroupError = e instanceof Error ? e.message : String(e);
		} finally {
			removeFromGroupSubmitting = false;
		}
	}
</script>

<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="flex items-center gap-2 text-base font-semibold">
			<UsersRound class="size-4" />
			Customer group
		</h2>
		<Button variant="outline" size="sm" onclick={openAddToGroupModal}>Add to group</Button>
	</div>
	{#if customerGroupsForCard.length === 0}
		<div class="px-6 py-8 text-center text-sm text-muted-foreground">No groups yet.</div>
	{:else}
		<ul class="divide-y">
			{#each groupCardPaginated as group (group.id ?? group.name)}
				<li class="flex items-center justify-between gap-4 px-6 py-4">
					<p class="text-sm font-medium">{group.name}</p>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
						>
							<MoreHorizontal class="size-4" />
							<span class="sr-only">Customer group actions</span>
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
								sideOffset={4}
							>
								<DropdownMenu.Item
									textValue="Edit"
									class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
									onSelect={openAddToGroupModal}
								>
									<Pencil class="size-4" />
									Edit
								</DropdownMenu.Item>
								<DropdownMenu.Item
									textValue="Delete"
									class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
									onSelect={() => openRemoveFromGroupModal(group)}
								>
									<Trash2 class="size-4" />
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</li>
			{/each}
		</ul>
		{#if groupCardTotal > 0}
			<div class="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-3">
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={groupCardPage <= 1}
						onclick={() => (groupCardPage = groupCardPage - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{groupCardPage} of {groupCardTotalPages} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={groupCardPage >= groupCardTotalPages}
						onclick={() => (groupCardPage = groupCardPage + 1)}
					>
						Next
					</Button>
				</div>
				<p class="text-sm text-muted-foreground">
					{groupCardStart} – {groupCardEnd} of {groupCardTotal} results
				</p>
			</div>
		{/if}
	{/if}
</section>

<CustomerAddToGroupDialog
	bind:open={addToGroupModalOpen}
	{customerId}
	assignedGroups={customerGroupsForCard}
	onSaved={onRefresh}
/>

<DeleteConfirmationModal
	bind:open={removeFromGroupModalOpen}
	entityName="customer group"
	entityTitle={removeFromGroupTarget?.name ?? customerGroupName}
	onConfirm={removeCustomerFromGroup}
	onCancel={closeRemoveFromGroupModal}
	submitting={removeFromGroupSubmitting}
	error={removeFromGroupError}
/>
