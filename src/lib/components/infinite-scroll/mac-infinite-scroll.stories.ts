import type { Meta, StoryObj } from '@storybook/web-components'
import MacInfiniteScroll from './mac-infinite-scroll.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

/**
 * MacInfiniteScroll 无限滚动故事。
 *
 * 说明：组件通过 IntersectionObserver 监听滚动容器底部，
 * 滚动到距底部 threshold 像素内时派发 mac-load-more 事件；
 * 加载中显示 loadingSnippet，无更多数据显示 finishedSnippet，
 * 加载失败显示 errorSnippet 与重试按钮（派发 mac-retry）。
 * 由于 jsdom/Storybook 中 IntersectionObserver 不会真实触发回调，
 * 下方 story 通过切换 hasMore/loading/error 状态展示各状态 UI。
 */

const meta = {
  title: '组件/InfiniteScroll 无限滚动',
  tags: ['autodocs'],
  args: {
    hasMore: true,
    children: '列表内容',
  },
  argTypes: {
    hasMore: { control: 'boolean', description: '是否还有更多数据可加载' },
    loading: { control: 'boolean', description: '当前是否正在加载数据' },
    error: { control: 'boolean', description: '上次加载尝试是否失败' },
    threshold: { control: 'number', description: '距离底部触发加载的像素距离' },
    immediateCheck: { control: 'boolean', description: '挂载后是否立即检查' },
    disabled: { control: 'boolean', description: '禁用自动加载' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** 构造一个固定高度的可滚动列表容器（便于观察底部状态区域）。 */
function scrollHost(inner: HTMLElement): HTMLElement {
  const host = document.createElement('div')
  host.style.height = '240px'
  host.style.overflowY = 'auto'
  host.style.border = '1px solid var(--md-color-border, #e0e0e0)'
  host.style.borderRadius = '8px'
  host.appendChild(inner)
  return host
}

export const Default: Story = {
  args: { hasMore: true, children: '滚动到底部将触发 mac-load-more 事件加载更多数据' },
  render: (args) =>
    scrollHost(
      mountSvelte(MacInfiniteScroll, {
        ...args,
        children: text(String(args.children ?? '')),
      }),
    ),
}

export const Loading: Story = {
  args: { hasMore: true, loading: true, children: '正在加载更多数据…' },
  render: (args) =>
    scrollHost(
      mountSvelte(MacInfiniteScroll, {
        ...args,
        children: text(String(args.children ?? '')),
      }),
    ),
}

export const Error: Story = {
  args: { hasMore: true, error: true, children: '加载失败，请点击重试按钮重新加载' },
  render: (args) =>
    scrollHost(
      mountSvelte(MacInfiniteScroll, {
        ...args,
        children: text(String(args.children ?? '')),
      }),
    ),
}

export const Finished: Story = {
  args: { hasMore: false, children: '没有更多数据了' },
  render: (args) =>
    scrollHost(
      mountSvelte(MacInfiniteScroll, {
        ...args,
        children: text(String(args.children ?? '')),
      }),
    ),
}

export const CustomIndicators: Story = {
  render: () =>
    scrollHost(
      mountSvelte(MacInfiniteScroll, {
        hasMore: true,
        loading: true,
        children: text('自定义加载指示器与底部内容'),
        loadingSnippet: html('<div style="padding:12px;text-align:center;color:#007aff;">自定义加载中…</div>'),
        finishedSnippet: html('<div style="padding:12px;text-align:center;color:#8e8e93;">— 自定义的没有更多 —</div>'),
      }),
    ),
}

export const Disabled: Story = {
  args: { disabled: true, children: '已禁用自动加载，不会派发 mac-load-more' },
  render: (args) =>
    scrollHost(
      mountSvelte(MacInfiniteScroll, {
        ...args,
        children: text(String(args.children ?? '')),
      }),
    ),
}
