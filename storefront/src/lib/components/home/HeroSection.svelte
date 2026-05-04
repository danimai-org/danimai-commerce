<script lang="ts">
	let {
		title = 'Movement, simplified.',
		subtitle = 'Scandinavian-inspired athleisure designed for everyday balance.',
		ctaHref = '/collections/core-essentials',
		ctaLabel = 'SHOP CORE DENIMAI →',
		videoSrc = 'https://cdn.mignite.app/ws/works_01KGFKTHDC6ZD3WS7GQTX8992N/Bring_a_bit_202602041404_u6uf6-01KGMC3H3BPBGYA1KXAMFFT0AM.mp4'
	} = $props();
</script>

<main class="hero">
	<div class="hero-bg">
		<video class="hero-video" autoplay muted loop playsinline aria-hidden="true">
			<source src={videoSrc} type="video/mp4" />
		</video>
	</div>
	<div class="hero-content">
		<h1 class="hero-title">{title}</h1>
		<p class="hero-subtitle">{subtitle}</p>
		<a href={ctaHref} class="hero-cta">{ctaLabel}</a>
	</div>
</main>
