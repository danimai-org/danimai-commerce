

<script lang="ts">
    import { SiteHeader, SiteFooter } from '$lib/components/layout';
    import { superForm } from 'sveltekit-superforms/client';
    import type { PageData } from './$types';

    export let data: PageData;

  
    const { form, errors, constraints, message, enhance, delayed } = superForm(data.registerForm);
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
        rel="stylesheet"
    />
    <title>Register — Denimai</title>
</svelte:head>

<div class="page-auth">
    <SiteHeader />

    <main class="auth-main">
        <header class="auth-header">
            <h1 class="auth-title">Create Your Denimai Account</h1>
            <p class="auth-subtitle">Join Denimai for a personalized shopping experience</p>
        </header>

        {#if $message}
            <div class="status-message" class:error={$errors._errors}>
                {$message}
            </div>
        {/if}

        <form class="auth-form" method="post" action="?/register" use:enhance>
            <div class="form-row form-row--split">
                <div class="field">
                    <label for="given_name">First Name</label>
                    <input
                        id="given_name"
                        name="given_name"
                        type="text"
                        placeholder="John"
                        bind:value={$form.given_name}
                        aria-invalid={$errors.given_name ? 'true' : undefined}
                        {...$constraints.given_name}
                    />
                    {#if $errors.given_name}
                        <span class="field-error">{$errors.given_name}</span>

                    {/if}
                </div>
                <div class="field">
                    <label for="family_name">Last Name</label>
                    <input
                        id="family_name"
                        name="family_name"
                        type="text"
                        placeholder="Doe"
                        bind:value={$form.family_name}
                        aria-invalid={$errors.family_name ? 'true' : undefined}
                        {...$constraints.family_name}
                    />
                    {#if $errors.family_name}
                        <span class="field-error">{$errors.family_name}</span>
                    {/if}
                </div>
            </div>
            <div class="field">
                <label for="email">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    bind:value={$form.email}
                    aria-invalid={$errors.email ? 'true' : undefined}
                    {...$constraints.email}
                />
                {#if $errors.email}
                    <span class="field-error">{$errors.email}</span>
                {/if}
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    bind:value={$form.password}
                    aria-invalid={$errors.password ? 'true' : undefined}
                    {...$constraints.password}
                />
                {#if $errors.password}
                    <span class="field-error">{$errors.password}</span>
                {/if}
            </div>

            <button type="submit" class="auth-submit" disabled={$delayed}>
                {$delayed ? 'Creating Account...' : 'Create Account'}
            </button>
        </form>

        <p class="auth-footer">
            Already have an account? <a href="/login">Login</a>
        </p>
    </main>

    <SiteFooter />
</div>

<style>
    .page-auth {
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
        max-width: 36rem;
        margin: 0 auto;
        padding: 3rem 1.5rem 4rem;
        width: 100%;
        box-sizing: border-box;
    }

    .auth-header {
        text-align: center;
        margin-bottom: 2.25rem;
    }

    .auth-title {
        font-size: clamp(1.5rem, 3.5vw, 1.875rem);
        font-weight: 700;
        color: #000;
        margin: 0 0 0.65rem;
        letter-spacing: -0.01em;
        line-height: 1.2;
    }

    .auth-subtitle {
        margin: 0 auto;
        max-width: 22rem;
        font-size: 0.9375rem;
        line-height: 1.5;
        color: #6b6b6b;
    }

    .status-message {
        padding: 1rem;
        margin-bottom: 1.5rem;
        background: #f0fdf4;
        color: #166534;
        border-radius: 4px;
        font-size: 0.875rem;
        text-align: center;
    }

    .status-message.error {
        background: #fef2f2;
        color: #991b1b;
    }

    .auth-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .form-row--split {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    @media (max-width: 480px) {
        .form-row--split {
            grid-template-columns: 1fr;
        }
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .field label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #3a3a3a;
    }

    .field input {
        font: inherit;
        font-size: 0.9375rem;
        padding: 0.7rem 0.8rem;
        border: 1px solid #d4d4d4;
        border-radius: 4px;
        background: #fff;
    }

    .field input[aria-invalid="true"] {
        border-color: #dc2626;
    }

    .field-error {
        font-size: 0.75rem;
        color: #dc2626;
        font-weight: 500;
    }

    .auth-submit {
        margin-top: 0.35rem;
        width: 100%;
        font: inherit;
        font-size: 0.9375rem;
        font-weight: 700;
        padding: 0.95rem 1.5rem;
        border: none;
        border-radius: 4px;
        background: #000;
        color: #fff;
        cursor: pointer;
    }

    .auth-submit:disabled {
        opacity: 0.7;
        cursor: not-allowed;
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
    }
	.field-error {
    display: block;      /* Ensure it takes up space */
    color: #dc2626;      /* Bright red */
    font-size: 0.75rem;
    font-weight: 500;
    margin-top: 0.25rem;
}

/* Optional: Highlight the input border red when there is an error */
input[aria-invalid="true"] {
    border-color: #dc2626 !important;
}
</style>