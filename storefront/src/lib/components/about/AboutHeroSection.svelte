<script lang="ts">
    let {
        title = "Our Story",
        subtitle = "Movement-focused design for a life in motion",
        imageSrc = "https://cdn.mignite.app/ws/works_01KGFKTHDC6ZD3WS7GQTX8992N/generated-01KGHSDPQM7Z6D9PGFG9E15S5P-01KGHSDPQMZFXQV23Z6NVYBARS.jpeg",
    }: {
        title?: string;
        subtitle?: string;
        imageSrc?: string;
    } = $props();
</script>

<section class="about-hero">
    <div
        class="about-hero-bg"
        style="background-image: url('{imageSrc}');"
    ></div>
    <div class="about-hero-overlay"></div>
    <div class="about-hero-content">
        <h1 class="about-hero-title">{title}</h1>
        <p class="about-hero-subtitle">{subtitle}</p>
    </div>
</section>
