<script lang="ts">
    let {
        title = "Crafted for Movement",
        text = "Founded in Copenhagen, Essentials emerged from a simple truth: movement is life, and life demands clothing that adapts. We design for the body in motion—breathable, durable, and effortlessly versatile. Every seam and fabric choice serves your daily rhythm.",
        ctaHref = "/about",
        ctaLabel = "OUR STORY →",
    }: {
        title?: string;
        text?: string;
        ctaHref?: string;
        ctaLabel?: string;
    } = $props();
</script>

<section class="about-crafted">
    <div class="about-crafted-image"></div>
    <div class="about-crafted-content">
        <h2 class="about-crafted-title">{title}</h2>
        <p class="about-crafted-text">{text}</p>
        <a href={ctaHref} class="about-crafted-cta">{ctaLabel}</a>
    </div>
</section>

