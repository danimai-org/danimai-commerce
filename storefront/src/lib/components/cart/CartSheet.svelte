<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart';
	import type { CartLineItem } from '$lib/stores/cart';

	let cartState = $state({ open: false, items: [] as CartLineItem[] });
	$effect(() => {
		const unsub = cart.subscribe((s) => {
			cartState = { open: s.open, items: s.items };
		});
		return unsub;
	});
	$effect(() => {
		if (!cartState.open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') cart.close();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	});

	const subtotal = $derived(
		cartState.items.reduce((sum, i) => sum + i.priceValue * i.quantity, 0)
	);
	const subtotalDisplay = $derived(`$${subtotal.toFixed(2)}`);

	function handleClose() {
		cart.close();
	}

	function goToCart() {
		cart.close();
		goto('/cart');
	}
</script>

{#if cartState.open}
	<div
		class="backdrop"
		onclick={handleClose}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClose()}
		role="button"
		tabindex="-1"
		aria-label="Close cart"
	></div>
	<div class="sheet" role="dialog" aria-label="Shopping Cart">
		<header class="sheet-header">
			<h2 class="sheet-title">Shopping Cart</h2>
			<button type="button" class="sheet-close" onclick={handleClose} aria-label="Close">×</button>
		</header>
		<div class="sheet-body">
			{#if cartState.items.length === 0}
				<p class="empty">Your cart is empty.</p>
			{:else}
				<ul class="line-items">
					{#each cartState.items as item (item.key)}
						<li class="line-item">
							<div class="line-item-image" style="background-color: #f5f0eb;">
								{#if item.image}
									<img src={item.image} alt="" />
								{/if}
							</div>
							<div class="line-item-details">
								<p class="line-item-name">{item.name}</p>
								<p class="line-item-variant">{item.variant}</p>
								<div class="line-item-actions">
									<div class="quantity-controls">
										<button type="button" class="qty-btn" onclick={() => cart.updateQuantity(item.key, -1)} aria-label="Decrease quantity">−</button>
										<span class="qty-value">{item.quantity}</span>
										<button type="button" class="qty-btn" onclick={() => cart.updateQuantity(item.key, 1)} aria-label="Increase quantity">+</button>
									</div>
									<button type="button" class="remove-btn" onclick={() => cart.removeItem(item.key)} aria-label="Remove item">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
									</button>
								</div>
							</div>
							<p class="line-item-total">${(item.priceValue * item.quantity).toFixed(2)}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if cartState.items.length > 0}
			<footer class="sheet-footer">
				<div class="subtotal-row">
					<span>Subtotal</span>
					<strong>{subtotalDisplay}</strong>
				</div>
				<button type="button" class="go-to-cart" onclick={goToCart}>Go to cart</button>
			</footer>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 1000;
	}
	.sheet {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		max-width: 420px;
		background: #fff;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
		z-index: 1001;
		display: flex;
		flex-direction: column;
	}
	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #eee;
	}
	.sheet-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
	}
	.sheet-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: #1a1a1a;
		padding: 0.25rem;
	}
	.sheet-body {
		flex: 1;
		overflow: auto;
		padding: 1rem 1.5rem;
	}
	.empty {
		color: #666;
		text-align: center;
		padding: 2rem;
		margin: 0;
	}
	.line-items {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.line-item {
		display: grid;
		grid-template-columns: 72px 1fr auto;
		gap: 0.75rem;
		align-items: start;
		padding: 1rem 0;
		border-bottom: 1px solid #f0f0f0;
	}
	.line-item:last-child {
		border-bottom: none;
	}
	.line-item-image {
		aspect-ratio: 1;
		border-radius: 6px;
		overflow: hidden;
		background: #f5f0eb;
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
		font-size: 0.9375rem;
		margin: 0 0 0.25rem;
	}
	.line-item-variant {
		font-size: 0.8125rem;
		color: #666;
		margin: 0 0 0.5rem;
	}
	.line-item-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.quantity-controls {
		display: flex;
		align-items: center;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
	}
	.qty-btn {
		width: 28px;
		height: 28px;
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
		min-width: 1.5rem;
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
		font-size: 0.9375rem;
		margin: 0;
	}
	.sheet-footer {
		padding: 1.25rem 1.5rem;
		border-top: 1px solid #eee;
	}
	.subtotal-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
		font-size: 0.9375rem;
	}
	.go-to-cart {
		width: 100%;
		background: #2d2d2d;
		color: #fff;
		border: none;
		padding: 0.875rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
	}
	.go-to-cart:hover {
		background: #1a1a1a;
	}
</style>
