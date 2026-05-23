<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Users from '@lucide/svelte/icons/users';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { label, fallbackId = '…' }: { label: string; fallbackId?: string } = $props();
</script>

<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
	<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
		<button
			type="button"
			class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
			onclick={() => goto(resolve('/customers', {}), { replaceState: true })}
		>
			<Users class="size-4 shrink-0" />
			<span>Customers</span>
		</button>
		<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
		<span class="font-medium text-foreground">{label || fallbackId}</span>
	</nav>
</div>
