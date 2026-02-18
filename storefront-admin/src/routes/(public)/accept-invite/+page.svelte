<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	const API_BASE = 'http://localhost:8000';

	const tokenFromUrl = $derived($page.url.searchParams.get('token') ?? '');

	let token = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	$effect(() => {
		if (tokenFromUrl) token = tokenFromUrl;
	});

	async function submit() {
		error = null;
		const t = token.trim();
		if (!t) {
			error = 'Invite token is required. Please use the link from your invite email.';
			return;
		}
		if (password.length < 8) {
			error = 'Password must be at least 8 characters.';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}
		submitting = true;
		try {
			const res = await fetch(`${API_BASE}/invites/accept`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: t, password }),
			});
			const text = await res.text();
			if (!res.ok) {
				let msg = text;
				try {
					const j = JSON.parse(text);
					msg = j.message ?? msg;
				} catch {}
				throw new Error(msg);
			}
			success = true;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
	<h1 class="text-xl font-semibold">Accept invite</h1>
	<p class="mt-1 text-sm text-muted-foreground">
		Set your password to create your account. You can then log in with your email and this password.
	</p>

	{#if success}
		<div class="mt-6 space-y-4">
			<p class="text-sm text-green-600 dark:text-green-400">Account created. You can now log in.</p>
			<Button class="w-full" onclick={() => goto('/')}>Go to dashboard</Button>
		</div>
	{:else}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				submit();
			}}
			class="mt-6 space-y-4"
		>
			<div class="space-y-2">
				<label for="password" class="block text-sm font-medium">Password</label>
				<div class="relative">
					<Input
						id="password"
						type={showPassword ? 'text' : 'password'}
						placeholder="At least 8 characters"
						class="w-full pr-10"
						bind:value={password}
						disabled={submitting}
						minlength={8}
						required
					/>
					<button
						type="button"
						class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						onclick={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						tabindex="-1"
					>
						{#if showPassword}
							<EyeOff class="size-4" />
						{:else}
							<Eye class="size-4" />
						{/if}
					</button>
				</div>
			</div>
			<div class="space-y-2">
				<label for="confirmPassword" class="block text-sm font-medium">Confirm password</label>
				<div class="relative">
					<Input
						id="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder="Repeat password"
						class="w-full pr-10"
						bind:value={confirmPassword}
						disabled={submitting}
						minlength={8}
						required
					/>
					<button
						type="button"
						class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						onclick={() => (showConfirmPassword = !showConfirmPassword)}
						aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
						tabindex="-1"
					>
						{#if showConfirmPassword}
							<EyeOff class="size-4" />
						{:else}
							<Eye class="size-4" />
						{/if}
					</button>
				</div>
			</div>
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Creating account…' : 'Create account'}
			</Button>
		</form>
	{/if}
</div>
