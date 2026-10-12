<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-number-animation
   * @summary 数字动画组件，在数值之间平滑过渡。
   *
   * @slot prefixSnippet - 数字前的内容（例如货币符号）。
   * @slot suffixSnippet - 数字后的内容（例如单位文本）。
   *
   * @event mac-number-animation-start - 动画开始时触发。`detail: { from, to }`
   * @event mac-number-animation-finish - 动画结束时触发。`detail: { value }`
   */

  type EasingFn = (t: number) => number

  const EASING_MAP: Record<string, EasingFn> = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  }

  interface Props {
    /** 动画目标值。 */
    to?: number
    /** 起始值。 */
    from?: number
    /** 动画时长（毫秒）。 */
    duration?: number
    /** 小数位数。 */
    precision?: number
    /** 千位分隔符字符。 */
    separator?: string
    /** 缓动函数名称。 */
    easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
    /** 挂载时是否自动开始动画。 */
    autoplay?: boolean
    /** 前缀文本（替代插槽）。 */
    prefix?: string
    /** 后缀文本（替代插槽）。 */
    suffix?: string
    /** 组件尺寸。 */
    size?: MacSize
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 动画完成时的回调（可作为属性设置）。 */
    onFinish?: (value: number) => void
    /** 数字前内容（优先于 prefix 文本）。 */
    prefixSnippet?: Snippet
    /** 数字后内容（优先于 suffix 文本）。 */
    suffixSnippet?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    to = 0,
    from = 0,
    duration = 2000,
    precision = 0,
    separator = '',
    easing = 'easeOut',
    autoplay = true,
    prefix = '',
    suffix = '',
    size = undefined,
    theme = undefined,
    onFinish = undefined,
    prefixSnippet,
    suffixSnippet,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLSpanElement | undefined = $state()
  let displayValue = $state(0)

  let rafId: number | null = null
  let startTime: number | null = null
  let isAnimating = false
  let mounted = false

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  /** 开始动画（对应 Lit 版 start 公开方法）。 */
  export function start(): void {
    stopAnimation()
    displayValue = from
    startTime = null
    isAnimating = true
    emit('mac-number-animation-start', { from, to })
    rafId = requestAnimationFrame(animate)
  }

  /** 重置到起始值。 */
  export function reset(): void {
    stopAnimation()
    displayValue = from
    isAnimating = false
  }

  function stopAnimation(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    isAnimating = false
  }

  function animate(timestamp: number): void {
    if (startTime === null) {
      startTime = timestamp
    }

    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easingFn = EASING_MAP[easing] || EASING_MAP.easeOut
    const easedProgress = easingFn(progress)

    displayValue = from + (to - from) * easedProgress

    if (progress < 1) {
      rafId = requestAnimationFrame(animate)
    } else {
      displayValue = to
      isAnimating = false
      emit('mac-number-animation-finish', { value: to })
      onFinish?.(to)
    }
  }

  // 挂载：autoplay 从 from 开始动画，否则直接显示 to
  $effect(() => {
    if (autoplay) {
      displayValue = from
      const raf = requestAnimationFrame(() => start())
      return () => {
        cancelAnimationFrame(raf)
        stopAnimation()
      }
    }
    displayValue = to
  })

  // `to` / `from` 变化时重新动画（跳过首次，与 Lit updated 行为一致）
  $effect(() => {
    void to
    void from
    if (!mounted) {
      mounted = true
      return
    }
    if (autoplay && !isAnimating) {
      start()
    }
  })

  function formatNumber(value: number): string {
    const fixed = value.toFixed(precision)
    if (!separator) return fixed

    const [intPart, decPart] = fixed.split('.')
    const formatted = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted
  }
</script>

<span
  bind:this={root}
  {...rest}
  class="mac-scope mac-number-animation number-animation"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if prefixSnippet}
    <span class="prefix">{@render prefixSnippet()}</span>
  {:else if prefix}
    <span class="prefix">{prefix}</span>
  {/if}

  <span class="value">{formatNumber(displayValue)}</span>

  {#if suffixSnippet}
    <span class="suffix">{@render suffixSnippet()}</span>
  {:else if suffix}
    <span class="suffix">{suffix}</span>
  {/if}
</span>

<style>
  .mac-number-animation {
    display: inline-flex;
    align-items: baseline;
    --md-number-animation-font-size: var(--md-font-size-display, 48px);
    --md-number-animation-color: var(--md-color-text);
    --md-number-animation-font-weight: 600;
    --md-number-animation-font-family: var(--md-font-family);
    --md-number-animation-prefix-color: var(--md-color-text-secondary);
    --md-number-animation-suffix-color: var(--md-color-text-secondary);
  }

  .number-animation {
    display: inline-flex;
    align-items: baseline;
    font-variant-numeric: tabular-nums;
  }

  .prefix,
  .suffix {
    font-size: calc(var(--md-number-animation-font-size) * 0.45);
    color: var(--md-number-animation-prefix-color);
    font-weight: 400;
  }

  .suffix {
    color: var(--md-number-animation-suffix-color);
  }

  .value {
    font-size: var(--md-number-animation-font-size);
    font-weight: var(--md-number-animation-font-weight);
    font-family: var(--md-number-animation-font-family);
    color: var(--md-number-animation-color);
    line-height: 1;
    letter-spacing: -0.02em;
  }

  /* ─── 尺寸：sm ─── */

  .mac-number-animation[data-size='sm'] {
    --md-number-animation-font-size: var(--md-font-size-xl, 24px);
  }

  /* ─── 尺寸：md ─── */

  .mac-number-animation[data-size='md'] {
    --md-number-animation-font-size: var(--md-font-size-display, 48px);
  }

  /* ─── 尺寸：lg ─── */

  .mac-number-animation[data-size='lg'] {
    --md-number-animation-font-size: var(--md-font-size-hero, 72px);
  }

  /* ─── 深色模式 ─── */

  .mac-number-animation[data-theme='dark'] {
    --md-number-animation-color: rgba(255, 255, 255, 0.92);
    --md-number-animation-prefix-color: rgba(255, 255, 255, 0.55);
    --md-number-animation-suffix-color: rgba(255, 255, 255, 0.55);
  }

  .mac-number-animation[data-theme='light'] {
    --md-number-animation-color: var(--md-color-text);
    --md-number-animation-prefix-color: var(--md-color-text-secondary);
    --md-number-animation-suffix-color: var(--md-color-text-secondary);
  }
</style>
