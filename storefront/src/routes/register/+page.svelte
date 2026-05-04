

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

<div class="page-register">
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