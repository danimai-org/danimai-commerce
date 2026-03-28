<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';

	let { onEdit }: { onEdit: () => void } = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="flex size-8 items-center justify-center rounded-md hover:bg-muted">
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
				onSelect={onEdit}
			>
				<Pencil class="size-4" />
				Edit
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
