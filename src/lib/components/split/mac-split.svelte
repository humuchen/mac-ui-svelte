<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-split
   * @summary macOS 风格的可调整分割面板组件。
   *
   * @slot first - 第一个面板的内容。
   * @slot second - 第二个面板的内容。
   *
   * @event mac-split-change - 分割值变化时触发。`detail: { value: number }`
   * @event mac-split-drag-start - 开始拖拽时触发。
   * @event mac-split-drag-end - 拖拽结束时触发。
   */

  interface Props {
    /** 分割方向。 */
    direction?: 'horizontal' | 'vertical'
    /** 初始分割值，比例（0-1）或像素。 */
    split?: number
    /** 分割值的单位：'ratio'（0-1）或 'pixel'。 */
    unit?: 'ratio' | 'pixel'
    /** 第一个面板的最小尺寸（像素）。 */
    min?: number
    /** 第一个面板的最大尺寸（像素）。0 表示无限制。 */
    max?: number
    /** 禁用调整大小。 */
    disabled?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 第一个面板内容。 */
    first?: Snippet
    /** 第二个面板内容。 */
    second?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    direction = 'horizontal',
    split = 0.5,
    unit = 'ratio',
    min = 0,
    max = 0,
    disabled = false,
    theme = undefined,
    first,
    second,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let splitEl: HTMLDivElement | undefined = $state()
  let dragging = $state(false)
  let currentSplit = $state(split)

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // split 属性变化时同步内部值
  $effect(() => {
    currentSplit = split
    updateFirstSize()
  })

  $effect(() => {
    void direction
    updateFirstSize()
  })

  function updateFirstSize() {
    if (!root) return
    let sizeValue: string
    if (unit === 'pixel') {
      sizeValue = `${currentSplit}px`
    } else {
      sizeValue = `${currentSplit * 100}%`
    }
    root.style.setProperty('--_first-size', sizeValue)
  }

  function onResizerMouseDown(e: MouseEvent) {
    if (disabled) return
    e.preventDefault()
    dragging = true
    emit('mac-split-drag-start')

    document.addEventListener('mousemove', onDocumentMouseMove)
    document.addEventListener('mouseup', onDocumentMouseUp)
  }

  function onDocumentMouseMove(e: MouseEvent) {
    if (!dragging || !splitEl) return

    const rect = splitEl.getBoundingClientRect()
    let newSize: number

    if (direction === 'horizontal') {
      newSize = e.clientX - rect.left
    } else {
      newSize = e.clientY - rect.top
    }

    // 应用最小/最大约束
    if (min > 0) {
      newSize = Math.max(newSize, min)
    }
    if (max > 0) {
      newSize = Math.min(newSize, max)
    }

    // 转换为单位值
    if (unit === 'ratio') {
      const total = direction === 'horizontal' ? rect.width : rect.height
      if (total > 0) {
        newSize = newSize / total
      }
    }

    currentSplit = newSize
    updateFirstSize()
    emit('mac-split-change', { value: newSize })
  }

  function onDocumentMouseUp() {
    if (!dragging) return
    dragging = false
    emit('mac-split-drag-end')
    document.removeEventListener('mousemove', onDocumentMouseMove)
    document.removeEventListener('mouseup', onDocumentMouseUp)
  }

  // 组件销毁时清理 document 监听
  $effect(() => {
    return () => {
      document.removeEventListener('mousemove', onDocumentMouseMove)
      document.removeEventListener('mouseup', onDocumentMouseUp)
    }
  })
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-split"
  class:disabled={disabled}
  data-disabled={disabled || undefined}
  data-theme={resolvedTheme}
>
  <div bind:this={splitEl} class="split split--{direction}">
    <div class="panel">
      {#if first}{@render first()}{/if}
    </div>
    <div
      class="resizer {dragging ? 'resizer--dragging' : ''}"
      onmousedown={onResizerMouseDown}
    >
      <div class="resizer__line"></div>
      <div class="resizer__handle">
        <div class="resizer__handle-dots">
          <div class="resizer__handle-dot"></div>
          <div class="resizer__handle-dot"></div>
          <div class="resizer__handle-dot"></div>
        </div>
      </div>
    </div>
    <div class="panel">
      {#if second}{@render second()}{/if}
    </div>
  </div>
</div>

<style>
  .mac-split {
    display: block;
    width: 100%;
    height: 100%;
  }

  .split {
    display: grid;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .split--horizontal {
    grid-template-columns:
      var(--_first-size, 50%) var(--md-split-resizer-size, 1px)
      1fr;
  }

  .split--vertical {
    grid-template-rows:
      var(--_first-size, 50%) var(--md-split-resizer-size, 1px)
      1fr;
  }

  .panel {
    overflow: hidden;
    min-width: 0;
    min-height: 0;
  }

  .resizer {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    user-select: none;
    touch-action: none;
    z-index: 1;
  }

  .split--horizontal .resizer {
    cursor: col-resize;
    width: var(--md-split-resizer-size, 1px);
  }

  .split--vertical .resizer {
    cursor: row-resize;
    height: var(--md-split-resizer-size, 1px);
  }

  .resizer__line {
    background: var(--md-split-resizer-color, var(--md-color-border));
    transition: background var(--md-transition-fast);
  }

  .split--horizontal .resizer__line {
    width: 1px;
    height: 100%;
  }

  .split--vertical .resizer__line {
    width: 100%;
    height: 1px;
  }

  .resizer:hover .resizer__line,
  .resizer--dragging .resizer__line {
    background: var(--md-split-resizer-hover-color, var(--md-color-primary));
  }

  .split--horizontal .resizer:hover .resizer__line,
  .split--horizontal .resizer--dragging .resizer__line {
    width: 2px;
  }

  .split--vertical .resizer:hover .resizer__line,
  .split--vertical .resizer--dragging .resizer__line {
    height: 2px;
  }

  .resizer__handle {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--md-radius-sm);
    background: var(--md-split-resizer-handle-bg, transparent);
    opacity: 0;
    transition: opacity var(--md-transition-fast);
  }

  .split--horizontal .resizer__handle {
    width: 8px;
    height: 24px;
  }

  .split--vertical .resizer__handle {
    width: 24px;
    height: 8px;
  }

  .resizer:hover .resizer__handle,
  .resizer--dragging .resizer__handle {
    opacity: 1;
    background: var(--md-split-resizer-handle-bg, var(--md-color-bg-secondary));
  }

  .resizer__handle-dots {
    display: flex;
    gap: 2px;
  }

  .split--horizontal .resizer__handle-dots {
    flex-direction: column;
  }

  .resizer__handle-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--md-split-resizer-handle-dot-color, var(--md-color-text-secondary));
  }

  .mac-split[data-disabled] .resizer,
  .mac-split.disabled .resizer {
    cursor: default;
    pointer-events: none;
  }

  .mac-split.disabled .resizer__line {
    background: var(--md-split-resizer-color, var(--md-color-border));
  }
</style>
