/**
 * VSCode 主题配置文件接口定义
 * 定义了 VSCode 颜色主题 JSON 文件的结构和字段含义
 */

/**
 * 颜色主题配置的主要接口
 */
export interface VSCodeColorTheme {
  /**
   * JSON Schema 引用，用于验证主题配置文件结构
   * 值通常是 "vscode://schemas/color-theme"
   */
  $schema?: string;

  /**
   * 主题的显示名称
   * 例如："Default Dark Modern"
   */
  name: string;

  /**
   * 继承的父主题路径
   * 可以使用相对路径如 "./dark_plus.json"
   * 主题会继承该文件中的所有颜色定义，并可以覆盖特定颜色
   */
  include?: string;

  /**
   * 颜色定义对象
   * 键是 VSCode 预定义的颜色令牌（Color Tokens）
   * 值是具体的颜色值，支持十六进制、RGB、RGBA 等格式
   */
  colors: ColorDefinitions;

  /**
   * 语义高亮颜色定义（可选）
   * 用于定义语法高亮的颜色
   */
  tokenColors?: TokenColor[];

  /**
   * 主题的唯一标识符（可选）
   */
  readonly?: boolean;

  /**
   * 主题的适用范围（可选）
   */
  uiTheme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
}

/**
 * 颜色定义接口
 * 定义了 VSCode UI 各个部分的颜色
 */
export interface ColorDefinitions {
  // 活动栏颜色
  /** 活动栏活动项目边框颜色 */
  'activityBar.activeBorder'?: string;
  /** 活动栏背景色 */
  'activityBar.background'?: string;
  /** 活动栏边框颜色 */
  'activityBar.border'?: string;
  /** 活动栏前景色 */
  'activityBar.foreground'?: string;
  /** 活动栏非活动项前景色 */
  'activityBar.inactiveForeground'?: string;
  /** 活动栏徽章背景色 */
  'activityBarBadge.background'?: string;
  /** 活动栏徽章前景色 */
  'activityBarBadge.foreground'?: string;

  // 徽章颜色
  /** 徽章背景色 */
  'badge.background'?: string;
  /** 徽章前景色 */
  'badge.foreground'?: string;

  // 按钮颜色
  /** 按钮背景色 */
  'button.background'?: string;
  /** 按钮边框颜色 */
  'button.border'?: string;
  /** 按钮前景色 */
  'button.foreground'?: string;
  /** 按钮悬停背景色 */
  'button.hoverBackground'?: string;
  /** 次要按钮背景色 */
  'button.secondaryBackground'?: string;
  /** 次要按钮前景色 */
  'button.secondaryForeground'?: string;
  /** 次要按钮悬停背景色 */
  'button.secondaryHoverBackground'?: string;

  // 下拉菜单颜色
  /** 下拉菜单背景色 */
  'dropdown.background'?: string;
  /** 下拉菜单边框颜色 */
  'dropdown.border'?: string;
  /** 下拉菜单前景色 */
  'dropdown.foreground'?: string;
  /** 下拉菜单列表背景色 */
  'dropdown.listBackground'?: string;

  // 编辑器颜色
  /** 编辑器背景色 */
  'editor.background'?: string;
  /** 编辑器前景色 */
  'editor.foreground'?: string;
  /** 编辑器查找匹配项背景色 */
  'editor.findMatchBackground'?: string;
  /** 编辑器组边框颜色 */
  'editorGroup.border'?: string;
  /** 编辑器组标签页背景色 */
  'editorGroupHeader.tabsBackground'?: string;
  /** 编辑器组标签页边框颜色 */
  'editorGroupHeader.tabsBorder'?: string;
  /** 编辑器标记添加行的背景色 */
  'editorGutter.addedBackground'?: string;
  /** 编辑器标记删除行的背景色 */
  'editorGutter.deletedBackground'?: string;
  /** 编辑器标记修改行的背景色 */
  'editorGutter.modifiedBackground'?: string;
  /** 编辑器行号活动行前景色 */
  'editorLineNumber.activeForeground'?: string;
  /** 编辑器行号前景色 */
  'editorLineNumber.foreground'?: string;
  /** 编辑器概览标尺边框颜色 */
  'editorOverviewRuler.border'?: string;
  /** 编辑器小部件背景色 */
  'editorWidget.background'?: string;

