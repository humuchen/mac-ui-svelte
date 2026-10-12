<script lang="ts">
  import type { Snippet } from 'svelte'
  import { getAnimation, BUILT_IN_ANIMATION_NAMES } from './animations'

  /**
   * @tag mac-animation
   * @summary 动画容器组件（高阶组件模式）。
   *
   * 将需要应用动画的目标内容放在 MacAnimation 内部，被包裹内容将自动应用指定动画。
   *
   * @slot children - 需要应用动画的目标内容。
   *
   * @event mac-animation-start - 动画开始时触发。
   * @event mac-animation-end - 动画结束时触发。
   * @event mac-animation-iteration - 动画每次重复时触发。
   */

  interface Props {
    /** 动画类型名称（内置 27 种，或通过 registerAnimation 注册的自定义动画）。 */
    type?: string
    /** 动画时长，如 '1s' / '500ms'。 */
    duration?: string
    /** 延迟时间。 */
    delay?: string
    /** 重复次数：数字或 'infinite'。 */
    iterationCount?: number | 'infinite'
    /** 动画方向。 */
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
    /** 填充模式。 */
    fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
    /** 缓动函数。 */
    timingFunction?: string
    /** 是否暂停（暂停 / 继续控制）。 */
    paused?: boolean
    /** 是否以块级元素渲染（默认 inline-block）。 */
    block?: boolean
    /** 动画结束后是否自动移除动画样式（便于反复触发）。 */
    autoClear?: boolean
    /** 需要应用动画的目标内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    type = 'fadeIn',
    duration = '1s',
    delay = '0s',
    iterationCount = 1,
    direction = 'normal',
    fillMode = 'both',
    timingFunction = 'ease',
    paused = $bindable(false),
    block = false,
    autoClear = false,
    children,
    ...rest
  }: Props = $props()

  let wrapper: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    wrapper?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // 属性变更后，将动画样式同步到包裹元素
  $effect(() => {
    void type
    void duration
    void delay
    void iterationCount
    void direction
    void fillMode
    void timingFunction
    void paused
    applyAnimation()
  })

  function applyAnimation() {
    if (!wrapper) return

    const def = getAnimation(type)
    if (!def) {
      wrapper.style.animation = ''
      return
    }

    const parts = [
      `mac-${def.name}`,
      duration ?? '1s',
      timingFunction ?? 'ease',
      delay ?? '0s',
      String(iterationCount ?? 1),
      direction ?? 'normal',
      fillMode ?? 'both',
      paused ? 'paused' : 'running',
    ]
    wrapper.style.animation = parts.join(' ')
  }

  // 渲染自定义（非内置）动画的 keyframes 到 document.head
  $effect(() => {
    const def = getAnimation(type)
    if (!def || BUILT_IN_ANIMATION_NAMES.has(def.name)) return
    const style = document.createElement('style')
    style.textContent = def.keyframes
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  })

  function onAnimationStart() {
    emit('mac-animation-start')
  }

  function onAnimationIteration() {
    emit('mac-animation-iteration')
  }

  function onAnimationEnd() {
    emit('mac-animation-end')
    if (autoClear) {
      // 保留终态视觉，仅移除动画以允许后续 restart
      wrapper?.style.setProperty('animation', 'none')
    }
  }

  /* ─────────── 公共方法（暂停 / 继续 / 重启 / 停止） ─────────── */

  /** 暂停动画。 */
  export function pause() {
    paused = true
    applyAnimation()
  }

  /** 继续动画。 */
  export function resume() {
    paused = false
    applyAnimation()
  }

  /** 重启动画（从头开始播放一次）。 */
  export function restart() {
    if (!wrapper) return
    // 先移除动画并强制回流，再重新应用
    wrapper.style.animation = 'none'
    // 强制 reflow
    void wrapper.offsetWidth
    applyAnimation()
  }

  /** 停止动画并清除样式。 */
  export function stop() {
    if (wrapper) wrapper.style.animation = 'none'
  }
</script>

<div
  bind:this={wrapper}
  {...rest}
  class="mac-scope mac-animation mac-anim-wrapper"
  class:block
  onanimationstart={onAnimationStart}
  onanimationiteration={onAnimationIteration}
  onanimationend={onAnimationEnd}
>
  {#if children}{@render children()}{/if}
</div>

<style>
  .mac-animation {
    display: inline-block;
    /* 硬件加速：减少动画抖动 */
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .mac-animation.block {
    display: block;
  }
</style>
