type StripeKeyMode = "test" | "live";

/** Account slug after `pk|sk_(test|live)_` — differs per key but same account shares a short prefix. */
export function stripeAccountSlug(key: string): string | null {
  const match = key.trim().match(/^(?:pk|sk)_(?:test|live)_(51[A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}

export function stripeAccountsMatch(keyA: string, keyB: string): boolean {
  const slugA = stripeAccountSlug(keyA);
  const slugB = stripeAccountSlug(keyB);
  if (!slugA || !slugB) return false;
  const len = Math.min(slugA.length, slugB.length, 8);
  return slugA.slice(0, len) === slugB.slice(0, len);
}

function stripeKeyMode(key: string): StripeKeyMode | null {
  if (/^sk_(test|live)_/.test(key)) {
    return key.includes("_test_") ? "test" : "live";
  }
  if (/^pk_(test|live)_/.test(key)) {
    return key.includes("_test_") ? "test" : "live";
  }
  return null;
}

/** Picks the secret key that belongs to the same Stripe account as the publishable key. */
export function resolveStripeSecretKey(
  stripeKey: string,
  stripeSecretKey: string,
  stripePublishableKey: string,
): string {
  const publishable = stripePublishableKey.trim();
  const candidates = [stripeKey, stripeSecretKey]
    .map((k) => k.trim())
    .filter(Boolean);

  if (publishable) {
    const matched = candidates.find((c) => stripeAccountsMatch(c, publishable));
    if (matched) return matched;
  }

  if (candidates[0]) return candidates[0];
  throw new Error("STRIPE_KEY is not configured.");
}

export function assertStripeKeyPairMatch(
  secretKey: string,
  publishableKey: string,
): void {
  const secret = secretKey.trim();
  const publishable = publishableKey.trim();

  if (!/^sk_(test|live)_\S+$/.test(secret)) {
    throw new Error("STRIPE_KEY is missing or not a valid Stripe secret key.");
  }
  if (!/^pk_(test|live)_\S+$/.test(publishable)) {
    throw new Error(
      "STRIPE_PUBLISHABLE_KEY is missing or not a valid Stripe publishable key.",
    );
  }

  const secretMode = stripeKeyMode(secret);
  const publishableMode = stripeKeyMode(publishable);
  if (!secretMode || !publishableMode || secretMode !== publishableMode) {
    throw new Error(
      "STRIPE_KEY and STRIPE_PUBLISHABLE_KEY must both be test keys or both be live keys.",
    );
  }

  if (!stripeAccountsMatch(secret, publishable)) {
    const secretSlug = stripeAccountSlug(secret);
    throw new Error(
      `STRIPE_PUBLISHABLE_KEY does not match STRIPE_KEY (secret account ${secretSlug?.slice(0, 8) ?? "?"}…). Use both keys from the same Stripe Dashboard account.`,
    );
  }
}

export function resolveStripePublishableKey(
  secretKey: string,
  publishableKey: string,
): string {
  const secret = secretKey.trim();
  const publishable = publishableKey.trim();

  if (!secret) {
    throw new Error("STRIPE_KEY is not configured.");
  }
  if (!publishable) {
    throw new Error(
      "STRIPE_PUBLISHABLE_KEY is required. Copy the Publishable key from Stripe Dashboard → Developers → API keys (same account and mode as STRIPE_KEY).",
    );
  }

  assertStripeKeyPairMatch(secret, publishable);
  return publishable;
}
