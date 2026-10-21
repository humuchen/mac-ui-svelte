import type { Meta, StoryObj } from '@storybook/web-components'
import MacTag from './mac-tag.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Tag 标签',
  tags: ['autodocs'],
  args: {
    type: 'primary',
    closable: false,
    round: false,
    bordered: true,
    disabled: false,
    children: '标签',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger', 'info'],
      description: '标签的类型样式',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '标签的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    closable: { control: 'boolean', description: '标签是否可关闭（点击关闭按钮触发 mac-close 事件）' },
    round: { control: 'boolean', description: '标签是否为圆角' },
    bordered: { control: 'boolean', description: '标签是否有边框' },
    disabled: { control: 'boolean', description: '禁用标签' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { type: 'primary', children: '主要标签' },
  render: (args) => mountSvelte(MacTag, { ...args, children: text(String(args.children ?? '')) }),
}

export const Types: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '8px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'center'
    for (const type of ['default', 'primary', 'success', 'warning', 'danger', 'info'] as const) {
      const cell = document.createElement('div')
      cell.appendChild(mountSvelte(MacTag, { type, children: text(`${type} 标签`) }))
      host.appendChild(cell)
    }
    return host
  },
}

export const Sizes: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '12px'
    host.style.alignItems = 'center'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = document.createElement('div')
      cell.appendChild(mountSvelte(MacTag, { size, type: 'primary', children: text(`${size} 尺寸`) }))
      host.appendChild(cell)
    }
    return host
  },
}

export const Closable: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '12px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'center'
    // 可关闭
    host.appendChild(mountSvelte(MacTag, { type: 'primary', closable: true, children: text('可关闭') }))
    // 可关闭 + 圆角
    host.appendChild(
      mountSvelte(MacTag, { type: 'success', closable: true, round: true, children: text('圆角可关闭') }),
    )
    // 可关闭 + 无边框
    host.appendChild(
      mountSvelte(MacTag, { type: 'warning', closable: true, bordered: false, children: text('无边框') }),
    )
    // 已禁用
    host.appendChild(
      mountSvelte(MacTag, { type: 'danger', closable: true, disabled: true, children: text('已禁用') }),
    )
    return host
  },
}

export const WithPrefixSuffix: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () =>
    mountSvelte(MacTag, {
      type: 'info',
      children: text('前后缀内容'),
      prefix: html('<span style="color:#007aff;font-weight:600">●</span>'),
      suffix: text('+8'),
    }),
}
