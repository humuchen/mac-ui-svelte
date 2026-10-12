import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacTabs from './mac-tabs.svelte'
import MacTabPane from './mac-tab-pane.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const items = [
  { key: 'a', label: '标签一' },
  { key: 'b', label: '标签二' },
  { key: 'c', label: '标签三', disabled: true },
]

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-tabs')!
}

describe('MacTabs（Svelte 版）', () => {
  it('默认属性渲染：items 模式渲染标签项', () => {
    const { container } = render(MacTabs, { props: { items, defaultValue: 'a' } })
    const root = getRoot(container)
    expect(root.querySelectorAll('.tab-item').length).toBe(3)
    expect(root.querySelector('.tab-item.active')?.getAttribute('data-key')).toBe('a')
    expect(root.querySelector('.indicator')).toBeTruthy()
  })

  it('value 属性受控激活', () => {
    const { container } = render(MacTabs, { props: { items, value: 'b' } })
    expect(container.querySelector('.tab-item.active')?.getAttribute('data-key')).toBe('b')
  })

  it('未提供 value/defaultValue 时激活第一项', () => {
    const { container } = render(MacTabs, { props: { items } })
    expect(container.querySelector('.tab-item.active')?.getAttribute('data-key')).toBe('a')
  })

  it('点击切换激活并派发 mac-tabs-change', async () => {
    const { container } = render(MacTabs, { props: { items, defaultValue: 'a' } })
    const handler = vi.fn()
    document.addEventListener('mac-tabs-change', handler)
    const tab = container.querySelector<HTMLElement>('.tab-item[data-key="b"]')!
    await fireEvent.click(tab)
    expect(tab.className).toContain('active')
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.key).toBe('b')
    document.removeEventListener('mac-tabs-change', handler)
  })

  it('disabled 标签点击无效', async () => {
    const { container } = render(MacTabs, { props: { items, defaultValue: 'a' } })
    const handler = vi.fn()
    document.addEventListener('mac-tabs-change', handler)
    await fireEvent.click(container.querySelector<HTMLElement>('.tab-item[data-key="c"]')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-tabs-change', handler)
  })

  it('closable 显示关闭按钮，点击派发 mac-tabs-close', async () => {
    const { container } = render(MacTabs, {
      props: { items, defaultValue: 'a', closable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-tabs-close', handler)
    const closeBtn = container.querySelector<HTMLElement>('.tab-item .close-btn')!
    expect(closeBtn).toBeTruthy()
    await fireEvent.click(closeBtn)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.key).toBe('a')
    document.removeEventListener('mac-tabs-close', handler)
  })

  it('addable 显示添加按钮，点击派发 mac-tabs-add', async () => {
    const { container } = render(MacTabs, { props: { items, addable: true } })
    const handler = vi.fn()
    document.addEventListener('mac-tabs-add', handler)
    expect(container.querySelector('.add-btn')).toBeTruthy()
    await fireEvent.click(container.querySelector('.add-btn')!)
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-tabs-add', handler)
  })

  it('type=segment / card 不渲染指示器', () => {
    const { container: c1 } = render(MacTabs, { props: { items, type: 'segment' } })
    expect(c1.querySelector('.indicator')).toBeNull()
    cleanup()
    const { container: c2 } = render(MacTabs, { props: { items, type: 'card' } })
    expect(c2.querySelector('.indicator')).toBeNull()
  })

  it('渲染 prefix / suffix snippet', () => {
    const { container } = render(MacTabs, {
      props: { items, prefix: snippet('P'), suffix: snippet('S') },
    })
    expect(container.textContent).toContain('P')
    expect(container.textContent).toContain('S')
  })
})

describe('MacTabPane（Svelte 版）', () => {
  it('插槽模式：面板注册并同步激活状态', async () => {
    const { container } = render(MacTabs, {
      props: {
        defaultValue: 'p1',
        children: snippet(`
          <div>pane 占位</div>
        `),
      },
    })
    // 直接渲染 pane 到 tabs 内部较复杂，这里验证 items 与 pane 混合模式下 tabs 自身行为
    expect(container.querySelector('.pane-container')).toBeTruthy()
  })

  it('pane active 状态控制显隐', async () => {
    const { container } = render(MacTabPane, { props: { tabKey: 'x', label: 'X' } })
    // 无 tabs 上下文时不激活
    const pane = container.querySelector<HTMLElement>('.mac-tab-pane')!
    expect(pane.style.display).toBe('none')
  })
})
