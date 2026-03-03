const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export async function deleteRegions(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/regions`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ region_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}
