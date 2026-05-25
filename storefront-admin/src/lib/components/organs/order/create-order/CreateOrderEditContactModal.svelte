<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let {
		open = $bindable(false),
		email = $bindable(''),
		phone = $bindable(''),
		updateProfile = $bindable(true),
		saving,
		canSave,
		onSave,
		onCancel
	}: {
		open?: boolean;
		email?: string;
		phone?: string;
		updateProfile?: boolean;
		saving: boolean;
		canSave: boolean;
		onSave: () => void;
		onCancel: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="top-1/2 left-1/2 flex h-auto max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border p-0 shadow-lg"
	>
		<Dialog.Header class="border-b px-6 py-4">
			<Dialog.Title class="text-base font-semibold">Edit contact information</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-col gap-4 px-6 py-4">
			<div class="flex flex-col gap-2">
				<label for="edit-contact-email" class="text-sm font-medium">Email</label>
				<Input id="edit-contact-email" type="email" bind:value={email} class="h-9" />
			</div>
			<div class="flex flex-col gap-2">
				<label for="edit-contact-phone" class="text-sm font-medium">Phone number</label>
				<Input id="edit-contact-phone" type="tel" bind:value={phone} class="h-9" />
			</div>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={updateProfile} class="size-4 rounded border-input" />
				<span>Update customer profile</span>
			</label>
		</div>
		<Dialog.Footer class="!flex-row justify-end gap-2 border-t px-6 py-4">
			<Button variant="outline" onclick={onCancel} disabled={saving}>Cancel</Button>
			<Button onclick={onSave} disabled={!canSave || saving}>Done</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
