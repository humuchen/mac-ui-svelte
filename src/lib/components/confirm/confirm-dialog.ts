import { mount, unmount, flushSync } from 'svelte'
import MacConfirm from './mac-confirm.svelte'
import type { MacTheme } from '../../internal/config.svelte'

/**
 * 命令式确认对话框 API（对应 Lit 版 MacConfirm.open 静态方法）。
 * 返回 Promise：确定解析为 true，取消解析为 false。
 */
export interface ConfirmOptions {
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  showIcon?: boolean
  width?: string | number
  maskClosable?: boolean
  theme?: MacTheme
  titleAlign?: 'left' | 'center' | 'right'
  showDivider?: boolean
  onOk?: () => void
  onCancel?: () => void
}

let activeCleanup: (() => void) | null = null

/** 以命令式方式打开确认对话框。 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // 关闭当前活动的命令式对话框
    closeConfirmDialog()

    const target = document.createElement('div')
    document.body.appendChild(target)
    let settled = false

    const finish = (result: boolean) => {
      if (settled) return
      settled = true
      activeCleanup = null
      unmount(instance)
      target.remove()
      if (result) {
        options.onOk?.()
      } else {
        options.onCancel?.()
      }
      resolve(result)
    }

    const instance = mount(MacConfirm, {
      target,
      props: {
        title: options.title ?? '',
        content: options.content ?? '',
        confirmText: options.confirmText ?? '确认',
        cancelText: options.cancelText ?? '取消',
        danger: options.danger ?? false,
        showIcon: options.showIcon ?? true,
        width: options.width ?? '420px',
        maskClosable: options.maskClosable ?? true,
        theme: options.theme,
        titleAlign: options.titleAlign ?? 'left',
        showDivider: options.showDivider ?? true,
        visible: true,
        onok: () => finish(true),
        oncancel: () => finish(false),
      },
    })
    flushSync()

    // 组件内部任何关闭路径（如 ESC）都会派发 mac-confirm-close
    target.addEventListener('mac-confirm-close', () => finish(false))
    activeCleanup = () => finish(false)
  })
}

/** 关闭当前活动的命令式对话框（视为取消）。 */
export function closeConfirmDialog(): void {
  if (activeCleanup) {
    const cleanup = activeCleanup
    activeCleanup = null
    cleanup()
  }
}
