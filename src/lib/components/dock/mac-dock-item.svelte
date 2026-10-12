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
   * @tag mac-dock-item
   * @summary macOS 风格的 Dock 项目，带图标、标签提示和弹跳动画。
   *
   * @slot children - 图标的视觉内容（图片、svg 等）。
   *
   * @event mac-dock-item-click - 点击时触发。Detail: { itemId }
   */

  interface Props {
    /** 项目标识符。 */
    itemId?: string
    /** 项目标签（tooltip）。 */
    label?: string
    /** 默认占位图标的颜色。 */
    color?: string
    /** 应用是否正在运行。 */
    running?: boolean
    /** 图标是否正在弹跳。 */
    bouncing?: boolean
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
    itemId = '',
    label = '',
    color = '#007AFF',
    running = false,
    bouncing = $bindable(false),
    theme = undefined,
    size = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  function handleClick(): void {
    bouncing = true
    emit('mac-dock-item-click', { itemId })
  }

  function onBounceEnd(): void {
    bouncing = false
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-dock-item"
  class:running
  class:bouncing
  data-theme={resolvedTheme}
  data-size={resolvedSize}
  onclick={handleClick}
  onanimationend={onBounceEnd}
>
  <div class="dock-item-icon">
    {#if children}
      {@render children()}
    {:else}
      <div class="default-icon" style="--dock-item-color: {color}; background: var(--dock-item-color)">
        {label ? label.charAt(0).toUpperCase() : '?'}
      </div>
    {/if}
  </div>
  <div class="dock-item-label">{label}</div>
  <div class="dock-indicator"></div>
</div>

<style>
  .mac-dock-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
    position: relative;
    transition: transform var(--md-transition-magnify);
    will-change: transform;
  }

  .dock-item-icon {
    width: var(--md-icon-size);
    height: var(--md-icon-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--md-radius-icon);
    overflow: hidden;
    filter: drop-shadow(var(--md-shadow-icon));
    transition: filter var(--md-transition-magnify);
    cursor: pointer;
  }

  .mac-dock-item:hover .dock-item-icon {
    filter: drop-shadow(var(--md-shadow-icon-hover));
  }

  .mac-dock-item:active .dock-item-icon {
    filter: drop-shadow(var(--md-shadow-icon-active));
  }

  .dock-item-icon :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--md-radius-icon);
  }

  .dock-item-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .default-icon {
    width: var(--md-icon-size);
    height: var(--md-icon-size);
    border-radius: var(--md-radius-icon);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--md-font-size-icon);
    color: var(--md-mac-text-white);
    font-weight: 600;
    background: var(--dock-item-color, var(--md-color-primary));
    box-shadow:
      inset 0 1px 0 var(--md-icon-inset-top),
      inset 0 -1px 0 var(--md-icon-inset-bottom),
      0 1px 4px rgba(0, 0, 0, 0.14);
  }

  /* ─── Tooltip Label ─── */

  .dock-item-label {
    position: absolute;
    top: var(--md-tooltip-offset);
    left: 50%;
    transform: translateX(-50%) scale(0.85);
    white-space: nowrap;
    font-family: var(--md-font-family);
    font-size: var(--md-font-size-sm);
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--md-mac-text-white);
    background: var(--md-tooltip-bg);
    backdrop-filter: blur(var(--md-tooltip-blur)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--md-tooltip-blur)) saturate(180%);
    padding: var(--md-spacing-xs) 10px;
    border-radius: var(--md-radius-sm);
    box-shadow:
      var(--md-tooltip-shadow),
      inset 0 0 0 0.5px var(--md-tooltip-border);
    pointer-events: none;
    opacity: 0;
    transition:
      opacity 120ms ease,
      transform 120ms ease;
  }

  .dock-item-label::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    background: var(--md-tooltip-bg);
    border-radius: 0 0 2px 2px;
    clip-path: polygon(0 0, 100% 0, 50% 100%);
  }

  .mac-dock-item:hover .dock-item-label {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }

  /* ─── Running Indicator ─── */

  .dock-indicator {
    width: var(--md-indicator-size);
    height: var(--md-indicator-size);
    border-radius: 50%;
    background: rgba(255, 255, 255, var(--md-opacity-indicator));
    margin-top: var(--md-indicator-margin-top);
    opacity: 0;
    transition: opacity var(--md-transition-fast);
  }

  .mac-dock-item.running .dock-indicator {
    opacity: 1;
  }

  /* ─── Bounce Animation ─── */

  .mac-dock-item.bouncing {
    animation: dock-bounce 1s ease;
  }

  @keyframes dock-bounce {
    0% {
      transform: translateY(0);
    }
    25% {
      transform: translateY(-24px);
    }
    50% {
      transform: translateY(0);
    }
    75% {
      transform: translateY(-12px);
    }
    100% {
      transform: translateY(0);
    }
  }
</style>
