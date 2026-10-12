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
   * @tag mac-text-ellipsis
   * @summary 支持行数限制、点击展开和提示框的文本省略组件。
   *
   * @slot children - 文本内容。
   * @slot tooltip - 文本被截断时悬停显示的自定义提示框内容。
   *   如果未提供且 `tooltip` 为 `true`，则将使用完整文本作为提示框内容。
   *
   * @event mac-ellipsis-expand - 文本展开或收起时触发。`detail: { expanded: boolean }`
   */

  interface Props {
    /** 截断前显示的最大行数。 */
    lineClamp?: number
    /** 如何触发展开。'click' 显示展开链接；'none' 禁用展开。 */
    expandTrigger?: 'click' | 'none'
    /** 文本当前是否已展开。 */
    expanded?: boolean
    /** 文本被截断时悬停是否显示提示框。 */
    tooltip?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 组件尺寸（对齐 BaseElement）。 */
    size?: MacSize
    /** 文本内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 自定义提示框内容。 */
    tooltipSnippet?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    lineClamp = 3,
    expandTrigger = 'none',
    expanded = $bindable(false),
    tooltip = false,
    theme = undefined,
    size = undefined,
    children,
    tooltipSnippet,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let contentEl: HTMLDivElement | undefined = $state()
  let tooltipEl: HTMLDivElement | undefined = $state()

  let isTruncated = $state(false)
  let tooltipVisible = $state(false)
  let tooltipStyle = $state('')

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  /** 测量内容是否被截断（与 Lit 版 _checkTruncation 等价）。 */
  function checkTruncation() {
    if (!contentEl) return
    // 临时移除限制以测量完整高度
    const hadClamp = contentEl.classList.contains('clamped')
    contentEl.classList.remove('clamped')
    contentEl.classList.add('expanded')
    const fullHeight = contentEl.scrollHeight
    contentEl.classList.remove('expanded')
    if (hadClamp) contentEl.classList.add('clamped')

    const lineHeight = parseFloat(getComputedStyle(contentEl).lineHeight) || 21
    const clampedHeight = lineHeight * lineClamp
    isTruncated = fullHeight > clampedHeight + 2
  }

  $effect(() => {
    // lineClamp / expanded 变化后重新测量
    void lineClamp
    void expanded
    checkTruncation()
  })

  function handleContentClick() {
    if (expandTrigger !== 'click' || !isTruncated) return
    expanded = !expanded
    emit('mac-ellipsis-expand', { expanded })
  }

  // --- 提示框 ---
  function handleMouseEnter() {
    if (!isTruncated || expanded) return
    // 如果存在自定义插槽内容或启用了 tooltip 属性，则显示提示框
    if (!tooltipSnippet && !tooltip) return
    showTooltip()
  }

  function handleMouseLeave() {
    hideTooltip()
  }

  function showTooltip() {
    if (tooltipVisible || !root || !tooltipEl) return
    tooltipVisible = true

    // 位置
    const rect = root.getBoundingClientRect()
    tooltipStyle = `left: ${rect.left}px; top: ${rect.bottom + 6}px;`

    const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number
    raf(() => {
      if (!tooltipEl) return
      // 如果溢出视口则调整
      const tipRect = tooltipEl.getBoundingClientRect()
      let style = ''
      let left = rect.left
      let top = rect.bottom + 6
      if (tipRect.right > window.innerWidth - 8) {
        left = window.innerWidth - tipRect.width - 8
      }
      if (tipRect.bottom > window.innerHeight - 8) {
        top = rect.top - tipRect.height - 6
      }
      style = `left: ${left}px; top: ${top}px; opacity: 1; transform: translateY(0);`
      tooltipStyle = style
    })
  }

  function hideTooltip() {
    tooltipVisible = false
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-text-ellipsis"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <div
    bind:this={contentEl}
    class="ellipsis-content {isTruncated && !expanded ? 'clamped' : ''} {expanded
      ? 'expanded'
      : ''} {expandTrigger === 'click' && isTruncated ? 'clickable' : ''}"
    style="--_line-clamp: {lineClamp}"
    onclick={handleContentClick}
  >
    {#if children}{@render children()}{/if}
  </div>

  <!-- 提示框（fixed 定位，行为与 Lit 版 portal 一致） -->
  <div bind:this={tooltipEl} class="tooltip-popup {tooltipVisible ? 'visible' : ''}" style={tooltipStyle}>
    {#if tooltipVisible}
      {#if tooltipSnippet}{@render tooltipSnippet()}{:else}{@render children!()}{/if}
    {/if}
  </div>
</div>

<style>
  .mac-text-ellipsis {
    display: block;
    --md-ellipsis-color: var(--md-color-text);
    --md-ellipsis-expand-color: var(--md-color-primary);
    --md-ellipsis-tooltip-bg: var(--md-tooltip-bg);
    --md-ellipsis-tooltip-color: #fff;
  }

  .mac-text-ellipsis {
    position: relative;
    color: var(--md-ellipsis-color);
    font-size: var(--md-font-size-base);
    line-height: 1.5;
    word-break: break-word;
  }

  .ellipsis-content {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: max-height var(--md-transition-normal);
  }

  .ellipsis-content.clamped {
    -webkit-line-clamp: var(--_line-clamp);
  }

  .ellipsis-content.expanded {
    display: block;
    -webkit-line-clamp: unset;
  }

  .ellipsis-content.clickable {
    cursor: pointer;
  }

  /* 提示框 */
  .tooltip-popup {
    position: fixed;
    z-index: 99999;
    max-width: 320px;
    padding: 6px 10px;
    background: var(--md-ellipsis-tooltip-bg);
    backdrop-filter: blur(var(--md-tooltip-blur));
    -webkit-backdrop-filter: blur(var(--md-tooltip-blur));
    border: 1px solid var(--md-tooltip-border);
    border-radius: var(--md-radius-md);
    box-shadow: var(--md-tooltip-shadow);
    color: var(--md-ellipsis-tooltip-color);
    font-size: var(--md-font-size-sm);
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
    pointer-events: none;
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity 120ms ease,
      transform 120ms ease;
  }

  .tooltip-popup.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style>
