<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';

	const CURRENCY_NAMES: Record<string, string> = {
		USD: 'US Dollar',
		EUR: 'Euro',
		GBP: 'British Pound',
		INR: 'Indian Rupee',
		JPY: 'Japanese Yen',
		CAD: 'Canadian Dollar',
		AUD: 'Australian Dollar',
		CHF: 'Swiss Franc',
		CNY: 'Chinese Yuan',
		BRL: 'Brazilian Real',
		MXN: 'Mexican Peso',
		SGD: 'Singapore Dollar',
		SEK: 'Swedish Krona',
		NOK: 'Norwegian Krone',
		DKK: 'Danish Krone'
	};

	interface Props {
		region: { id: string; name: string; currency_code: string; metadata?: Record<string, unknown> };
		onEdit: () => void;
		onDelete: () => void;
	}

	let { region, onEdit, onDelete }: Props = $props();

	const currencyLabel = $derived.by(() => {
		const code = region.currency_code?.toUpperCase() ?? '';
		const name = CURRENCY_NAMES[code];
		return name ? `${code} ${name}` : code;
	});
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">{region.name}</h1>
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
							class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
							onSelect={onEdit}
						>
							<Pencil class="size-4" />
							Edit
						</DropdownMenu.Item>
						<DropdownMenu.Item
							textValue="Delete"
							class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
							onSelect={onDelete}
						>
							<Trash2 class="size-4" />
							Delete
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>

		<dl class="grid gap-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="text-muted-foreground">Currency</dt>
				<dd class="mt-1 font-medium">{currencyLabel}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Automatic Taxes</dt>
				<dd class="mt-1 font-medium">True</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Tax inclusive pricing</dt>
				<dd class="mt-1 font-medium">False</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Payment Providers</dt>
				<dd class="mt-1 font-medium">System (DEFAULT)</dd>
			</div>
		</dl>
	</section>
</div>
