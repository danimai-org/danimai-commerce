<script lang="ts">
    let {
        title = "Built for the in-between",
        text = "Essentials is built for the in-between moments – the walk to the studio, the coffee after training, the quiet hours at home.",
        ctaHref = "/about",
        ctaLabel = "Our Story →",
    }: {
        title?: string;
        text?: string;
        ctaHref?: string;
        ctaLabel?: string;
    } = $props();
</script>

<section class="section story-section">
    <div class="story-image">
        <img
            src="https://cdn.mignite.app/ws/works_01KGFKTHDC6ZD3WS7GQTX8992N/nano_banana_pro_20260204_141238_1-01KGMCQQ1KXNTY3K55VA3T84KE.png"
            alt=""
        />
    </div>
    <div class="story-content">
        <h2 class="story-title">{title}</h2>
        <p class="story-text">{text}</p>
        <a href={ctaHref} class="story-cta">{ctaLabel}</a>
    </div>
</section>
