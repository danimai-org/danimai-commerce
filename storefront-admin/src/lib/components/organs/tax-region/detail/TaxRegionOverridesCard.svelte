<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import CreateOverrideSheet from './CreateOverrideSheet.svelte';

	interface Props {
		overrides?: unknown[];
	}

	let { overrides = [] }: Props = $props();

	let sheetOpen = $state(false);

	const rows = $derived(
		(overrides ?? []).map((item) => ({
			id: String((item as { id?: string })?.id ?? ''),
			name: String(
				(item as { name?: string; code?: string })?.name ?? (item as { code?: string })?.code ?? '—'
			),
			rate: Number((item as { rate?: string | number })?.rate ?? '0.00'),
			createdAt: (item as { created_at?: string | Date })?.created_at as
				| string
				| Date
				| null
				| undefined
		}))
	);
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="text-lg font-semibold">Tax Overrides</h2>
		<Button size="sm" variant="outline" onclick={() => (sheetOpen = true)}>Create</Button>
	</div>
	<div class="px-6 py-10 text-center">
		{#if rows.length === 0}
			<p class="text-sm font-medium text-muted-foreground">No records</p>
			<p class="mt-1 text-sm text-muted-foreground">There are no records to show</p>
		{:else}
			{#each rows as row (row.id)}
				<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
					<p class="text-sm font-medium text-muted-foreground">{row.name}</p>
				</div>
			{/each}
		{/if}
	</div>
</div>

<CreateOverrideSheet bind:open={sheetOpen} />
