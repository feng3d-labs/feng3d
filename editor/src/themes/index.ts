/**
 * 主题系统模块入口
 */

export { ThemeService } from './services/ThemeService';
export { ThemeMapper } from './services/ThemeMapper';
export { colorVariables, getColorVar } from './colorVariables';
export type { VSCodeColorTheme } from './interfaces/ThemeDefinition';
export type { VSCodeColorVariable } from './colorVariables';

// 导出类型定义
export type { ThemeInfo } from './services/ThemeService';
