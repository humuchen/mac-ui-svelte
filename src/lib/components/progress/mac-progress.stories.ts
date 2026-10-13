import type { Meta, StoryObj } from '@storybook/web-components'
import MacProgress from './mac-progress.svelte'
import { mountSvelte, text } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Progress 进度条',
  tags: ['autodocs'],
  args: {
    percentage: 60,
    type: 'line',
    status: 'default',
    size: 'md',
    showText: true,
    processing: false,
  },
  argTypes: {
    percentage: {
      control: 'number',
      min: 0,
      max: 100,
      step: 1,
      description: '当前进度百分比（0-100）',
    },
    type: {
      control: 'inline-radio',
      options: ['line', 'circle'],
      description: '进度指示器类型',
    },
    status: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error'],
      description: '进度状态',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '进度组件尺寸（默认 md）',
    },
    showText: { control: 'boolean', description: '是否显示百分比文本' },
    processing: { control: 'boolean', description: '进度是否处于处理状态（显示动画）' },
    color: { control: 'color', description: '进度填充的自定义颜色（覆盖状态颜色）' },
    strokeWidth: { control: 'number', min: 2, max: 20, step: 1, description: '环形进度条的描边宽度（像素）' },
    width: { control: 'number', min: 60, max: 240, step: 10, description: '环形进度条的宽度/高度（像素）' },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Line: Story = {
  args: { type: 'line', percentage: 60 },
  render: (args) => mountSvelte(MacProgress, { ...args }),
}

export const Statuses: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    host.style.maxWidth = '480px'
    for (const [status, percentage] of [
      ['default', 40],
      ['success', 100],
      ['warning', 70],
      ['error', 25],
    ] as const) {
      host.appendChild(mountSvelte(MacProgress, { type: 'line', status, percentage }))
    }
    return host
  },
}

export const Circle: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '24px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'center'
    // 默认环形
    host.appendChild(mountSvelte(MacProgress, { type: 'circle', percentage: 75, width: 120 }))
    // 成功状态
    host.appendChild(
      mountSvelte(MacProgress, { type: 'circle', percentage: 100, status: 'success', width: 120 }),
    )
    // 自定义颜色 / 描边宽度 / 中心文本
    host.appendChild(
      mountSvelte(MacProgress, {
        type: 'circle',
        percentage: 45,
        color: '#bf5af2',
        strokeWidth: 10,
        width: 120,
        text: text('进行中'),
      }),
    )
    return host
  },
}

export const MultiCircle: Story = {
  render: () =>
    mountSvelte(MacProgress, {
      type: 'circle',
      width: 160,
      circles: [
        { percentage: 80, color: '#0a84ff' },
        { percentage: 60, color: '#5e5ce6' },
        { percentage: 40, color: '#bf5af2' },
      ],
    }),
}

export const GradientAndProcessing: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    host.style.maxWidth = '480px'
    // 线性渐变填充
    host.appendChild(
      mountSvelte(MacProgress, {
        type: 'line',
        percentage: 70,
        gradient: { from: '#0a84ff', to: '#bf5af2', angle: 90 },
      }),
    )
    // 环形渐变填充
    host.appendChild(
      mountSvelte(MacProgress, {
        type: 'circle',
        percentage: 65,
        width: 120,
        gradient: { from: '#34c759', to: '#0a84ff', angle: 45 },
      }),
    )
    // 处理中动画
    host.appendChild(mountSvelte(MacProgress, { type: 'line', percentage: 45, processing: true }))
    return host
  },
}