  // 输入框颜色
  /** 输入框背景色 */
  'input.background'?: string;
  /** 输入框边框颜色 */
  'input.border'?: string;
  /** 输入框前景色 */
  'input.foreground'?: string;
  /** 输入框占位符前景色 */
  'input.placeholderForeground'?: string;

  // 菜单颜色
  /** 菜单背景色 */
  'menu.background'?: string;
  /** 菜单选中项背景色 */
  'menu.selectionBackground'?: string;

  // 通知颜色
  /** 通知中心头部背景色 */
  'notificationCenterHeader.background'?: string;
  /** 通知中心头部前景色 */
  'notificationCenterHeader.foreground'?: string;
  /** 通知背景色 */
  'notifications.background'?: string;
  /** 通知边框颜色 */
  'notifications.border'?: string;
  /** 通知前景色 */
  'notifications.foreground'?: string;

  // 面板颜色
  /** 面板背景色 */
  'panel.background'?: string;
  /** 面板边框颜色 */
  'panel.border'?: string;
  /** 面板输入框边框颜色 */
  'panelInput.border'?: string;
  /** 面板标签活动边框颜色 */
  'panelTitle.activeBorder'?: string;
  /** 面板标签活动前景色 */
  'panelTitle.activeForeground'?: string;
  /** 面板标签非活动前景色 */
  'panelTitle.inactiveForeground'?: string;

  // 侧边栏颜色
  /** 侧边栏背景色 */
  'sideBar.background'?: string;
  /** 侧边栏边框颜色 */
  'sideBar.border'?: string;
  /** 侧边栏前景色 */
  'sideBar.foreground'?: string;
  /** 侧边栏区头背景色 */
  'sideBarSectionHeader.background'?: string;
  /** 侧边栏区头边框颜色 */
  'sideBarSectionHeader.border'?: string;
  /** 侧边栏区头前景色 */
  'sideBarSectionHeader.foreground'?: string;
  /** 侧边栏标题前景色 */
  'sideBarTitle.foreground'?: string;

  // 状态栏颜色
  /** 状态栏背景色 */
  'statusBar.background'?: string;
  /** 状态栏边框颜色 */
  'statusBar.border'?: string;
  /** 状态栏悬停背景色 */
  'statusBarItem.hoverBackground'?: string;
  /** 状态栏悬停前景色 */
  'statusBarItem.hoverForeground'?: string;
  /** 状态栏调试背景色 */
  'statusBar.debuggingBackground'?: string;
  /** 状态栏调试前景色 */
  'statusBar.debuggingForeground'?: string;
  /** 状态栏焦点边框颜色 */
  'statusBar.focusBorder'?: string;
  /** 状态栏前景色 */
  'statusBar.foreground'?: string;
  /** 状态栏无文件夹背景色 */
  'statusBar.noFolderBackground'?: string;
  /** 状态栏焦点边框颜色 */
  'statusBarItem.focusBorder'?: string;
  /** 状态栏显著背景色 */
  'statusBarItem.prominentBackground'?: string;
  /** 状态栏远程背景色 */
  'statusBarItem.remoteBackground'?: string;
  /** 状态栏远程前景色 */
  'statusBarItem.remoteForeground'?: string;

  // 标签页颜色
  /** 活动标签页背景色 */
  'tab.activeBackground'?: string;
  /** 活动标签页边框颜色 */
  'tab.activeBorder'?: string;
  /** 活动标签页顶部边框颜色 */
  'tab.activeBorderTop'?: string;
  /** 活动标签页前景色 */
  'tab.activeForeground'?: string;
  /** 选定标签页顶部边框颜色 */
  'tab.selectedBorderTop'?: string;
  /** 标签页边框颜色 */
  'tab.border'?: string;
  /** 标签页悬停背景色 */
  'tab.hoverBackground'?: string;
  /** 非活动标签页背景色 */
  'tab.inactiveBackground'?: string;
  /** 非活动标签页前景色 */
  'tab.inactiveForeground'?: string;
  /** 未聚焦活动标签页边框颜色 */
  'tab.unfocusedActiveBorder'?: string;
  /** 未聚焦活动标签页顶部边框颜色 */
  'tab.unfocusedActiveBorderTop'?: string;
  /** 未聚焦标签页悬停背景色 */
  'tab.unfocusedHoverBackground'?: string;

