<script lang="ts">
  import type { Snippet } from 'svelte'
  import { useCarouselContext } from './carousel-context.svelte'

  /**
   * @tag mac-carousel-item
   * @summary MacCarousel 的幻灯片项。
   */

  interface Props {
    /** 幻灯片内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let { children, ...rest }: Props = $props()

  const carousel = useCarouselContext()
  let slideId = -1

  // 注册/注销幻灯片
  $effect(() => {
    if (!carousel) return
    slideId = carousel.registerSlide()
    return () => carousel.unregisterSlide(slideId)
  })

  /** 当前项索引（fade 效果的 active 类使用）。 */
  const index = $derived(carousel ? carousel.slides.indexOf(slideId) : -1)
</script>

<div
  {...rest}
  class="mac-carousel-item {index === carousel?.activeIndex ? 'active' : ''}"
>
  {#if children}{@render children()}{/if}
</div>

<style>
  .mac-carousel-item {
    display: block;
    flex-shrink: 0;
    width: 100%;
    height: 100%;
  }
</style>
