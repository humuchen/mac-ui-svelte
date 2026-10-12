<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-lazy-image
   * @summary 懒加载图片组件，支持占位图、错误状态、悬停动画和点击预览。
   *
   * @slot placeholder - 加载时显示的自定义占位内容。
   * @slot error - 图片加载失败时显示的自定义错误内容。
   *
   * @event mac-load - 图片成功加载时触发。
   * @event mac-error - 图片加载失败时触发。
   * @event mac-preview-open - 预览遮罩打开时触发。
   * @event mac-preview-close - 预览遮罩关闭时触发。
   */

  interface Props {
    /** 图片源地址。 */
    src?: string
    /** 图片替代文本。 */
    alt?: string
    /** 图片宽度。 */
    width?: string
    /** 图片高度。 */
    height?: string
    /** CSS object-fit 值。 */
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
    /** 加载时显示的占位图片地址。 */
    placeholder?: string
    /** IntersectionObserver 的 rootMargin。 */
    rootMargin?: string
    /** IntersectionObserver 的 threshold。 */
    threshold?: number
    /** 是否启用点击预览。 */
    preview?: boolean
    /** 预览模式的图片地址。未设置时回退到 src。 */
    previewSrc?: string
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 加载时显示的自定义占位内容。 */
    placeholderSnippet?: Snippet
    /** 图片加载失败时显示的自定义错误内容。 */
    errorSnippet?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    src = '',
    alt = '',
    width = undefined,
    height = undefined,
    objectFit = 'cover',
    placeholder = undefined,
    rootMargin = '0px',
    threshold = 0,
    preview = false,
    previewSrc = '',
    theme = undefined,
    placeholderSnippet,
    errorSnippet,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let loaded = $state(false)
  let loading = $state(false)
  let error = $state(false)
  let previewOpen = $state(false)
  let previewAnimating = $state(false)

  let observer: IntersectionObserver | undefined

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  function setupObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      // 无 IntersectionObserver 时直接加载
      loadImage()
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          loadImage()
          cleanupObserver()
        }
      },
      { rootMargin, threshold },
    )
    if (root) {
      observer.observe(root)
    }
  }

  function cleanupObserver() {
    observer?.disconnect()
    observer = undefined
  }

  // 挂载时建立观察
  $effect(() => {
    setupObserver()
    return () => {
      cleanupObserver()
    }
  })

  // src 变化时重置状态并重新加载
  $effect(() => {
    void src
    if (loaded || loading || error) {
      loaded = false
      loading = false
      error = false
      if (typeof IntersectionObserver === 'undefined') {
        loadImage()
      }
    }
  })

  function loadImage() {
    if (!src || loaded || loading) return

    loading = true
    error = false

    const img = new Image()

    img.onload = () => {
      loading = false
      loaded = true
      error = false
      emit('mac-load')
    }

    img.onerror = () => {
      loading = false
      loaded = false
      error = true
      emit('mac-error')
    }

    img.src = src
  }

  function onImageClick() {
    if (!preview || !loaded) return
    openPreview()
  }

  function openPreview() {
    if (previewOpen) return
    previewOpen = true
    previewAnimating = true
    emit('mac-preview-open')
    document.addEventListener('keydown', onKeydown)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        previewAnimating = false
      })
    })
    void raf
  }

  function closePreview() {
    if (!previewOpen) return
    previewAnimating = true
    requestAnimationFrame(() => {
      previewOpen = false
      previewAnimating = false
      emit('mac-preview-close')
      document.removeEventListener('keydown', onKeydown)
    })
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closePreview()
    }
  }

  function onPreviewBgClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closePreview()
    }
  }

  // 卸载时清理预览监听
  $effect(() => {
    return () => {
      document.removeEventListener('keydown', onKeydown)
    }
  })
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-lazy-image"
  class:preview-enabled={preview}
  data-theme={resolvedTheme}
