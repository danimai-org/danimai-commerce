<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';
	import { formatDate } from '$lib/utils';
	import { getDetailContext } from '$lib/hooks';
	import type { AttributeGroup } from '$lib/components/organs/attribute-group/type.js';
	import EditAttributeGroupSheet from '$lib/components/organs/attribute-group/update/EditAttributeGroupSheet.svelte';

	const detailQuery = getDetailContext<AttributeGroup>();
	let formSheetOpen = $state(false);
	const group = $derived(detailQuery?.data ?? null);
</script>

<div class="flex min-h-0 flex-col overflow-auto">
	<div class="flex flex-col gap-6 p-6">
		<div class="rounded-lg border bg-card p-8 shadow-sm">
			<section class="flex flex-col gap-6">
				<div class="flex items-center justify-between gap-4">
					<h1 class="text-3xl font-semibold tracking-tight">
						{group?.title ?? 'Attribute Group'}
					</h1>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
							aria-label="Actions"
						>
							<MoreHorizontal class="size-4" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								class="z-50 min-w-32 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
								sideOffset={4}
							>
								<DropdownMenu.Item
									textValue="Edit"
									class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
									onSelect={() => (formSheetOpen = true)}
									disabled={!group}
								>
									<Pencil class="size-4" />
									Edit
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>

				{#if group}
					<dl class="grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Created</dt>
							<dd>
								{formatDate(group.created_at ?? new Date())}
							</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Updated</dt>
							<dd>
								{formatDate(group.updated_at ?? new Date())}
							</dd>
						</div>
					</dl>
				{/if}
			</section>
		</div>
	</div>
</div>
<EditAttributeGroupSheet
	bind:open={formSheetOpen}
	{group}
	onSuccess={() => {
		void detailQuery?.refetch?.();
	}}
/>
