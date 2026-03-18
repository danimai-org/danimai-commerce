<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Reservations</h2>
		<Button variant="outline" size="sm">Create</Button>
	</div>
	<div class="mt-4 py-8 text-center text-sm text-muted-foreground">
		No reservations.
	</div>
</div>