>
  <div
    class="container"
    style="width: {width ?? ''}; height: {height ?? ''};"
    onclick={onImageClick}
  >
    {#if loaded}
      <img class="image loaded" {src} {alt} style="object-fit: {objectFit};" />
    {/if}
    {#if !loaded && !error}
      <div class="placeholder {!placeholderSnippet && !placeholder ? 'shimmer' : ''}">
        {#if placeholderSnippet}
          {@render placeholderSnippet()}
        {:else if placeholder}
          <img
            src={placeholder}
            alt=""
            style="width: 100%; height: 100%; object-fit: {objectFit}; opacity: 0.6;"
          />
        {:else}
          <svg
            class="placeholder-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        {/if}
      </div>
    {/if}
    {#if error}
      <div class="error">
        {#if errorSnippet}
          {@render errorSnippet()}
        {:else}
          <svg
            class="error-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
        {/if}
      </div>
    {/if}
  </div>
  {#if preview}
    <div
      class="preview-overlay {previewOpen ? 'open' : ''} {previewAnimating ? 'animating' : ''}"
      onclick={onPreviewBgClick}
    >
      <img class="preview-image" src={previewSrc || src} {alt} />
      <div class="preview-close" onclick={closePreview} title="关闭 (Esc)">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </div>
  {/if}
</div>

<style>
  .mac-lazy-image {
    display: inline-block;
    position: relative;
    overflow: hidden;
  }

  .mac-lazy-image.preview-enabled {
    cursor: pointer;
  }

  .container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .image {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition:
      opacity var(--md-transition-normal),
      transform var(--md-lazy-image-hover-duration, 300ms)
        var(--md-lazy-image-hover-easing, ease-out),
      filter var(--md-lazy-image-hover-duration, 300ms)
        var(--md-lazy-image-hover-easing, ease-out);
    object-fit: var(--md-lazy-image-object-fit, cover);
  }

  .image.loaded {
    opacity: 1;
  }

  .container:hover .image.loaded {
    transform: scale(var(--md-lazy-image-hover-scale, 1.05));
    filter: var(--md-lazy-image-hover-filter, none);
  }

  .placeholder,
  .error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--md-lazy-image-placeholder-bg, var(--md-color-bg-secondary));
    color: var(--md-lazy-image-placeholder-color, var(--md-color-text-secondary));
    transition: opacity var(--md-transition-normal);
  }

  .placeholder.hidden,
  .error.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .placeholder-icon {
    width: var(--md-lazy-image-placeholder-icon-size, 32px);
    height: var(--md-lazy-image-placeholder-icon-size, 32px);
    opacity: 0.4;
  }

  .error-icon {
    width: var(--md-lazy-image-error-icon-size, 32px);
    height: var(--md-lazy-image-error-icon-size, 32px);
    opacity: 0.4;
  }

  /* 加载微光效果 */
  .placeholder.shimmer {
    background: linear-gradient(
      90deg,
      var(--md-lazy-image-placeholder-bg, var(--md-color-bg-secondary)) 25%,
      var(--md-lazy-image-shimmer-bg, rgba(255, 255, 255, 0.5)) 50%,
      var(--md-lazy-image-placeholder-bg, var(--md-color-bg-secondary)) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  /* ─── 预览遮罩层 ─── */

  .preview-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--md-lazy-image-preview-bg, rgba(0, 0, 0, 0.85));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    opacity: 0;
    visibility: hidden;
    transition:
      opacity var(--md-lazy-image-preview-duration, 250ms) ease,
      visibility var(--md-lazy-image-preview-duration, 250ms) ease;
    cursor: zoom-out;
  }

  .preview-overlay.open {
    opacity: 1;
    visibility: visible;
  }

  .preview-image {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: var(--md-radius-md);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
    transform: scale(0.9);
    transition: transform var(--md-lazy-image-preview-duration, 250ms)
      cubic-bezier(0.16, 1, 0.3, 1);
    cursor: default;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  .preview-overlay.open .preview-image {
    transform: scale(1);
  }

  .preview-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition:
      background var(--md-transition-fast),
      color var(--md-transition-fast);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .preview-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .preview-close :global(svg),
  .preview-close svg {
    width: 20px;
    height: 20px;
  }
</style>