  // 终端颜色
  /** 终端前景色 */
  'terminal.foreground'?: string;
  /** 终端活动标签页边框颜色 */
  'terminal.tab.activeBorder'?: string;

  // 文本颜色
  /** 块引用背景色 */
  'textBlockQuote.background'?: string;
  /** 块引用边框颜色 */
  'textBlockQuote.border'?: string;
  /** 代码块背景色 */
  'textCodeBlock.background'?: string;
  /** 文本链接活动前景色 */
  'textLink.activeForeground'?: string;
  /** 文本链接前景色 */
  'textLink.foreground'?: string;
  /** 预格式化文本前景色 */
  'textPreformat.foreground'?: string;
  /** 预格式化文本背景色 */
  'textPreformat.background'?: string;
  /** 文本分隔符前景色 */
  'textSeparator.foreground'?: string;

  // 标题栏颜色
  /** 活动标题栏背景色 */
  'titleBar.activeBackground'?: string;
  /** 活动标题栏前景色 */
  'titleBar.activeForeground'?: string;
  /** 标题栏边框颜色 */
  'titleBar.border'?: string;
  /** 非活动标题栏背景色 */
  'titleBar.inactiveBackground'?: string;
  /** 非活动标题栏前景色 */
  'titleBar.inactiveForeground'?: string;

  // 欢迎页面颜色
  /** 欢迎页面瓦片背景色 */
  'welcomePage.tileBackground'?: string;
  /** 欢迎页面进度前景色 */
  'welcomePage.progress.foreground'?: string;

  // 小组件颜色
  /** 小组件边框颜色 */
  'widget.border'?: string;

  // 其他颜色
  /** 错误前景色 */
  'errorForeground'?: string;
  /** 焦点边框颜色 */
  'focusBorder'?: string;
  /** 前景色 */
  'foreground'?: string;
  /** 图标前景色 */
  'icon.foreground'?: string;
  /** 描述前景色 */
  'descriptionForeground'?: string;
  /** 聊天斜杠命令背景色 */
  'chat.slashCommandBackground'?: string;
  /** 聊天斜杠命令前景色 */
  'chat.slashCommandForeground'?: string;
  /** 聊天编辑文件前景色 */
  'chat.editedFileForeground'?: string;
  /** 复选框背景色 */
  'checkbox.background'?: string;
  /** 复选框边框色 */
  'checkbox.border'?: string;
  /** 调试工具栏背景色 */
  'debugToolBar.background'?: string;
  /** 输入选项活动背景色 */
  'inputOption.activeBackground'?: string;
  /** 输入选项活动边框色 */
  'inputOption.activeBorder'?: string;
  /** 键绑定标签前景色 */
  'keybindingLabel.foreground'?: string;
  /** 弹出查看器编辑器背景色 */
  'peekViewEditor.background'?: string;
  /** 弹出查看器编辑器匹配高亮背景色 */
  'peekViewEditor.matchHighlightBackground'?: string;
  /** 弹出查看结果背景色 */
  'peekViewResult.background'?: string;
  /** 弹出查看结果匹配高亮背景色 */
  'peekViewResult.matchHighlightBackground'?: string;
  /** 选择器组边框色 */
  'pickerGroup.border'?: string;
  /** 进度条背景色 */
  'progressBar.background'?: string;
  /** 快速输入背景色 */
  'quickInput.background'?: string;
  /** 快速输入前景色 */
  'quickInput.foreground'?: string;
  /** 设置下拉背景色 */
  'settings.dropdownBackground'?: string;
  /** 设置下拉边框色 */
  'settings.dropdownBorder'?: string;
  /** 设置标题前景色 */
  'settings.headerForeground'?: string;
  /** 设置修改项目指示器色 */
  'settings.modifiedItemIndicator'?: string;
}

/**
 * 语法标记颜色定义接口
 */
export interface TokenColor {
  /** 标记名称或作用域 */
  name?: string;
  /** 标记的作用域数组 */
  scope?: string | string[];
  /** 标记的颜色设置 */
  settings: TokenColorSettings;
}

/**
 * 语法标记颜色设置接口
 */
export interface TokenColorSettings {
  /** 前景色 */
  foreground?: string;
  /** 背景色 */
  background?: string;
  /** 字体样式 */
  fontStyle?: 'normal' | 'italic' | 'bold' | 'underline' | string;
}