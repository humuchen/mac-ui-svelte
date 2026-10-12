import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacAlert from './mac-alert.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

describe('MacAlert（Svelte 版）', () => {
  it('默认属性渲染：default 类型 / 有边框 / 显示图标', () => {
    const { container, getByRole } = render(MacAlert, {
      props: { title: '标题', children: snippet('内容') },
    })
    const alert = getByRole('alert')
    expect(alert.className).toContain('alert--default')
    expect(alert.className).toContain('alert--bordered')
    expect(alert.querySelector('.alert__icon')).toBeTruthy()
    expect(alert.querySelector('.alert__title')?.textContent).toBe('标题')
    expect(alert.querySelector('.alert__description')?.textContent).toContain('内容')
    void container
  })

  it('属性绑定响应：type / bordered / showIcon / closable', () => {
    const { getByRole } = render(MacAlert, {
      props: { type: 'success', bordered: false, showIcon: false, closable: true },
    })
    const alert = getByRole('alert')
    expect(alert.className).toContain('alert--success')
    expect(alert.className).toContain('alert--borderless')
    expect(alert.querySelector('.alert__icon')).toBeNull()
    expect(alert.querySelector('.alert__close')).toBeTruthy()
  })

  it('点击关闭按钮派发 mac-close 事件', async () => {
    const { getByRole } = render(MacAlert, { props: { closable: true } })
    const handler = vi.fn()
    document.addEventListener('mac-close', handler)
    await fireEvent.click(getByRole('button', { name: 'Close' }))
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-close', handler)
  })

  it('渲染 icon / action snippet', () => {
    const { getByRole } = render(MacAlert, {
      props: { icon: snippet('<b>ICO</b>'), action: snippet('<u>ACT</u>') },
    })
    const alert = getByRole('alert')
    expect(alert.querySelector('.alert__icon')?.innerHTML).toContain('ICO')
    expect(alert.querySelector('.alert__action')?.innerHTML).toContain('ACT')
  })

  it('closable=false 时不渲染关闭按钮', () => {
    const { getByRole } = render(MacAlert, { props: {} })
    expect(getByRole('alert').querySelector('.alert__close')).toBeNull()
  })
})
