import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacPopconfirm from './mac-popconfirm.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const flush = (ms = 220) => new Promise((r) => setTimeout(r, ms))

describe('MacPopconfirm（Svelte 版）', () => {
  it('默认不显示气泡', () => {
    const { container } = render(MacPopconfirm, {
      props: { title: '删除', children: snippet('<button>删除</button>') },
    })
    expect(container.querySelector('.mac-popconfirm-portal')).toBeNull()
  })

  it('click 触发：点击触发元素显示气泡并派发 open', async () => {
    const { container } = render(MacPopconfirm, {
      props: { title: '删除确认', description: '此操作不可撤销', children: snippet('<button>删</button>') },
    })
    const handler = vi.fn()
    document.addEventListener('mac-popconfirm-open', handler)
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    const portal = container.querySelector<HTMLElement>('.mac-popconfirm-portal')!
    expect(portal).toBeTruthy()
    expect(portal.querySelector('.popconfirm-title')?.textContent).toBe('删除确认')
    expect(portal.querySelector('.popconfirm-desc')?.textContent).toBe('此操作不可撤销')
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-popconfirm-open', handler)
  })

  it('再次点击触发元素隐藏气泡', async () => {
    const { container } = render(MacPopconfirm, {
      props: { children: snippet('<button>x</button>') },
    })
    const trigger = container.querySelector('.trigger')!
    await fireEvent.click(trigger)
    await flush(0)
    expect(container.querySelector('.mac-popconfirm-portal')).toBeTruthy()
    await fireEvent.click(trigger)
    expect(container.querySelector('.mac-popconfirm-portal')).toBeNull()
  })

  it('点击确认派发 mac-popconfirm-confirm 并关闭', async () => {
    const { container } = render(MacPopconfirm, {
      props: { children: snippet('<button>x</button>') },
    })
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    const handler = vi.fn()
    document.addEventListener('mac-popconfirm-confirm', handler)
    await fireEvent.click(container.querySelector('.popconfirm-btn-confirm')!)
    expect(handler).toHaveBeenCalledOnce()
    expect(container.querySelector('.mac-popconfirm-portal')).toBeNull()
    document.removeEventListener('mac-popconfirm-confirm', handler)
  })

  it('点击取消派发 mac-popconfirm-cancel 并关闭', async () => {
    const { container } = render(MacPopconfirm, {
      props: { children: snippet('<button>x</button>') },
    })
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    const handler = vi.fn()
    document.addEventListener('mac-popconfirm-cancel', handler)
    await fireEvent.click(container.querySelector('.popconfirm-btn-cancel')!)
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-popconfirm-cancel', handler)
  })

  it('danger=true 确认按钮使用危险样式', async () => {
    const { container } = render(MacPopconfirm, {
      props: { danger: true, children: snippet('<button>x</button>') },
    })
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    expect(container.querySelector('.popconfirm-btn-danger')).toBeTruthy()
  })

  it('showIcon=false 不显示图标', async () => {
    const { container } = render(MacPopconfirm, {
      props: { showIcon: false, children: snippet('<button>x</button>') },
    })
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    expect(container.querySelector('.popconfirm-icon')).toBeNull()
  })

  it('disabled 状态点击无效', async () => {
    const { container } = render(MacPopconfirm, {
      props: { disabled: true, children: snippet('<button>x</button>') },
    })
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    expect(container.querySelector('.mac-popconfirm-portal')).toBeNull()
  })

  it('ESC 键取消并关闭', async () => {
    const { container } = render(MacPopconfirm, {
      props: { children: snippet('<button>x</button>') },
    })
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    const handler = vi.fn()
    document.addEventListener('mac-popconfirm-cancel', handler)
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(handler).toHaveBeenCalledOnce()
    expect(container.querySelector('.mac-popconfirm-portal')).toBeNull()
    document.removeEventListener('mac-popconfirm-cancel', handler)
  })

  it('点击外部区域关闭', async () => {
    const { container } = render(MacPopconfirm, {
      props: { children: snippet('<button>x</button>') },
    })
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    expect(container.querySelector('.mac-popconfirm-portal')).toBeTruthy()
    await fireEvent.mouseDown(document.body)
    expect(container.querySelector('.mac-popconfirm-portal')).toBeNull()
  })

  it('hover 触发模式：悬停显示', async () => {
    vi.useFakeTimers()
    const { container } = render(MacPopconfirm, {
      props: { trigger: 'hover', children: snippet('<button>x</button>') },
    })
    await fireEvent.mouseEnter(container.querySelector('.trigger')!)
    await vi.advanceTimersByTimeAsync(200)
    expect(container.querySelector('.mac-popconfirm-portal')).toBeTruthy()
    vi.useRealTimers()
  })

  it('渲染 action snippet 替换默认按钮', async () => {
    const { container } = render(MacPopconfirm, {
      props: { children: snippet('<button>x</button>'), action: snippet('<button class="my-action">好的</button>') },
    })
    await fireEvent.click(container.querySelector('.trigger')!)
    await flush(0)
    expect(container.querySelector('.my-action')).toBeTruthy()
    expect(container.querySelector('.popconfirm-btn-confirm')).toBeNull()
  })
})
