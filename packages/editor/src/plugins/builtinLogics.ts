import type { EditorPluginManifest } from './types';
import { NavigationLogic } from '../navigation/Navigation';
import { CameraIconLogic } from '../scripts/CameraIcon';
import { DirectionLightIconLogic } from '../scripts/DirectionLightIcon';
import { MouseRayTestScriptLogic } from '../scripts/MouseRayTestScript';
import { PointLightIconLogic } from '../scripts/PointLightIcon';
import { SpotLightIconLogic } from '../scripts/SpotLightIcon';
import { EditorComponentLogic } from '../feng3d/EditorComponent';
import { GroundGridLogic } from '../feng3d/GroundGrid';
import { MRSToolLogic } from '../feng3d/mrsTool/MRSTool';
import { MToolLogic } from '../feng3d/mrsTool/MTool';
import { RToolLogic } from '../feng3d/mrsTool/RTool';
import { SToolLogic } from '../feng3d/mrsTool/STool';
import { CoordinateAxisLogic, CoordinateCubeLogic, CoordinatePlaneLogic, MToolModelLogic } from '../feng3d/mrsTool/models/MToolModel';
import { CoordinateRotationAxisLogic, CoordinateRotationFreeAxisLogic, RToolModelLogic } from '../feng3d/mrsTool/models/RToolModel';
import { CoordinateScaleCubeLogic, SToolModelLogic } from '../feng3d/mrsTool/models/SToolModel';
import { SectorObject3DLogic } from '../feng3d/mrsTool/models/SectorObject3D';
import { SceneRotateToolLogic } from '../feng3d/scene/SceneRotateTool';

/**
 * 内置插件清单：**Logic 贡献点**（issue #170）。
 *
 * ## 为什么 Logic 也要走清单
 *
 * 改造前这 23 个 `registerLogic('X', XLogic)` 都写在各自模块的**顶层**，
 * 于是"编辑器有哪些 Logic"取决于 `import` 图的执行顺序：
 *
 * - 漏 import 一个文件，该类型就静默失去行为（`logic()` 返回 null，控制台一句报错）；
 * - 想知道有哪些，只能全仓 grep `registerLogic`；
 * - 单元测试里"有没有注册"取决于导入顺序，会写出脆弱或互相污染的用例。
 *
 * 现在它们是一份**数据**：清单说"哪个 `__type__` 由哪个类实现"，
 * 由核心在启动时（`installBuiltinPlugins()`）显式注册。门禁见
 * `scripts/check-editor-module-effects.mjs`——它按 AST 判"模块顶层有没有注册调用"，
 * 不靠代码评审记得住。
 *
 * ## 为什么分组是这几个插件
 *
 * 按**功能的归属**分，而不是按目录分（目录是实现的摆放细节）：
 * 变换工具、编辑器自身的场景对象、对象图标、相机导航。
 * 这样贡献表能回答"我要关掉变换工具"该关哪个插件（#169）。
 *
 * ## 为什么这里放类本身、面板那里放 loader
 *
 * 面板视图放 `() => import(...)` 是为了**按需加载**（编辑器启动不必拉起所有面板）；
 * 而 Logic 注册发生在启动时、需要拿到类，且这些类本就在编辑器的 import 图里
 * （它们不是可选的界面，是类型的行为），没有可延迟的空间。
 */
export const MRS_TOOL_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-mrs-tool',
    name: '变换工具',
    description: '移动 / 旋转 / 缩放工具及其坐标轴模型（场景中的 gizmo）',
    contributes: {
        logics: [
            { name: 'MRSTool', logic: MRSToolLogic },
            { name: 'MTool', logic: MToolLogic },
            { name: 'RTool', logic: RToolLogic },
            { name: 'STool', logic: SToolLogic },
            { name: 'MToolModel', logic: MToolModelLogic },
            { name: 'RToolModel', logic: RToolModelLogic },
            { name: 'SToolModel', logic: SToolModelLogic },
            { name: 'SectorObject3D', logic: SectorObject3DLogic },
            { name: 'CoordinateAxis', logic: CoordinateAxisLogic },
            { name: 'CoordinateCube', logic: CoordinateCubeLogic },
            { name: 'CoordinatePlane', logic: CoordinatePlaneLogic },
            { name: 'CoordinateRotationAxis', logic: CoordinateRotationAxisLogic },
            { name: 'CoordinateRotationFreeAxis', logic: CoordinateRotationFreeAxisLogic },
            { name: 'CoordinateScaleCube', logic: CoordinateScaleCubeLogic },
        ],
    },
};

/** 编辑器自身的场景对象：编辑器组件基类、地面网格、场景旋转工具 */
export const EDITOR_OBJECTS_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-editor-objects',
    name: '编辑器场景对象',
    description: '编辑器组件基类（EditorComponent）、地面网格、场景旋转工具',
    contributes: {
        logics: [
            { name: 'EditorComponent', logic: EditorComponentLogic },
            { name: 'GroundGrid', logic: GroundGridLogic },
            { name: 'SceneRotateTool', logic: SceneRotateToolLogic },
        ],
    },
};

/**
 * 对象图标与拾取测试脚本。
 *
 * `MouseRayTestScript` 归在这里而不是单列一个插件：它和四个图标一样是
 * "挂在对象上、只在编辑器里起作用的脚本"，关掉图标的场景下也没理由留着它。
 */
export const OBJECT_ICONS_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-object-icons',
    name: '对象图标',
    description: '灯光 / 相机的图标显示与鼠标拾取测试脚本',
    contributes: {
        logics: [
            { name: 'SpotLightIcon', logic: SpotLightIconLogic },
            { name: 'PointLightIcon', logic: PointLightIconLogic },
            { name: 'DirectionLightIcon', logic: DirectionLightIconLogic },
            { name: 'CameraIcon', logic: CameraIconLogic },
            { name: 'MouseRayTestScript', logic: MouseRayTestScriptLogic },
        ],
    },
};

/** 相机导航（WASD 飞行 / 环绕等） */
export const NAVIGATION_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-navigation',
    name: '相机导航',
    description: '场景视图的相机导航（WASD 飞行 / 环绕 / 聚焦等）',
    contributes: {
        logics: [
            { name: 'Navigation', logic: NavigationLogic },
        ],
    },
};

/** 全部 Logic 贡献插件（顺序无关：清单里不允许出现重复的 `__type__`） */
export const LOGIC_PLUGINS: readonly EditorPluginManifest[] = [
    MRS_TOOL_PLUGIN,
    EDITOR_OBJECTS_PLUGIN,
    OBJECT_ICONS_PLUGIN,
    NAVIGATION_PLUGIN,
];
