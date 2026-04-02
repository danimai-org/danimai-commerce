<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
		rel="stylesheet"
	/>
	<title>Login — Denimai</title>
</svelte:head>

<div class="page-auth">
	<SiteHeader />

	<main class="auth-main">
		<header class="auth-header">
			<h1 class="auth-title">Login to Your Account</h1>
			<p class="auth-subtitle">Welcome back to Denimai.</p>
		</header>

		<form class="auth-form" method="post" action="/login" onsubmit={(e) => e.preventDefault()}>
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
			<button type="submit" class="auth-submit">Login</button>
		</form>

		<p class="auth-footer">
			Don't have an account? <a href="/register">Register</a>
		</p>
	</main>

	<SiteFooter />
</div>

<style>
	.page-auth {
		--font-serif: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
		--font-sans: 'DM Sans', system-ui, -apple-system, sans-serif;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	:global(body) {
		margin: 0;
		font-family: var(--font-sans);
		color: #1a1a1a;
		background: #fff;
	}

	.auth-main {
		flex: 1;
		max-width: 28rem;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
		width: 100%;
		box-sizing: border-box;
	}

	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.auth-title {
		font-family: var(--font-serif);
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		margin: 0 0 0.5rem;
		letter-spacing: 0.02em;
	}

	.auth-subtitle {
		margin: 0;
		font-size: 0.9375rem;
		color: #5c5c5c;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.field label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #2a2a2a;
	}

	.field input {
		font: inherit;
		font-size: 0.9375rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid #d4d4d4;
		border-radius: 2px;
		background: #fff;
		color: #1a1a1a;
	}

	.field input::placeholder {
		color: #9a9a9a;
	}

	.field input:focus {
		outline: none;
		border-color: #1a1a1a;
	}

	.auth-submit {
		margin-top: 0.25rem;
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		padding: 0.85rem 1.5rem;
		border: none;
		border-radius: 2px;
		background: #1a1a1a;
		color: #fff;
		cursor: pointer;
	}

	.auth-submit:hover {
		background: #000;
	}

	.auth-footer {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.9375rem;
		color: #5c5c5c;
	}

	.auth-footer a {
		color: #1a1a1a;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.auth-footer a:hover {
		color: #000;
	}
</style>
