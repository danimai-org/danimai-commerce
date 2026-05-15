<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import EditTax from '$lib/components/organs/tax-region/update/EditTax.svelte';

	import { Toaster } from 'svelte-sonner';

	interface Props {
		taxRegion?: Record<string, unknown> | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { taxRegion, onUpdated = () => {} }: Props = $props();

	let editSheetOpen = $state(false);

	function formatDate(value: unknown): string {
		if (!value) return '—';
		const date = new Date(value as unknown as string | Date);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{taxRegion?.name ?? taxRegion?.id}</h1>
			<p class="mt-1 text-sm text-muted-foreground">Tax region details</p>
		</div>
		<div class="flex items-center gap-2">
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
							onSelect={() => (editSheetOpen = true)}
						>
							<Pencil class="size-4" />
							Edit
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	</div>

	<dl class="mt-6 grid gap-4 text-sm sm:grid-cols-2">
		<div>
			<dt class="text-muted-foreground">Name</dt>
			<dd class="mt-1 font-medium">{taxRegion?.name ?? '—'}</dd>
		</div>
		<div>
			<dt class="text-muted-foreground">Tax provider</dt>
			<dd class="mt-1 font-medium">{taxRegion?.tax_provider_id ?? '—'}</dd>
		</div>
		<div>
			<dt class="text-muted-foreground">Created</dt>
			<dd class="mt-1 font-medium">
				{formatDate(taxRegion?.created_at as unknown as string | Date)}
			</dd>
		</div>
		<div>
			<dt class="text-muted-foreground">Updated</dt>
			<dd class="mt-1 font-medium">
				{formatDate(taxRegion?.updated_at as unknown as string | Date)}
			</dd>
		</div>
	</dl>
</div>

{#key taxRegion?.id}
	<EditTax
		bind:open={editSheetOpen}
		region={taxRegion as Record<string, unknown> | null}
		onSuccess={onUpdated}
	/>
{/key}

<Toaster position="top-center" richColors={true} />
