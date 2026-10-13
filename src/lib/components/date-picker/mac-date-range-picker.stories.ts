import type { Meta, StoryObj } from '@storybook/web-components'
import MacDateRangePicker from './mac-date-range-picker.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/DateRangePicker 日期范围选择器',
  tags: ['autodocs'],
  args: {
    format: 'YYYY-MM-DD',
    placeholder: 'Select range',
  },
  argTypes: {
    value: { control: false, description: '选中的范围 [start, end]（受控）' },
    defaultValue: { control: false, description: '默认范围（非受控）' },
    format: { control: 'text', description: '日期格式' },
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
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** 默认范围选择器：带选中范围，点击触发器打开双月面板。 */
export const Default: Story = {
  args: { value: ['2026-01-01', '2026-01-15'] },
  render: (args) => mountSvelte(MacDateRangePicker, { ...args }),
}

/** 自定义日期格式：format 与 value 需使用同一种格式。 */
export const CustomFormat: Story = {
  args: {
    format: 'YYYY/MM/DD',
    placeholder: '选择日期范围',
    value: ['2026/01/01', '2026/01/15'],
  },
  render: (args) => mountSvelte(MacDateRangePicker, { ...args }),
}

/** 三种尺寸并排展示。 */
export const Sizes: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexWrap = 'wrap'
    host.style.gap = '16px'
    host.style.alignItems = 'flex-start'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = document.createElement('div')
      cell.style.width = '280px'
      const caption = document.createElement('div')
      caption.textContent = `${size} 尺寸`
      caption.style.marginBottom = '6px'
      caption.style.fontSize = '12px'
      caption.style.color = '#8e8e93'
      cell.appendChild(caption)
      cell.appendChild(
        mountSvelte(MacDateRangePicker, {
          size,
          defaultValue: ['2026-01-01', '2026-01-15'],
          placeholder: 'Select range',
        }),
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
      cell.style.width = '280px'
      const caption = document.createElement('div')
      caption.textContent = s.label
      caption.style.marginBottom = '6px'
      caption.style.fontSize = '12px'
      caption.style.color = '#8e8e93'
      cell.appendChild(caption)
      cell.appendChild(
        mountSvelte(MacDateRangePicker, {
          value: ['2026-01-01', '2026-01-15'],
          placeholder: 'Select range',
          ...s.props,
        }),
      )
      host.appendChild(cell)
    }
    return host
  },
}

/** disabledDate 禁用周末：打开面板后周末日期不可点击。 */
export const DisabledWeekends: Story = {
  args: {
    value: ['2026-01-05', '2026-01-16'],
    disabledDate: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
  },
  render: (args) => mountSvelte(MacDateRangePicker, { ...args }),
}
