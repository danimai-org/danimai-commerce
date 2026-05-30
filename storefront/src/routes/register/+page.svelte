<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { superForm } from "sveltekit-superforms/client";

    let { data } = $props();
    let showPassword = $state(false);
    let submitting = $state(false);

    const { form, errors, constraints, message, enhance, submitting: submittingStore } =
        superForm(data.registerForm);

    $effect(() => {
        const unsub = submittingStore.subscribe((value) => {
            submitting = value;
        });
        return unsub;
    });
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
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
            <p class="auth-subtitle">
                Join Denimai for a personalized shopping experience
            </p>
        </header>

        {#if $message}
            <div class="status-message" class:error={$errors._errors}>
                {$message}
            </div>
        {/if}

        <form
            class="auth-form"
            method="post"
            action="?/register"
            use:enhance
            novalidate
        >
            <div class="form-row form-row--split">
                <div class="field">
                    <label for="given_name">First Name</label>
                    <input
                        id="given_name"
                        name="given_name"
                        type="text"
                        placeholder="John"
                        autocomplete="given-name"
                        bind:value={$form.given_name}
                        aria-invalid={$errors.given_name ? "true" : undefined}
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
                        autocomplete="family-name"
                        bind:value={$form.family_name}
                        aria-invalid={$errors.family_name ? "true" : undefined}
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
                    autocomplete="email"
                    bind:value={$form.email}
                    aria-invalid={$errors.email ? "true" : undefined}
                    {...$constraints.email}
                />
                {#if $errors.email}
                    <span class="field-error">{$errors.email}</span>
                {/if}
            </div>
            <div class="field">
                <label for="password">Password</label>
                <div class="password-input-wrap">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autocomplete="new-password"
                        bind:value={$form.password}
                        aria-invalid={$errors.password ? "true" : undefined}
                        {...$constraints.password}
                    />
                    <button
                        type="button"
                        class="password-toggle"
                        aria-label={showPassword
                            ? "Hide password"
                            : "Show password"}
                        onclick={() => (showPassword = !showPassword)}
                    >
                        {#if showPassword}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path
                                    d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.73-2.06 2.04-3.86 3.73-5.24"
                                />
                                <path
                                    d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.09 11.09 0 0 1-1.67 3.01"
                                />
                                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                <path d="m1 1 22 22" />
                            </svg>
                        {:else}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path
                                    d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                                />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        {/if}
                    </button>
                </div>
                {#if $errors.password}
                    <span class="field-error">{$errors.password}</span>
                {/if}
            </div>
            <button type="submit" class="auth-submit" disabled={submitting}>
                {submitting ? "Creating Account..." : "Create Account"}
            </button>
        </form>

        <p class="auth-footer">
            Already have an account? <a href="/login">Login</a>
        </p>
    </main>
    <SiteFooter />
</div>

<style>
    .password-input-wrap {
        position: relative;
    }

    .password-input-wrap input {
        width: 100%;
        padding-right: 4.5rem;
    }

    .password-toggle {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        border: 0;
        background: transparent;
        color: #444;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
    }
</style>
