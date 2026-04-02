<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import EditTax from '$lib/components/organs/tax-region/update/EditTax.svelte';

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
			<Button size="sm" variant="outline" onclick={() => (editSheetOpen = true)}>Edit</Button>
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
			<dd class="mt-1 font-medium">{formatDate(taxRegion?.created_at as unknown as string | Date)}</dd>
		</div>
		<div>
			<dt class="text-muted-foreground">Updated</dt>
			<dd class="mt-1 font-medium">{formatDate(taxRegion?.updated_at as unknown as string | Date)}</dd>
		</div>
	</dl>
</div>

{#key taxRegion?.id}
	<EditTax bind:open={editSheetOpen} region={taxRegion as Record<string, unknown> | null} onSuccess={onUpdated} />
{/key}