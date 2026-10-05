import type { EditorPluginManifest } from './types';
import { navigationLogic } from '../navigation/Navigation';
import { cameraIconLogic } from '../scripts/CameraIcon';
import { directionLightIconLogic } from '../scripts/DirectionLightIcon';
import { mouseRayTestScriptLogic } from '../scripts/MouseRayTestScript';
import { pointLightIconLogic } from '../scripts/PointLightIcon';
import { spotLightIconLogic } from '../scripts/SpotLightIcon';
import { editorComponentLogic } from '../feng3d/EditorComponent';
import { groundGridLogic } from '../feng3d/GroundGrid';
import { mrsToolLogic } from '../feng3d/mrsTool/MRSTool';
import { mToolLogic } from '../feng3d/mrsTool/MTool';
import { rToolLogic } from '../feng3d/mrsTool/RTool';
import { sToolLogic } from '../feng3d/mrsTool/STool';
import { coordinateAxisLogic, coordinateCubeLogic, coordinatePlaneLogic, mtoolModelLogic } from '../feng3d/mrsTool/models/MToolModel';
import { coordinateRotationAxisLogic, coordinateRotationFreeAxisLogic, rToolModelLogic } from '../feng3d/mrsTool/models/RToolModel';
import { coordinateScaleCubeLogic, sToolModelLogic } from '../feng3d/mrsTool/models/SToolModel';
import { sectorObject3DLogic } from '../feng3d/mrsTool/models/SectorObject3D';
import { editorSetTool } from '../feng3d/mrsTool/editorSetTool';
import { sceneRotateToolLogic } from '../feng3d/scene/SceneRotateTool';

/**
 * 内置插件清单：**Logic 贡献点**（issue #170）。
 *
 * ## 为什么 Logic 也要走清单
 *
 * 改造前这 23 个 `registerLogic('X', XLogic.create)` 都写在各自模块的**顶层**，
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
    apiVersion: '^1.0.0',
    contributes: {
        // 桥接方法跟着功能走：没有变换工具时"切换工具"没有意义，
        // 关掉本插件它就一起从桥接方法表里消失（issue #169 的"关干净"）
        bridgeMethods: [
            { name: 'editor.setTool', handler: editorSetTool },
        ],
        logics: [
            { name: 'MRSTool', logic: mrsToolLogic },
            { name: 'MTool', logic: mToolLogic },
            { name: 'RTool', logic: rToolLogic },
            { name: 'STool', logic: sToolLogic },
            { name: 'MToolModel', logic: mtoolModelLogic },
            { name: 'RToolModel', logic: rToolModelLogic },
            { name: 'SToolModel', logic: sToolModelLogic },
            { name: 'SectorObject3D', logic: sectorObject3DLogic },
            { name: 'CoordinateAxis', logic: coordinateAxisLogic },
            { name: 'CoordinateCube', logic: coordinateCubeLogic },
            { name: 'CoordinatePlane', logic: coordinatePlaneLogic },
            { name: 'CoordinateRotationAxis', logic: coordinateRotationAxisLogic },
            { name: 'CoordinateRotationFreeAxis', logic: coordinateRotationFreeAxisLogic },
            { name: 'CoordinateScaleCube', logic: coordinateScaleCubeLogic },
        ],
    },
};

/** 编辑器自身的场景对象：编辑器组件基类、地面网格、场景旋转工具 */
export const EDITOR_OBJECTS_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-editor-objects',
    name: '编辑器场景对象',
    description: '编辑器组件基类（EditorComponent）、地面网格、场景旋转工具',
    apiVersion: '^1.0.0',
    contributes: {
        logics: [
            { name: 'EditorComponent', logic: editorComponentLogic },
            { name: 'GroundGrid', logic: groundGridLogic },
            { name: 'SceneRotateTool', logic: sceneRotateToolLogic },
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
    apiVersion: '^1.0.0',
    contributes: {
        logics: [
            { name: 'SpotLightIcon', logic: spotLightIconLogic },
            { name: 'PointLightIcon', logic: pointLightIconLogic },
            { name: 'DirectionLightIcon', logic: directionLightIconLogic },
            { name: 'CameraIcon', logic: cameraIconLogic },
            { name: 'MouseRayTestScript', logic: mouseRayTestScriptLogic },
        ],
    },
};

/** 相机导航（WASD 飞行 / 环绕等） */
export const NAVIGATION_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-navigation',
    name: '相机导航',
    description: '场景视图的相机导航（WASD 飞行 / 环绕 / 聚焦等）',
    apiVersion: '^1.0.0',
    contributes: {
        logics: [
            { name: 'Navigation', logic: navigationLogic },
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
