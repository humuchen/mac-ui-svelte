import type { Meta, StoryObj } from '@storybook/web-components'
import MacInputNumber from './mac-input-number.svelte'
import { mountSvelte, text } from '../../../../.storybook/mount-svelte'

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
  title: '组件/InputNumber 数字输入框',
  tags: ['autodocs'],
  args: {
    value: 5,
    min: 0,
    max: 10,
    step: 1,
    placeholder: '请输入数字',
  },
  argTypes: {
    value: { control: 'number', description: '输入框的值（受控）' },
    defaultValue: { control: 'number', description: '非受控模式的默认值' },
    min: { control: 'number', description: '最小值' },
    max: { control: 'number', description: '最大值' },
    step: { control: 'number', description: '步进值' },
    precision: { control: 'number', description: '精度（小数位数）' },
    placeholder: { control: 'text', description: '输入框的占位符' },
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
    status: {
      control: 'select',
      options: ['error', 'warning', 'success'],
      description: '输入框的状态',
    },
    disabled: { control: 'boolean', description: '禁用输入框' },
    readonly: { control: 'boolean', description: '使输入框只读' },
    showButton: { control: 'boolean', description: '显示步进按钮' },
    buttonPlacement: { control: 'inline-radio', options: ['inside', 'outside'], description: '按钮位置' },
    clearable: { control: 'boolean', description: '显示清除按钮' },
    keyboard: { control: 'boolean', description: '启用键盘控制（方向键、Page Up/Down）' },
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
  args: { value: 5, min: 0, max: 10, step: 1, placeholder: '请输入数量（0-10）' },
  render: (args) => mountSvelte(MacInputNumber, { ...args }),
}

export const StepAndPrecision: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    // 小数步进 + 精度格式化
    host.appendChild(
      captionCell(
        '小数步进（step=0.1, precision=2）',
        mountSvelte(MacInputNumber, { value: 3.5, step: 0.1, precision: 2, min: 0, max: 10 }),
      ),
    )
    // 大步进（键盘 Page Up/Down 可快速调整）
    host.appendChild(
      captionCell(
        '大步进（step=100）',
        mountSvelte(MacInputNumber, { value: 1000, step: 100, min: 0, max: 10000 }),
      ),
    )
    // 有值时显示清除按钮
    host.appendChild(
      captionCell('可清除', mountSvelte(MacInputNumber, { value: 7, clearable: true })),
    )
    return host
  },
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
          mountSvelte(MacInputNumber, { variant, value: 5, placeholder: '请输入数字' }),
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
        captionCell(`${size} 尺寸`, mountSvelte(MacInputNumber, { size, value: 5 })),
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
      ['错误状态', { status: 'error', value: 5 }],
      ['警告状态', { status: 'warning', value: 5 }],
      ['成功状态', { status: 'success', value: 5 }],
      ['禁用状态', { disabled: true, value: 5 }],
      ['只读状态', { readonly: true, value: 5 }],
      ['外部步进按钮', { buttonPlacement: 'outside', value: 5 }],
      ['隐藏步进按钮', { showButton: false, value: 5, placeholder: '请输入数字' }],
      ['前缀 / 后缀', { value: 5, prefix: text('¥'), suffix: text('件') }],
    ]
    for (const [caption, props] of rows) {
      host.appendChild(captionCell(caption, mountSvelte(MacInputNumber, props)))
    }
    return host
  },
}
