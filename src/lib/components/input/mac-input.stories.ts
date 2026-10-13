import type { Meta, StoryObj } from '@storybook/web-components'
import MacInput from './mac-input.svelte'
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
  title: '组件/Input 输入框',
  tags: ['autodocs'],
  args: {
    value: '',
    placeholder: '请输入内容',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'tel', 'url'],
      description: '输入框的类型',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '输入框的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    variant: {
      control: 'select',
      options: ['default', 'filled', 'glass', 'underline'],
      description: '视觉变体',
    },
    label: { control: 'text', description: '输入框的标签' },
    placeholder: { control: 'text', description: '输入框的占位符' },
    required: { control: 'boolean', description: '显示必填指示器' },
    disabled: { control: 'boolean', description: '禁用输入框' },
    readonly: { control: 'boolean', description: '使输入框只读' },
    error: { control: 'boolean', description: '输入框的错误状态' },
    success: { control: 'boolean', description: '输入框的成功状态' },
    helperText: { control: 'text', description: '输入框的辅助文本' },
    clearable: { control: 'boolean', description: '显示清除按钮' },
    showPasswordToggle: { control: 'boolean', description: '显示密码切换按钮' },
    showCharCounter: { control: 'boolean', description: '显示字符计数器' },
    maxLength: { control: 'number', description: '最大字符长度' },
    loading: { control: 'boolean', description: '显示加载状态' },
    floating: { control: 'boolean', description: '启用浮动标签' },
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
  args: {
    label: '用户名',
    required: true,
    value: '',
    placeholder: '请输入用户名',
    helperText: '将作为您的登录账号',
  },
  render: (args) => mountSvelte(MacInput, { ...args }),
}

export const Variants: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '12px'
    for (const variant of ['default', 'filled', 'glass', 'underline'] as const) {
      host.appendChild(
        captionCell(
          `${variant} 变体`,
          mountSvelte(MacInput, { variant, placeholder: '请输入内容' }),
        ),
      )
    }
    return host
  },
}

export const Sizes: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '12px'
    for (const size of ['sm', 'md', 'lg'] as const) {
      host.appendChild(
        captionCell(`${size} 尺寸`, mountSvelte(MacInput, { size, placeholder: '请输入内容' })),
      )
    }
    return host
  },
}

export const States: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    const rows: Array<[string, Record<string, unknown>]> = [
      ['错误状态', { error: true, value: '错误内容', helperText: '输入内容不符合要求' }],
      ['成功状态', { success: true, value: '正确内容', helperText: '输入内容可用' }],
      ['禁用状态', { disabled: true, value: '禁用内容', placeholder: '不可编辑' }],
      ['只读状态', { readonly: true, value: '只读内容' }],
      ['加载状态', { loading: true, value: '加载中' }],
    ]
    for (const [caption, props] of rows) {
      host.appendChild(captionCell(caption, mountSvelte(MacInput, props)))
    }
    return host
  },
}

export const Features: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    // 密码输入与显示切换
    host.appendChild(
      captionCell(
        '密码输入（可切换显示）',
        mountSvelte(MacInput, { type: 'password', value: 'secret123', showPasswordToggle: true }),
      ),
    )
    // 有值时显示清除按钮
    host.appendChild(
      captionCell('可清除', mountSvelte(MacInput, { value: '点击右侧按钮清除', clearable: true })),
    )
    // 字符计数器（达到上限 80% 变为警告色）
    host.appendChild(
      captionCell(
        '字符计数',
        mountSvelte(MacInput, { value: 'hello world', showCharCounter: true, maxLength: 20 }),
      ),
    )
    // 前缀 / 后缀插槽
    host.appendChild(
      captionCell(
        '前缀 / 后缀',
        mountSvelte(MacInput, {
          value: 'example',
          prefix: html('<span style="font-size:14px;line-height:1">🔍</span>'),
          suffix: text('.com'),
        }),
      ),
    )
    // 浮动标签
    host.appendChild(
      captionCell(
        '浮动标签',
        mountSvelte(MacInput, { floating: true, label: '电子邮箱', value: 'user@example.com' }),
      ),
    )
    return host
  },
}
