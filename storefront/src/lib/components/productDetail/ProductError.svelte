<script lang="ts">
	let { message = 'Product not found', backHref = '/' }: { message?: string; backHref?: string } = $props();
</script>

<div class="product-error">
	<p>{message}</p>
	<a href={backHref}>Back to home</a>
</div>
