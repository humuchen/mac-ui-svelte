// mac-menu 公共类型（独立成 .ts，保证 build:types 可生成声明）

/** 菜单项（与 Lit 版 DropdownItem 结构一致）。 */
export interface MenuItem {
  /** 唯一值。 */
  value?: string
  /** 标签文本（支持 HTML）。 */
  label?: string
  /** 图标（支持 HTML）。 */
  icon?: string
  /** 快捷键文本。 */
  shortcut?: string
  /** 是否禁用。 */
  disabled?: boolean
  /** 是否为危险操作。 */
  danger?: boolean
  /** 是否为分隔线。 */
  divider?: boolean
  /** 子菜单项。 */
  children?: MenuItem[]
}
