import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacInfiniteScroll from './mac-infinite-scroll.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-infinite-scroll')!
}

describe('MacInfiniteScroll（Svelte 版）', () => {
  it('默认属性渲染：hasMore=true 时无状态栏', () => {
    const { container } = render(MacInfiniteScroll, {
      props: { children: snippet('<li>item</li>') },
    })
    const root = getRoot(container)
    expect(root.querySelector('.sentinel')).toBeTruthy()
    expect(root.querySelector('.status')).toBeNull()
    expect(root.textContent).toContain('item')
  })

  it('loading 状态显示旋转器', () => {
    const { container } = render(MacInfiniteScroll, { props: { loading: true } })
    expect(container.querySelector('.loading-spinner')).toBeTruthy()
    expect(container.textContent).toContain('加载中...')
  })

  it('error 状态显示重试按钮，点击派发 mac-retry', async () => {
    const { container } = render(MacInfiniteScroll, { props: { error: true } })
    const handler = vi.fn()
    document.addEventListener('mac-retry', handler)
    expect(container.textContent).toContain('加载失败')
    await fireEvent.click(container.querySelector('.retry-btn')!)
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-retry', handler)
  })

  it('hasMore=false 显示没有更多数据', () => {
    const { container } = render(MacInfiniteScroll, { props: { hasMore: false } })
    expect(container.textContent).toContain('没有更多数据')
  })

  it('渲染自定义状态 snippet', () => {
    const { container } = render(MacInfiniteScroll, {
      props: { loading: true, loadingSnippet: snippet('<b>自定义加载</b>') },
    })
    expect(container.textContent).toContain('自定义加载')
  })

  it('渲染 finished / error snippet', () => {
    const { container: c1 } = render(MacInfiniteScroll, {
      props: { hasMore: false, finishedSnippet: snippet('到底了') },
    })
    expect(c1.textContent).toContain('到底了')
    cleanup()
    const { container: c2 } = render(MacInfiniteScroll, {
      props: { error: true, errorSnippet: snippet('<u>出错了</u>') },
    })
    expect(c2.textContent).toContain('出错了')
  })

  it('disabled 状态不触发加载', async () => {
    const { container } = render(MacInfiniteScroll, {
      props: { disabled: true, immediateCheck: false },
    })
    const handler = vi.fn()
    document.addEventListener('mac-load-more', handler)
    await new Promise((r) => setTimeout(r, 50))
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-load-more', handler)
  })

  it('immediateCheck：内容未填满时触发 mac-load-more', async () => {
    const { container } = render(MacInfiniteScroll, {
      props: { immediateCheck: true, children: snippet('x') },
    })
    const handler = vi.fn()
    document.addEventListener('mac-load-more', handler)
    await new Promise((r) => setTimeout(r, 50))
    // jsdom 中 scrollHeight == clientHeight（均为 0），会触发检查
    expect(handler).toHaveBeenCalled()
    document.removeEventListener('mac-load-more', handler)
  })
})
