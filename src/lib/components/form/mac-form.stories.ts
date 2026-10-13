import type { Meta, StoryObj } from '@storybook/web-components'
import MacForm from './mac-form.svelte'
import FormDemo from '../../../../.storybook/demos/form-demo.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Form 表单',
  tags: ['autodocs'],
  args: {
    labelWidth: '96px',
    labelAlign: 'right',
    showLabel: true,
    showFeedback: true,
    disabled: false,
  },
  argTypes: {
    labelWidth: { control: 'text', description: '标签宽度（CSS 长度值）' },
    labelAlign: {
      control: 'inline-radio',
      options: ['left', 'right', 'top'],
      description: '标签对齐方式',
    },
    showLabel: { control: 'boolean', description: '是否显示标签' },
    showFeedback: { control: 'boolean', description: '是否显示错误反馈信息' },
    disabled: { control: 'boolean', description: '禁用所有表单项' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '表单尺寸（默认继承 ConfigProvider，否则 md）',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** 所有 story 均通过演示包装组件 FormDemo 渲染（内含 model / rules 受控绑定）。 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '完整表单演示：用户名（必填）、年龄（数字范围 1-150）、邮箱（必填 + 格式校验），提交时统一验证并反馈错误。',
      },
    },
  },
  render: () => mountSvelte(FormDemo, {}),
}

export const Compact: Story = {
  parameters: {
    docs: { description: { story: '窄容器中的表单布局（max-width 420px）。' } },
  },
  render: () => {
    const wrapper = document.createElement('div')
    wrapper.style.maxWidth = '420px'
    wrapper.appendChild(mountSvelte(FormDemo, {}))
    return wrapper
  },
}

export const InCard: Story = {
  parameters: {
    docs: { description: { story: '卡片容器内的表单（带标题区域）。' } },
  },
  render: () => {
    const card = document.createElement('div')
    card.style.maxWidth = '480px'
    card.style.padding = '24px'
    card.style.border = '1px solid rgba(0, 0, 0, 0.08)'
    card.style.borderRadius = '12px'
    card.style.background = '#ffffff'
    const title = document.createElement('h3')
    title.textContent = '账户设置'
    title.style.margin = '0 0 16px'
    title.style.fontSize = '16px'
    card.appendChild(title)
    card.appendChild(mountSvelte(FormDemo, {}))
    return card
  },
}
