<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { MultiSelectCombobox } from '$lib/components/organs/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { client } from '$lib/client.js';
	import { toast, Toaster } from 'svelte-sonner';

	type Role = { id: string; name: string };

	let {
		open = $bindable(false),
		formData,
		onSuccess = () => {}
	}: {
		open?: boolean;
		formData: any;
		onSuccess?: () => void;
	} = $props();

	const initialFormData = $state.snapshot(formData);

	const { form, errors, enhance, delayed } = superForm(initialFormData, {
		resetForm: true,
		onResult: ({ result }) => {
			if (result.status === 200) {
				toast.success('Invite created successfully');
				open = false;
				onSuccess();
			}
		}
	});

	let roles = $state<Role[]>([]);
	let rolesLoading = $state(false);
	let roleLoadError = $state<string | null>(null);
	let selectedRoleIds = $state<string[]>([]);
	let initialized = $state(false);

	function parseClientError(result: any, fallback: string) {
		const msg = result?.error?.value?.message;
		return typeof msg === 'string' && msg.trim().length > 0 ? msg : fallback;
	}

	async function loadRoles() {
		rolesLoading = true;
		roleLoadError = null;
		try {
			const res = await client.roles.get({ query: { limit: 100 } as any });
			if (res.error) {
				throw new Error(parseClientError(res, 'Failed to load roles'));
			}
			roles = ((res.data as { rows?: Role[] } | null)?.rows ?? []) as Role[];
		} catch (e) {
			roleLoadError = e instanceof Error ? e.message : String(e);
		} finally {
			rolesLoading = false;
		}
	}

	$effect(() => {
		if (!open) {
			initialized = false;
			roleLoadError = null;
			roles = [];
			selectedRoleIds = [];
			return;
		}

		if (initialized) return;
		initialized = true;

		selectedRoleIds = Array.isArray($form.role_ids) ? [...$form.role_ids] : [];
		loadRoles();
	});

	$effect(() => {
		$form.role_ids = selectedRoleIds;
	});

	function close() {
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex h-full max-h-dvh w-full max-w-lg flex-col sm:max-w-lg">
		<form action="?/create" method="POST" use:enhance class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Invite user</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Send an invite by email. Optionally assign roles.
				</p>
			</div>

			<div class="min-h-0 flex-1 overflow-auto space-y-4 px-6 py-6">
				<div class="space-y-2">
					<label for="invite-email" class="block text-sm font-medium">Email</label>
					<Input
						id="invite-email"
						name="email"
						type="email"
						placeholder="user@example.com"
						class={cn('w-full', $errors.email && 'border-destructive')}
						bind:value={$form.email}
						aria-invalid={$errors.email ? 'true' : undefined}
						required
					/>
					{#if $errors.email}
						<p class="text-xs text-destructive">{$errors.email}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label for="invite-role" class="block text-sm font-medium">Roles (optional)</label>
					{#if rolesLoading}
						<p class="text-sm text-muted-foreground">Loading roles...</p>
					{:else if roleLoadError}
						<p class="text-sm text-destructive">{roleLoadError}</p>
					{:else}
						<MultiSelectCombobox
							id="invite-role"
							options={roles.map((r) => ({ id: r.id, value: r.name }))}
							bind:value={selectedRoleIds}
							placeholder="Select roles..."
							disabled={$delayed}
						/>
					{/if}
					{#if $errors.role_ids}
						<p class="text-xs text-destructive">{$errors.role_ids}</p>
					{/if}
					{#each selectedRoleIds as roleId (roleId)}
						<input type="hidden" name="role_ids" value={roleId} />
					{/each}
				</div>
			</div>

			<div class="flex shrink-0 justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={close} disabled={$delayed}>
					Cancel
				</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Sending...' : 'Send invite'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
<Toaster richColors position="top-center" />
