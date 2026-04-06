/**
 * VSCode 主题颜色常量
 * 导出所有 VSCode 主题颜色的 CSS 变量名
 * 使用方式: colorVariables.sideBarBackground -> CSS: var(--sideBar-background)
 */

/**
 * VSCode 主题颜色变量名
 * 对应 CSS 变量格式: --{key} (如 sideBar.background -> --sideBar-background)
 */
export const colorVariables = {
  // 全局基础颜色
  foreground: '--foreground',
  background: '--background',

  // 编辑器区域
  editorBackground: '--editor-background',
  editorForeground: '--editor-foreground',

  // 编辑器行号
  editorLineNumberBackground: '--editor-lineNumber-background',
  editorLineNumberForeground: '--editor-lineNumber-foreground',
  editorLineNumberActiveForeground: '--editorLineNumber-activeForeground',

  // 编辑器选择
  editorSelectionBackground: '--editor-selectionBackground',
  editorSelectionForeground: '--editor-selectionForeground',
  editorInactiveSelectionBackground: '--editor-inactiveSelectionBackground',

  // 编辑器光标
  editorCursorForeground: '--editorCursor-foreground',

  // 活动栏 (Activity Bar - 最左侧)
  activityBarBackground: '--activityBar-background',
  activityBarForeground: '--activityBar-foreground',
  activityBarInactiveForeground: '--activityBar-inactiveForeground',
  activityBarActiveBorder: '--activityBar-activeBorder',
  activityBarActiveBackground: '--activityBar-activeBackground',

  // 侧边栏 (Side Bar - 左侧面板)
  sideBarBackground: '--sideBar-background',
  sideBarForeground: '--sideBar-foreground',
  sideBarBorder: '--sideBar-border',

  // 侧边栏标题
  sideBarTitleForeground: '--sideBarTitle-foreground',

  // 侧边栏章节头部
  sideBarSectionHeaderBackground: '--sideBarSectionHeader-background',
  sideBarSectionHeaderForeground: '--sideBarSectionHeader-foreground',

  // 标题栏 (Title Bar - 顶部)
  titleBarActiveBackground: '--titleBar-activeBackground',
  titleBarActiveForeground: '--titleBar-activeForeground',
  titleBarInactiveBackground: '--titleBar-inactiveBackground',
  titleBarInactiveForeground: '--titleBar-inactiveForeground',
  titleBarBorder: '--titleBar-border',

  // 选项卡 (Tabs - 编辑器顶部)
  tabActiveForeground: '--tab-activeForeground',
  tabInactiveForeground: '--tab-inactiveForeground',
  tabActiveBackground: '--tab-activeBackground',
  tabInactiveBackground: '--tab-inactiveBackground',
  tabActiveBorder: '--tab-activeBorder',
  tabUnfocusedActiveForeground: '--tab-unfocusedActiveForeground',
  tabUnfocusedInactiveForeground: '--tab-unfocusedInactiveForeground',

  // 选项卡边框
  tabBorder: '--tab-border',

  // 编辑器组 (Editor Groups)
  editorGroupBorder: '--editorGroup-border',
  editorGroupDropBackground: '--editorGroup-dropBackground',

  // 面板 (Panel - 底部)
  panelBackground: '--panel-background',
  panelForeground: '--panel-foreground',
  panelBorder: '--panel-border',
  panelTitleActiveBorder: '--panelTitle-activeBorder',
  panelTitleInactiveForeground: '--panelTitle-inactiveForeground',
  panelTitleActiveForeground: '--panelTitle-activeForeground',
  panelSectionHeaderBackground: '--panelSectionHeader-background',
  panelSectionHeaderForeground: '--panelSectionHeader-foreground',

  // 编辑器小部件 (Editor Widgets - 悬浮面板)
  editorWidgetBackground: '--editorWidget-background',
  editorWidgetForeground: '--editorWidget-foreground',
  editorWidgetBorder: '--editorWidget-border',

  // 按钮
  buttonBackground: '--button-background',
  buttonForeground: '--button-foreground',
  buttonHoverBackground: '--button-hoverBackground',
  buttonSecondaryForeground: '--button-secondaryForeground',
  buttonSecondaryBackground: '--button-secondaryBackground',
  buttonSecondaryHoverBackground: '--button-secondaryHoverBackground',

  // 输入框
  inputBackground: '--input-background',
  inputForeground: '--input-foreground',
  inputBorder: '--input-border',
  inputPlaceholderForeground: '--input-placeholderForeground',
  inputOptionActiveBackground: '--inputOption-activeBackground',
  inputOptionActiveForeground: '--inputOption-activeForeground',
  inputOptionHoverBackground: '--inputOption-hoverBackground',

  // 下拉框
  dropdownBackground: '--dropdown-background',
  dropdownForeground: '--dropdown-foreground',
  dropdownBorder: '--dropdown-border',

  // 列表
  listBackground: '--list-background',
  listForeground: '--list-foreground',
  listActiveSelectionBackground: '--list-activeSelectionBackground',
  listActiveSelectionForeground: '--list-activeSelectionForeground',
  listInactiveSelectionBackground: '--list-inactiveSelectionBackground',
  listInactiveSelectionForeground: '--list-inactiveSelectionForeground',
  listHoverBackground: '--list-hoverBackground',
  listHoverForeground: '--list-hoverForeground',
  listFocusHighlightForeground: '--list-focusHighlightForeground',
  listFocusOutline: '--list-focusOutline',

  // 滚动条
  scrollbarSliderBackground: '--scrollbarSlider-background',
  scrollbarSliderHoverBackground: '--scrollbarSlider-hoverBackground',
  scrollbarSliderActiveBackground: '--scrollbarSlider-activeBackground',
  scrollbarShadow: '--scrollbar-shadow',

  // Badge (徽章)
  badgeBackground: '--badge-background',
  badgeForeground: '--badge-foreground',

  // 进度条
  progressBarBackground: '--progressBar-background',

  // 编辑器 CodeLens
  editorCodeLensForeground: '--editorCodeLens-foreground',
  editorCodeLensActiveForeground: '--editorCodeLens-activeForeground',

  // 编辑器光标粗体
  editorCursorBackground: '--editorCursor-background',

  // 编辑器搜索匹配
  editorFindMatchBackground: '--editor-findMatchBackground',
  editorFindMatchForeground: '--editor-findMatchForeground',
  editorFindMatchHighlightBackground: '--editor-findMatchHighlightBackground',
  editorFindMatchHighlightForeground: '--editor-findMatchHighlightForeground',
  editorFindRangeHighlightBackground: '--editor-findRangeHighlightBackground',
  editorFindRangeHighlightForeground: '--editor-findRangeHighlightForeground',

  // 编辑器悬停
  editorHoverWidgetBackground: '--editorHoverWidget-background',
  editorHoverWidgetBorder: '--editorHoverWidget-border',
  editorHoverWidgetStatusBarBackground: '--editorHoverWidget-statusBar-background',

  // 编辑器链接
  textLinkForeground: '--textLink-foreground',
  textLinkActiveForeground: '--textLink-activeForeground',

  // 编辑器概览标尺
  editorOverviewRulerBorder: '--editorOverviewRuler-border',

  // 编辑器折叠
  editorFoldBackground: '--editor-fold-background',

  // 编辑器内联提示
  editorInlayForeground: '--editorInlay-foreground',
  editorInlayBackground: '--editorInlay-background',
  editorInlayParameterForeground: '--editorInlay-parameterForeground',
  editorInlayTypeForeground: '--editorInlay-typeForeground',

  // 警告信息
  errorForeground: '--errorForeground',
  errorForeground1: '--errorForeground-1',
  errorBackground: '--error-background',
  warningForeground: '--warningForeground',
  warningForeground1: '--warningForeground-1',
  warningBackground: '--warning-background',
  infoForeground: '--infoForeground',
  infoForeground1: '--infoForeground-1',
  infoBackground: '--info-background',
  hintForeground: '--hintForeground',
  hintForeground1: '--hintForeground-1',
  hintBackground: '--hint-background',

  // Editor Gutter (行号区域)
  editorGutterAddedBackground: '--editorGutter-addedBackground',
  editorGutterDeletedBackground: '--editorGutter-deletedBackground',
  editorGutterModifiedBackground: '--editorGutter-modifiedBackground',

  // Diff 颜色
  diffEditorInsertedTextBackground: '--diffEditor-insertedTextBackground',
  diffEditorRemovedTextBackground: '--diffEditor-removedTextBackground',
  diffEditorInsertedLineBackground: '--diffEditor-insertedLineBackground',
  diffEditorRemovedLineBackground: '--diffEditor-removedLineBackground',
  diffEditorDiagonalFill: '--diffEditor-diagonalFill',

  // 描述性文本
  descriptionForeground: '--descriptionForeground',

  // 图标颜色
  iconForeground: '--icon-foreground',

  // 调试工具栏
  debugToolBarBackground: '--debugToolBar-background',
  debugToolBarForeground: '--debugToolBar-foreground',

  // Git 颜色
  gitDecorationAddedResourceForeground: '--gitDecoration-addedResourceForeground',
  gitDecorationModifiedResourceForeground: '--gitDecoration-modifiedResourceForeground',
  gitDecorationDeletedResourceForeground: '--gitDecoration-deletedResourceForeground',
  gitDecorationRenamedResourceForeground: '--gitDecoration-renamedResourceForeground',
  gitDecorationUntrackedResourceForeground: '--gitDecoration-untrackedResourceForeground',
  gitDecorationIgnoredResourceForeground: '--gitDecoration-ignoredResourceForeground',
  gitDecorationConflictedResourceForeground: '--gitDecoration-conflictedResourceForeground',
  gitDecorationSubmoduleResourceForeground: '--gitDecoration-submoduleResourceForeground',

  // 通知
  notificationsForeground: '--notificationsForeground',
  notificationsBackground: '--notifications-background',
  notificationsBorder: '--notifications-border',
  notificationsErrorIconForeground: '--notificationsErrorIcon-foreground',
  notificationsWarningIconForeground: '--notificationsWarningIcon-foreground',
  notificationsInfoIconForeground: '--notificationsInfoIcon-foreground',

  // 扩展按钮
  extensionButtonProminentBackground: '--extensionButton-prominentBackground',
  extensionButtonProminentForeground: '--extensionButton-prominentForeground',
  extensionButtonProminentHoverBackground: '--extensionButton-prominentHoverBackground',

  // 快速选择
  quickInputBackground: '--quickInput-background',
  quickInputForeground: '--quickInput-foreground',

  // Terminal 集成
  terminalForeground: '--terminal-foreground',
  terminalBackground: '--terminal-background',
  terminalSelectionBackground: '--terminal-selectionBackground',
  terminalBorder: '--terminal-border',
  terminalDropBackground: '--terminal-dropBackground',

  // Terminal ANSI 颜色
  terminalAnsiBlack: '--terminal-ansiBlack',
  terminalAnsiRed: '--terminal-ansiRed',
  terminalAnsiGreen: '--terminal-ansiGreen',
  terminalAnsiYellow: '--terminal-ansiYellow',
  terminalAnsiBlue: '--terminal-ansiBlue',
  terminalAnsiMagenta: '--terminal-ansiMagenta',
  terminalAnsiCyan: '--terminal-ansiCyan',
  terminalAnsiWhite: '--terminal-ansiWhite',
  terminalAnsiBrightBlack: '--terminal-ansiBrightBlack',
  terminalAnsiBrightRed: '--terminal-ansiBrightRed',
  terminalAnsiBrightGreen: '--terminal-ansiBrightGreen',
  terminalAnsiBrightYellow: '--terminal-ansiBrightYellow',
  terminalAnsiBrightBlue: '--terminal-ansiBrightBlue',
  terminalAnsiBrightMagenta: '--terminal-ansiBrightMagenta',
  terminalAnsiBrightCyan: '--terminal-ansiBrightCyan',
  terminalAnsiBrightWhite: '--terminal-ansiBrightWhite',

  // 图表颜色
  chartsForeground: '--charts-foreground',
  chartsLines: '--charts-lines',
  chartsRed: '--charts-red',
  chartsBlue: '--charts-blue',
  chartsYellow: '--charts-yellow',
  chartsOrange: '--charts-orange',
  chartsGreen: '--charts-green',
  chartsPurple: '--charts-purple',

  // 状态栏 (Status Bar - 底部)
  statusBarForeground: '--statusBar-foreground',
  statusBarBackground: '--statusBar-background',
  statusBarBorder: '--statusBar-border',
  statusBarNoFolderBackground: '--statusBar-noFolderBackground',
  statusBarNoFolderForeground: '--statusBar-noFolderForeground',
  statusBarDebuggingBackground: '--statusBar-debuggingBackground',
  statusBarDebuggingForeground: '--statusBar-debuggingForeground',

  // Breadcrumb 面包屑导航
  breadcrumbForeground: '--breadcrumb-foreground',
  breadcrumbBackground: '--breadcrumb-background',
  breadcrumbFocusForeground: '--breadcrumb-focusForeground',
  breadcrumbActiveSelectionForeground: '--breadcrumb-activeSelectionForeground',

  // Minimap
  editorMinimapBackground: '--editorMinimap-background',
  editorMinimapFindMatchHighlight: '--editorMinimap-findMatchHighlight',
  editorMinimapSelectionHighlight: '--editorMinimap-selectionHighlight',
  editorMinimapErrorForeground: '--editorMinimap-errorForeground',
  editorMinimapWarningForeground: '--editorMinimap-warningForeground',

  // Bracket Pair Colorization
  editorBracketMatchBackground: '--editorBracketMatch-background',
  editorBracketMatchBorder: '--editorBracketMatch-border',

  // Ruler
  editorRulerForeground: '--editor-rulerForeground',

  // 行高亮
  editorLineHighlightBackground: '--editor-lineHighlightBackground',
  editorLineHighlightBorder: '--editor-lineHighlightBorder',

  // 符号图标颜色
  symbolIconArrayForeground: '--symbolIcon-arrayForeground',
  symbolIconBooleanForeground: '--symbolIcon-booleanForeground',
  symbolIconClassForeground: '--symbolIcon-classForeground',
  symbolIconColorForeground: '--symbolIcon-colorForeground',
  symbolIconConstantForeground: '--symbolIcon-constantForeground',
  symbolIconConstructorForeground: '--symbolIcon-constructorForeground',
  symbolIconEnumeratorForeground: '--symbolIcon-enumeratorForeground',
  symbolIconEnumeratorMemberForeground: '--symbolIcon-enumeratorMemberForeground',
  symbolIconEventForeground: '--symbolIcon-eventForeground',
  symbolIconFieldForeground: '--symbolIcon-fieldForeground',
  symbolIconFileForeground: '--symbolIcon-fileForeground',
  symbolIconFolderForeground: '--symbolIcon-folderForeground',
  symbolIconFunctionForeground: '--symbolIcon-functionForeground',
  symbolIconInterfaceForeground: '--symbolIcon-interfaceForeground',
  symbolIconKeyForeground: '--symbolIcon-keyForeground',
  symbolIconKeywordForeground: '--symbolIcon-keywordForeground',
  symbolIconMethodForeground: '--symbolIcon-methodForeground',
  symbolIconModuleForeground: '--symbolIcon-moduleForeground',
  symbolIconNamespaceForeground: '--symbolIcon-namespaceForeground',
  symbolIconNullForeground: '--symbolIcon-nullForeground',
  symbolIconNumberForeground: '--symbolIcon-numberForeground',
  symbolIconObjectForeground: '--symbolIcon-objectForeground',
  symbolIconOperatorForeground: '--symbolIcon-operatorForeground',
  symbolIconPackageForeground: '--symbolIcon-packageForeground',
  symbolIconPropertyForeground: '--symbolIcon-propertyForeground',
  symbolIconReferenceForeground: '--symbolIcon-referenceForeground',
  symbolIconSnippetForeground: '--symbolIcon-snippetForeground',
  symbolIconStringForeground: '--symbolIcon-stringForeground',
  symbolIconStructForeground: '--symbolIcon-structForeground',
  symbolIconTextForeground: '--symbolIcon-textForeground',
  symbolIconTypeParameterForeground: '--symbolIcon-typeParameterForeground',
  symbolIconUnitForeground: '--symbolIcon-unitForeground',
  symbolIconVariableForeground: '--symbolIcon-variableForeground',
} as const;

/**
 * 获取颜色变量的 CSS var() 表达式
 */
export function getColorVar(variableName: keyof typeof colorVariables): string {
  return `var(${colorVariables[variableName]})`;
}

/**
 * VSCode 主题颜色类型
 */
export type VSCodeColorVariable = keyof typeof colorVariables;
