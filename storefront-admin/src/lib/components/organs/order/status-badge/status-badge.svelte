<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		status = '',
		class: className = ''
	}: {
		status?: string;
		class?: string;
	} = $props();

	const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
	const variantClass = $derived((() => {
		switch (status) {
			case 'completed':
			case 'fulfilled':
			case 'captured':
				return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
			case 'pending':
			case 'not_fulfilled':
			case 'not_paid':
			case 'awaiting':
				return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
			case 'canceled':
			case 'archived':
			case 'refunded':
			case 'returned':
				return 'bg-muted text-muted-foreground';
			case 'requires_action':
				return 'bg-destructive/15 text-destructive';
			default:
				return 'bg-muted text-muted-foreground';
		}
	})());
</script>

<span class={cn(base, variantClass, className)}>{status || '—'}</span>
