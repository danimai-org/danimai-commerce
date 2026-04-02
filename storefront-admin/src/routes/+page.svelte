<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	goto(resolve('/products', {}), { replaceState: true });
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<a href={resolve('/products', {})}>Products</a>
