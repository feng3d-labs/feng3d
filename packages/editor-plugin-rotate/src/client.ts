import { rotateLogic } from './runtime';
import { ROTATE_API_VERSION, ROTATE_PLUGIN_ID, ROTATE_TYPE } from './shared';
import type { EditorPluginManifest, PanelViewLoader } from 'feng3d-editor/client';

/**
 * 界面端（Web 半）—— 包入口 `"./client"`。
 *
 * 这一端给编辑器用：声明"我贡献什么界面"（这里是往 `panel.main` 座位加一个标签页）。
 *
 * ## 为什么清单是纯数据、视图是 loader
 *
 * 清单保持纯数据（`view` 是 `() => import(...)`，不是组件本身）：
 * 单元测试不必编译 Vue 单文件组件，编辑器启动也不必把所有面板的视图都拉起来。
 * 这与 `feng3d-editor/client` 的 `PanelViewLoader` 契约一致。
 *
 * 界面端**允许**依赖 Vue（它就是画界面的）；`./runtime` 端则禁止——
 * 两端边界不同，见 `scripts/check-runtime-half-deps.mjs`。
 */

/**
 * 本插件的清单（界面端装载器读它）。
 *
 * `slot` 用**座位名**（正式写法）：`'panel.main'` 是主标签区；
 * 落位缩写 `placement: 'main'` 是等价糖，新插件不必再用。
 */
/**
 * 面板视图的 loader（**纯动态导入**，不依赖编辑器的运行期 API）。
 *
 * 为什么不用 `toViewComponent()` 包装：那个函数来自 `feng3d-editor/client`，用了它这个
 * client 半就**必须**在运行期解析到编辑器包——而插件包是**独立打包**的（第三方构建），
 * 浏览器原生 ESM 解析不了裸包名（#276 阶段 4/收尾阶段的实测教训）。
 * 契约本身只要"返回模块的 Promise"（`PanelViewLoader`），所以直接写 loader 最省事：
 * 类型走 `import type`（打包时被擦除），运行期只依赖 `./panel`。
 */
export const rotatePanelView: PanelViewLoader = () => import('./panel');

export const ROTATE_PLUGIN: EditorPluginManifest = {
    id: ROTATE_PLUGIN_ID,
    name: '旋转（三端样板）',
    description: '演示插件三端形态：界面端贡献面板、游戏端注册同一个 __type__ 的行为',
    apiVersion: ROTATE_API_VERSION,
    contributes: {
        // **同一个 `__type__` 在两端各注册一次**（#276 验收③"两端都有行为"）：
        // 这一份给编辑器（它读清单），`./runtime` 那一份给游戏端（构建期打入产物）。
        // 编辑格式 = 运行格式——场景里存下来的 `{ __type__: 'Rotate' }` 两边都能跑。
        logics: [{ name: ROTATE_TYPE, logic: rotateLogic }],
        // **插件自带 AI 工具**（#281 **路径 B**）：给桥接方法写上 `description` / `inputSchema`，
        // 它**就成了**一个 AI 工具（MCP 侧把它接到工具表里，名字 = 方法名把 `.` 换 `_`）。
        // 装上这个插件，AI 的工具表里就多一个 `rotate_info`。
        //
        // 这里**不再另写一份 `aiTools`**：两份声明迟早漂移（路径 A 当年的断链就是这么来的），
        // 而"方法自带"已经是生效通路（#777 让 MCP 侧真的消费它）。
        //
        // 注意 handler **只收 params**、拿不到编辑器 API——插件包是**独立打包**的，
        // 运行期解析不了 `feng3d-editor` 裸包名（#276 阶段 4 的实测教训）。
        // 所以样板这里是**纯函数**；"插件的方法怎么拿到编辑器能力"是另一个待定契约
        // （能力注入，见 #281 的讨论）。
        bridgeMethods: [
            {
                name: 'rotate.info',
                // **方法自带 AI 元数据**（#281 路径 B，**唯一通路**）：
                // MCP 的 `listTools` 读它就是工具定义（名字 = `rotate.info` → `rotate_info`）。
                description: '返回三端样板插件声明的 __type__ 与 apiVersion——用来验证「插件自带 AI 工具」'
                    + '这条路：装上它，AI 的工具表里就多出这一个。',
                inputSchema: { type: 'object', properties: {}, additionalProperties: false },
                handler: () => ({ type: ROTATE_TYPE, apiVersion: ROTATE_API_VERSION }),
            },
        ],
        panels: [
            {
                id: 'rotate.panel',
                labelKey: 'panels.rotate',
                slot: 'panel.main',
                order: 50,
                icon: 'mdi:rotate-right',
                view: rotatePanelView,
            },
        ],
    },
};

/**
 * 装载器读的清单（**client 半的约定导出名**，见 `packages/editor/src/plugins/loader/loader.ts`）。
 *
 * 运行时装载按 `import('<包名>/client')` 取模块，读这里的 `manifest`（也接受默认导出）。
 * 保留 `ROTATE_PLUGIN` 这个具名导出是为了让"谁在贡献什么"在源码里一眼可读。
 */
export const manifest = ROTATE_PLUGIN;
