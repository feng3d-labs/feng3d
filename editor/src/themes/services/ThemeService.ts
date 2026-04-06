/**
 * 主题服务
 * 用于加载和应用不同的主题文件
 */

import { ThemeMapper } from './ThemeMapper';
import { VSCodeColorTheme } from '../interfaces/ThemeDefinition';

interface ThemeData extends VSCodeColorTheme {}

export interface ThemeInfo {
  id: string;
  name: string;
  fileName: string;
  description: string;
}

export class ThemeService {
  private static instance: ThemeService;
  private themes: ThemeInfo[] = [];
  private themesInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private loadedThemes: Map<string, ThemeData> = new Map(); // 缓存已加载的主题

  private constructor() {
    // 立即开始初始化主题列表
    this.initPromise = this.initThemes();
  }

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private async initThemes() {
    try {
      // 从配置文件加载主题列表
      const response = await fetch('./resource/themes/themes.json');
      if (response.ok) {
        const config = await response.json();
        this.themes = config.themes.map((theme: any) => ({
          id: theme.id,
          name: theme.name,
          fileName: theme.fileName,
          description: theme.description
        }));
      } else {
        // 如果配置文件不可用，则使用默认主题列表
        this.themes = [
          { id: 'dark_modern', name: 'Default Dark Modern', fileName: 'dark_modern.json', description: 'Modern dark theme based on VSCode' },
          { id: 'dark_plus', name: 'Dark+', fileName: 'dark_plus.json', description: 'Dark+ theme based on VSCode' },
          { id: 'dark_vs', name: 'Dark Visual Studio', fileName: 'dark_vs.json', description: 'Dark Visual Studio theme' },
          { id: 'hc_black', name: 'High Contrast Black', fileName: 'hc_black.json', description: 'High contrast black theme' },
          { id: 'hc_light', name: 'High Contrast Light', fileName: 'hc_light.json', description: 'High contrast light theme' },
          { id: 'light_modern', name: 'Default Light Modern', fileName: 'light_modern.json', description: 'Modern light theme based on VSCode' },
          { id: 'light_plus', name: 'Light+', fileName: 'light_plus.json', description: 'Light+ theme based on VSCode' },
          { id: 'light_vs', name: 'Light Visual Studio', fileName: 'light_vs.json', description: 'Light Visual Studio theme' },
        ];
      }
    } catch (error) {
      console.error('Failed to load themes configuration:', error);
      // 出错时使用默认主题列表
      this.themes = [
        { id: 'dark_modern', name: 'Default Dark Modern', fileName: 'dark_modern.json', description: 'Modern dark theme based on VSCode' },
        { id: 'dark_plus', name: 'Dark+', fileName: 'dark_plus.json', description: 'Dark+ theme based on VSCode' },
        { id: 'dark_vs', name: 'Dark Visual Studio', fileName: 'dark_vs.json', description: 'Dark Visual Studio theme' },
        { id: 'hc_black', name: 'High Contrast Black', fileName: 'hc_black.json', description: 'High contrast black theme' },
        { id: 'hc_light', name: 'High Contrast Light', fileName: 'hc_light.json', description: 'High contrast light theme' },
        { id: 'light_modern', name: 'Default Light Modern', fileName: 'light_modern.json', description: 'Modern light theme based on VSCode' },
        { id: 'light_plus', name: 'Light+', fileName: 'light_plus.json', description: 'Light+ theme based on VSCode' },
        { id: 'light_vs', name: 'Light Visual Studio', fileName: 'light_vs.json', description: 'Light Visual Studio theme' },
      ];
    } finally {
      this.themesInitialized = true;
    }
  }

