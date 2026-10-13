import type { Meta, StoryObj } from '@storybook/web-components'
import MacSplit from './mac-split.svelte'
import { mountSvelte, html } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Split 分割面板',
  tags: ['autodocs'],
  args: {
    direction: 'horizontal',
    split: 0.5,
    unit: 'ratio',
    min: 0,
    max: 0,
    disabled: false,
  },
  argTypes: {
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: '分割方向：horizontal 水平 / vertical 垂直',
    },
    split: {
      control: 'number',
      description: '初始分割值：ratio 单位为 0-1 比例，pixel 单位为像素',
    },
    unit: {
      control: 'inline-radio',
      options: ['ratio', 'pixel'],
      description: '分割值的单位',
    },
    min: { control: 'number', description: '第一个面板的最小尺寸（像素）' },
    max: { control: 'number', description: '第一个面板的最大尺寸（像素），0 表示无限制' },
    disabled: { control: 'boolean', description: '禁用拖拽调整' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// 两个面板的内容（first / second 命名 slot）
const firstPanel = html(
  '<div style="box-sizing:border-box;height:100%;padding:16px;background:rgba(0,122,255,0.10);font-size:14px;">第一个面板（拖拽中间的分割条可调整大小）</div>',
)
const secondPanel = html(
  '<div style="box-sizing:border-box;height:100%;padding:16px;background:rgba(0,0,0,0.04);font-size:14px;">第二个面板</div>',
)

/** MacSplit 自身宽高为 100%，需要外层提供固定高度才能展示分割效果。 */
function splitScene(props: Record<string, unknown>, height = '320px'): HTMLElement {
  const host = document.createElement('div')
  host.style.height = height
  host.style.border = '1px solid rgba(0, 0, 0, 0.12)'
  host.style.borderRadius = '8px'
  host.style.overflow = 'hidden'
  const node = mountSvelte(MacSplit, props)
  node.style.height = '100%'
  host.appendChild(node)
  return host
}

export const Horizontal: Story = {
  render: (args) => splitScene({ ...args, first: firstPanel, second: secondPanel }),
}

export const Vertical: Story = {
  args: { direction: 'vertical' },
  render: (args) => splitScene({ ...args, first: firstPanel, second: secondPanel }),
}

export const PixelUnit: Story = {
  args: { unit: 'pixel', split: 220 },
  render: (args) => splitScene({ ...args, first: firstPanel, second: secondPanel }),
}

export const MinMax: Story = {
  args: { unit: 'pixel', split: 200, min: 120, max: 400 },
  render: (args) => splitScene({ ...args, first: firstPanel, second: secondPanel }),
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => splitScene({ ...args, first: firstPanel, second: secondPanel }),
}
