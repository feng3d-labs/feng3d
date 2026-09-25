/**
 * 主题映射服务
 * 将 VSCode 主题颜色直接映射为 CSS 变量
 * 变量名直接使用 VSCode 的原始颜色 key（如 button.background -> --button-background）
 */

import { VSCodeColorTheme } from '../interfaces/ThemeDefinition';

interface VSCodeTheme extends VSCodeColorTheme {}

export class ThemeMapper {
  /**
   * 将 VSCode 主题颜色映射为 CSS 变量
   * 变量名使用 VSCode 原始 key，将 . 替换为 -
   */
  public static mapVSCodeToCSSVariables(vscodeTheme: VSCodeTheme): Record<string, string> {
    const cssVariables: Record<string, string> = {};
    const colors = vscodeTheme.colors as Record<string, string>;

    // 遍历所有颜色，直接映射为 CSS 变量
    // VSCode key 格式: "button.background" -> CSS 变量: "--button-background"
    for (const [key, value] of Object.entries(colors)) {
      const cssVarName = `--${key.replace(/\./g, '-')}`;
      cssVariables[cssVarName] = value;
    }

    return cssVariables;
  }

  /**
   * 获取所有 VSCode 颜色键的列表
   */
  public static getVSCodeColorKeys(): string[] {
    return [
      'foreground',
      'background',
      'editor.background',
      'editor.foreground',
      'button.background',
      'button.foreground',
      'button.hoverBackground',
      'activityBar.background',
      'activityBar.foreground',
      'activityBar.inactiveForeground',
      'sideBar.background',
      'sideBar.foreground',
      'sideBar.border',
      'titleBar.activeBackground',
      'titleBar.activeForeground',
      'tab.activeBackground',
      'tab.activeForeground',
      'panel.background',
      'panel.foreground',
      'input.background',
      'input.foreground',
      'input.border',
      'input.placeholderForeground',
      'list.background',
      'list.foreground',
      'list.activeSelectionBackground',
      'list.activeSelectionForeground',
      'list.hoverBackground',
      'editor.selectionBackground',
      'editor.selectionForeground',
      'editor.inactiveSelectionBackground',
      'editorCursor.foreground',
      'editorLineNumber.foreground',
      'editorLineNumber.activeForeground',
      'editorIndentGuide.background',
      'editorIndentGuide.activeBackground',
      'editorError.foreground',
      'editorWarning.foreground',
      'editorInfo.foreground',
      'errorForeground',
      'warningForeground',
      'textLink.foreground',
      'descriptionForeground',
      'editorWidget.background',
      'editorWidget.foreground',
      'editorWidget.border',
      'scrollbarSlider.background',
      'scrollbarSlider.hoverBackground',
      'scrollbarSlider.activeBackground',
      'badge.background',
      'badge.foreground',
      'progressBar.background',
      'diffEditor.insertedTextBackground',
      'diffEditor.removedTextBackground',
      'editorGutter.addedBackground',
      'editorGutter.deletedBackground',
      'editorGutter.modifiedBackground',
      'gitDecoration.addedResourceForeground',
      'gitDecoration.modifiedResourceForeground',
      'gitDecoration.deletedResourceForeground',
    ];
  }

  /**
   * 获取常用颜色的默认值（用于回退）
   */
  public static getDefaultColors(): Record<string, string> {
    return {
      'foreground': '#cccccc',
      'background': '#1e1e1e',
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'button.background': '#0e639c',
      'button.foreground': '#ffffff',
      'button.hoverBackground': '#1177bb',
      'activityBar.background': '#2c2c2c',
      'activityBar.foreground': '#ffffff',
      'sideBar.background': '#252526',
      'sideBar.foreground': '#cccccc',
      'sideBar.border': '#2b2b2b',
      'titleBar.activeBackground': '#3c3c3c',
      'titleBar.activeForeground': '#cccccc',
      'panel.background': '#1e1e1e',
      'panel.foreground': '#cccccc',
      'input.background': '#3c3c3c',
      'input.foreground': '#cccccc',
      'input.border': 'transparent',
      'input.placeholderForeground': '#858585',
      'list.background': '#252526',
      'list.foreground': '#cccccc',
      'list.activeSelectionBackground': '#094771',
      'list.activeSelectionForeground': '#ffffff',
      'list.hoverBackground': '#2a2d2e',
      'editor.selectionBackground': '#264f78',
      'editor.selectionForeground': '#ffffff',
      'editorCursor.foreground': '#aeafad',
      'editorLineNumber.foreground': '#858585',
      'editorIndentGuide.background': '#e3e4e229',
      'errorForeground': '#f48771',
      'warningForeground': '#cca700',
      'textLink.foreground': '#3794ff',
      'descriptionForeground': '#858585',
    };
  }
}
