<script lang="ts">
	interface Props {
		src: string;
		alt?: string;
		class?: string;
	}
	let { src, alt = '', class: className = '' }: Props = $props();
</script>

{#if src}
	<img
		{src}
		{alt}
		class={className}
		onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
	/>
{/if}
