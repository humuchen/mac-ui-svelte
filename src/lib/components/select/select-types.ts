// mac-select 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: string
  description?: string
}

export interface OptionGroup {
  label: string
  options: SelectOption[]
}
