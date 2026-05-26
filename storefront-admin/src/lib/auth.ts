import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'danimai_session';
const SESSION_COOKIE = 'danimai_session';
const COOKIE_MAX_AGE_DAYS = 7;

type TokenPayload = { sub?: string; email?: string; exp?: number; type?: string };

type AuthTokens = { access_token: string; refresh_token: string };

function decodePayload(token: string): TokenPayload | null {
	try {
		const b64 = token.split('.')[1];
		if (!b64) return null;
		const json = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
		return JSON.parse(json) as TokenPayload;
	} catch {
		return null;
	}
}

function isTokenExpired(payload: TokenPayload): boolean {
	if (payload.exp == null) return false;
	return payload.exp * 1000 <= Date.now();
}

function readStoredTokens(): AuthTokens | null {
	if (typeof window === 'undefined') return null;
	try {
		const s = window.localStorage.getItem(STORAGE_KEY);
		if (!s) return null;
		const parsed = JSON.parse(s) as AuthTokens;
		if (!parsed.access_token) return null;
		return parsed;
	} catch {
		return null;
	}
}

function userFromToken(access_token: string): { id: string; email: string } | null {
	const payload = decodePayload(access_token);
	if (!payload?.sub) return null;
	if (isTokenExpired(payload)) return null;
	return { id: payload.sub, email: payload.email ?? '' };
}

function hydrateUserFromStorage(): { id: string; email: string } | null {
	const tokens = readStoredTokens();
	if (!tokens?.access_token) return null;
	return userFromToken(tokens.access_token);
}

export function getApiBase(): string {
	return import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';
}

export const user = writable<{ id: string; email: string } | null>(
	browser ? hydrateUserFromStorage() : null
);
export const authReady = writable(false);

let initPromise: Promise<void> | null = null;
let refreshPromise: Promise<AuthTokens | null> | null = null;

export function ensureSessionCookie(): void {
	if (typeof document === 'undefined') return;
	const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
	const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : '';
	document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${maxAge}; samesite=strict${secure}`;
}

export function setSession(tokens: AuthTokens) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
		ensureSessionCookie();
	} catch {
		/* ignore */
	}
	const u = userFromToken(tokens.access_token);
	if (u) user.set(u);
	authReady.set(true);
}

export function clearSession() {
	user.set(null);
	try {
		window.localStorage.removeItem(STORAGE_KEY);
		document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
	} catch {
		/* ignore */
	}
}

export function isLoggedIn(): boolean {
	return get(user) != null;
}

export function getAccessToken(): string | null {
	return readStoredTokens()?.access_token ?? null;
}

function isAccessTokenValid(access_token: string): boolean {
	const payload = decodePayload(access_token);
	return Boolean(payload?.sub && !isTokenExpired(payload));
}

function isRefreshTokenValid(refresh_token: string): boolean {
	const payload = decodePayload(refresh_token);
	if (!payload || isTokenExpired(payload)) return false;
	if (payload.type != null && payload.type !== 'refresh') return false;
	return true;
}

async function refreshSession(refresh_token: string): Promise<AuthTokens | null> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const res = await fetch(`${getApiBase()}/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token })
			});
			if (!res.ok) return null;
			const data = (await res.json()) as AuthTokens;
			if (!data.access_token || !data.refresh_token) return null;
			setSession(data);
			return data;
		} catch {
			return null;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

/** Returns valid tokens, refreshing the access token when needed. */
export async function ensureValidTokens(): Promise<AuthTokens | null> {
	const stored = readStoredTokens();
	if (!stored?.access_token) {
		clearSession();
		return null;
	}

	if (isAccessTokenValid(stored.access_token)) {
		const u = userFromToken(stored.access_token);
		if (u) user.set(u);
		ensureSessionCookie();
		return stored;
	}

	if (!stored.refresh_token || !isRefreshTokenValid(stored.refresh_token)) {
		clearSession();
		return null;
	}

	return refreshSession(stored.refresh_token);
}

/** Returns a valid access token, refreshing when expired. */
export async function getValidAccessToken(): Promise<string | null> {
	const tokens = await ensureValidTokens();
	return tokens?.access_token ?? null;
}

async function validateSessionWithBackend(access_token: string): Promise<boolean> {
	try {
		const res = await fetch(`${getApiBase()}/auth/me`, {
			headers: { Authorization: `Bearer ${access_token}` }
		});
		if (res.status === 401) return false;
		return true;
	} catch {
		/* offline or API down — keep local session */
		return true;
	}
}

/** Restore session from storage, sync cookie, optionally validate with backend. */
export async function initializeAuth(): Promise<void> {
	if (typeof window === 'undefined') return;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		console.debug('[auth] initializeAuth: start');

		const hasStored = Boolean(readStoredTokens()?.access_token);
		console.debug('[auth] token in localStorage:', hasStored);

		if (!hasStored) {
			user.set(null);
			authReady.set(true);
			console.debug('[auth] initializeAuth: done (no session)');
			return;
		}

		const tokens = await ensureValidTokens();
		if (!tokens) {
			authReady.set(true);
			console.debug('[auth] initializeAuth: done (cleared invalid/expired)');
			return;
		}

		const restored = userFromToken(tokens.access_token);
		if (restored) {
			user.set(restored);
			console.debug('[auth] user restored:', restored.email, restored.id);
		}

		const valid = await validateSessionWithBackend(tokens.access_token);
		if (!valid) {
			const refreshed = await ensureValidTokens();
			if (!refreshed) {
				console.debug('[auth] /auth/me returned 401, clearing session');
				clearSession();
			} else {
				const retryValid = await validateSessionWithBackend(refreshed.access_token);
				if (!retryValid) {
					console.debug('[auth] /auth/me still 401 after refresh, clearing session');
					clearSession();
				}
			}
		}

		authReady.set(true);
		console.debug('[auth] initializeAuth: done, authenticated:', get(user) != null);
	})();

	return initPromise;
}

/** Call backend to expire session (set logged_out_at), then clear local session. */
export async function logout(apiBase: string = getApiBase()): Promise<void> {
	const token = getAccessToken();
	if (token && apiBase) {
		try {
			await fetch(`${apiBase}/auth/logout`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
		} catch {
			/* ignore */
		}
	}
	clearSession();
	initPromise = null;
	authReady.set(true);
}

if (browser) {
	void initializeAuth();
}
