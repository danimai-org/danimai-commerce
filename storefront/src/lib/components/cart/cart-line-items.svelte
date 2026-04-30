<script lang="ts">
	type CartRowView = {
		key: string;
		lineId: string;
		href: string;
		name: string;
		priceValue: number;
		image: string | null;
		quantity: number;
		variant: string;
	};

	let {
		items,
		onChangeQuantity,
		onRemove
	}: {
		items: CartRowView[];
		onChangeQuantity: (lineId: string, delta: number) => void;
		onRemove: (lineId: string) => void;
	} = $props();
</script>

<ul class="line-items">
	{#each items as item (item.key)}
		<li class="line-item">
			<a href={item.href} class="line-item-image" style="background-color: #f5f0eb;">
				{#if item.image}
					<img src={item.image} alt="" />
				{/if}
			</a>
			<div class="line-item-details">
				<a href={item.href} class="line-item-name">{item.name}</a>
				<p class="line-item-variant">{item.variant}</p>
				<div class="line-item-actions">
					<div class="quantity-controls">
						<button
							type="button"
							class="qty-btn"
							onclick={() => onChangeQuantity(item.lineId, -1)}
							aria-label="Decrease quantity">−</button
						>
						<span class="qty-value">{item.quantity}</span>
						<button
							type="button"
							class="qty-btn"
							onclick={() => onChangeQuantity(item.lineId, 1)}
							aria-label="Increase quantity">+</button
						>
					</div>
					<button
						type="button"
						class="remove-btn"
						onclick={() => onRemove(item.lineId)}
						aria-label="Remove item"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line
								x1="10"
								y1="11"
								x2="10"
								y2="17"
							/><line x1="14" y1="11" x2="14" y2="17" /></svg
						>
					</button>
				</div>
			</div>
			<p class="line-item-total">${(item.priceValue * item.quantity).toFixed(2)}</p>
		</li>
	{/each}
</ul>

<style>
	.line-items {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.line-item {
		display: grid;
		grid-template-columns: 96px 1fr auto;
		gap: 1.25rem;
		align-items: start;
		padding: 1.5rem 0;
		border-bottom: 1px solid #eee;
	}
	.line-item:last-child {
		border-bottom: none;
	}
	.line-item-image {
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
		background: #f5f0eb;
		display: block;
	}
	.line-item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.line-item-details {
		min-width: 0;
	}
	.line-item-name {
		font-weight: 600;
		font-size: 1rem;
		margin: 0 0 0.25rem;
		color: #1a1a1a;
		text-decoration: none;
		display: block;
	}
	.line-item-name:hover {
		text-decoration: underline;
	}
	.line-item-variant {
		font-size: 0.875rem;
		color: #666;
		margin: 0 0 0.75rem;
	}
	.line-item-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.quantity-controls {
		display: flex;
		align-items: center;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
	}
	.qty-btn {
		width: 32px;
		height: 32px;
		background: #fff;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		color: #1a1a1a;
	}
	.qty-btn:hover {
		background: #f5f5f5;
	}
	.qty-value {
		min-width: 2rem;
		text-align: center;
		font-size: 0.875rem;
	}
	.remove-btn {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: #666;
	}
	.remove-btn:hover {
		color: #1a1a1a;
	}
	.line-item-total {
		font-weight: 600;
		font-size: 1rem;
		margin: 0;
		color: #1a1a1a;
	}
	@media (max-width: 640px) {
		.line-item {
			grid-template-columns: 72px 1fr;
			gap: 0.75rem;
		}
		.line-item-total {
			grid-column: 2;
			text-align: right;
		}
	}
</style>
