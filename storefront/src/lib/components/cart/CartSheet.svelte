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
			<h2 class="sheet-title">Shopping cart</h2>
			<button type="button" class="sheet-close" onclick={handleClose} aria-label="Close">×</button>
		</header>
		<div class="sheet-body">
			{#if cartState.items.length === 0}
				<p class="empty">Your cart is empty.</p>
			{:else}
				<ul class="line-items">
					{#each cartState.items as item (item.key)}
						<li class="line-card">
							<div class="line-card-media">
								{#if item.image}
									<img src={item.image} alt="" />
								{/if}
							</div>
							<div class="line-card-body">
								<p class="line-card-title">{item.name}</p>
								<p class="line-card-meta">{item.variant}</p>
								<p class="line-card-price">
									<span class="line-card-price-label">Price</span>
									<span class="line-card-price-value">{item.priceDisplay}</span>
									<span class="line-card-qty-label">× {item.quantity}</span>
								</p>
								<p class="line-card-line-total">
									<span class="line-card-line-total-label">Line total</span>
									<strong>${(item.priceValue * item.quantity).toFixed(2)}</strong>
								</p>
								<div class="line-card-actions">
									<div class="quantity-controls">
										<button type="button" class="qty-btn" onclick={() => cart.updateQuantity(item.key, -1)} aria-label="Decrease quantity">−</button>
										<span class="qty-value">{item.quantity}</span>
										<button type="button" class="qty-btn" onclick={() => cart.updateQuantity(item.key, 1)} aria-label="Increase quantity">+</button>
									</div>
									<button type="button" class="remove-btn" onclick={() => cart.removeItem(item.key)} aria-label="Remove item">
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
									</button>
								</div>
							</div>
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
				<button type="button" class="go-to-cart" onclick={goToCart}>View cart</button>
			</footer>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.35);
		z-index: 1000;
	}
	.sheet {
		--cart-bg: #ffffff;
		--cart-border: #e0e0e0;
		--cart-text: #000000;
		--cart-muted: #757575;
		--cart-accent: #6b6b40;
		--cart-accent-hover: #5a5a36;
		--cart-radius: 10px;
		--cart-radius-sm: 8px;
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		max-width: 420px;
		background: #fafafa;
		box-shadow: -4px 0 28px rgba(0, 0, 0, 0.12);
		z-index: 1001;
		display: flex;
		flex-direction: column;
	}
	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		background: var(--cart-bg);
		border-bottom: 1px solid var(--cart-border);
	}
	.sheet-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
		color: var(--cart-text);
	}
	.sheet-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: var(--cart-accent);
		padding: 0.25rem;
		border-radius: var(--cart-radius-sm);
	}
	.sheet-close:hover {
		background: rgba(107, 107, 64, 0.08);
		color: var(--cart-accent-hover);
	}
	.sheet-body {
		flex: 1;
		overflow: auto;
		padding: 1rem 1.25rem;
	}
	.empty {
		color: var(--cart-muted);
		text-align: center;
		padding: 2rem;
		margin: 0;
		font-size: 0.9375rem;
	}
	.line-items {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.line-card {
		display: grid;
		grid-template-columns: 100px 1fr;
		gap: 0;
		border: 1px solid var(--cart-border);
		border-radius: var(--cart-radius);
		overflow: hidden;
		background: var(--cart-bg);
	}
	.line-card-media {
		aspect-ratio: 1;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		border-right: 1px solid var(--cart-border);
	}
	.line-card-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.line-card-body {
		min-width: 0;
		padding: 0.875rem 0.875rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.line-card-title {
		font-weight: 700;
		font-size: 0.875rem;
		line-height: 1.35;
		margin: 0;
		color: var(--cart-text);
	}
	.line-card-meta {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--cart-muted);
		margin: 0;
	}
	.line-card-price {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--cart-text);
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.4rem;
	}
	.line-card-price-label {
		font-weight: 400;
	}
	.line-card-price-value {
		font-weight: 700;
	}
	.line-card-qty-label {
		font-size: 0.75rem;
		color: var(--cart-muted);
		font-weight: 500;
	}
	.line-card-line-total {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--cart-text);
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.line-card-line-total-label {
		color: var(--cart-muted);
		font-size: 0.75rem;
	}
	.line-card-line-total strong {
		font-weight: 700;
	}
	.line-card-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 0.35rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--cart-border);
	}
	.quantity-controls {
		display: flex;
		align-items: center;
		border: 1px solid var(--cart-border);
		border-radius: var(--cart-radius-sm);
		overflow: hidden;
		background: #fff;
	}
	.qty-btn {
		width: 32px;
		height: 32px;
		background: #fff;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		color: var(--cart-accent);
		font-weight: 600;
	}
	.qty-btn:hover {
		background: rgba(107, 107, 64, 0.08);
	}
	.qty-value {
		min-width: 1.5rem;
		text-align: center;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--cart-text);
	}
	.remove-btn {
		background: none;
		border: none;
		padding: 0.3rem;
		cursor: pointer;
		color: var(--cart-accent);
		border-radius: var(--cart-radius-sm);
	}
	.remove-btn:hover {
		color: var(--cart-accent-hover);
		background: rgba(107, 107, 64, 0.08);
	}
	.sheet-footer {
		padding: 1.25rem 1.5rem;
		background: var(--cart-bg);
		border-top: 1px solid var(--cart-border);
	}
	.subtotal-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
		font-size: 0.9375rem;
		color: var(--cart-text);
	}
	.subtotal-row strong {
		font-weight: 700;
	}
	.go-to-cart {
		width: 100%;
		background: var(--cart-accent);
		color: #fff;
		border: none;
		padding: 0.875rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 700;
		border-radius: var(--cart-radius-sm);
		cursor: pointer;
	}
	.go-to-cart:hover {
		background: var(--cart-accent-hover);
	}
</style>
