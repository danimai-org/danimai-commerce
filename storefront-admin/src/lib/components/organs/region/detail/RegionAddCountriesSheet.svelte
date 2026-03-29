<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex w-full flex-col sm:max-w-lg">
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title>Add countries</Sheet.Title>
			<Sheet.Description>Select the countries that belong to this region.</Sheet.Description>
		</Sheet.Header>

		<div class="flex-1 p-6 text-center">
			<p class="text-sm text-muted-foreground">Country selection list goes here...</p>
		</div>

		<Sheet.Footer class="mt-auto flex justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={() => (open = false)}>Save Changes</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
