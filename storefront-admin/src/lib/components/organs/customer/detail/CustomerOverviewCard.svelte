<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { CustomerFormSheet, DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import { deleteCustomer, type Customer } from '$lib/customers/api.js';

	let {
		customer,
		onDeleted,
		onUpdated,
		onDeleteError
	}: {
		customer: Customer;
		onDeleted: () => void | Promise<void>;
		onUpdated: () => void | Promise<void>;
		onDeleteError?: (message: string) => void;
	} = $props();

	const createdDisplay = $derived(
		customer.created_at
			? new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
			: '–'
	);

	const displayTitle = $derived(customer.email);

	let editOpen = $state(false);
	let deleteModalOpen = $state(false);
	let deleteSubmitting = $state(false);

	function openEdit() {
		editOpen = true;
	}

	function openDeleteModal() {
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		if (!deleteSubmitting) deleteModalOpen = false;
	}

	async function handleConfirmDelete() {
		deleteSubmitting = true;
		try {
			await deleteCustomer(customer.id);
			closeDeleteModal();
			await onDeleted();
		} catch (e) {
			onDeleteError?.(e instanceof Error ? e.message : String(e));
		} finally {
			deleteSubmitting = false;
		}
	}
</script>

<div class="flex gap-6">
	<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
		<section class="flex flex-col gap-6">
			<div class="flex items-center justify-between gap-4">
				<h1 class="text-2xl font-semibold tracking-tight">{customer.email}</h1>
				<div class="flex items-center gap-2">
					{#if !customer.has_account}
						<span
							class="inline-flex items-center rounded-md border border-orange-300 bg-orange-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
							>Guest</span
						>
					{/if}
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
									onSelect={openEdit}
								>
									<Pencil class="size-4" />
									Edit
								</DropdownMenu.Item>
								<DropdownMenu.Item
									textValue="Delete"
									class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
									onSelect={openDeleteModal}
								>
									<Trash2 class="size-4" />
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>
			</div>
			<table class="w-full text-sm">
				<tbody>
					<tr>
						<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Name</th>
						<td class="py-3 font-medium">
							{customer.first_name || customer.last_name
								? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
								: '–'}
						</td>
					</tr>
					<tr>
						<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Phone</th>
						<td class="py-3 font-medium">{customer.phone ?? '–'}</td>
					</tr>
					<tr>
						<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Account</th>
						<td class="py-3 font-medium">{customer.has_account ? 'Registered' : 'Guest'}</td>
					</tr>
					<tr>
						<th class="w-32 py-3 pr-4 text-left font-medium text-muted-foreground">Created</th>
						<td class="py-3 font-medium">{createdDisplay}</td>
					</tr>
				</tbody>
			</table>
		</section>
	</div>
</div>

<CustomerFormSheet bind:open={editOpen} {customer} onSuccess={onUpdated} />

<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="customer"
	entityTitle={displayTitle}
	onConfirm={handleConfirmDelete}
	onCancel={closeDeleteModal}
	submitting={deleteSubmitting}
/>
