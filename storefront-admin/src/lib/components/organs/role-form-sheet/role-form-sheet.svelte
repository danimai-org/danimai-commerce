<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createEventDispatcher } from 'svelte';
	import { client } from '$lib/client.js';
	type Role = {
		id: string;
		name: string;
		description: string;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date |null;
	};

	let {
		open = $bindable(false),
		mode,
		role = null,
	}: {
		open?: boolean;
		mode: 'create' | 'edit';
		role: Role | null;
	} = $props();

	const dispatch = createEventDispatcher<{ success: void }>();

	let name = $state('');
	let description = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!open) return;
		if (mode === 'edit' && role) {
			name = role.name ?? '';
			description = role.description ?? '';
		} else {
			name = '';
			description = '';
		}
		error = null;
	});

	function parseRoleError(body: string): string {
		try {
			const json = JSON.parse(body) as { message?: string };
			const msg = json?.message ?? body;
			if (msg.includes('roles_name_key') || msg.toLowerCase().includes('duplicate key')) {
				return 'A role with this name already exists.';
			}
			return msg;
		} catch {
			return body;
		}
	}

	async function handleSubmit() {
		error = null;
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}
		submitting = true;
		try {
			const descriptionValue = description.trim() || undefined;

			if (mode === 'create') {
				const res = await client.roles.post({
					name: name.trim(),
					description: descriptionValue
				});
				if (res.error) {
					throw new Error(parseRoleError(res.error.value?.message ?? 'Failed to create role'));
				}
			} else if (mode === 'edit' && role) {
				const res = await client.roles({ id: role.id }).put({
					name: name.trim(),
					description: descriptionValue
				});
				if (res.error) {
					throw new Error(parseRoleError(res.error.value?.message ?? 'Failed to update role'));
				}
			}
			open = false;
			dispatch('success');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold">
					{mode === 'create' ? 'Add role' : 'Edit role'}
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{mode === 'create'
						? 'Create a new role with a name and optional description.'
						: 'Update the role name and description.'}
				</p>
			</div>
			<div class="flex-1 space-y-4 overflow-auto p-6">
				{#if error}
					<div
						class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="role-name">Name</label>
					<Input id="role-name" bind:value={name} placeholder="e.g. admin" />
				</div>
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="role-desc">Description</label>
					<Input id="role-desc" bind:value={description} placeholder="Optional description" />
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="button" disabled={submitting} onclick={handleSubmit}>
					{submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

