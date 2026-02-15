import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'danimai_session';
const SESSION_COOKIE = 'danimai_session';
const COOKIE_MAX_AGE_DAYS = 7;

function decodePayload(token: string): { sub?: string; email?: string } | null {
	try {
		const b64 = token.split('.')[1];
		if (!b64) return null;
		const json = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
		return JSON.parse(json) as { sub?: string; email?: string };
	} catch {
		return null;
	}
}

function readStored(): { id: string; email: string } | null {
	if (typeof window === 'undefined') return null;
	try {
		const s = window.localStorage.getItem(STORAGE_KEY);
		if (!s) return null;
		const { access_token } = JSON.parse(s) as { access_token: string; refresh_token: string };
		const payload = decodePayload(access_token);
		if (!payload?.sub) return null;
		return { id: payload.sub, email: payload.email ?? '' };
	} catch {
		return null;
	}
}

export const user = writable<{ id: string; email: string } | null>(readStored());

export function setSession(tokens: { access_token: string; refresh_token: string }) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
		const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
		document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${maxAge}; samesite=strict`;
	} catch { /* ignore */ }
	const payload = decodePayload(tokens.access_token);
	if (payload?.sub) {
		user.set({ id: payload.sub, email: payload.email ?? '' });
	}
}

export function clearSession() {
	user.set(null);
	try {
		window.localStorage.removeItem(STORAGE_KEY);
		document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
	} catch { /* ignore */ }
}

export function isLoggedIn(): boolean {
	return get(user) != null;
}

export function getAccessToken(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		const s = window.localStorage.getItem(STORAGE_KEY);
		if (!s) return null;
		const { access_token } = JSON.parse(s) as { access_token: string; refresh_token: string };
		return access_token;
	} catch {
		return null;
	}
}

const API_BASE = typeof window !== 'undefined' ? (import.meta.env.VITE_API_BASE ?? 'http://localhost:8000') : '';

/** Call backend to expire session (set logged_out_at), then clear local session. */
export async function logout(apiBase: string = API_BASE): Promise<void> {
	const token = getAccessToken();
	if (token && apiBase) {
		try {
			await fetch(`${apiBase}/auth/logout`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			});
		} catch { /* ignore */ }
	}
	clearSession();
}
