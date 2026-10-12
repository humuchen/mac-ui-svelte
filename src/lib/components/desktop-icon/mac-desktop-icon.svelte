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
   * @tag mac-desktop-icon
   * @summary 带有选中状态的 macOS 风格桌面图标。
   *
   * @slot children - 图标的视觉内容（图片、svg 等）。
   *
   * @event mac-icon-dblclick - 双击时触发。Detail: { iconId }
   */

  interface Props {
    /** 图标标签文本。 */
    label?: string
    /** 图标标识符。 */
    iconId?: string
    /** 图标是否被选中。 */
    selected?: boolean
    /** 图标是否正在被拖拽。 */
    dragging?: boolean
    /** 图标 X 坐标。 */
    x?: number
    /** 图标 Y 坐标。 */
    y?: number
    /** 默认占位符的图标颜色。 */
    color?: string
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 组件尺寸（对齐 BaseElement）。 */
    size?: MacSize
    /** 图标的视觉内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    label = '',
    iconId = $bindable(''),
    selected = false,
    dragging = false,
    x = 0,
    y = 0,
    color = '#007AFF',
    theme = undefined,
    size = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()

  // 自增计数器，用于为未指定 iconId 的图标自动生成唯一标识
  let autoIdCounter = 0

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // 若未指定 iconId，自动生成唯一标识
  $effect(() => {
    if (!iconId) {
      iconId = `__auto_${autoIdCounter++}`
    }
  })

  let clickTimer: ReturnType<typeof setTimeout> | null = null
  let clickCount = 0

  function handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return
    // 不阻止冒泡，让桌面组件通过 composedPath() 识别图标
    e.preventDefault()
    handleClick()
  }

  function handleTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return
    e.preventDefault()
    handleClick()
  }

  function handleClick(): void {
    clickCount++
    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickCount = 0
      }, 350)
    } else if (clickCount === 2) {
      if (clickTimer) clearTimeout(clickTimer)
      clickCount = 0
      emit('mac-icon-dblclick', { iconId })
    }
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-desktop-icon"
  class:selected
  class:dragging
  style="position: absolute; left: {x}px; top: {y}px;"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  <div class="icon-wrapper" onmousedown={handleMouseDown} ontouchstart={handleTouchStart}>
    <div class="icon-image">
      {#if children}
        {@render children()}
      {:else}
        <div class="default-icon" style="--icon-color: {color}; background: var(--icon-color)">
          {label ? label.charAt(0).toUpperCase() : '?'}
        </div>
      {/if}
    </div>
    <span class="icon-label">{label}</span>
  </div>
</div>

<style>
  .mac-desktop-icon {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    width: var(--md-icon-wrapper-width);
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
    z-index: 1;
  }

  .mac-desktop-icon.selected {
    z-index: 2;
  }

  .mac-desktop-icon.dragging {
    z-index: 100;
  }

  .icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--md-spacing-xs);
    padding: 6px var(--md-spacing-xs);
    border-radius: var(--md-radius-lg);
    transition:
      background-color var(--md-transition-fast),
      box-shadow var(--md-transition-fast);
    width: 100%;
    cursor: pointer;
  }

  .mac-desktop-icon:hover .icon-wrapper {
    background-color: rgba(255, 255, 255, var(--md-opacity-hover));
  }

  .mac-desktop-icon.selected .icon-wrapper {
    background-color: var(--md-mac-selection);
    box-shadow: inset 0 0 0 0.5px var(--md-mac-selection-border);
  }

  .mac-desktop-icon.dragging .icon-wrapper {
    background-color: var(--md-mac-selection-rect-inner);
    box-shadow: var(--md-shadow-desktop-icon-drag);
  }

  .icon-image {
    width: var(--md-icon-size-desktop);
    height: var(--md-icon-size-desktop);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--md-radius-icon-lg);
    overflow: hidden;
    filter: drop-shadow(var(--md-shadow-icon));
    transition: transform var(--md-transition-magnify);
  }

  .mac-desktop-icon:active .icon-image {
    transform: scale(0.9);
  }

  .mac-desktop-icon.dragging .icon-image {
    transform: scale(1.04);
    filter: drop-shadow(var(--md-shadow-icon-drag));
  }

  .icon-image :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--md-radius-icon-lg);
  }

  .icon-image :global(svg) {
    width: 100%;
    height: 100%;
  }

  .icon-label {
    font-family: var(--md-font-family);
    font-size: var(--md-font-size-xs);
    line-height: 1.35;
    text-align: center;
    letter-spacing: 0.01em;
    color: var(--md-mac-text-white-soft);
    max-width: 76px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    text-shadow: var(--md-text-shadow-label);
    padding: 1px 5px;
    border-radius: var(--md-radius-sm);
    transition: all var(--md-transition-fast);
  }

  .mac-desktop-icon.selected .icon-label {
    background-color: var(--md-mac-selection-label-bg);
    color: var(--md-mac-text-white);
    text-shadow: var(--md-text-shadow-none);
    box-shadow: 0 1px 3px rgba(0, 122, 255, 0.3);
  }

  .default-icon {
    width: var(--md-icon-size-desktop);
    height: var(--md-icon-size-desktop);
    border-radius: var(--md-radius-icon-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--md-font-size-icon-lg);
    color: var(--md-mac-text-white);
    font-weight: 600;
    background: var(--icon-color, var(--md-color-primary));
    box-shadow:
      inset 0 1px 0 var(--md-icon-inset-top-soft),
      inset 0 -1px 0 var(--md-icon-inset-bottom-soft),
      0 1px 3px rgba(0, 0, 0, 0.12);
  }
</style>
