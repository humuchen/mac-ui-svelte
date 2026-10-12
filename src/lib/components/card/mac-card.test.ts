import { describe, expect, it, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import MacCard from './mac-card.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

describe('MacCard（Svelte 版）', () => {
  it('默认属性渲染：default 变体基础结构', () => {
    const { container } = render(MacCard, { props: { children: snippet('主体') } })
    const card = container.querySelector<HTMLElement>('.mac-card')!
    expect(card.className).toContain('card--default')
    expect(card.querySelector('.card__media')).toBeTruthy()
    expect(card.querySelector('.card__header-wrapper')).toBeTruthy()
    expect(card.querySelector('.card__body')?.textContent).toContain('主体')
    expect(card.querySelector('.card__footer-wrapper')).toBeTruthy()
  })

  it('属性绑定响应：variant / hoverable / clickable / loading / accent', () => {
    const { container } = render(MacCard, {
      props: {
        variant: 'glass',
        hoverable: true,
        clickable: true,
        loading: true,
        accent: 'top',
        mediaRatio: '16-9',
      },
    })
    const card = container.querySelector<HTMLElement>('.mac-card')!
    expect(card.className).toContain('card--glass')
    expect(card.className).toContain('card--hoverable')
    expect(card.className).toContain('card--clickable')
    expect(card.className).toContain('card--loading')
    expect(card.className).toContain('card--accent-top')
    expect(card.querySelector('.card__media--ratio-16-9')).toBeTruthy()
  })

  it('渲染 header / footer / media snippet', () => {
    const { container } = render(MacCard, {
      props: {
        children: snippet('B'),
        header: snippet('H'),
        footer: snippet('F'),
        media: snippet('<img src="x.png" alt="m" />'),
      },
    })
    const card = container.querySelector<HTMLElement>('.mac-card')!
    expect(card.querySelector('.card__header-wrapper')?.textContent).toContain('H')
    expect(card.querySelector('.card__footer-wrapper')?.textContent).toContain('F')
    expect(card.querySelector('.card__media-content')?.querySelector('img')).toBeTruthy()
  })

  it('不传 header/footer 时对应区域为空', () => {
    const { container } = render(MacCard, { props: {} })
    const card = container.querySelector<HTMLElement>('.mac-card')!
    expect(card.querySelector('.card__header-wrapper')?.textContent).toBe('')
    expect(card.querySelector('.card__footer-wrapper')?.textContent).toBe('')
  })

  it('data-theme 属性跟随 theme', () => {
    const { container } = render(MacCard, { props: { theme: 'dark' } })
    expect(container.querySelector<HTMLElement>('.mac-card')!.dataset.theme).toBe('dark')
  })
})
