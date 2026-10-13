import type { Meta, StoryObj } from '@storybook/web-components'
import MacDatePicker from './mac-date-picker.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'
import type { PickerType } from './date-picker-types'

const meta = {
  title: '组件/DatePicker 日期选择器',
  tags: ['autodocs'],
  args: {
    value: '2026-01-15',
    format: 'YYYY-MM-DD',
    placeholder: '选择日期',
  },
  argTypes: {
    value: { control: 'text', description: '选中的日期字符串（受控）' },
    defaultValue: { control: 'text', description: '默认日期字符串（非受控）' },
    format: { control: 'text', description: '日期格式，如 YYYY-MM-DD HH:mm:ss' },
    placeholder: { control: 'text', description: '占位符' },
    disabled: { control: 'boolean', description: '禁用选择器' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '选择器的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    clearable: { control: 'boolean', description: '显示清空按钮' },
    error: { control: 'boolean', description: '错误状态' },
    success: { control: 'boolean', description: '成功状态' },
    disabledDate: { control: false, description: '禁用日期判断函数，返回 true 的日期不可选' },
    type: {
      control: 'select',
      options: ['date', 'datetime', 'year', 'quarter', 'week'],
      description: '选择器类型',
    },
    panel: { control: 'boolean', description: '面板模式（无触发器，面板常显）' },
    showFooter: { control: 'boolean', description: '是否显示面板底部（今天/清空按钮）' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** 默认日期选择器：带选中值，点击触发器打开下拉面板。 */
export const Default: Story = {
  args: { value: '2026-01-15' },
  render: (args) => mountSvelte(MacDatePicker, { ...args }),
}

/** 五种类型并排展示：date / datetime / year / quarter / week。 */
export const Types: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexWrap = 'wrap'
    host.style.gap = '16px'
    host.style.alignItems = 'flex-start'
    const cases: { type: PickerType; placeholder: string; value: string; format?: string }[] = [
      { type: 'date', placeholder: '选择日期', value: '2026-01-15' },
      {
        type: 'datetime',
        placeholder: '选择日期时间',
        value: '2026-01-15 10:30:00',
        format: 'YYYY-MM-DD HH:mm:ss',
      },
      { type: 'year', placeholder: '选择年份', value: '2026' },
      { type: 'quarter', placeholder: '选择季度', value: '2026-Q2' },
      { type: 'week', placeholder: '选择周', value: '2026-01-04' },
    ]
    for (const c of cases) {
      const cell = document.createElement('div')
      cell.style.width = '240px'
      cell.appendChild(
        mountSvelte(MacDatePicker, {
          type: c.type,
          placeholder: c.placeholder,
          value: c.value,
          format: c.format ?? 'YYYY-MM-DD',
        }),
      )
      host.appendChild(cell)
    }
    return host
  },
}

/** 三种尺寸并排展示。 */
export const Sizes: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexWrap = 'wrap'
    host.style.gap = '16px'
    host.style.alignItems = 'center'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = document.createElement('div')
      cell.style.width = '240px'
      cell.appendChild(
        mountSvelte(MacDatePicker, { size, value: '2026-01-15', placeholder: `${size} 尺寸` }),
      )
      host.appendChild(cell)
    }
    return host
  },
}

/** 状态并排展示：禁用 / 错误 / 成功 / 可清空。 */
export const States: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexWrap = 'wrap'
    host.style.gap = '16px'
    host.style.alignItems = 'flex-start'
    const states = [
      { label: '禁用 disabled', props: { disabled: true } },
      { label: '错误 error', props: { error: true } },
      { label: '成功 success', props: { success: true } },
      { label: '可清空 clearable', props: { clearable: true } },
    ]
    for (const s of states) {
      const cell = document.createElement('div')
      cell.style.width = '220px'
      const caption = document.createElement('div')
      caption.textContent = s.label
      caption.style.marginBottom = '6px'
      caption.style.fontSize = '12px'
      caption.style.color = '#8e8e93'
      cell.appendChild(caption)
      cell.appendChild(
        mountSvelte(MacDatePicker, {
          value: '2026-01-15',
          placeholder: '选择日期',
          ...s.props,
        }),
      )
      host.appendChild(cell)
    }
    return host
  },
}

/** 内联面板模式：无触发器、面板常显；同时演示 disabledDate 禁用周末。 */
export const InlinePanel: Story = {
  args: {
    panel: true,
    value: '2026-01-15',
    disabledDate: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
  },
  render: (args) => mountSvelte(MacDatePicker, { ...args }),
}
