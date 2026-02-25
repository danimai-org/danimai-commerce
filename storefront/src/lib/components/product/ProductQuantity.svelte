<script lang="ts">
	let { quantity = $bindable(1), min = 1, max = 99 }: { quantity?: number; min?: number; max?: number } = $props();
</script>

<div class="quantity-row">
	<span class="option-label">Quantity</span>
	<div class="quantity-control">
		<button type="button" class="qty-btn" onclick={() => (quantity = Math.max(min, quantity - 1))} aria-label="Decrease">−</button>
		<input type="number" bind:value={quantity} min={min} max={max} class="qty-input" aria-label="Quantity" />
		<button type="button" class="qty-btn" onclick={() => (quantity = Math.min(max, quantity + 1))} aria-label="Increase">+</button>
	</div>
</div>

<style>
	.quantity-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.option-label {
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #555;
		font-weight: 600;
	}
	.quantity-control {
		display: inline-flex;
		align-items: center;
		border: 1px solid #ccc;
		border-radius: 4px;
		width: fit-content;
	}
	.qty-btn {
		width: 40px;
		height: 40px;
		border: none;
		background: #f5f5f5;
		font-size: 1.25rem;
		cursor: pointer;
		line-height: 1;
	}
	.qty-btn:hover {
		background: #eee;
	}
	.qty-input {
		width: 48px;
		height: 40px;
		border: none;
		border-left: 1px solid #ccc;
		border-right: 1px solid #ccc;
		text-align: center;
		font-size: 0.9375rem;
	}
</style>
