<script lang="ts">
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import type { PromotionDetail } from './types.js';

	let {
		promotion,
		onOpenEdit
	}: {
		promotion: PromotionDetail;
		onOpenEdit?: () => void;
	} = $props();
</script>

<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
	<div class="mb-6 flex items-center justify-between gap-4">
		<h2 class="text-lg font-semibold tracking-tight text-foreground">Overview</h2>
		<button
			type="button"
			class="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
			aria-label="Edit promotion"
			onclick={() => onOpenEdit?.()}
		>
			<MoreHorizontal class="size-4" />
		</button>
	</div>
	<div class="grid grid-cols-2 gap-x-4 gap-y-6">
		<div class="flex min-w-0 flex-col gap-1">
			<div class="text-sm text-muted-foreground">Code</div>
			<p class="text-base font-semibold text-foreground">{promotion.code || '—'}</p>
		</div>
		<div class="flex min-w-0 flex-col gap-1">
			<div class="text-sm text-muted-foreground">Method</div>
			<p class="text-base font-semibold text-foreground">{promotion.method}</p>
		</div>
	</div>
</div>
