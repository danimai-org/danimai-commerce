<script lang="ts">
    let {
        quantity = $bindable(1),
        min = 1,
        max = 99,
    }: { quantity?: number; min?: number; max?: number } = $props();
</script>

<div class="quantity-row">
    <span class="option-label">Quantity</span>
    <div class="quantity-control">
        <button
            type="button"
            class="qty-btn"
            onclick={() => (quantity = Math.max(min, quantity - 1))}
            aria-label="Decrease">−</button
        >
        <input
            type="number"
            bind:value={quantity}
            {min}
            {max}
            class="qty-input"
            aria-label="Quantity"
        />
        <button
            type="button"
            class="qty-btn"
            onclick={() => (quantity = Math.min(max, quantity + 1))}
            aria-label="Increase">+</button
        >
    </div>
</div>
