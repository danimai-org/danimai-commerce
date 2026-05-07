<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { client } from "$lib/api/client";

    type VerifyState = "loading" | "success" | "error";

    let state: VerifyState = "loading";
    let message = "Verifying your email...";

    const treatyErrorMessage = (err: unknown): string => {
        const o = err as { value?: { message?: string } };
        return o?.value?.message ?? "Unable to verify your email.";
    };

    onMount(() => {
        const token = $page.url.searchParams.get("token")?.trim() ?? "";
        if (!token) {
            state = "error";
            message = "Verification token is missing.";
            return;
        }

        void (async () => {
            state = "loading";
            message = "Verifying your email...";
            const res = await client.storefront.auth["verify-email"].post({
                token,
            });

            if (res.error) {
                state = "error";
                message = treatyErrorMessage(res.error);
                return;
            }

            state = "success";
            message = "Your email has been verified successfully.";
        })();
    });
</script>

<svelte:head>
    <title>Verify Email — Denimai</title>
</svelte:head>

<div class="page-verify-email">
    <SiteHeader />

    <main class="verify-main">
        <section class="verify-card">
            {#if state === "loading"}
                <div class="verify-loader" aria-hidden="true"></div>
                <h1>Verifying Email</h1>
                <p>{message}</p>
            {:else if state === "success"}
                <h1>Email Verified</h1>
                <p>{message}</p>
                <a class="verify-action" href="/login">Go to Login</a>
            {:else}
                <h1>Verification Failed</h1>
                <p>{message}</p>
                <a class="verify-action" href="/register">Back to Register</a>
            {/if}
        </section>
    </main>

    <SiteFooter />
</div>

<style>
    .verify-main {
        min-height: 52vh;
        display: grid;
        place-items: center;
        padding: 2rem 1rem;
    }

    .verify-card {
        width: min(100%, 560px);
        border: 1px solid #d9d9d9;
        border-radius: 10px;
        background: #fff;
        padding: 2rem;
        text-align: center;
    }

    .verify-card h1 {
        margin: 0 0 0.75rem;
    }

    .verify-card p {
        margin: 0;
        color: #444;
    }

    .verify-action {
        display: inline-block;
        margin-top: 1.25rem;
        background: #171717;
        color: #fff;
        text-decoration: none;
        padding: 0.65rem 1rem;
        border-radius: 6px;
    }

    .verify-loader {
        width: 30px;
        height: 30px;
        margin: 0 auto 0.9rem;
        border: 3px solid #e6e6e6;
        border-top-color: #171717;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
