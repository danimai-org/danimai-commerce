<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { goto } from "$app/navigation";
    import { superForm } from "sveltekit-superforms/client";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import type { SuperValidated } from "sveltekit-superforms";
    import { z } from "zod";
    let { data } = $props();

    const LoginSchema = z.object({
        email: z
            .string()
            .trim()
            .email("Please enter a valid email address."),
        password: z
            .string()
            .trim()
            .min(1, "Please enter your password."),
    });
    type LoginFormData = z.infer<typeof LoginSchema>;

    const ACCOUNT_STORAGE_KEY = "dm_sf_account";
    let showPassword = $state(false);
    const firstError = (value: unknown): string => {
        if (typeof value === "string") return value;
        if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === "string"
        ) {
            return value[0];
        }
        if (value && typeof value === "object" && "_errors" in value) {
            const errors = (value as { _errors?: unknown })._errors;
            if (
                Array.isArray(errors) &&
                errors.length > 0 &&
                typeof errors[0] === "string"
            ) {
                return errors[0];
            }
        }
        return "";
    };
    // `data` comes from page load; superForm owns state after init.
    // svelte-ignore state_referenced_locally
    const { form, errors, constraints, message, enhance, delayed } = superForm<LoginFormData>(
        (data as { loginForm: SuperValidated<LoginFormData> }).loginForm,
        {
            validators: zod4Client(LoginSchema),
            onUpdated({ form: validated }) {
                if (!validated.valid || !validated.posted) return;
                const email = validated.data.email.trim();
                const name = email.includes("@")
                    ? email.split("@")[0]
                    : "Customer";

                const params = new URLSearchParams({
                    email,
                    name,
                });

                localStorage.setItem(
                    ACCOUNT_STORAGE_KEY,
                    JSON.stringify({
                        name,
                        email,
                    }),
                );

                void goto(`/account?${params.toString()}`);
            },
        },
    );
</script>

<svelte:head>
    <title>Login — Denimai</title>
</svelte:head>

<div class="page-login">
    <SiteHeader />

    <main class="auth-main">
        <header class="auth-header">
            <h1 class="auth-title">Login to Your Account</h1>
            <p class="auth-subtitle">Welcome back to Denimai.</p>
        </header>

        <form
            class="auth-form"
            method="post"
            action="?/login"
            use:enhance
            novalidate
        >
            <div class="field">
                <label for="login-email">Email</label>
                <input
                    id="login-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    bind:value={$form.email}
                    aria-invalid={$errors.email ? "true" : undefined}
                />
                {#if $errors.email}
                    <span class="field-error">{firstError($errors.email)}</span>
                {/if}
            </div>
            <div class="field">
                <label for="login-password">Password</label>
                <div class="password-input-wrap">
                    <input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autocomplete="current-password"
                        placeholder="Enter your password"
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
                    <span class="field-error">{firstError($errors.password)}</span>
                {/if}
            </div>
            {#if $message}
                <p class="login-error">{$message}</p>
            {/if}
            <button type="submit" class="auth-submit" disabled={$delayed}>
                {$delayed ? "Logging in..." : "LOGIN"}
            </button>
        </form>

        <p class="auth-footer">
            Don't have an account? <a href="/register">Register</a>
        </p>
    </main>

    <SiteFooter />
</div>

<style>
    .auth-form {
        border: 1px solid #d9d9d9;
        border-radius: 8px;
        padding: 1.25rem;
        background: #fff;
    }

    .auth-form input {
        border: 1px solid #cfcfcf;
    }

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

    .login-error {
        margin: 0;
        color: #b42318;
        font-size: 0.875rem;
    }

    .field-error {
        margin: 0;
        color: #b42318;
        font-size: 0.875rem;
        line-height: 1.35;
    }

    input[aria-invalid="true"] {
        border-color: #b42318;
    }
</style>
