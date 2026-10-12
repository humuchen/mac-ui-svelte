<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { CircleConfig, GradientConfig, GradientStop } from './progress-types'
  import {
    useMacConfig,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-progress
   * @summary 进度组件，用于显示完成状态。
   *
   * @slot text - 环形进度条中心的自定义文本。
   */

  interface Props {
    /** 当前进度百分比（0-100）。 */
    percentage?: number
    /** 进度指示器类型。 */
    type?: 'line' | 'circle'
    /** 进度状态。 */
    status?: 'default' | 'success' | 'warning' | 'error'
    /** 进度组件尺寸。 */
    size?: MacSize
    /** 是否显示百分比文本。 */
    showText?: boolean
    /** 进度是否处于处理状态（显示动画）。 */
    processing?: boolean
    /** 进度填充的自定义颜色。覆盖状态颜色。 */
    color?: string
    /** 环形进度条的描边宽度（像素）。 */
    strokeWidth?: number
    /** 环形进度条的宽度/高度（像素）。 */
    width?: number
    /** 多环配置的嵌套环形显示。 */
    circles?: CircleConfig[]
    /** 进度填充的渐变配置。 */
    gradient?: GradientConfig
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 环形进度条中心的自定义文本。 */
    text?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    percentage = 0,
    type = 'line',
    status = 'default',
    size = 'md',
    showText = true,
    processing = false,
    color = undefined,
    strokeWidth = 6,
    width = 120,
    circles = undefined,
    gradient = undefined,
    theme = undefined,
    text,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  const normalizedPercentage = $derived(Math.max(0, Math.min(100, percentage)))

  function hasGradient(): boolean {
    if (!gradient) return false
    if (gradient.stops && gradient.stops.length >= 2) return true
    return !!gradient.from && !!gradient.to
  }

  function getGradientId(index = 0): string {
    return `mac-progress-gradient-${index}`
  }

  function gradientStops(): GradientStop[] {
    const grad = gradient!
    if (grad.stops && grad.stops.length >= 2) return grad.stops
    return [
      { color: grad.from!, offset: 0 },
      { color: grad.to!, offset: 100 },
    ]
  }

  /** 线性进度条填充的行内样式。 */
  const lineFillStyle = $derived.by(() => {
    let fillStyle = ''
    if (hasGradient()) {
      const angle = gradient!.angle ?? 0
      const stopStr = gradientStops()
        .map((s) => `${s.color} ${s.offset ?? 0}%`)
        .join(', ')
      fillStyle = `background: linear-gradient(${angle}deg, ${stopStr})`
    } else if (color) {
      fillStyle = `background-color: ${color}`
    }
    return fillStyle
  })

  /** 多环几何参数。 */
  const multiCircle = $derived.by(() => {
    if (!circles || circles.length === 0) return null
    const gap = 4
    const padding = 2
    const strokeWidths = circles.map((c) => c.strokeWidth ?? strokeWidth)
    const radii: number[] = []
    radii[0] = (width - strokeWidths[0]) / 2 - padding
    for (let i = 1; i < circles.length; i++) {
      radii[i] = radii[i - 1] - strokeWidths[i - 1] / 2 - gap - strokeWidths[i] / 2
    }
    return circles.map((circle, index) => {
      const sw = strokeWidths[index]
      const r = radii[index]
      const c = 2 * Math.PI * r
      const pct = Math.max(0, Math.min(100, circle.percentage))
      const offset = c - (pct / 100) * c
      let strokeValue = ''
      if (circle.color) {
        strokeValue = circle.color
      } else if (hasGradient()) {
        strokeValue = `url(#${getGradientId(index)})`
      }
      // processing 动画仅作用于最内环（数组最后一个）
      const isProcessing = processing && index === circles!.length - 1
      return { sw, r, c, offset, strokeValue, isProcessing }
    })
  })

  /** 单环几何参数。 */
  const singleCircle = $derived.by(() => {
    const sw = strokeWidth
    const r = (width - sw) / 2
    const c = 2 * Math.PI * r
    const offset = c - (normalizedPercentage / 100) * c
    let strokeValue = ''
    if (hasGradient()) {
      strokeValue = `url(#${getGradientId(0)})`
    } else if (color) {
      strokeValue = color
    }
    return { sw, r, c, offset, strokeValue }
  })

  function gradientAngleCoords() {
    const angle = (gradient?.angle ?? 0) * (Math.PI / 180)
    return {
      x1: 50 - 50 * Math.cos(angle),
      y1: 50 - 50 * Math.sin(angle),
      x2: 50 + 50 * Math.cos(angle),
      y2: 50 + 50 * Math.sin(angle),
    }
  }
</script>

<div
  {...rest}
  class="mac-scope mac-progress"
  data-theme={resolvedTheme}
  data-size={size}
>
  {#if type === 'line'}
    <div class="progress-line progress-line--{size}">
      <div class="progress-line__track">
        <div
          class="progress-line__fill progress-line__fill--{status} {processing
            ? 'progress-line__fill--processing'
            : ''}"
          style="width: {processing ? '100%' : normalizedPercentage + '%'}; {lineFillStyle}"
        ></div>
      </div>
      {#if showText && !processing}
        <span class="progress-line__text">{normalizedPercentage}%</span>
      {/if}
    </div>
  {:else if circles && circles.length > 0}
    <div class="progress-circle" style="width: {width}px; height: {width}px;">
      <svg class="progress-circle__svg" width={width} height={width} viewBox="0 0 {width} {width}">
        <defs>
          {#if hasGradient()}
            {@const coord = gradientAngleCoords()}
            {#each circles as _, i}
              <linearGradient
                id={getGradientId(i)}
                x1="{coord.x1}%"
                y1="{coord.y1}%"
                x2="{coord.x2}%"
                y2="{coord.y2}%"
              >
                {#each gradientStops() as s}
                  <stop offset="{s.offset ?? 0}%" stop-color={s.color} />
                {/each}
              </linearGradient>
            {/each}
          {/if}
        </defs>
        {#each multiCircle as circle}
          <circle
            class="progress-circle__track"
            cx={width / 2}
            cy={width / 2}
            r={circle.r}
            stroke-width={circle.sw}
          />
          <circle
            class="progress-circle__fill {circle.isProcessing ? 'progress-circle__fill--processing' : ''}"
            cx={width / 2}
            cy={width / 2}
            r={circle.r}
            stroke-width={circle.sw}
            stroke-dasharray={circle.isProcessing
              ? circle.c * 0.25 + ' ' + circle.c * 0.75
              : circle.c}
            stroke-dashoffset={circle.isProcessing ? circle.c * 0.125 : circle.offset}
            stroke={circle.strokeValue}
            stroke-linecap="round"
          />
        {/each}
      </svg>
      {#if showText && !processing}
        <span class="progress-circle__text">
          {#if text}{@render text()}{:else}{normalizedPercentage}%{/if}
        </span>
      {/if}
    </div>
  {:else}
    <div class="progress-circle" style="width: {width}px; height: {width}px;">
      <svg class="progress-circle__svg" width={width} height={width} viewBox="0 0 {width} {width}">
        <defs>
          {#if hasGradient()}
            {@const coord = gradientAngleCoords()}
            <linearGradient
              id={getGradientId(0)}
              x1="{coord.x1}%"
              y1="{coord.y1}%"
              x2="{coord.x2}%"
              y2="{coord.y2}%"
            >
              {#each gradientStops() as s}
                <stop offset="{s.offset ?? 0}%" stop-color={s.color} />
              {/each}
            </linearGradient>
          {/if}
        </defs>
        <circle
          class="progress-circle__track"
          cx={width / 2}
          cy={width / 2}
          r={singleCircle.r}
          stroke-width={singleCircle.sw}
        />
        <circle
          class="progress-circle__fill progress-circle__fill--{status} {processing
            ? 'progress-circle__fill--processing'
            : ''}"
          cx={width / 2}
          cy={width / 2}
          r={singleCircle.r}
          stroke-width={singleCircle.sw}
          stroke-dasharray={processing
            ? singleCircle.c * 0.25 + ' ' + singleCircle.c * 0.75
            : singleCircle.c}
          stroke-dashoffset={processing ? singleCircle.c * 0.125 : singleCircle.offset}
          stroke={singleCircle.strokeValue}
        />
      </svg>
      {#if showText}
        <span class="progress-circle__text">
          {#if text}{@render text()}{:else}{normalizedPercentage}%{/if}
        </span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .mac-progress {
    display: block;
    font-family: var(--md-font-family);
  }

  /* ═══════════════════════════════════════════════════
     线性进度条
     ═══════════════════════════════════════════════════ */
  .progress-line {
    display: flex;
    align-items: center;
    gap: var(--md-progress-text-gap);
    width: 100%;
  }

  .progress-line--sm {
    --_progress-height: var(--sm-progress-height);
    --_progress-font-size: var(--sm-progress-font-size);
  }

  .progress-line--md {
    --_progress-height: var(--md-progress-height);
    --_progress-font-size: var(--md-progress-font-size);
  }

  .progress-line--lg {
    --_progress-height: var(--lg-progress-height);
    --_progress-font-size: var(--lg-progress-font-size);
  }

  .progress-line__track {
    flex: 1;
    height: var(--_progress-height);
    background-color: var(--md-progress-track-bg);
    border-radius: var(--md-progress-radius);
    overflow: hidden;
  }

  .progress-line__fill {
    height: 100%;
    border-radius: var(--md-progress-radius);
    background-color: var(--md-progress-fill-default);
    transition: width var(--md-transition-normal);
  }

  .progress-line__fill--success {
    background-color: var(--md-progress-fill-success);
  }

  .progress-line__fill--warning {
    background-color: var(--md-progress-fill-warning);
  }

  .progress-line__fill--error {
    background-color: var(--md-progress-fill-error);
  }

  .progress-line__text {
    font-size: var(--_progress-font-size);
    color: var(--md-progress-text-color);
    min-width: var(--md-progress-text-min-width);
    text-align: right;
    white-space: nowrap;
  }

  /* 线性进度条的处理动画 */
  .progress-line__fill--processing {
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 24px 24px;
    animation: progress-line-stripes 1s linear infinite;
  }

  @keyframes progress-line-stripes {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 24px 0;
    }
  }

  /* ═══════════════════════════════════════════════════
     环形进度条
     ═══════════════════════════════════════════════════ */
  .progress-circle {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .progress-circle__svg {
    transform: rotate(-90deg);
  }

  .progress-circle__track {
    fill: none;
    stroke: var(--md-progress-track-bg);
  }

  .progress-circle__fill {
    fill: none;
    stroke: var(--md-progress-fill-default);
    transition: stroke-dashoffset var(--md-transition-normal);
    stroke-linecap: round;
  }

  .progress-circle__fill--success {
    stroke: var(--md-progress-fill-success);
  }

  .progress-circle__fill--warning {
    stroke: var(--md-progress-fill-warning);
  }

  .progress-circle__fill--error {
    stroke: var(--md-progress-fill-error);
  }

  .progress-circle__text {
    position: absolute;
    font-size: var(--md-progress-circle-text-size);
    color: var(--md-progress-text-color);
    font-weight: var(--md-progress-circle-text-weight);
  }

  /* 环形进度条的处理动画 */
  .progress-circle__fill--processing {
    animation: progress-circle-spin 2s linear infinite;
    transform-origin: center;
  }

  @keyframes progress-circle-spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
