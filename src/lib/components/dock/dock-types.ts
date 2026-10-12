// mac-dock 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface DockItemData {
  id: string
  label: string
  color?: string
  iconSrc?: string
  running?: boolean
}
