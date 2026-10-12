<script lang="ts">
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-rating
   * @summary macOS 风格的评分组件，支持自定义图标。
   *
   * @event mac-rating-change - 评分值变化时触发。`detail: { value: number }`
   */

  import type { RatingIcon } from './rating-types'

  interface Props {
    /** 当前评分值（支持半星，如 3.5）。 */
    value?: number
    /** 最大评分数量。 */
    max?: number
    /** 是否允许半星选择。 */
    allowHalf?: boolean
    /** 评分是否为只读。 */
    readonly?: boolean
    /** 评分是否禁用。 */
    disabled?: boolean
    /** 是否显示数值标签。 */
    showValue?: boolean
    /** 图标形状。 */
    icon?: RatingIcon
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 组件尺寸（对齐 BaseElement）。 */
    size?: MacSize
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = $bindable(0),
    max = 5,
    allowHalf = false,
    readonly = false,
    disabled = false,
    showValue = false,
    icon = 'star',
    theme = undefined,
    size = undefined,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let hoverValue = $state<number | null>(null)

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  /** 内置图标形状（与 Lit 版 _icons 一致）。 */
  const icons: Record<RatingIcon, { tag: 'path' | 'circle'; d?: string; cx?: number; cy?: number; r?: number }[]> =
    {
      star: [{ tag: 'path', d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }],
      heart: [{ tag: 'path', d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' }],
      circle: [{ tag: 'circle', cx: 12, cy: 12, r: 10 }],
      flame: [
        {
          tag: 'path',
          d: 'M12 23c-4.97 0-9-3.13-9-7 0-2.38 1.41-4.56 3.5-5.8C6.17 7.82 6 5.39 7.23 3.5 8.5 1.56 10.76 1 12 1c0 0-1.5 3-1.5 5.5 0 1.5.67 2.5 2 3 1.33.5 2.5-.5 2.5-2 0-1-.5-2.5-1.5-3.5 2.5 1 4.5 3.5 4.5 6.5 0 1.5-.5 3-1.5 4 1-1 1.5-2.5 1.5-4 0-3-2-5.5-4.5-6.5 1 1 1.5 2.5 1.5 3.5 0 1.5-1.17 2.5-2.5 2-1.33-.5-2-1.5-2-3C9.5 4 11 1 12 1c1.24 0 3.5.56 4.77 2.5C18 5.39 17.83 7.82 17.5 10.2 19.59 11.44 21 13.62 21 16c0 3.87-4.03 7-9 7z',
        },
      ],
      thumb: [
        {
          tag: 'path',
          d: 'M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z',
        },
      ],
    }

  const iconShapes = $derived(icons[icon] ?? icons.star)

  const displayValue = $derived(hoverValue ?? value)
  const isInteractive = $derived(!readonly && !disabled)

  function onMouseEnter(index: number, half: 'left' | 'right'): void {
    if (readonly || disabled) return
    if (allowHalf) {
      hoverValue = half === 'left' ? index - 0.5 : index
    } else {
      hoverValue = index
    }
  }

  function onMouseLeave(): void {
    if (readonly || disabled) return
    hoverValue = null
  }

  function onClick(index: number, half: 'left' | 'right'): void {
    if (readonly || disabled) return
    let newValue: number
    if (allowHalf) {
      newValue = half === 'left' ? index - 0.5 : index
    } else {
      newValue = index
    }
    // 点击相同值以清除
    value = newValue === value ? 0 : newValue
    emit('mac-rating-change', { value })
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-rating rating"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
  class:rating--disabled={disabled}
  class:rating--readonly={readonly}
  onmouseleave={isInteractive ? onMouseLeave : undefined}
>
  {#each Array.from({ length: max }, (_, i) => i + 1) as index (index)}
    {@const filled = displayValue >= index}
    {@const halfFilled = !filled && displayValue >= index - 0.5}
    {@const isHovered = hoverValue !== null && index <= hoverValue}
    {@const isHalfHovered =
      hoverValue !== null && !filled && index - 0.5 <= hoverValue && index > hoverValue - 0.5}
    <div class="icon-wrapper">
      <!-- 空图层（始终可见） -->
      <div class="icon-layer icon-layer--empty">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          {#each iconShapes as shape}
            {#if shape.tag === 'path'}
              <path d={shape.d} />
            {:else}
              <circle cx={shape.cx} cy={shape.cy} r={shape.r} />
            {/if}
          {/each}
        </svg>
      </div>
      {#if halfFilled || isHalfHovered}
        <div class="icon-layer icon-layer--half {isHovered ? 'icon-layer--hover' : ''}">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            {#each iconShapes as shape}
              {#if shape.tag === 'path'}
                <path d={shape.d} />
              {:else}
                <circle cx={shape.cx} cy={shape.cy} r={shape.r} />
              {/if}
            {/each}
          </svg>
        </div>
      {/if}
      {#if filled}
        <div class="icon-layer icon-layer--full {isHovered ? 'icon-layer--hover' : ''}">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            {#each iconShapes as shape}
              {#if shape.tag === 'path'}
                <path d={shape.d} />
              {:else}
                <circle cx={shape.cx} cy={shape.cy} r={shape.r} />
              {/if}
            {/each}
          </svg>
        </div>
      {/if}
      {#if isInteractive}
        <div
          class="click-zone click-zone--left"
          onmouseenter={() => onMouseEnter(index, 'left')}
          onclick={() => onClick(index, 'left')}
        ></div>
        <div
          class="click-zone click-zone--right"
          onmouseenter={() => onMouseEnter(index, 'right')}
          onclick={() => onClick(index, 'right')}
        ></div>
      {/if}
    </div>
  {/each}
  {#if showValue}
    <span class="label">{displayValue.toFixed(allowHalf ? 1 : 0)}</span>
  {/if}
</div>

<style>
  .mac-rating {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    --md-rating-icon-size: var(--md-icon-size-lg, 24px);
    --md-rating-gap: var(--md-spacing-xs, 4px);
    --md-rating-color-active: var(--md-color-warning, #f59e0b);
    --md-rating-color-inactive: var(--md-color-border, #d1d5db);
    --md-rating-color-hover: var(--md-color-warning, #f59e0b);
    --md-rating-color-disabled: var(--md-color-border, #d1d5db);
  }

  .mac-rating.rating--disabled {
    cursor: not-allowed;
    pointer-events: none;
  }

  .rating {
    display: inline-flex;
    align-items: center;
    gap: var(--md-rating-gap);
  }

  .icon-wrapper {
    position: relative;
    width: var(--md-rating-icon-size);
    height: var(--md-rating-icon-size);
    flex-shrink: 0;
  }

  .icon-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
      color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .icon-layer :global(svg) {
    width: 100%;
    height: 100%;
  }

  .icon-layer svg {
    width: 100%;
    height: 100%;
  }

  .icon-layer--empty {
    color: var(--md-rating-color-inactive);
  }

  .icon-layer--full {
    color: var(--md-rating-color-active);
    clip-path: inset(0 0 0 0);
  }

  .icon-layer--half {
    color: var(--md-rating-color-active);
    clip-path: inset(0 50% 0 0);
  }

  .icon-layer--hover {
    color: var(--md-rating-color-hover);
    transform: scale(1.15);
  }

  .mac-rating.rating--disabled .icon-layer--full,
  .mac-rating.rating--disabled .icon-layer--half {
    color: var(--md-rating-color-disabled);
  }

  /* Clickable zones */
  .click-zone {
    position: absolute;
    top: 0;
    height: 100%;
    z-index: 1;
    cursor: pointer;
  }

  .click-zone--left {
    left: 0;
    width: 50%;
  }

  .click-zone--right {
    right: 0;
    width: 50%;
  }

  .mac-rating.rating--disabled .click-zone {
    cursor: not-allowed;
  }

  /* Label */
  .label {
    margin-left: var(--md-rating-gap);
    font-size: var(--md-font-size-base, 14px);
    color: var(--md-color-text-secondary, #6b7280);
    user-select: none;
    -webkit-user-select: none;
  }

  .mac-rating.rating--disabled .label {
    opacity: 0.5;
  }

  /* Dark Mode */
  .mac-rating[data-theme='dark'] {
    --md-rating-color-inactive: var(--md-rating-color-dark-inactive, #4b5563);
    --md-rating-color-disabled: var(--md-rating-color-dark-inactive, #4b5563);
  }
</style>
