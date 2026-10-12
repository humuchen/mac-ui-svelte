import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDynamicTags from './mac-dynamic-tags.svelte'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-dynamic-tags')!
}

describe('MacDynamicTags（Svelte 版）', () => {
  it('默认属性渲染：defaultValue 渲染标签列表与添加按钮', () => {
    const { container } = render(MacDynamicTags, {
      props: { defaultValue: ['苹果', '香蕉'] },
    })
    const root = getRoot(container)
    const tags = root.querySelectorAll('.tag-wrapper')
    expect(tags.length).toBe(2)
    expect(tags[0].getAttribute('data-value')).toBe('苹果')
    expect(root.querySelector('.add-button')).toBeTruthy()
  })

  it('点击添加按钮显示输入框，回车添加标签并派发事件', async () => {
    vi.useFakeTimers()
    const { container } = render(MacDynamicTags, { props: { defaultValue: [] } })
    const updateHandler = vi.fn()
    const addHandler = vi.fn()
    document.addEventListener('mac-update', updateHandler)
    document.addEventListener('mac-add', addHandler)

    await fireEvent.click(container.querySelector('.add-button')!)
    const input = container.querySelector<HTMLInputElement>('.input')!
    expect(input).toBeTruthy()
    await fireEvent.input(input, { target: { value: '新标签' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    const detail = (updateHandler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toEqual(['新标签'])
    expect((addHandler.mock.calls[0][0] as CustomEvent).detail.value).toBe('新标签')
    expect(getRoot(container).querySelectorAll('.tag-wrapper').length).toBe(1)
    document.removeEventListener('mac-update', updateHandler)
    document.removeEventListener('mac-add', addHandler)
    vi.useRealTimers()
  })

  it('重复标签不添加', async () => {
    const { container } = render(MacDynamicTags, { props: { defaultValue: ['A'] } })
    const updateHandler = vi.fn()
    document.addEventListener('mac-update', updateHandler)
    await fireEvent.click(container.querySelector('.add-button')!)
    const input = container.querySelector<HTMLInputElement>('.input')!
    await fireEvent.input(input, { target: { value: 'A' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(updateHandler).not.toHaveBeenCalled()
    document.removeEventListener('mac-update', updateHandler)
  })

  it('点击标签关闭按钮删除并派发 mac-remove / mac-update', async () => {
    const { container } = render(MacDynamicTags, {
      props: { defaultValue: ['A', 'B'] },
    })
    const removeHandler = vi.fn()
    const updateHandler = vi.fn()
    document.addEventListener('mac-remove', removeHandler)
    document.addEventListener('mac-update', updateHandler)
    const closeBtn = container.querySelector('.tag-wrapper .close')!
    await fireEvent.click(closeBtn)
    const detail = (removeHandler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('A')
    expect(detail.index).toBe(0)
    const updateDetail = (updateHandler.mock.calls[0][0] as CustomEvent).detail
    expect(updateDetail.value).toEqual(['B'])
    document.removeEventListener('mac-remove', removeHandler)
    document.removeEventListener('mac-update', updateHandler)
  })

  it('max 限制：达到上限后隐藏添加按钮', () => {
    const { container } = render(MacDynamicTags, {
      props: { defaultValue: ['A', 'B'], max: 2 },
    })
    expect(container.querySelector('.add-button')).toBeNull()
  })

  it('disabled 状态下点击添加按钮无效', async () => {
    const { container } = render(MacDynamicTags, { props: { disabled: true } })
    expect(container.querySelector('.container--disabled')).toBeTruthy()
    await fireEvent.click(container.querySelector('.add-button')!)
    expect(container.querySelector('.input')).toBeNull()
  })

  it('Escape 关闭输入框', async () => {
    const { container } = render(MacDynamicTags, { props: {} })
    await fireEvent.click(container.querySelector('.add-button')!)
    expect(container.querySelector('.input')).toBeTruthy()
    await fireEvent.keyDown(container.querySelector('.input')!, { key: 'Escape' })
    expect(container.querySelector('.input')).toBeNull()
  })
})
