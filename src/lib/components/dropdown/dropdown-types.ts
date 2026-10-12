// mac-dropdown 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface DropdownItem {
  value: string
  label: string
  icon?: string
  disabled?: boolean
  danger?: boolean
  shortcut?: string
  divider?: boolean
  children?: DropdownItem[]
}
