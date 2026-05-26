<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		orderDialogBody,
		orderDialogFooter,
		orderDialogHeader,
		orderDialogSm,
		orderDialogTitle
	} from '../dialog-classes.js';

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
	<Dialog.Content class={orderDialogSm}>
		<Dialog.Header class={orderDialogHeader}>
			<Dialog.Title class={orderDialogTitle}>Edit contact information</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-col gap-4 {orderDialogBody}">
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
		<Dialog.Footer class={orderDialogFooter}>
			<Button variant="outline" onclick={onCancel} disabled={saving}>Cancel</Button>
			<Button onclick={onSave} disabled={!canSave || saving}>Done</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
