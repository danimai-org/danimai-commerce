export type ShippingAddressValue = {
	country: string;
	first_name: string;
	last_name: string;
	company: string;
	address_1: string;
	address_2: string;
	city: string;
	state: string;
	postal_code: string;
	phone_code: string;
	phone: string;
};

export function emptyShippingAddress(): ShippingAddressValue {
	return {
		country: 'India',
		first_name: '',
		last_name: '',
		company: '',
		address_1: '',
		address_2: '',
		city: '',
		state: '',
		postal_code: '',
		phone_code: '+91',
		phone: ''
	};
}

export function hasShippingAddress(addr: ShippingAddressValue | null | undefined): boolean {
	if (!addr) return false;
	return Boolean(
		addr.address_1?.trim() ||
			addr.city?.trim() ||
			addr.first_name?.trim() ||
			addr.last_name?.trim()
	);
}

export function formatShippingAddressSummary(addr: ShippingAddressValue): string {
	const lines: string[] = [];
	const name = [addr.first_name, addr.last_name].filter((s) => s?.trim()).join(' ');
	if (name) lines.push(name);
	if (addr.company?.trim()) lines.push(addr.company.trim());
	if (addr.address_1?.trim()) {
		lines.push(addr.address_1.trim());
		if (addr.address_2?.trim()) lines.push(addr.address_2.trim());
	}
	const cityLine = [addr.city, addr.state, addr.postal_code].filter((s) => s?.trim()).join(', ');
	if (cityLine) lines.push(cityLine);
	if (addr.country?.trim()) lines.push(addr.country.trim());
	if (addr.phone?.trim()) {
		lines.push(`${addr.phone_code ? `${addr.phone_code} ` : ''}${addr.phone.trim()}`);
	}
	return lines.join('\n');
}
