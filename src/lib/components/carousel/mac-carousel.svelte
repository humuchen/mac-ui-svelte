<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import { provideCarouselContext } from './carousel-context.svelte'

  /**
   * @tag mac-carousel
   * @summary 用于循环展示内容的轮播组件。
   *
   * @slot children - 用于放置 MacCarouselItem 的默认内容。
   *
   * @event mac-carousel-change - 当前幻灯片变化时触发。`detail: { index: number, fromIndex: number }`
   */

  interface Props {
    /** 默认激活的幻灯片索引（非受控模式）。 */
    defaultIndex?: number
    /** 是否自动播放。 */
    autoplay?: boolean
    /** 自动播放间隔，单位为毫秒。 */
    interval?: number
    /** 是否循环播放。 */
    loop?: boolean
    /** 滑动方向。 */
    direction?: 'horizontal' | 'vertical'
    /** 过渡效果。 */
    effect?: 'slide' | 'fade' | 'custom'
    /** 每次显示的幻灯片数量。 */
    slidesPerView?: number
    /** 是否显示导航箭头。 */
    showArrow?: boolean
    /** 是否显示指示器圆点。 */
    showDots?: boolean
    /** 指示器圆点样式。 */
    dotType?: 'dot' | 'line'
    /** 指示器圆点的位置。 */
    dotPosition?: 'top' | 'bottom' | 'left' | 'right'
    /** 轮播是否可拖拽。 */
    draggable?: boolean
    /** 是否支持键盘导航。 */
    keyboard?: boolean
    /** 是否支持鼠标滚轮导航。 */
    wheel?: boolean
    /** 幻灯片过渡时长，单位为毫秒。 */
    transitionDuration?: number
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 组件尺寸（对齐 BaseElement）。 */
    size?: MacSize
    /** 幻灯片内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    defaultIndex = 0,
    autoplay = false,
    interval = 5000,
    loop = true,
    direction = 'horizontal',
    effect: effectName = 'slide',
    slidesPerView = 1,
    showArrow = true,
    showDots = true,
    dotType = 'dot',
    dotPosition = 'bottom',
    draggable = false,
    keyboard = false,
    wheel = false,
    transitionDuration = 300,
    theme = undefined,
    size = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let track: HTMLDivElement | undefined = $state()
  let activeIndex = $state(0)
  let slides = $state<number[]>([])
  let slideIdSeq = 0
  let isDragging = $state(false)
  let dragOffset = $state(0)

  let autoplayTimer: ReturnType<typeof setInterval> | null = null
  let dragStartPos = 0
  let dragStartIndex = 0
  let isWheeling = false

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  provideCarouselContext({
    get slides() {
      return slides
    },
    registerSlide() {
      const id = ++slideIdSeq
      // 延迟到微任务：避免在子组件 effect 上下文中写父组件状态
      queueMicrotask(() => {
        slides = [...slides, id]
      })
      return id
    },
    unregisterSlide(id) {
      queueMicrotask(() => {
        slides = slides.filter((s) => s !== id)
      })
    },
    get activeIndex() {
      return activeIndex
    },
  })

  const slideCount = $derived(slides.length)

  // 初始化索引
  $effect(() => {
    if (defaultIndex > 0) {
      activeIndex = Math.min(defaultIndex, Math.max(0, slideCount - 1))
    }
  })

  function goTo(index: number) {
    const count = slideCount
    if (count <= 0) return

    let target = index
    if (loop) {
      if (target < 0) target = count - 1
      if (target >= count) target = 0
    } else {
      target = Math.max(0, Math.min(count - 1, target))
    }

    const fromIndex = activeIndex
    // 非循环模式在两端时导航为空操作
    if (target === fromIndex) return

    activeIndex = target
    emit('mac-carousel-change', { index: target, fromIndex })
  }

  /** 跳转到指定幻灯片（公开方法）。 */
  export function setIndex(index: number) {
    goTo(index)
  }

  function prev() {
    goTo(activeIndex - 1)
  }

  function next() {
    goTo(activeIndex + 1)
  }

  // 自动播放
  $effect(() => {
    if (autoplay && slideCount > 1) {
      autoplayTimer = setInterval(() => {
        next()
      }, interval)
      return () => {
        if (autoplayTimer) {
          clearInterval(autoplayTimer)
          autoplayTimer = null
        }
      }
    }
  })

  // 变换位置
  $effect(() => {
    void activeIndex
    void slidesPerView
    void dragOffset
    applyTransform()
  })

  function applyTransform() {
    if (!track) return
    if (effectName === 'fade' || effectName === 'custom') {
      track.style.transform = ''
      track.style.transition = ''
      return
    }
    const index = activeIndex
    const offset = isDragging ? dragOffset : 0
    const step = 100 / slidesPerView

    if (direction === 'horizontal') {
      const translateX = -(index * step) + offset
      track.style.transform = `translateX(${translateX}%)`
    } else {
      const translateY = -(index * step) + offset
      track.style.transform = `translateY(${translateY}%)`
    }

    if (isDragging) {
      track.style.transition = 'none'
    } else {
      track.style.transition = `transform ${transitionDuration}ms ease`
    }
  }

  function handleMouseEnter() {
    if (autoplay && autoplayTimer) {
      clearInterval(autoplayTimer)
      autoplayTimer = null
    }
  }

  function handleMouseLeave() {
    if (isDragging) {
      endDrag()
    }
  }

  /* ─── 拖拽 ─── */

  function startDrag(clientPos: number) {
    if (!draggable || slideCount <= 1 || effectName === 'fade') return
    isDragging = true
    dragStartPos = clientPos
    dragStartIndex = activeIndex
    dragOffset = 0
    applyTransform()
  }

  function moveDrag(clientPos: number) {
    if (!isDragging || !root) return
    const rect = root.getBoundingClientRect()
    const rectSize = direction === 'horizontal' ? rect.width : rect.height
    if (rectSize === 0) return
    const delta = clientPos - dragStartPos
    dragOffset = (delta / rectSize) * 100
    applyTransform()
  }

  function endDrag() {
    if (!isDragging) return
    isDragging = false

    const threshold = 20
    if (dragOffset > threshold) {
      goTo(dragStartIndex - 1)
    } else if (dragOffset < -threshold) {
      goTo(dragStartIndex + 1)
    } else {
      goTo(dragStartIndex)
    }
    dragOffset = 0
    applyTransform()
  }

  function onPointerDown(e: PointerEvent) {
    if (!draggable) return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    startDrag(direction === 'horizontal' ? e.clientX : e.clientY)
  }

  function onPointerMove(e: PointerEvent) {
    moveDrag(direction === 'horizontal' ? e.clientX : e.clientY)
  }

  function onPointerUp() {
    endDrag()
  }

  /* ─── 键盘与滚轮 ─── */

  function handleKeydown(e: KeyboardEvent) {
    const isHorizontal = direction === 'horizontal'
    if ((isHorizontal && e.key === 'ArrowLeft') || (!isHorizontal && e.key === 'ArrowUp')) {
      e.preventDefault()
      prev()
    } else if (
      (isHorizontal && e.key === 'ArrowRight') ||
      (!isHorizontal && e.key === 'ArrowDown')
    ) {
      e.preventDefault()
      next()
    }
  }

  function handleWheel(e: WheelEvent) {
    if (!wheel || isWheeling) return
    e.preventDefault()

    const isHorizontal = direction === 'horizontal'
    const delta = isHorizontal ? e.deltaX : e.deltaY
    if (Math.abs(delta) < 20) return

    isWheeling = true
    if (delta > 0) {
      next()
    } else {
      prev()
    }

    setTimeout(() => {
      isWheeling = false
    }, transitionDuration + 100)
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-carousel"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
  data-direction={direction}
  data-dot-position={dotPosition}
  tabindex={keyboard ? 0 : undefined}
  onkeydown={keyboard ? handleKeydown : undefined}
  onwheel={wheel ? handleWheel : undefined}
>
  <div
    class="carousel"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onpointerdown={draggable ? onPointerDown : undefined}
    onpointermove={draggable ? onPointerMove : undefined}
    onpointerup={draggable ? onPointerUp : undefined}
  >
    <div bind:this={track} class="track track--{effectName}">
      {#if children}{@render children()}{/if}
    </div>
    {#if showArrow && slideCount > 1}
      <button
        class="arrow arrow--prev"
        type="button"
        aria-label="上一张幻灯片"
        onclick={prev}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {#if direction === 'vertical'}
            <path d="M12 19V5M5 12l7-7 7 7" />
          {:else}
            <path d="M15 18l-6-6 6-6" />
          {/if}
        </svg>
      </button>
      <button
        class="arrow arrow--next"
        type="button"
        aria-label="下一张幻灯片"
        onclick={next}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {#if direction === 'vertical'}
            <path d="M12 5v14M5 12l7 7 7-7" />
          {:else}
            <path d="M9 18l6-6-6-6" />
          {/if}
        </svg>
      </button>
    {/if}
    {#if showDots && slideCount > 1}
      <div class="dots">
        {#each Array.from({ length: slideCount }, (_, i) => i) as i (i)}
          <button
            class="dot dot--{dotType} {i === activeIndex ? 'dot--active' : ''}"
            type="button"
            aria-label="跳转到第 {i + 1} 张幻灯片"
            aria-current={i === activeIndex ? 'true' : 'false'}
            onclick={() => goTo(i)}
          ></button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .mac-carousel {
    display: block;
    position: relative;
    overflow: hidden;
    --mac-carousel-slides-per-view: 1;
  }

  .carousel {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* ─── 滑动效果 ─── */
  .track--slide {
    display: flex;
    width: 100%;
    height: 100%;
    will-change: transform;
  }

  .mac-carousel[data-direction='vertical'] .track--slide {
    flex-direction: column;
  }

  .track--slide :global(.mac-carousel-item) {
    flex-shrink: 0;
    width: calc(100% / var(--mac-carousel-slides-per-view));
    height: 100%;
  }

  .mac-carousel[data-direction='vertical'] .track--slide :global(.mac-carousel-item) {
    width: 100%;
    height: calc(100% / var(--mac-carousel-slides-per-view));
  }

  /* ─── 淡入淡出效果 ─── */
  .track--fade {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .track--fade :global(.mac-carousel-item) {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% / var(--mac-carousel-slides-per-view));
    height: 100%;
    opacity: 0;
    transition: opacity var(--md-transition-normal);
    z-index: 0;
  }

  .mac-carousel[data-direction='vertical'] .track--fade :global(.mac-carousel-item) {
    width: 100%;
    height: calc(100% / var(--mac-carousel-slides-per-view));
  }

  .track--fade :global(.mac-carousel-item.active) {
    opacity: 1;
    z-index: 1;
  }

  /* ─── 自定义效果 ─── */
  .track--custom {
    display: flex;
    width: 100%;
    height: 100%;
  }

  .mac-carousel[data-direction='vertical'] .track--custom {
    flex-direction: column;
  }

  .track--custom :global(.mac-carousel-item) {
    flex-shrink: 0;
    width: calc(100% / var(--mac-carousel-slides-per-view));
    height: 100%;
  }

  .mac-carousel[data-direction='vertical'] .track--custom :global(.mac-carousel-item) {
    width: 100%;
    height: calc(100% / var(--mac-carousel-slides-per-view));
  }

  /* ─── 箭头 ─── */
  .arrow {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--md-carousel-arrow-size);
    height: var(--md-carousel-arrow-size);
    border-radius: 50%;
    background: var(--md-carousel-arrow-bg);
    color: var(--md-carousel-arrow-color);
    border: none;
    cursor: pointer;
    opacity: 0.7;
    transition:
      opacity var(--md-transition-fast),
      background var(--md-transition-fast);
    z-index: 10;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    pointer-events: auto;
  }

  .arrow:hover {
    opacity: 1;
    background: var(--md-carousel-arrow-hover-bg);
  }

  .arrow:focus-visible {
    outline: 2px solid var(--md-color-primary);
    outline-offset: 2px;
  }

  .arrow :global(svg),
  .arrow svg {
    width: 18px;
    height: 18px;
  }

  /* 水平箭头 */
  .mac-carousel[data-direction='horizontal'] .arrow--prev {
    top: 50%;
    left: var(--md-carousel-arrow-offset);
    transform: translateY(-50%);
  }

  .mac-carousel[data-direction='horizontal'] .arrow--next {
    top: 50%;
    right: var(--md-carousel-arrow-offset);
    transform: translateY(-50%);
  }

  /* 垂直箭头 */
  .mac-carousel[data-direction='vertical'] .arrow--prev {
    top: var(--md-carousel-arrow-offset);
    left: 50%;
    transform: translateX(-50%);
  }

  .mac-carousel[data-direction='vertical'] .arrow--next {
    bottom: var(--md-carousel-arrow-offset);
    left: 50%;
    transform: translateX(-50%);
  }

  /* ─── 圆点 ─── */
  .dots {
    position: absolute;
    display: flex;
    align-items: center;
    gap: var(--md-carousel-dot-gap);
    z-index: 10;
  }

  .dot {
    cursor: pointer;
    transition: all var(--md-transition-fast);
    border: none;
    background: var(--md-carousel-dot-bg);
    padding: 0;
  }

  .dot:hover {
    background: var(--md-carousel-dot-hover-bg);
  }

  .dot--active {
    background: var(--md-carousel-dot-active-bg);
  }

  /* 圆点类型：圆点 */
  .dot--dot {
    width: var(--md-carousel-dot-size);
    height: var(--md-carousel-dot-size);
    border-radius: 50%;
  }

  .dot--dot.dot--active {
    width: var(--md-carousel-dot-active-width);
    border-radius: var(--md-carousel-dot-active-radius);
  }

  /* 圆点类型：线条 */
  .dot--line {
    width: var(--md-carousel-line-width);
    height: var(--md-carousel-line-height);
    border-radius: var(--md-carousel-line-radius);
  }

  .dot--line.dot--active {
    width: var(--md-carousel-line-active-width);
  }

  /* 水平方向的圆点位置 */
  .mac-carousel[data-direction='horizontal'][data-dot-position='top'] .dots {
    top: var(--md-carousel-dots-offset);
    left: 50%;
    transform: translateX(-50%);
  }

  .mac-carousel[data-direction='horizontal'][data-dot-position='bottom'] .dots {
    bottom: var(--md-carousel-dots-offset);
    left: 50%;
    transform: translateX(-50%);
  }

  .mac-carousel[data-direction='horizontal'][data-dot-position='left'] .dots {
    left: var(--md-carousel-dots-offset);
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
  }

  .mac-carousel[data-direction='horizontal'][data-dot-position='right'] .dots {
    right: var(--md-carousel-dots-offset);
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
  }

  /* 垂直方向的圆点位置 */
  .mac-carousel[data-direction='vertical'][data-dot-position='top'] .dots {
    top: var(--md-carousel-dots-offset);
    left: 50%;
    transform: translateX(-50%);
  }

  .mac-carousel[data-direction='vertical'][data-dot-position='bottom'] .dots {
    bottom: var(--md-carousel-dots-offset);
    left: 50%;
    transform: translateX(-50%);
  }

  .mac-carousel[data-direction='vertical'][data-dot-position='left'] .dots {
    left: var(--md-carousel-dots-offset);
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
  }

  .mac-carousel[data-direction='vertical'][data-dot-position='right'] .dots {
    right: var(--md-carousel-dots-offset);
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
  }
</style>
