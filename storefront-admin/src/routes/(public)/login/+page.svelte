<script lang="ts">
	import { goto } from '$app/navigation';
	import { setSession } from '$lib/auth.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	const API_BASE = 'http://localhost:8000';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	async function submit() {
		error = null;
		const e = email.trim();
		if (!e) {
			error = 'Email is required.';
			return;
		}
		if (!password) {
			error = 'Password is required.';
			return;
		}
		submitting = true;
		try {
			const res = await fetch(`${API_BASE}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: e, password }),
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
			const data = JSON.parse(text) as {
				access_token: string;
				refresh_token: string;
				expires_in: number;
			};
			setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
	<div class="flex flex-col items-center text-center">
		<div
			class="flex size-14 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
		>
			<span class="text-2xl font-bold">M</span>
		</div>
		<h1 class="mt-6 text-2xl font-bold tracking-tight">Welcome to Danimai</h1>
		<p class="mt-2 text-sm text-muted-foreground">
			Sign in to access the account area
		</p>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			submit();
		}}
		class="mt-8 space-y-4"
	>
		<div class="space-y-2">
			<label for="login-email" class="sr-only">Email</label>
			<Input
				id="login-email"
				type="email"
				placeholder="Email"
				class="w-full"
				bind:value={email}
				disabled={submitting}
				autocomplete="email"
				required
			/>
		</div>
		<div class="space-y-2">
			<label for="login-password" class="sr-only">Password</label>
			<div class="relative">
				<Input
					id="login-password"
					type={showPassword ? 'text' : 'password'}
					placeholder="Password"
					class="w-full pr-10"
					bind:value={password}
					disabled={submitting}
					autocomplete="current-password"
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
		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}
		<Button type="submit" class="w-full" disabled={submitting}>
			{submitting ? 'Signing in…' : 'Continue with Email'}
		</Button>
	</form>

	<p class="mt-6 text-center text-sm text-muted-foreground">
		Forgot password? –
		<button
			type="button"
			class="text-primary underline underline-offset-4 hover:no-underline bg-transparent border-none cursor-pointer p-0 font-inherit"
		>
			Reset
		</button>
	</p>
</div>
