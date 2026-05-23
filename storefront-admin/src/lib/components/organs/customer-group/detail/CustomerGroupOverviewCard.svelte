<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import EditCustomerGroup from '$lib/components/organs/customer-group/update/EditCustomerGroup.svelte';
	import type { CustomerGroupDetail } from '$lib/customer-groups/api.js';

	let {
		group,
		onGroupRefresh = async () => {}
	}: {
		group: CustomerGroupDetail;
		onGroupRefresh?: () => void | Promise<void>;
	} = $props();

	let editSheetOpen = $state(false);
</script>

<div class="flex gap-6">
	<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
		<section class="flex flex-col gap-6">
			<div class="flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-semibold tracking-tight">{group.name}</h1>
					<p class="mt-1 text-sm text-muted-foreground">Customers – {group.customer_count}</p>
				</div>
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
								onSelect={() => (editSheetOpen = true)}
							>
								<Pencil class="size-4" />
								Edit
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</div>
		</section>
	</div>
</div>

{#key group.id}
	<EditCustomerGroup bind:open={editSheetOpen} {group} onSaved={onGroupRefresh} />
{/key}
