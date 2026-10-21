import type { Meta, StoryObj } from '@storybook/web-components'
import MacDescriptions from './mac-descriptions.svelte'
import { mountSvelte, html } from '../../../../.storybook/mount-svelte'
import type { DescriptionItem } from './descriptions-types'

/**
 * 说明：Svelte 版推荐使用 items 数据 prop 渲染描述列表（本文件各 story 均基于该方式）。
 * MacDescriptionItem 子组件为兼容 Lit 版插槽用法而保留，渲染为隐藏元素（display:none），
 * 可通过 children snippet 传入，实际展示仍由 items 数据驱动，故不在 story 中单独演示。
 */

const deviceItems: DescriptionItem[] = [
  { label: '名称', value: 'MacBook Pro 14 英寸' },
  { label: '价格', value: '¥14,999' },
  { label: '颜色', value: '深空灰色' },
  { label: '芯片', value: 'M4 Pro' },
  { label: '内存', value: '24GB 统一内存' },
  { label: '存储', value: '512GB SSD' },
]

const meta = {
  title: '组件/Descriptions 描述列表',
  tags: ['autodocs'],
  args: {
    items: deviceItems,
    column: 3,
    labelPlacement: 'left',
    bordered: false,
    title: '',
    separator: ':',
  },
  argTypes: {
    items: {
      control: false,
      description: '描述列表数据项：label / value / span / labelStyle / contentStyle',
    },
    labelPlacement: { control: 'inline-radio', options: ['left', 'top'], description: '标签位置' },
    labelAlign: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: '标签文本对齐方式',
    },
    column: { control: 'number', description: '每行列数' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '组件尺寸（默认继承 ConfigProvider，否则 md）',
    },
    bordered: { control: 'boolean', description: '是否显示边框样式' },
    title: { control: 'text', description: '标题文本' },
    separator: { control: 'text', description: '标签与值之间的分隔符（仅 label-placement=left 且非 bordered）' },
    extra: { control: false, description: '头部额外内容 snippet（如操作按钮）' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** 默认（label 在左、无边框）：label: value 内联排列，3 列。 */
export const Default: Story = {
  render: (args) => mountSvelte(MacDescriptions, { ...args }),
}

/** 边框样式（label 在左）：表格布局。 */
export const Bordered: Story = {
  args: { bordered: true },
  render: (args) => mountSvelte(MacDescriptions, { ...args }),
}

/** label 在上方：网格布局，2 列；并通过 span 演示跨列。 */
export const TopPlacement: Story = {
  args: {
    labelPlacement: 'top',
    column: 2,
    items: [
      { label: '订单号', value: 'ORD-2026-0101-001' },
      { label: '下单时间', value: '2026-01-15 10:30' },
      { label: '备注', value: '请在工作日送达', span: 2 },
    ],
  },
  render: (args) => mountSvelte(MacDescriptions, { ...args }),
}

/** 头部区域：title 标题 + extra 操作按钮 + 自定义分隔符。 */
export const WithHeader: Story = {
  args: {
    title: '设备信息',
    separator: ' - ',
    extra: html(
      '<button type="button" style="border:1px solid rgba(0,0,0,0.15);background:transparent;border-radius:6px;padding:2px 12px;font-size:13px;cursor:pointer;color:inherit">编辑</button>',
    ),
  },
  render: (args) => mountSvelte(MacDescriptions, { ...args }),
}

/** 标签对齐方式并排展示：left / center / right（边框样式下效果明显）。 */
export const LabelAlign: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    const items: DescriptionItem[] = [
      { label: '名称', value: 'MacBook Pro' },
      { label: '价格', value: '¥14,999' },
      { label: '颜色', value: '深空灰色' },
      { label: '芯片', value: 'M4 Pro' },
    ]
    for (const align of ['left', 'center', 'right'] as const) {
      const cell = document.createElement('div')
      cell.appendChild(
        mountSvelte(MacDescriptions, {
          items,
          column: 2,
          bordered: true,
          labelAlign: align,
          title: `labelAlign: ${align}`,
        }),
      )
      host.appendChild(cell)
    }
    return host
  },
}
