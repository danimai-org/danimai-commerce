<script lang="ts">
	let { message = 'Product not found', backHref = '/' }: { message?: string; backHref?: string } = $props();
</script>

<div class="product-error">
	<p>{message}</p>
	<a href={backHref}>Back to home</a>
</div>

<style>
	.product-error {
		max-width: 600px;
		margin: 4rem auto;
		padding: 2rem;
		text-align: center;
	}
	.product-error p {
		margin: 0 0 1rem;
		color: #1a1a1a;
	}
	.product-error a {
		color: #1a1a1a;
		text-decoration: underline;
	}
</style>