  /**
   * 等待主题列表初始化完成
   */
  public async waitForInitialization(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * 获取所有可用主题
   */
  public getThemes(): ThemeInfo[] {
    return this.themes;
  }

  /**
   * 获取主题详情
   */
  public getThemeInfo(themeId: string): ThemeInfo | undefined {
    return this.themes.find(theme => theme.id === themeId);
  }

  /**
   * 加载并应用主题
   */
  public async loadAndApplyTheme(themeId: string): Promise<void> {
    try {
      // 获取主题文件路径
      const themeInfo = this.getThemeInfo(themeId);
      if (!themeInfo) {
        throw new Error(`Theme ${themeId} not found`);
      }

      // 加载主题文件（处理 include 字段）
      const themeData = await this.loadThemeFile(themeInfo.fileName);

      // 映射 VSCode 主题到 CSS 变量
      const mappedTheme = ThemeMapper.mapVSCodeToCSSVariables(themeData);

      // 应用映射后的主题
      this.applyMappedTheme(mappedTheme, themeId);

      console.log(`Theme ${themeId} loaded and applied successfully`);
    } catch (error) {
      console.error(`Failed to load and apply theme ${themeId}:`, error);
      throw error;
    }
  }

  /**
   * 加载主题文件（支持 include 字段）
   */
  private async loadThemeFile(fileName: string): Promise<ThemeData> {
    // 检查缓存
    if (this.loadedThemes.has(fileName)) {
      return this.loadedThemes.get(fileName)!;
    }

    // 主题文件基础路径 - 使用相对路径
    const basePath = './resource/themes/';

    // 构建主题文件URL
    const themeUrl = basePath + fileName;

    try {
      const response = await fetch(themeUrl);
      if (!response.ok) {
        throw new Error(`Failed to load theme file: ${themeUrl}`);
      }

      const themeData: ThemeData = await response.json();

      // 如果主题文件包含 include 字段，需要先加载被继承的主题
      if (themeData.include) {
        const includePath = this.resolveIncludePath(themeData.include);
        const parentTheme = await this.loadThemeFile(includePath);

        // 合并颜色：父主题为基础，当前主题覆盖
        const parentColors = parentTheme.colors || {};
        const currentColors = themeData.colors || {};
        const mergedColors = { ...parentColors, ...currentColors };

        // 合并 tokenColors（如果存在）
        const parentTokenColors = parentTheme.tokenColors || [];
        const currentTokenColors = themeData.tokenColors || [];
        const mergedTokenColors = [...parentTokenColors];
        // 合并 tokenColors，当前主题的覆盖父主题的
        currentTokenColors.forEach(currentToken => {
          const index = mergedTokenColors.findIndex(t => t.name === currentToken.name);
          if (index >= 0) {
            mergedTokenColors[index] = currentToken;
          } else {
            mergedTokenColors.push(currentToken);
          }
        });

        // 返回合并后的主题数据
        const mergedTheme: ThemeData = {
          ...parentTheme,
          ...themeData,
          colors: mergedColors,
          tokenColors: mergedTokenColors
        };

        // 缓存合并后的主题
        this.loadedThemes.set(fileName, mergedTheme);
        return mergedTheme;
      }

      // 缓存主题
      this.loadedThemes.set(fileName, themeData);
      return themeData;
    } catch (error) {
      console.error(`Error loading theme file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * 解析 include 路径
   * 处理相对路径，如 "./dark_plus.json" -> "dark_plus.json"
   */
  private resolveIncludePath(includePath: string): string {
    // 移除 ./ 前缀
    let path = includePath.replace(/^\.\//, '');

    // 处理 ../ 前缀（简单处理，只去掉一层）
    if (path.startsWith('../')) {
      path = path.substring(3);
    }

    return path;
  }

  /**
   * 应用映射后的主题到CSS变量
   */
  private applyMappedTheme(mappedTheme: Record<string, string>, themeId: string): void {
    const root = document.documentElement;

    // 清除之前的主题变量
    this.clearThemeVariables(root);

    // 根据主题类型设置 data-theme 属性
    if (themeId.includes('light') || themeId.includes('hc_light')) {
      root.setAttribute('data-theme', 'light');
    } else {
      root.setAttribute('data-theme', 'dark');
    }

    // 应用映射后的主题变量
    Object.entries(mappedTheme).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value);
      }
    });

    // 保存主题ID到本地存储
    localStorage.setItem('editor-vscode-theme', themeId);
  }

  /**
   * 清除主题变量
   */
  private clearThemeVariables(root: HTMLElement): void {
    // 收集所有已设置的主题相关 CSS 变量
    const variablesToRemove: string[] = [];

    // VSCode 主题变量通常以这些前缀开头
    const prefixes = [
      'activityBar-', 'button-', 'checkbox-', 'debugToolBar-', 'descriptionForeground',
      'dropdown-', 'editor-', 'errorForeground', 'foreground', 'focusBorder',
      'icon-', 'input-', 'list-', 'panel-', 'scrollbarSlider-', 'sideBar-',
      'tab-', 'titleBar-', 'warningForeground', 'badge-', 'textLink-',
      'progressBar-', 'widget-', 'diffEditor-', 'editorGutter-', 'gitDecoration-',
      'notifications-', 'terminal-', 'charts-', 'breadcrumb-', 'minimap-',
      'peekView-', 'extensionButton-', 'quickInput-', 'walkthrough-', 'welcomePage-'
    ];

    // 检查所有内联样式
    const inlineStyle = root.style;
    for (let i = inlineStyle.length - 1; i >= 0; i--) {
      const propertyName = inlineStyle[i];
      if (propertyName && propertyName.startsWith('--')) {
        // 检查是否是主题相关的变量
        const varName = propertyName.substring(2); // 移除 --
        const isThemeVar = prefixes.some(prefix => varName.startsWith(prefix));
        if (isThemeVar) {
          variablesToRemove.push(propertyName);
        }
      }
    }

    // 清除旧的颜色变量（兼容旧版本）
    for (let i = 0; i < inlineStyle.length; i++) {
      const propertyName = inlineStyle[i];
      if (propertyName && (propertyName.startsWith('--color-') || propertyName.startsWith('--el-'))) {
        if (!variablesToRemove.includes(propertyName)) {
          variablesToRemove.push(propertyName);
        }
      }
    }

    // 移除所有收集到的变量
    variablesToRemove.forEach(varName => {
      root.style.removeProperty(varName);
    });
  }

  /**
   * 获取当前应用的主题ID
   */
  public getCurrentThemeId(): string | null {
    // 首先尝试从本地存储获取
    const savedThemeId = localStorage.getItem('editor-vscode-theme');
    if (savedThemeId) {
      return savedThemeId;
    }
    return null;
  }
}
