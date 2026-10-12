// mac-desktop 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface DesktopIconData {
  id: string
  label: string
  color?: string
  x?: number
  y?: number
  iconSrc?: string
}
