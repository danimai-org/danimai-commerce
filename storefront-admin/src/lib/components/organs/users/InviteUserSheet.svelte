<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import MultiSelectCombobox from '$lib/components/organs/multi-select-combobox/multi-select-combobox.svelte';
	import { client } from '$lib/client.js';

	type Role = {
		id: string;
		name: string;
		description: string;
		created_at: Date;
		updated_at: Date;
		deleted_at: Date | null;
	};

	let {
		open = $bindable(false),
		onInvited
	}: {
		open: boolean;
		onInvited?: () => void;
	} = $props();

	let email = $state('');
	let roleIds = $state<string[]>([]);
	let roles = $state<Role[]>([]);
	let loading = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	let prevOpen = $state(false);

	function parseClientError(
		result: { error?: { value?: { message?: string } } },
		fallback: string
	) {
		const msg = result?.error?.value?.message;
		return typeof msg === 'string' && msg.trim().length > 0 ? msg : fallback;
	}

	$effect(() => {
		const justOpened = open && !prevOpen;
		prevOpen = open;
		if (!justOpened) return;

		email = '';
		roleIds = [];
		error = null;
		loading = true;
		client.roles
			.get({ query: { limit: 100 } as Record<string, unknown> })
			.then((res) => {
				if (res.error) {
					throw new Error(parseClientError(res, 'Failed to load roles'));
				}
				roles = ((res.data as { rows?: Role[] } | null)?.rows ?? []) as Role[];
			})
			.catch((e) => {
				error = e instanceof Error ? e.message : String(e);
			})
			.finally(() => {
				loading = false;
			});
	});

	async function submit() {
		error = null;
		const trimmed = email.trim();
		if (!trimmed) {
			error = 'Email is required';
			return;
		}
		submitting = true;
		try {
			const body: { email: string; role_id?: string } = { email: trimmed };
			if (roleIds.length > 0) body.role_id = roleIds[0];
			const res = await client.invites.post(body as { email: string; role_ids?: string[] });
			if (res.error) {
				throw new Error(parseClientError(res, 'Failed to send invite'));
			}
			open = false;
			onInvited?.();
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
				<h2 class="text-lg font-semibold">Invite user</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Send an invite by email. Optionally assign a role.
				</p>
			</div>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					submit();
				}}
				class="flex h-full flex-col"
			>
				<div class="min-h-0 flex-1 space-y-4 overflow-auto px-6 py-6">
					<div class="space-y-2">
						<label for="invite-email" class="block text-sm font-medium">Email</label>
						<Input
							id="invite-email"
							type="email"
							placeholder="user@example.com"
							class="w-full"
							bind:value={email}
							disabled={submitting}
							required
						/>
					</div>
					<div class="space-y-2">
						<label for="invite-role" class="block text-sm font-medium">Role (optional)</label>
						{#if loading}
							<p class="text-sm text-muted-foreground">Loading roles…</p>
						{:else}
							<MultiSelectCombobox
								id="invite-role"
								options={roles.map((r) => ({ id: r.id, value: r.name }))}
								bind:value={roleIds}
								placeholder="Select role"
								disabled={submitting}
							/>
						{/if}
					</div>
					{#if error}
						<p class="text-sm text-destructive">{error}</p>
					{/if}
				</div>
				<div class="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => (open = false)}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={submitting}>
						{submitting ? 'Sending…' : 'Send invite'}
					</Button>
				</div>
			</form>
		</div>
	</Sheet.Content>
</Sheet.Root>
