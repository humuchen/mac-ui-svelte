import type { Meta, StoryObj } from '@storybook/web-components'
import MacConfigProvider from './mac-config-provider.svelte'
import ConfigProviderDemo from '../../../../.storybook/demos/config-provider-demo.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

// 说明：MacConfigProvider 本身不渲染视觉内容（display: contents），
// 它通过 theme / size 向后代组件传递全局配置。
// 这里直接挂载 .storybook/demos/config-provider-demo.svelte 演示包装组件，
// 内部包含 MacButton / MacTag / MacInput 等后代组件，可直观感受配置效果。

const meta = {
  title: '组件/ConfigProvider 全局配置',
  tags: ['autodocs'],
  args: {
    theme: 'light',
    size: 'md',
  },
  argTypes: {
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '主题模式：light 浅色 / dark 深色',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '全局尺寸：sm 小 / md 中 / lg 大',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const LightMd: Story = {
  args: { theme: 'light', size: 'md' },
  render: (args) => mountSvelte(ConfigProviderDemo, args),
}

export const DarkMd: Story = {
  args: { theme: 'dark', size: 'md' },
  render: (args) => mountSvelte(ConfigProviderDemo, args),
}

export const LightSm: Story = {
  args: { theme: 'light', size: 'sm' },
  render: (args) => mountSvelte(ConfigProviderDemo, args),
}

export const LightLg: Story = {
  args: { theme: 'light', size: 'lg' },
  render: (args) => mountSvelte(ConfigProviderDemo, args),
}

export const DarkLg: Story = {
  args: { theme: 'dark', size: 'lg' },
  render: (args) => mountSvelte(ConfigProviderDemo, args),
}
