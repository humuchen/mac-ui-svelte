import type { Meta, StoryObj } from '@storybook/web-components'
import MacTabs from './mac-tabs.svelte'
import { mountSvelte, text } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Tabs 标签页',
  tags: ['autodocs'],
  args: {
    type: 'line',
    defaultValue: 'a',
    value: '',
    closable: false,
    addable: false,
    animated: true,
    trigger: 'click',
    children: '当前激活标签的面板内容（items 模式下通过 children 渲染自定义内容）',
    items: [
      { key: 'a', label: '标签一' },
      { key: 'b', label: '标签二' },
      { key: 'c', label: '标签三', disabled: true },
    ],
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['line', 'card', 'segment'],
      description: '标签类型：line 下划线指示器 / card 卡片标签 / segment 分段控制器',
    },
    items: {
      control: 'object',
      description: '标签项数据（TabItem 数组，结构为 { key, label, disabled? }）',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '组件尺寸（默认继承 ConfigProvider，否则 md）',
    },
    value: {
      control: 'text',
      description: '受控模式下激活标签的键（设置后由外部完全控制激活态）',
    },
    defaultValue: { control: 'text', description: '默认激活标签的键（非受控模式）' },
    closable: { control: 'boolean', description: '标签是否可关闭（点击触发 mac-tabs-close 事件）' },
    addable: { control: 'boolean', description: '是否显示添加按钮（点击触发 mac-tabs-add 事件）' },
    animated: { control: 'boolean', description: '是否启用标签切换动画（指示器滑动）' },
    trigger: {
      control: 'inline-radio',
      options: ['click', 'hover'],
      description: '标签切换的触发方式',
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

// 注：除 items 数据驱动模式外，还支持 MacTabPane 插槽模式，例如：
// <MacTabs defaultValue="p1">
//   <MacTabPane tabKey="p1" label="标签一">面板一内容</MacTabPane>
//   <MacTabPane tabKey="p2" label="标签二">面板二内容</MacTabPane>
// </MacTabs>

export const Default: Story = {
  render: (args) =>
    mountSvelte(MacTabs, {
      ...args,
      children: text(String(args.children ?? '')),
      // prefix / suffix 命名 slot 演示：标签导航前/后的内容
      prefix: text('设置'),
      suffix: text('更多'),
    }),
}

export const Card: Story = {
  args: { type: 'card' },
  render: (args) => mountSvelte(MacTabs, { ...args, children: text(String(args.children ?? '')) }),
}

export const Segment: Story = {
  args: { type: 'segment' },
  render: (args) => mountSvelte(MacTabs, { ...args, children: text(String(args.children ?? '')) }),
}

export const Sizes: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    for (const size of ['sm', 'md', 'lg'] as const) {
      host.appendChild(
        mountSvelte(MacTabs, {
          size,
          defaultValue: 'a',
          items: [
            { key: 'a', label: `${size} 标签一` },
            { key: 'b', label: '标签二' },
          ],
          children: text(`${size} 尺寸的面板内容`),
        }),
      )
    }
    return host
  },
}

export const Closable: Story = {
  args: { closable: true, addable: true },
  render: (args) => mountSvelte(MacTabs, { ...args, children: text(String(args.children ?? '')) }),
}
