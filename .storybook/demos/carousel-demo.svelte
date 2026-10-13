<script lang="ts">
  import { MacCarousel, MacCarouselItem } from '../../src/lib/index'

  /** 演示用幻灯片（渐变背景 + 文案，避免外链图片依赖）。 */
  const slides = [
    { title: '第一屏', desc: 'slide 过渡效果', from: '#0a84ff', to: '#5e5ce6' },
    { title: '第二屏', desc: 'fade 过渡效果', from: '#bf5af2', to: '#ff375f' },
    { title: '第三屏', desc: '自定义内容', from: '#ff9f0a', to: '#ff453a' },
  ]
</script>

<MacCarousel autoplay={false} showArrow showDots>
  {#each slides as slide, i (i)}
    <MacCarouselItem>
      <div
        class="slide"
        style="background: linear-gradient(135deg, {slide.from}, {slide.to});"
      >
        <strong>{slide.title}</strong>
        <span>{slide.desc}</span>
      </div>
    </MacCarouselItem>
  {/each}
</MacCarousel>

<style>
  .slide {
    display: flex;
    height: 240px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 12px;
    color: #fff;
    font-size: 18px;
  }
</style>
