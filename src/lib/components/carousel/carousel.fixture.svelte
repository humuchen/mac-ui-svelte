<script lang="ts">
  import MacCarousel from './mac-carousel.svelte'
  import MacCarouselItem from './mac-carousel-item.svelte'

  let {
    autoplay = false,
    interval = 5000,
    loop = true,
    showArrow = true,
    dotType = 'dot' as 'dot' | 'line',
    slidesCount = 3,
  } = $props()
</script>

<MacCarousel {autoplay} {interval} {loop} {showArrow} {dotType}>
  {#each Array.from({ length: slidesCount }, (_, i) => i) as i (i)}
    <MacCarouselItem>{String.fromCharCode(65 + i)}</MacCarouselItem>
  {/each}
</MacCarousel>
