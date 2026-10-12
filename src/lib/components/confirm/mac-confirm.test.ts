import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacConfirm from './mac-confirm.svelte'
import { confirmDialog, closeConfirmDialog } from './confirm-dialog'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

describe('MacConfirm（Svelte 版）', () => {
  it('visible=false 时不渲染', () => {
    const { container } = render(MacConfirm, { props: { title: 'T', content: 'C' } })
    expect(container.querySelector('.mac-confirm')).toBeNull()
  })

  it('visible=true 渲染遮罩、标题、内容与默认按钮', () => {
    const { container } = render(MacConfirm, {
      props: { visible: true, title: '删除确认', content: '确定要删除吗？' },
    })
    expect(container.querySelector('.mask')).toBeTruthy()
    expect(container.querySelector('.title')?.textContent).toBe('删除确认')
    expect(container.querySelector('.content')?.textContent).toBe('确定要删除吗？')
    expect(container.querySelector('.footer-btn--cancel')?.textContent?.trim()).toBe('取消')
    expect(container.querySelector('.footer-btn--ok')?.textContent?.trim()).toBe('确认')
  })

  it('点击确定派发 mac-confirm-ok 并关闭', async () => {
    const { container } = render(MacConfirm, { props: { visible: true } })
    const okHandler = vi.fn()
    const closeHandler = vi.fn()
    document.addEventListener('mac-confirm-ok', okHandler)
    document.addEventListener('mac-confirm-close', closeHandler)
    await fireEvent.click(container.querySelector('.footer-btn--ok')!)
    expect(okHandler).toHaveBeenCalledOnce()
    expect(closeHandler).toHaveBeenCalledOnce()
    expect(container.querySelector('.mac-confirm')).toBeNull()
    document.removeEventListener('mac-confirm-ok', okHandler)
    document.removeEventListener('mac-confirm-close', closeHandler)
  })

  it('点击取消派发 mac-confirm-cancel 并关闭', async () => {
    const { container } = render(MacConfirm, { props: { visible: true } })
    const cancelHandler = vi.fn()
    document.addEventListener('mac-confirm-cancel', cancelHandler)
    await fireEvent.click(container.querySelector('.footer-btn--cancel')!)
    expect(cancelHandler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-confirm-cancel', cancelHandler)
  })

  it('danger=true 使用危险样式', () => {
    const { container } = render(MacConfirm, {
      props: { visible: true, danger: true, title: '危险操作' },
    })
    expect(container.querySelector('.footer-btn--danger')).toBeTruthy()
    expect(container.querySelector('.titlebar-icon--danger')).toBeTruthy()
  })

  it('showIcon=false 不显示图标', () => {
    const { container } = render(MacConfirm, {
      props: { visible: true, showIcon: false, title: 'T' },
    })
    expect(container.querySelector('.titlebar-icon')).toBeNull()
  })

  it('titleAlign=center 映射居中样式', () => {
    const { container } = render(MacConfirm, {
      props: { visible: true, title: 'T', titleAlign: 'center' },
    })
    expect(container.querySelector('.titlebar--center')).toBeTruthy()
  })

  it('maskClosable 点击遮罩取消', async () => {
    const { container } = render(MacConfirm, {
      props: { visible: true, maskClosable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-confirm-cancel', handler)
    await fireEvent.click(container.querySelector('.mask')!)
    expect(handler).toHaveBeenCalledOnce()
    expect(container.querySelector('.mac-confirm')).toBeNull()
    document.removeEventListener('mac-confirm-cancel', handler)
  })

  it('maskClosable=false 点击遮罩不关闭', async () => {
    const { container } = render(MacConfirm, {
      props: { visible: true, maskClosable: false },
    })
    await fireEvent.click(container.querySelector('.mask')!)
    expect(container.querySelector('.mac-confirm')).toBeTruthy()
  })

  it('ESC 键取消', async () => {
    const { container } = render(MacConfirm, { props: { visible: true } })
    const handler = vi.fn()
    document.addEventListener('mac-confirm-cancel', handler)
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-confirm-cancel', handler)
  })

  it('width 数字属性转换为像素', () => {
    const { container } = render(MacConfirm, { props: { visible: true, width: 320 } })
    const c = container.querySelector<HTMLElement>('.container')!
    expect(c.style.getPropertyValue('--md-confirm-width')).toBe('320px')
  })

  it('渲染 children / footer snippet', () => {
    const { container } = render(MacConfirm, {
      props: {
        visible: true,
        children: snippet('<p>自定义内容</p>'),
        footer: snippet('<button class="my-btn">好</button>'),
      },
    })
    expect(container.textContent).toContain('自定义内容')
    expect(container.querySelector('.my-btn')).toBeTruthy()
  })
})

describe('confirmDialog 命令式 API（对应 MacConfirm.open）', () => {
  it('打开对话框并解析为 true（确定）', async () => {
    const promise = confirmDialog({ title: '确认', content: '内容' })
    await new Promise((r) => setTimeout(r, 0))
    const mask = document.querySelector('.mac-confirm')!
    expect(mask).toBeTruthy()
    await fireEvent.click(document.querySelector('.footer-btn--ok')!)
    await expect(promise).resolves.toBe(true)
    expect(document.querySelector('.mac-confirm')).toBeNull()
  })

  it('点击取消解析为 false', async () => {
    const onCancel = vi.fn()
    const promise = confirmDialog({ title: '确认', onCancel })
    await new Promise((r) => setTimeout(r, 0))
    await fireEvent.click(document.querySelector('.footer-btn--cancel')!)
    await expect(promise).resolves.toBe(false)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('点击遮罩视为取消', async () => {
    const promise = confirmDialog({ title: '确认', maskClosable: true })
    await new Promise((r) => setTimeout(r, 0))
    await fireEvent.click(document.querySelector('.mask')!)
    await expect(promise).resolves.toBe(false)
  })

  it('closeConfirmDialog 关闭当前对话框', async () => {
    const promise = confirmDialog({ title: '确认' })
    await new Promise((r) => setTimeout(r, 0))
    closeConfirmDialog()
    await expect(promise).resolves.toBe(false)
    expect(document.querySelector('.mac-confirm')).toBeNull()
  })
})
