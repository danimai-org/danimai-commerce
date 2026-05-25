<script lang="ts">
	import type { OrderAddress } from './types.js';

	let {
		address,
		emptyLabel = 'No address provided'
	}: {
		address: OrderAddress | null;
		emptyLabel?: string;
	} = $props();
</script>

{#if address && (address.first_name || address.last_name || address.address_1)}
	<div class="space-y-0.5 text-sm text-muted-foreground">
		{#if address.first_name || address.last_name}
			<div>{[address.first_name, address.last_name].filter(Boolean).join(' ')}</div>
		{/if}
		{#if address.company}
			<div>{address.company}</div>
		{/if}
		{#if address.address_1}
			<div>{address.address_1}</div>
			{#if address.address_2}
				<div>{address.address_2}</div>
			{/if}
		{/if}
		{#if address.city || address.state || address.postal_code}
			<div>
				{[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}
			</div>
		{/if}
		{#if address.country}
			<div>{address.country}</div>
		{/if}
		{#if address.phone}
			<div>{address.phone_code ? `${address.phone_code} ` : ''}{address.phone}</div>
		{/if}
	</div>
{:else}
	<div class="text-muted-foreground">{emptyLabel}</div>
{/if}
