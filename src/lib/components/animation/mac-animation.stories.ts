import type { Meta, StoryObj } from '@storybook/web-components'
import MacAnimation from './mac-animation.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Animation 动画',
  tags: ['autodocs'],
  args: {
    type: 'fadeIn',
    duration: '1s',
    delay: '0s',
    iterationCount: 1,
    direction: 'normal',
    fillMode: 'both',
    timingFunction: 'ease',
    paused: false,
    block: false,
    autoClear: false,
    children: '淡入动画内容',
  },
  argTypes: {
    type: {
      control: 'select',
      options: [
        'fadeIn',
        'fadeOut',
        'fadeInUp',
        'fadeInDown',
        'fadeInLeft',
        'fadeInRight',
        'zoomIn',
        'zoomOut',
        'scaleIn',
        'rotateIn',
        'flip',
        'rotateInDownLeft',
        'slideInLeft',
        'slideInRight',
        'slideInUp',
        'slideInDown',
        'bounce',
        'bounceIn',
        'shake',
        'pulse',
        'flash',
        'swing',
        'wobble',
        'jello',
        'rubberBand',
        'tada',
        'rollIn',
        'lightSpeedIn',
        'heartBeat',
      ],
      description: '动画类型名称（内置 27 种，或通过 registerAnimation 注册的自定义动画）',
    },
    duration: { control: 'text', description: "动画时长，如 '1s' / '500ms'" },
    iterationCount: { control: 'text', description: "重复次数：数字或 'infinite'" },
    direction: {
      control: 'select',
      options: ['normal', 'reverse', 'alternate', 'alternate-reverse'],
      description: '动画方向',
    },
    fillMode: {
      control: 'select',
      options: ['none', 'forwards', 'backwards', 'both'],
      description: '填充模式',
    },
    timingFunction: {
      control: 'text',
      description: "缓动函数，如 ease / linear / cubic-bezier(0.4, 0, 0.2, 1)",
    },
    paused: {
      control: 'boolean',
      description:
        '是否暂停动画。注意：fadeIn / zoomIn 等透明型动画暂停时停在初始帧（opacity: 0），元素不可见属预期行为',
    },
    block: { control: 'boolean', description: '是否以块级元素渲染（默认 inline-block）' },
    autoClear: {
      control: 'boolean',
      description: '动画结束后是否自动移除动画样式（保留终态，便于反复触发）',
    },
    delay: {
      control: 'text',
      description:
        "延迟时间，如 '0.5s'。fillMode=both 时延迟期间显示初始帧（fadeIn 类动画为透明）",
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// 注：组件实例暴露 pause() / resume() / restart() / stop() 方法，
// paused 属性支持双向绑定；动画开始 / 重复 / 结束分别派发
// mac-animation-start / mac-animation-iteration / mac-animation-end 事件。

/** 动画画廊：网格排列多个 MacAnimation 循环播放，便于横向对比效果。 */
function animationGallery(types: string[], options: Record<string, unknown> = {}): HTMLElement {
  const host = document.createElement('div')
  host.style.display = 'grid'
  host.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))'
  host.style.gap = '16px'
  host.style.maxWidth = '760px'
  types.forEach((type, index) => {
    const cell = document.createElement('div')
    cell.style.display = 'flex'
    cell.style.justifyContent = 'center'
    cell.appendChild(
      mountSvelte(MacAnimation, {
        type,
        ...options,
        // 错开延迟，形成波浪式播放效果
        delay: `${(index % 6) * 0.15}s`,
        children: html(
          `<div style="display:flex;align-items:center;justify-content:center;width:96px;height:96px;border-radius:12px;background:rgba(0,122,255,0.12);color:var(--md-color-text,#1d1d1f);font-size:13px;">${type}</div>`,
        ),
      }),
    )
    host.appendChild(cell)
  })
  return host
}

export const FadeIn: Story = {
  render: (args) =>
    mountSvelte(MacAnimation, { ...args, children: text(String(args.children ?? '')) }),
}

export const InfiniteLoop: Story = {
  args: {
    type: 'heartBeat',
    duration: '1.2s',
    iterationCount: 'infinite',
    direction: 'alternate',
    children: '心跳动画（infinite 无限循环）',
  },
  render: (args) =>
    mountSvelte(MacAnimation, { ...args, children: text(String(args.children ?? '')) }),
}

export const EntranceAnimations: Story = {
  args: {
    duration: '2.4s',
    iterationCount: 'infinite',
    direction: 'alternate',
  },
  argTypes: {
    type: { control: false, description: '画廊中每个单元格使用各自的动画类型，此控件不适用' },
    delay: { control: false, description: '画廊内按单元格顺序错开延迟，形成波浪播放效果' },
  },
  render: (args) =>
    animationGallery(
      [
        'fadeIn',
        'fadeInUp',
        'fadeInDown',
        'fadeInLeft',
        'fadeInRight',
        'zoomIn',
        'scaleIn',
        'rotateIn',
        'flip',
        'slideInUp',
        'slideInDown',
        'rollIn',
        'lightSpeedIn',
      ],
      {
        duration: args.duration,
        iterationCount: args.iterationCount,
        direction: args.direction,
        fillMode: args.fillMode,
        timingFunction: args.timingFunction,
        paused: args.paused,
        block: args.block,
        autoClear: args.autoClear,
      },
    ),
}

export const AttentionGrabbers: Story = {
  args: {
    duration: '1.4s',
    iterationCount: 'infinite',
  },
  argTypes: {
    type: { control: false, description: '画廊中每个单元格使用各自的动画类型，此控件不适用' },
    delay: { control: false, description: '画廊内按单元格顺序错开延迟，形成波浪播放效果' },
  },
  render: (args) =>
    animationGallery(
      [
        'bounce',
        'shake',
        'pulse',
        'flash',
        'swing',
        'wobble',
        'jello',
        'rubberBand',
        'tada',
        'heartBeat',
      ],
      {
        duration: args.duration,
        iterationCount: args.iterationCount,
        direction: args.direction,
        fillMode: args.fillMode,
        timingFunction: args.timingFunction,
        paused: args.paused,
        block: args.block,
        autoClear: args.autoClear,
      },
    ),
}

export const PausedControl: Story = {
  args: { type: 'bounce', duration: '1.5s', paused: true, children: 'paused=true 时动画暂停在初始状态' },
  render: (args) =>
    mountSvelte(MacAnimation, { ...args, children: text(String(args.children ?? '')) }),
}
