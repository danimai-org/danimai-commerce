<script lang="ts">
    import { formatStoreMoney } from "$lib/money";

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
        onRemove,
    }: {
        items: CartRowView[];
        onChangeQuantity: (lineId: string, delta: number) => void;
        onRemove: (lineId: string) => void;
    } = $props();
</script>

<ul class="cart-line-items-ul line-items">
    {#each items as item (item.key)}
        <li class="line-item">
            <a
                href={item.href}
                class="line-item-image"
                style="background-color: #f5f0eb;"
            >
                {#if item.image}
                    <img src={item.image} alt="" />
                {/if}
            </a>
            <div class="line-item-details">
                <a href={item.href} class="line-item-name">{item.name}</a>
                {#if item.variant}
                    <p class="line-item-variant">{item.variant}</p>
                {/if}
                <div class="line-item-actions">
                    <div class="quantity-controls">
                        <button
                            type="button"
                            class="qty-btn"
                            disabled={item.quantity <= 1}
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
                            ><path
                                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                            /><line x1="10" y1="11" x2="10" y2="17" /><line
                                x1="14"
                                y1="11"
                                x2="14"
                                y2="17"
                            /></svg
                        >
                    </button>
                </div>
            </div>
            <p class="line-item-total">
                {formatStoreMoney(item.priceValue * item.quantity)}
            </p>
        </li>
    {/each}
</ul>
