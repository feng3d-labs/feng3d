// Vite 入口文件：将 Editor 类挂载到全局命名空间
// 物理插件已收回主仓（packages/cannon-plugin，引擎依赖 npm cannon-es）：它与本包的 feng3d
// 同仓库同版本、源码发布，因此不再走「外部化 + esm.sh CDN」那条路——那条路拿到的 0.7.x
// 依赖旧版 feng3d 的 dist 构建，链接期报 `does not provide an export named 'Behaviour'`，
// 会阻断整个模块图导致编辑器白屏。
import * as cannonPlugin from '@feng3d/cannon-plugin';
import * as feng3dModule from 'feng3d';
import { ClassUtils } from 'feng3d';
import * as editorModule from './index';
import { initQRCode } from './utils/QRCode';
import './utils/Tween'; // 初始化 Tween 更新循环

// 提前创建 Pinia 实例，确保在 EditorData 使用之前可用
import './vue-app/pinia';

// 直接将整个模块挂载到 editor 命名空间
window.editor = editorModule;
window['feng3d'] = window['feng3d'] || {} as any;
for (const key in feng3dModule)
{
    window['feng3d'][key] = feng3dModule[key];
}

// 把物理插件的导出并进 feng3d 命名空间（与 feng3d 自身导出同款处理）。
// 注意：新架构下组件的分发走 registerLogic 注册表（`__type__` → Logic 工厂），
// 不再依赖 ClassUtils 按类名查找；这里挂载是为了让 `window.feng3d.<导出名>` 仍可见。
for (const key in cannonPlugin)
{
    window['feng3d'][key] = cannonPlugin[key];
}

// 扩展 Window 接口
declare global
{
    interface Window
    {
        editor: typeof editorModule;
    }
}

// 覆盖 ClassUtils.getDefinitionByName，如果找不到类则从 feng3d 命名空间查找
if (typeof window !== 'undefined' && ClassUtils && ClassUtils.prototype)
{
    // 保存原始方法
    const originalGetDefinitionByName = ClassUtils.prototype.getDefinitionByName;

    // 覆盖方法
    ClassUtils.prototype.getDefinitionByName = function (name: string): any
    {
        // 先尝试使用原始方法查找
        let result = originalGetDefinitionByName.call(this, name);

        // 如果找不到，从 feng3d 命名空间中查找
        if (!result && window['feng3d'] && typeof name === 'string')
        {
            // 尝试直接通过类名查找
            if (window['feng3d'][name])
            {
                result = window['feng3d'][name];
            }
            else
            {
                // 尝试通过命名空间路径查找（例如 'PhysicsWorld' 或 'feng3d.PhysicsWorld'）
                const parts = name.split('.');
                let current: any = window['feng3d'];

                for (const part of parts)
                {
                    if (current && current[part])
                    {
                        current = current[part];
                    }
                    else
                    {
                        current = null;
                        break;
                    }
                }

                if (current)
                {
                    result = current;
                }
            }
        }

        return result;
    };
}

// 初始化二维码功能
if (typeof window !== 'undefined' && document.readyState === 'loading')
{
    document.addEventListener('DOMContentLoaded', () =>
    {
        initQRCode(document.URL);
    });
}
else
{
    initQRCode(document.URL);
}

// 初始化 Vue 应用
if (typeof window !== 'undefined')
{
    // 等待 DOM 加载完成
    if (document.readyState === 'loading')
    {
        document.addEventListener('DOMContentLoaded', async () =>
        {
            // 挂载 Vue 应用
            await import('./vue-app/main');
        });
    }
    else
    {
        // DOM 已准备好，立即挂载 Vue 应用
        import('./vue-app/main');
    }
}

// 导出所有内容
export * from './index';

