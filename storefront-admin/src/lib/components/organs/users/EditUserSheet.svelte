<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import MultiSelectCombobox from '$lib/components/organs/multi-select-combobox/multi-select-combobox.svelte';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';

	type User = {
		id: string;
		first_name: string | null;
		last_name: string | null;
		role_id: string | null;
	};

	type Role = {
		id: string;
		name: string;
	};

	let {
		open = $bindable(false),
		user = null,
		roles = [],
		onSaved
	}: {
		open: boolean;
		user: User | null;
		roles: Role[];
		onSaved?: () => void;
	} = $props();

	const { form, errors, enhance, delayed, reset, message } = superForm(
		{ id: '', first_name: '', last_name: '', role_ids: [] as string[] },
		{
			resetForm: false,
			onResult: ({ result }) => {
				if (result.type === 'success') {
					open = false;
					onSaved?.();
					return;
				}
				const d = (result as { data?: { error?: string } }).data;
				if (d?.error) message.set(d.error);
			}
		}
	);

	/** MultiSelectCombobox cannot bind to `$form.role_ids`; mirror inviteCreate.svelte sync. */
	let roleIds = $state<string[]>([]);

	let initializedForId = $state<string | null>(null);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			return;
		}
		if (!user) return;
		const nextId = user.id;
		if (initializedForId === nextId) return;
		initializedForId = nextId;
		const nextRoleIds = user.role_id ? [user.role_id] : [];
		roleIds = nextRoleIds;
		reset({
			data: {
				id: user.id,
				first_name: user.first_name ?? '',
				last_name: user.last_name ?? '',
				role_ids: nextRoleIds
			}
		});
		message.set('');
	});

	$effect(() => {
		$form.role_ids = roleIds;
	});

	function close() {
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Edit user</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update first name, last name, and role.</p>
			</div>
			<form
				method="POST"
				action="?/updateUser"
				use:enhance
				class="flex flex-1 flex-col overflow-auto"
			>
				<input type="hidden" name="id" bind:value={$form.id} />
				{#each roleIds as roleId (roleId)}
					<input type="hidden" name="role_ids" value={roleId} />
				{/each}
				<div class="space-y-4 px-6 py-6">
					<div class="space-y-2">
						<label for="edit-first-name" class="block text-sm font-medium">First Name</label>
						<Input
							id="edit-first-name"
							name="first_name"
							type="text"
							placeholder="First name"
							class={cn('w-full', $errors.first_name && 'border-destructive')}
							bind:value={$form.first_name}
							aria-invalid={$errors.first_name ? 'true' : undefined}
							disabled={$delayed}
						/>
						{#if $errors.first_name}
							<span class="text-xs text-destructive">{$errors.first_name}</span>
						{/if}
					</div>
					<div class="space-y-2">
						<label for="edit-last-name" class="block text-sm font-medium">Last Name</label>
						<Input
							id="edit-last-name"
							name="last_name"
							type="text"
							placeholder="Last name"
							class={cn('w-full', $errors.last_name && 'border-destructive')}
							bind:value={$form.last_name}
							aria-invalid={$errors.last_name ? 'true' : undefined}
							disabled={$delayed}
						/>
						{#if $errors.last_name}
							<span class="text-xs text-destructive">{$errors.last_name}</span>
						{/if}
					</div>
					<div class="space-y-2">
						<label for="edit-role" class="block text-sm font-medium">Role</label>
						<MultiSelectCombobox
							id="edit-role"
							options={roles.map((r) => ({ id: r.id, value: r.name }))}
							bind:value={roleIds}
							placeholder="Select role"
							disabled={$delayed}
						/>
					</div>
					{#if $message}
						<p class="text-sm text-destructive">{$message}</p>
					{/if}
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button type="button" variant="outline" onclick={close} disabled={$delayed}>
						Cancel
					</Button>
					<Button type="submit" disabled={$delayed}>
						{$delayed ? 'Saving…' : 'Save'}
					</Button>
				</div>
			</form>
		</div>
	</Sheet.Content>
</Sheet.Root>
