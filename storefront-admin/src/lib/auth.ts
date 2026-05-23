import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'danimai_session';
const SESSION_COOKIE = 'danimai_session';
const COOKIE_MAX_AGE_DAYS = 7;

type TokenPayload = { sub?: string; email?: string; exp?: number };

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

function readStoredTokens(): { access_token: string; refresh_token: string } | null {
	if (typeof window === 'undefined') return null;
	try {
		const s = window.localStorage.getItem(STORAGE_KEY);
		if (!s) return null;
		const parsed = JSON.parse(s) as { access_token: string; refresh_token: string };
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

export const user = writable<{ id: string; email: string } | null>(null);
export const authReady = writable(false);

let initPromise: Promise<void> | null = null;

export function ensureSessionCookie(): void {
	if (typeof document === 'undefined') return;
	const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
	const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : '';
	document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${maxAge}; samesite=strict${secure}`;
}

export function setSession(tokens: { access_token: string; refresh_token: string }) {
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

const API_BASE =
	typeof window !== 'undefined' ? (import.meta.env.VITE_API_BASE ?? 'http://localhost:8000') : '';

/** Restore session from storage, sync cookie, optionally validate with backend. */
export async function initializeAuth(): Promise<void> {
	if (typeof window === 'undefined') return;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		console.debug('[auth] initializeAuth: start');

		const tokens = readStoredTokens();
		const hasToken = Boolean(tokens?.access_token);
		console.debug('[auth] token in localStorage:', hasToken);

		if (!tokens?.access_token) {
			user.set(null);
			authReady.set(true);
			console.debug('[auth] initializeAuth: done (no session)');
			return;
		}

		const payload = decodePayload(tokens.access_token);
		if (!payload?.sub || isTokenExpired(payload)) {
			console.debug('[auth] token expired or invalid payload');
			clearSession();
			authReady.set(true);
			console.debug('[auth] initializeAuth: done (cleared expired)');
			return;
		}

		const restored = { id: payload.sub, email: payload.email ?? '' };
		user.set(restored);
		ensureSessionCookie();
		console.debug('[auth] user restored:', restored.email, restored.id);

		const apiBase = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';
		try {
			const res = await fetch(`${apiBase}/auth/me`, {
				headers: { Authorization: `Bearer ${tokens.access_token}` }
			});
			if (res.status === 401) {
				console.debug('[auth] /auth/me returned 401, clearing session');
				clearSession();
			}
		} catch {
			/* offline or API down — keep local session */
		}

		authReady.set(true);
		console.debug('[auth] initializeAuth: done, authenticated:', get(user) != null);
	})();

	return initPromise;
}

/** Call backend to expire session (set logged_out_at), then clear local session. */
export async function logout(apiBase: string = API_BASE): Promise<void> {
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
