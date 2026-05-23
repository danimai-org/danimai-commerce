<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		updateCustomerGroup,
		type CustomerGroupDetail
	} from '$lib/customer-groups/api.js';

	let {
		open = $bindable(false),
		group = null,
		onSaved = async () => {}
	}: {
		open?: boolean;
		group?: CustomerGroupDetail | null;
		onSaved?: () => void | Promise<void>;
	} = $props();

	let formName = $state('');
	let formError = $state<string | null>(null);
	let formSubmitting = $state(false);
	let initializedForId = $state<string | null>(null);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			formError = null;
			return;
		}

		const nextId = group?.id ?? '';
		if (!nextId) return;
		if (initializedForId === nextId) return;
		initializedForId = nextId;
		formName = group?.name ?? '';
		formError = null;
	});

	function closeSheet() {
		if (!formSubmitting) open = false;
	}

	async function submitForm() {
		if (!group) return;
		formError = null;
		if (!formName.trim()) {
			formError = 'Name is required';
			return;
		}
		formSubmitting = true;
		try {
			await updateCustomerGroup(group.id, { name: formName.trim() });
			open = false;
			await onSaved();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			formSubmitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Edit Customer Group</Sheet.Title>
				<Sheet.Description>Update customer group details.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if formError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{formError}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-group-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-group-name"
							bind:value={formName}
							placeholder="Customer group name"
							class="h-9"
							disabled={formSubmitting}
							required
						/>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet} disabled={formSubmitting}>Cancel</Button>
				<Button onclick={submitForm} disabled={formSubmitting}>
					{formSubmitting ? 'Saving...' : 'Save'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
