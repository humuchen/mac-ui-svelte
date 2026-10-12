// mac-progress 公共类型（独立成 .ts，保证 build:types 可生成声明）

/** 单个环配置（对应 Lit 版 CircleConfig）。 */
export interface CircleConfig {
  percentage: number
  color?: string
  strokeWidth?: number
}

/** 渐变色标。 */
export interface GradientStop {
  color: string
  offset?: number
}

/** 渐变配置（对应 Lit 版 GradientConfig）。 */
export interface GradientConfig {
  from?: string
  to?: string
  angle?: number
  stops?: GradientStop[]
}
