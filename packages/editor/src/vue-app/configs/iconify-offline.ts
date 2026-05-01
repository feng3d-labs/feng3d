/**
 * Iconify 图标集配置
 * 开发模式使用在线 API，生产模式使用本地预加载的图标集
 */
import { addCollection, _api } from '@iconify/iconify';

// 项目中使用的图标集列表
const iconSets = ['mdi', 'material-symbols'];

// 检测是否为开发模式
const isDev = import.meta.env.DEV;

/**
 * 配置离线模式（仅在生产环境启用）
 * 禁用所有 API 请求，只使用本地预加载的图标
 */
export function configureOfflineMode() {
  // 开发模式下不禁用 API，使用在线服务
  if (isDev) {
    console.log('[Iconify] 开发模式：使用在线 API');
    return;
  }

  // 生产模式禁用 API 请求，只使用本地预加载的图标
  _api.setFetch(async () => {
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
 * 预加载图标集（仅在生产环境）
 * 从 iconify 目录加载 JSON 文件（由 Vite 插件复制到构建目录）
 */
export async function loadIconSets() {
  // 开发模式不预加载，使用在线 API
  if (isDev) {
    console.log('[Iconify] 开发模式：跳过本地图标集预加载');
    return { loadedSets: [], failedSets: [] };
  }

  const loadedSets: string[] = [];
  const failedSets: string[] = [];

  // 预加载图标集
  for (const iconSet of iconSets) {
    try {
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

