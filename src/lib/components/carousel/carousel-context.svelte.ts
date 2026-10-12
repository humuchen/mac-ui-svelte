import { getContext, setContext } from 'svelte'

/** Carousel 提供给子 CarouselItem 的上下文。 */
export interface CarouselContext {
  /** 已注册幻灯片 id 列表（按顺序，响应式）。 */
  slides: number[]
  registerSlide: () => number
  unregisterSlide: (id: number) => void
  /** 当前激活索引（响应式）。 */
  activeIndex: number
}

export const CAROUSEL_CONTEXT_KEY = Symbol('mac-carousel')

export function provideCarouselContext(ctx: CarouselContext): void {
  setContext(CAROUSEL_CONTEXT_KEY, ctx)
}

export function useCarouselContext(): CarouselContext | null {
  return getContext<CarouselContext | null>(CAROUSEL_CONTEXT_KEY) ?? null
}
