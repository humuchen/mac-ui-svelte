<script lang="ts">
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-group-button
   * @summary 一个 macOS 风格的分段控制组件。
   *
   * @event mac-change - 选中值变化时触发。`detail: { value, item, index }`
   */

  import type { GroupButtonItem } from './group-button-types'

  interface Props {
    /** 按钮项数组。 */
    items?: GroupButtonItem[]
    /** 当前选中的值。 */
    value?: string
    /** 按钮的尺寸。 */
    size?: MacSize
    /** 禁用所有按钮。 */
    disabled?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    items = [],
    value = $bindable(''),
    size = undefined,
    disabled = false,
    theme = undefined,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let containerEl: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // 未提供初始值时自动选中第一个可用项
  $effect(() => {
    if (!value && items.length > 0) {
      const enabledItem = items.find((item) => !item.disabled)
      if (enabledItem) {
        value = enabledItem.value
      }
    }
  })

  /** 更新滑块位置（与 Lit 版 _updateSliderPosition 一致）。 */
  function updateSliderPosition(animate: boolean) {
    if (!containerEl) return
    const slider = containerEl.querySelector<HTMLElement>('.slider')
    const buttons = containerEl.querySelectorAll<HTMLButtonElement>('.button')
    if (!slider || buttons.length === 0) return

    const selectedIndex = items.findIndex((item) => item.value === value)
    if (selectedIndex === -1) return

    const button = buttons[selectedIndex]
    if (!button) return

    if (!animate) {
      slider.style.transition = 'none'
    } else {
      slider.style.transition =
        'transform 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)'
    }

    // 使用 offsetLeft 获取按钮相对于容器的位置
    const offset = button.offsetLeft

    slider.style.width = `${button.offsetWidth}px`
    slider.style.transform = `translateX(${offset}px)`

    // 强制重排以确保过渡动画生效
    if (!animate) {
      void slider.offsetHeight
      slider.style.transition =
        'transform 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }

  // value / items 变化后更新滑块位置
  $effect(() => {
    void value
    void items
    const raf = requestAnimationFrame(() => updateSliderPosition(true))
    return () => cancelAnimationFrame(raf)
  })

  function handleButtonClick(item: GroupButtonItem, index: number) {
    if (item.disabled || disabled) return

    if (value !== item.value) {
      value = item.value
      emit('mac-change', { value, item, index })
    }
  }

  function getPreviousEnabledIndex(currentIndex: number): number {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!items[i].disabled) return i
    }
    return currentIndex
  }

  function getNextEnabledIndex(currentIndex: number): number {
    for (let i = currentIndex + 1; i < items.length; i++) {
      if (!items[i].disabled) return i
    }
    return currentIndex
  }

  function getFirstEnabledIndex(): number {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].disabled) return i
    }
    return 0
  }

  function getLastEnabledIndex(): number {
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i].disabled) return i
    }
    return items.length - 1
  }

  function handleKeyDown(event: KeyboardEvent, item: GroupButtonItem, index: number) {
    if (disabled) return

    let newIndex: number

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        newIndex = getPreviousEnabledIndex(index)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        newIndex = getNextEnabledIndex(index)
        break
      case 'Home':
        event.preventDefault()
        newIndex = getFirstEnabledIndex()
        break
      case 'End':
        event.preventDefault()
        newIndex = getLastEnabledIndex()
        break
      case ' ':
      case 'Enter':
        event.preventDefault()
        handleButtonClick(item, index)
        return
      default:
        return
    }

    if (newIndex !== index && newIndex !== -1) {
      const newItem = items[newIndex]
      handleButtonClick(newItem, newIndex)
      containerEl?.querySelectorAll<HTMLButtonElement>('.button')[newIndex]?.focus()
    }
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-group-button"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  <div bind:this={containerEl} class="group-container" role="radiogroup">
    <div class="slider"></div>
    <div class="button-wrapper">
      {#each items as item, index (item.value)}
        <button
          class="button {value === item.value ? 'button--selected' : ''}"
          disabled={disabled || item.disabled}
          role="radio"
          aria-checked={value === item.value}
          tabindex={value === item.value ? 0 : -1}
          onclick={() => handleButtonClick(item, index)}
          onkeydown={(e: KeyboardEvent) => handleKeyDown(e, item, index)}
        >
          {item.label}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .mac-group-button {
    display: inline-block;
  }

  .group-container {
    position: relative;
    display: inline-flex;
    align-items: center;
    background: var(--md-glass-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    border: 1px solid var(--md-glass-border);
    border-radius: var(--md-group-button-container-radius);
    padding: 3px;
    box-shadow:
      inset 0 1px 0 var(--md-glass-highlight-top),
      inset 0 -1px 0 var(--md-glass-highlight-bottom),
      var(--md-shadow-menu);
    overflow: hidden;
  }

  .slider {
    position: absolute;
    top: 3px;
    left: 3px;
    height: calc(100% - 6px);
    background: var(--md-group-button-item-selected-bg);
    border-radius: calc(var(--md-group-button-container-radius) - 2px);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.12),
      0 1px 2px rgba(0, 0, 0, 0.08);
    transition:
      transform 280ms cubic-bezier(0.4, 0, 0.2, 1),
      width 280ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, width;
    z-index: 1;
  }

  .button-wrapper {
    position: relative;
    z-index: 2;
  }

  .button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--md-group-button-item-padding-vertical)
      var(--md-group-button-item-padding-horizontal);
    font-size: var(--md-group-button-item-font-size);
    font-family: var(--md-font-family);
    font-weight: 500;
    line-height: 1.4;
    color: var(--md-group-button-item-color);
    background: transparent;
    border: none;
    border-radius: calc(var(--md-group-button-container-radius) - 2px);
    cursor: pointer;
    transition:
      color 150ms ease,
      opacity 150ms ease;
    user-select: none;
    white-space: nowrap;
    -webkit-font-smoothing: antialiased;
  }

  .button:hover:not(.button--selected):not(:disabled) {
    color: var(--md-group-button-item-active-color);
  }

  .button--selected {
    color: var(--md-group-button-item-selected-color);
    text-shadow: 0 -0.5px 0 rgba(0, 0, 0, 0.15);
  }

  .button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .button:focus-visible {
    outline: 2px solid var(--md-group-button-item-focus-outline);
    outline-offset: 2px;
  }

  /* 尺寸 */
  .mac-group-button[data-size='sm'] .button {
    padding: var(--sm-group-button-item-padding-vertical)
      var(--sm-group-button-item-padding-horizontal);
    font-size: var(--sm-group-button-item-font-size);
  }

  .mac-group-button[data-size='lg'] .button {
    padding: var(--lg-group-button-item-padding-vertical)
      var(--lg-group-button-item-padding-horizontal);
    font-size: var(--lg-group-button-item-font-size);
  }

  .mac-group-button[data-theme='dark'] .group-container {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .mac-group-button[data-theme='dark'] .button {
    color: rgba(255, 255, 255, 0.85);
  }

  .mac-group-button[data-theme='dark'] .button:hover:not(.button--selected):not(:disabled) {
    color: var(--md-mac-text-white);
  }
</style>
