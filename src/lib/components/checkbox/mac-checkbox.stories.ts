import type { Meta, StoryObj } from '@storybook/web-components'
import MacCheckbox from './mac-checkbox.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

/** 生成带说明文字的单元格（用于多示例并排/纵排展示）。 */
function captionCell(caption: string, node: HTMLElement): HTMLElement {
  const cell = document.createElement('div')
  const title = document.createElement('div')
  title.textContent = caption
  title.style.marginBottom = '6px'
  title.style.fontSize = '12px'
  title.style.color = 'var(--md-color-text-secondary, #86868b)'
  cell.appendChild(title)
  cell.appendChild(node)
  return cell
}

const meta = {
  title: '组件/Checkbox 复选框',
  tags: ['autodocs'],
  args: {
    value: 'agree',
    checked: false,
    defaultChecked: false,
    indeterminate: false,
    disabled: false,
    label: '',
    children: '记住登录状态',
  },
  argTypes: {
    value: { control: 'text', description: '复选框的值' },
    checked: { control: 'boolean', description: '复选框是否被选中（受控）' },
    defaultChecked: { control: 'boolean', description: '默认是否被选中（非受控模式）' },
    indeterminate: { control: 'boolean', description: '复选框是否处于半选状态' },
    disabled: { control: 'boolean', description: '禁用复选框' },
    label: { control: 'text', description: '复选框的标签文本（优先于 children）' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '复选框的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: 'remember', children: '记住登录状态' },
  render: (args) =>
    mountSvelte(MacCheckbox, { ...args, children: text(String(args.children ?? '')) }),
}

export const States: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    const rows: Array<[string, Record<string, unknown>]> = [
      ['未选中', { label: '未选中' }],
      ['已选中（checked）', { label: '已选中', checked: true }],
      ['默认选中（defaultChecked）', { label: '默认选中', defaultChecked: true }],
      ['半选（indeterminate）', { label: '半选', indeterminate: true }],
      ['禁用', { label: '禁用', disabled: true }],
      ['禁用且选中', { label: '禁用且选中', disabled: true, checked: true }],
    ]
    for (const [caption, props] of rows) {
      host.appendChild(captionCell(caption, mountSvelte(MacCheckbox, props)))
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
    host.style.gap = '24px'
    host.style.alignItems = 'center'
    for (const size of ['sm', 'md', 'lg'] as const) {
      host.appendChild(
        mountSvelte(MacCheckbox, { size, label: `${size} 尺寸`, checked: true }),
      )
    }
    return host
  },
}

export const WithChildrenSlot: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () =>
    mountSvelte(MacCheckbox, {
      value: 'terms',
      checked: true,
      children: html(
        '我已阅读并接受 <a href="javascript:void(0)" style="color:#007aff">服务协议</a> 与 <strong>隐私政策</strong>',
      ),
    }),
}
