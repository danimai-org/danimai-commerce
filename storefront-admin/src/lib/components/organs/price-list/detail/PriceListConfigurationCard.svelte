<script lang="ts">
	import { getDetailContext } from '$lib/hooks';

	type PriceList = {
		starts_at: string | null;
		ends_at: string | null;
	};
	const detailQuery = getDetailContext<PriceList>();
	const priceList = $derived(detailQuery?.data ?? null);

	function formatDateTime(value: string | null | undefined): string {
		if (!value) return '—';
		try {
			const d = new Date(value);
			if (Number.isNaN(d.getTime())) return '—';
			return d.toLocaleString(undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return '—';
		}
	}
	const startsLabel = $derived(priceList?.starts_at ? formatDateTime(priceList.starts_at) : '—');
	const endsLabel = $derived(priceList?.ends_at ? formatDateTime(priceList.ends_at) : '—');
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<h2 class="text-sm font-semibold">Configuration</h2>
	<div class="mt-4 grid gap-3">
		<div class="flex items-center justify-between gap-4 rounded-md border bg-muted/20 px-3 py-2">
			<span class="text-xs text-muted-foreground">Start date</span>
			<span class="text-sm font-medium">{startsLabel}</span>
		</div>
		<div class="flex items-center justify-between gap-4 rounded-md border bg-muted/20 px-3 py-2">
			<span class="text-xs text-muted-foreground">End date</span>
			<span class="text-sm font-medium">{endsLabel}</span>
		</div>
	</div>
</div>
