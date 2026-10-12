// mac-radio-group 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}
