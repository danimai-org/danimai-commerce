import { redirect } from '@sveltejs/kit';

const PUBLIC_PATHS = ['/login', '/accept-invite'];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function load({ url, cookies }) {
	const pathname = url.pathname;
	if (isPublicPath(pathname)) return {};
	const hasSession = cookies.get('danimai_session');
	if (!hasSession) {
		redirect(302, '/login');
	}
	return {};
}
