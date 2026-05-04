<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { goto } from '$app/navigation';

	const handleLogin = async (e: Event) => {
		e.preventDefault();
		await goto('/account');
		return false;
	};
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	
	
	<title>Login — Denimai</title>
</svelte:head>

<div class="page-login">
	<SiteHeader />

	<main class="auth-main">
		<header class="auth-header">
			<h1 class="auth-title">Login to Your Account</h1>
			<p class="auth-subtitle">Welcome back to Denimai.</p>
		</header>

		<form class="auth-form" method="post" action="/login" onsubmit={handleLogin}>
			<div class="field">
				<label for="login-email">Email</label>
				<input
					id="login-email"
					name="email"
					type="email"
					autocomplete="email"
					placeholder="you@example.com"
				/>
			</div>
			<div class="field">
				<label for="login-password">Password</label>
				<input
					id="login-password"
					name="password"
					type="password"
					autocomplete="current-password"
					placeholder="Enter your password"
				/>
			</div>
			<button type="submit" class="auth-submit">LOGIN</button>
		</form>

		<p class="auth-footer">
			Don't have an account? <a href="/register">Register</a>
		</p>
	</main>

	<SiteFooter />
</div>
