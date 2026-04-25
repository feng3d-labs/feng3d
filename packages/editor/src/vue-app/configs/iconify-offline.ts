/**
 * Iconify 完全离线模式配置
 * 预加载项目中使用的图标集，完全禁用 API 请求
 */
import { addCollection, _api } from '@iconify/iconify';

// 项目中使用的图标集列表
const iconSets = ['mdi', 'material-symbols'];

/**
 * 配置完全离线模式
 * 禁用所有 API 请求，只使用本地预加载的图标
 */
export function configureOfflineMode() {
  // 使用 _api.setFetch 禁用所有 API 请求
  _api.setFetch(async (url: string) => {
    // 拦截所有 API 请求，返回空响应
    // 图标将从预加载的本地数据中获取
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found (Offline Mode)',
      headers: new Headers(),
      json: async () => ({}),
      text: async () => ''
    } as Response;
  });
}

/**
 * 预加载图标集
 * 从 iconify 目录加载 JSON 文件（由 Vite 插件复制到构建目录）
 * 使用相对路径，与 index.html 处于同一层级
 */
export async function loadIconSets() {
  const loadedSets: string[] = [];
  const failedSets: string[] = [];

  // 预加载图标集
  for (const iconSet of iconSets) {
    try {
      // 使用相对路径，与 index.html 处于同一层级
      // 构建后 iconify/*.json 与 assets/*.js 在同一目录
      const response = await fetch(`./iconify/${iconSet}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const collection = await response.json();
      if (collection) {
        addCollection(collection);
        loadedSets.push(iconSet);
        console.log(`[Iconify] ✓ 已加载图标集: ${iconSet}`);
      }
    } catch (error) {
      failedSets.push(iconSet);
      console.warn(`[Iconify] ✗ 无法加载图标集 ${iconSet}:`, error);
    }
  }

  if (loadedSets.length > 0) {
    console.log(`[Iconify] 离线模式已启用，已加载 ${loadedSets.length} 个图标集`);
  }
  if (failedSets.length > 0) {
    console.warn(`[Iconify] 警告: ${failedSets.length} 个图标集加载失败`);
  }

  return { loadedSets, failedSets };
}

