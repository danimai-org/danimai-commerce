const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export async function deleteCurrencies(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/currencies`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ currency_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}
