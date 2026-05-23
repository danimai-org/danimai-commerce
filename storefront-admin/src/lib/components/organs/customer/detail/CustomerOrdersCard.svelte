<script lang="ts">
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
</script>

<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="flex items-center gap-2 text-base font-semibold">
			<ShoppingBag class="size-4" />
			Orders
		</h2>
	</div>
	<div class="px-6 py-8 text-center text-sm text-muted-foreground">No orders yet.</div>
</section>
