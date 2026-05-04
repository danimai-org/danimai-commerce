<script lang="ts">
	let {
		posterSrc = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80',
		heading = 'Behind the fabric'
	}: {
		posterSrc?: string;
		heading?: string;
	} = $props();
</script>

<section class="video-section" aria-label={heading}>
	<div class="video-frame">
		<img src={posterSrc} alt="" class="video-poster" width="1600" height="900" />
		<button type="button" class="video-play" aria-label="Play video">
			<span class="video-play-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
			</span>
		</button>
	</div>
</section>
