/**
 * 设计令牌配置
 * 使用 src/themes 中的 VSCode 主题颜色变量
 */

import { colorVariables } from '../../themes';

/**
 * 颜色设计令牌 - 使用 VSCode 语义化颜色变量
 * 所有颜色都来自 VSCode 主题系统
 */
export const colorTokens = {
  // 按钮
  buttonBackground: `var(${colorVariables.buttonBackground})`,
  buttonForeground: `var(${colorVariables.buttonForeground})`,
  buttonHoverBackground: `var(${colorVariables.buttonHoverBackground})`,

  // 编辑器
  editorBackground: `var(${colorVariables.editorBackground})`,
  editorForeground: `var(${colorVariables.editorForeground})`,

  // 面板
  panelBackground: `var(${colorVariables.panelBackground})`,
  panelForeground: `var(${colorVariables.panelForeground})`,

  // 侧边栏
  sideBarBackground: `var(${colorVariables.sideBarBackground})`,
  sideBarForeground: `var(${colorVariables.sideBarForeground})`,
  sideBarBorder: `var(${colorVariables.sideBarBorder})`,

  // 输入框
  inputBackground: `var(${colorVariables.inputBackground})`,
  inputForeground: `var(${colorVariables.inputForeground})`,
  inputBorder: `var(${colorVariables.inputBorder})`,
  inputPlaceholderForeground: `var(${colorVariables.inputPlaceholderForeground})`,

  // 列表
  listBackground: `var(${colorVariables.listBackground})`,
  listForeground: `var(${colorVariables.listForeground})`,
  listActiveSelectionBackground: `var(${colorVariables.listActiveSelectionBackground})`,
  listActiveSelectionForeground: `var(${colorVariables.listActiveSelectionForeground})`,
  listHoverBackground: `var(${colorVariables.listHoverBackground})`,

  // 边框
  editorWidgetBorder: `var(${colorVariables.editorWidgetBorder})`,

  // 状态颜色
  errorForeground: `var(${colorVariables.errorForeground})`,
  warningForeground: `var(${colorVariables.warningForeground})`,
  infoForeground: `var(${colorVariables.infoForeground})`,

  // 文本颜色
  foreground: `var(${colorVariables.foreground})`,
  descriptionForeground: `var(${colorVariables.descriptionForeground})`,

  // 链接
  textLinkForeground: `var(${colorVariables.textLinkForeground})`,

  // 标题栏
  titleBarActiveBackground: `var(${colorVariables.titleBarActiveBackground})`,
  titleBarActiveForeground: `var(${colorVariables.titleBarActiveForeground})`,

  // 选项卡
  tabActiveBackground: `var(${colorVariables.tabActiveBackground})`,
  tabActiveForeground: `var(${colorVariables.tabActiveForeground})`,
  tabInactiveBackground: `var(${colorVariables.tabInactiveBackground})`,
  tabInactiveForeground: `var(${colorVariables.tabInactiveForeground})`,

  // 选择区域
  editorSelectionBackground: `var(${colorVariables.editorSelectionBackground})`,
  editorSelectionForeground: `var(${colorVariables.editorSelectionForeground})`,

  // 行号
  editorLineNumberForeground: `var(${colorVariables.editorLineNumberForeground})`,

  // 滚动条
  scrollbarSliderBackground: `var(${colorVariables.scrollbarSliderBackground})`,

} as const;

/**
 * 间距设计令牌
 */
export const spacingTokens = {
  unit: 8,
  scale: [4, 8, 12, 16, 24, 32, 48, 64] as const,
} as const;

/**
 * 字体设计令牌
 */
export const typographyTokens = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSizes: [12, 14, 16, 18, 20, 24, 28, 32] as const,
} as const;

/**
 * 获取间距值
 * @param index 间距索引（0-7）
 * @returns 间距值（px）
 */
export function getSpacing(index: number): number {
  if (index >= 0 && index < spacingTokens.scale.length) {
    return spacingTokens.scale[index];
  }
  return spacingTokens.unit;
}

/**
 * 获取字体大小
 * @param index 字体大小索引（0-7）
 * @returns 字体大小（px）
 */
export function getFontSize(index: number): number {
  if (index >= 0 && index < typographyTokens.fontSizes.length) {
    return typographyTokens.fontSizes[index];
  }
  return typographyTokens.fontSizes[1]; // 默认 14px
}
