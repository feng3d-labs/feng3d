<template>
  <div ref="containerRef" class="scene-view">
    <!-- 顶部工具栏 -->
    <TopToolBar />

    <!-- 画布区域 -->
    <div ref="canvasAreaRef" class="scene-canvas-area">
      <!-- 背景区域用于鼠标事件检测 -->
      <div ref="backRectRef" class="scene-back-rect"></div>
      <!-- 性能统计工具容器 -->
      <div ref="statsContainerRef" class="scene-stats-container"></div>
      <!-- 场景旋转工具图层 -->
      <div ref="sceneRotateToolLayerRef" class="scene-rotate-tool-layer"></div>
      <!-- 粒子效果控制器 -->
      <ParticleEffectController />
      <!-- 相机预览组件（显示在场景界面右下角） -->
      <CameraPreview :parent-container="containerRef as any" />
      <!-- 区域选择矩形 -->
      <AreaSelectRect ref="areaSelectRectRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, markRaw } from 'vue';
import { Vector2, Vector3, Matrix4x4, Stats, shortcut, windowEventProxy, ticker, watcher, reactive, logic } from 'feng3d';
import type { Camera, PerspectiveCamera, Object3D, FPSController, Ray3, Scene } from 'feng3d';
import * as TWEEN from '@tweenjs/tween.js';
import { EditorComponent } from '../../feng3d/EditorComponent';
import { EditorView } from '../../feng3d/EditorView';
import { GroundGrid } from '../../feng3d/GroundGrid';
import { createTrident } from '../../feng3d/Trident';
import { hierarchy } from '../../feng3d/hierarchy/Hierarchy';
import { MRSTool } from '../../feng3d/mrsTool/MRSTool';
import { SceneRotateTool } from '../../feng3d/scene/SceneRotateTool';
import { EditorData } from '../../global/EditorData';
import { useEditorStore } from '../stores/editorStore';
import { sceneControlConfig } from '../../shortcut/Editorshortcut';
import { setWorldMatrix } from '../../scripts/iconUtils';
import { drag } from '../../ui/drag/Drag';
import { editorui } from '../../global/editorui';
import CameraPreview from '../components/CameraPreview.vue';
import AreaSelectRect from '../components/AreaSelectRect.vue';
import ParticleEffectController from '../components/ParticleEffectController.vue';
import TopToolBar from '../components/TopToolBar.vue';

const editorStore = useEditorStore();

// DOM 引用
const containerRef = ref<HTMLElement>();
const canvasAreaRef = ref<HTMLElement>();
const backRectRef = ref<HTMLElement>();
const statsContainerRef = ref<HTMLElement>();
const sceneRotateToolLayerRef = ref<HTMLElement>();

// Stats 实例（每个 SceneView 独立）
const statsInstance = ref<Stats | null>(null);

// 3D 渲染相关
const canvas = ref<HTMLCanvasElement | null>(null);
const view = ref<any>(null); // EditorView
const editorCamera = ref<Camera | null>(null);
// 编辑器相机所属的 Object3D。
// 新范式中相机是挂在 Object3D 上的纯数据组件，位置/旋转矩阵与父子关系一律经
// `logic(object3D)` 读取（旧 `camera.object3D` / `camera.transform` 均已删除）。
const editorCameraObject = ref<Object3D | null>(null);
const areaSelectRectRef = ref<InstanceType<typeof AreaSelectRect> | null>(null);
const areaSelectStartPosition = ref<Vector2 | null>(null);

// 拖放容器
let dragContainer: HTMLElement | null = null;

// 状态
const selectedObjectsHistory = ref<Object3D[]>([]);
const rotateSceneCenter = ref<Vector3 | null>(null);
const rotateSceneCameraGlobalMatrix = ref<Matrix4x4 | null>(null);
const rotateSceneMousePoint = ref<Vector2 | null>(null);
const preMousePoint = ref<Vector2 | null>(null);
const dragSceneMousePoint = ref<Vector2 | null>(null);
const dragSceneCameraGlobalMatrix = ref<Matrix4x4 | null>(null);

// 鼠标是否在视图中
function getMouseInView(): boolean {
  if (!containerRef.value) return false;
  const rect = containerRef.value.getBoundingClientRect();
  const x = windowEventProxy.clientX;
  const y = windowEventProxy.clientY;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// 获取全局边界
function getGlobalBounds() {
  if (!containerRef.value) return { x: 0, y: 0, width: 0, height: 0 };
  const rect = containerRef.value.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    contains: (x: number, y: number) => {
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    },
    clampPoint: (point: Vector2) => {
      return new Vector2(
        Math.max(rect.left, Math.min(rect.right, point.x)),
        Math.max(rect.top, Math.min(rect.bottom, point.y))
      );
    }
  };
}

// 初始化 3D 场景
function initScene() {
  if (canvas.value && !view.value) {
    // 确保 canvas 在 DOM 中并且有尺寸
    if (!canvas.value.parentElement) {
      console.error('SceneView: canvas is not in DOM');
      return false; // 返回 false 表示初始化失败
    }
    
    const rect = canvas.value.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      // 尺寸无效，返回 false，等待 ResizeObserver 触发
      return false;
    }
    
    console.log('SceneView: initializing scene', { canvasSize: { width: rect.width, height: rect.height } });
    
    // 创建独立的 Stats 实例（不使用单例）
    if (statsContainerRef.value && !statsInstance.value) {
      statsInstance.value = markRaw(new Stats());
      if (statsInstance.value.dom) {
        statsContainerRef.value.appendChild(statsInstance.value.dom);
        // 设置初始样式
        statsInstance.value.dom.style.position = 'absolute';
        statsInstance.value.dom.style.left = '0px';
        statsInstance.value.dom.style.top = '0px';
        statsInstance.value.dom.style.zIndex = '10';
      }
      
    }
    
    // 创建 EditorView
    view.value = markRaw(new EditorView(canvas.value) as any);
    
    // 将 Stats 实例关联到 View
    if (view.value && statsInstance.value) {
      (view.value as any).statsInstance = statsInstance.value;
    }
    
    // ---- 编辑器场景树：纯数据字面量 + `logic()` 触发挂载（新范式） ----
    //
    // 旧写法 `serialization.setValue(new Object3D(), {...}).addComponent(X)` 已整体废除：
    // `Object3D` / `Camera` / `Scene` 等均为纯数据 interface（运行时无值，不能 `new`），
    // 组件用 `__type__` 字面量声明；组件初始化（`init` 注入宿主）与父子关系由
    // `logic()` 构造 `EntityLogic` / `ContainerLogic` 时注册的 effect 自动维护，
    // 不再有命令式 `addComponent` / `addChild`。

    /** 编辑器相机组件：投影参数内联（`lens` 已删除；fov/aspect/near 为接口必填，far 替代旧 `camera.lens.far = 5000`） */
    const cameraComponent: PerspectiveCamera = {
      __type__: 'PerspectiveCamera',
      fov: 60,
      aspect: 1,
      near: 0.3,
      far: 5000,
    };

    /** FPS 控制器组件（`auto` 是 Logic 字段而非数据字段，不能写进字面量，挂载后经 logic 关闭） */
    const fpsControllerComponent: FPSController = { __type__: 'FPSController' };

    /** 编辑器相机对象（相机组件挂载在它上面） */
    const cameraObject: Object3D = {
      __type__: 'Object3D',
      name: 'editorCamera',
      position: { x: 5, y: 3, z: 5 },
      components: [cameraComponent, fpsControllerComponent],
    };

    // TODO(P1 API 迁移)：旧 `editorScene.runEnvironment = RunEnvironment.all` 无等价写法——
    // `runEnvironment` 已移到 `Behaviour` 基接口（packages/feng3d/src/component/Behaviour.ts），
    // `Scene` 自身不再是 Behaviour。编辑器场景是否需要该运行环境语义待独立决策。
    /** 编辑器场景组件 */
    const editorSceneComponent: Scene = { __type__: 'Scene' };

    /** 场景旋转工具：`view` / `layerContainer` 在字面量内一次性给出（纯数据字段只读，不能事后赋值） */
    const sceneRotateToolComponent: SceneRotateTool = {
      __type__: 'SceneRotateTool',
      view: view.value,
      layerContainer: sceneRotateToolLayerRef.value ?? undefined,
    };

    /** 地面网格 / 位移旋转缩放工具：与相机共享**同一份**相机数据对象引用（不是副本） */
    const groundGridComponent: GroundGrid = { __type__: 'GroundGrid', editorCamera: cameraComponent };
    const mrsToolComponent: MRSTool = { __type__: 'MRSTool', editorCamera: cameraComponent };
    /** 编辑器模块组件（图标跟随逻辑；`scene` / `editorCamera` 由 `EditorView.setEditorContext` 注入） */
    const editorComponentData: EditorComponent = { __type__: 'EditorComponent' };

    /** 编辑器场景对象（承载 Scene 组件与全部编辑器工具组件） */
    const editorSceneObject: Object3D = {
      __type__: 'Object3D',
      name: 'editorScene',
      components: [editorSceneComponent, sceneRotateToolComponent, groundGridComponent, mrsToolComponent, editorComponentData],
    };

    // ---- 视图根组装（新范式渲染入口：`EditorView.root` 即纯数据 `View.root`）----
    //
    // 结构见 `EditorView` 类注释：
    //   root.components = [视图 Scene 组件]（渲染背景 / 环境光）
    //   root.children   = [编辑器相机, 编辑器场景对象, 游戏场景对象]
    // 相机必须排在 children 首位——`ViewLogic` 取 root 子树第一个 Camera 作为渲染相机。
    // 游戏场景对象作为**子级**而非视图根本身：游戏场景树保持干净，层级面板与
    // 「保存场景」（序列化 `hierarchy.rootnode.object3D`）都不会带出编辑器对象。
    const viewRoot = view.value.root as Object3D;

    const gameScene = EditorData.editorData.gameScene;
    /** 游戏场景根对象（`Scene` 是组件，宿主对象经 `logic(scene).entity` 取） */
    const gameSceneObject3D = gameScene ? (logic(gameScene).entity as Object3D | null) : null;

    /** 视图 Scene 组件：背景 / 环境光与游戏场景**共享同一份数据对象**（属性面板改动即时反映到渲染） */
    const viewSceneComponent: Scene = {
      __type__: 'Scene',
      background: gameScene?.background ?? { __type__: 'Color4', r: 0.2784, g: 0.2784, b: 0.2784, a: 1 },
      ambientColor: gameScene?.ambientColor ?? { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
    };

    const r_viewRoot = reactive(viewRoot);
    r_viewRoot.components.push(viewSceneComponent);
    r_viewRoot.children.push(cameraObject, editorSceneObject);
    if (gameSceneObject3D) r_viewRoot.children.push(gameSceneObject3D);

    // 挂载：构造 Object3DLogic（含 EntityLogic / ContainerLogic 的结构同步 effect）——
    // 组件在此获得宿主并执行 init()，父子关系自动建立。
    // 从根开始 `logic()` 即可递归触达整棵树（ContainerLogic 的 effect 会为每个子对象创建 logic）。
    logic(viewRoot);

    const cameraLogic = logic(cameraObject);
    // 旧 `addComponent(FPSController).auto = false`：init() 内 auto 默认为 true，这里再关闭订阅
    logic(fpsControllerComponent).auto = false;
    // 旧 `logic(camera.transform).lookAt(new Vector3())`：变换直接挂在 Object3D 的 logic 上
    cameraLogic.lookAt(new Vector3());

    editorCamera.value = markRaw(cameraComponent);
    editorCameraObject.value = markRaw(cameraObject);

    // 同步 EditorView 契约字段与编辑器上下文（旧实现散落在已摘除的 `view.render()` 内）
    view.value.camera = cameraComponent;
    view.value.editorScene = markRaw(editorSceneComponent);
    view.value.editorComponent = editorComponentData;
    view.value.setScene(EditorData.editorData.gameScene ?? null);
    view.value.setEditorContext(cameraComponent, editorComponentData);
    
    // 坐标轴指示器（trident）：纯数据字面量构造，不再走资源加载
    //
    // TODO(P1 序列化层议题，主仓范围)：原实现 `loader.loadText('gameobjects/Trident.gameobject.json')`
    // + `serialization.deserialize(...)`。该资源是**旧格式**（`GameObject` / `Transform` /
    // `Material.shaderName`），旧反序列化走 `classUtils.getInstanceByName`（内部 `new Cls()`），
    // 而主仓这些类型已迁移为纯数据接口（运行时无构造器），加载必然失败
    // （控制台 `无法获取名称为 GameObject 的实例!`）。故改用 `createTrident()` 字面量；
    // 资源文件保留，待 `packages/serialization` 完成纯数据迁移后再切回读取。
    const trident = createTrident();
    // 旧 `editorScene.object3D.addChild(trident)` → 响应式 push（父级关系由 ContainerLogic 的 effect 维护）
    const r_editorSceneObject = reactive(editorSceneObject);
    r_editorSceneObject.children.push(trident);
    
    // 层级面板挂在游戏场景树上（不含编辑器对象）
    if (gameSceneObject3D) {
      hierarchy.rootObject3D = gameSceneObject3D;
      console.log('SceneView: hierarchy.rootObject3D set to gameScene object3D');
    }

    // 视图根就绪，启动渲染循环（每帧 webgpu.submit(viewLogic.submit)）
    view.value.start();
    console.log('SceneView: rendering started');

    // 初始化成功，返回 true
    return true;
  }
  return false;
}

// 尝试初始化场景（如果尺寸有效）
function tryInitScene() {
  if (canvas.value && !view.value) {
    const success = initScene();
    if (success) {
      // 初始化成功后，更新 canvas 大小
      updateCanvasSize();
    }
    return success;
  }
  return false;
}

// 更新 Canvas 位置和大小
function updateCanvasSize() {
  if (!canvas.value || !canvasAreaRef.value) return;

  const rect = canvasAreaRef.value.getBoundingClientRect();

  // 确保 canvas 有有效的尺寸
  if (rect.width <= 0 || rect.height <= 0) {
    console.warn('SceneView: canvas area has invalid size', rect);
    return;
  }

  // 设置 canvas 大小（相对于容器）
  if (view.value && typeof (view.value as any).setSize === 'function') {
    (view.value as any).setSize(rect.width, rect.height);
  } else {
    // 如果 setSize 不可用，直接设置 canvas 尺寸
    canvas.value.width = rect.width;
    canvas.value.height = rect.height;
  }

  // 更新 Stats 位置（相对于容器）
  if (statsInstance.value && statsInstance.value.dom) {
    statsInstance.value.dom.style.position = 'absolute';
    statsInstance.value.dom.style.left = '0px';
    statsInstance.value.dom.style.top = '0px';
    statsInstance.value.dom.style.zIndex = '10';
  }

  console.log('SceneView: canvas size updated', { width: rect.width, height: rect.height });
}

// 鼠标进入视图
function onMouseOver() {
  shortcut.activityState('mouseInView3D');
}

// 鼠标离开视图
function onMouseOut() {
  shortcut.deactivityState('mouseInView3D');
}

/**
 * 在给定对象集合中拾取离相机最近的对象。
 *
 * 用 `RenderableLogic.worldRayIntersection`（世界包围盒相交 + 本地射线）逐个判定，
 * 不走 `raycaster.pickAll`：后者第二阶段会再用 `geometry.raycast` 做三角形求交，
 * 当前主仓该步对 `MeshRenderer` 的纯数据组件返回空，导致整体拾取结果为空。
 * 包围盒级精度对编辑器的选择操作足够。
 *
 * @param mouseRay3D 鼠标射线
 * @param object3Ds 候选对象（通常是 `SceneLogic.mouseCheckObjects`）
 * @returns 最近命中的对象；无命中返回 null
 */
function pickNearestObject(mouseRay3D: Ray3, object3Ds: Object3D[]): Object3D | null {
  let nearest: Object3D | null = null;
  let nearestDistance = Number.MAX_VALUE;

  for (const object3D of object3Ds) {
    const model = object3D.components?.find((c) => c.__type__ === 'MeshRenderer' || c.__type__ === 'SkinnedMeshRenderer');
    if (!model) continue;

    const hit = (logic(model) as unknown as { worldRayIntersection(ray: Ray3): { rayEntryDistance: number } | null })
      .worldRayIntersection(mouseRay3D);
    if (!hit) continue;
    if (hit.rayEntryDistance < nearestDistance) {
      nearestDistance = hit.rayEntryDistance;
      nearest = object3D;
    }
  }

  return nearest;
}

// 选择游戏对象
function onSelectGameObject() {
  if (!getMouseInView() || !view.value) return;

  // 鼠标射线按需现算（旧实现读每帧渲染循环写入的 `view.mouseRay3D`，新范式无该每帧状态）
  const mouseRay3D = view.value.getRay3D(windowEventProxy.clientX, windowEventProxy.clientY);
  if (!mouseRay3D) return;

  // 编辑器场景的拾取集合：旧 `editorScene.mouseCheckObjects` 数据字段已移到 `SceneLogic.mouseCheckObjects`
  const editorSceneComponent = view.value.editorScene as Scene | null;
  if (!editorSceneComponent) return;

  // 编辑器对象（工具 / 图标）优先：命中即不参与游戏对象选择
  if (pickNearestObject(mouseRay3D, logic(editorSceneComponent).mouseCheckObjects)) {
    return;
  }

  const gameScene = (editorStore as any).gameScene as Scene | null;
  if (!gameScene) return;

  const hitObject = pickNearestObject(mouseRay3D, logic(gameScene).mouseCheckObjects);
  if (!hitObject) {
    (editorStore as any).clearSelectedObjects();
    return;
  }

  // 过滤游戏对象（`parent` / `scene` 字段已删除，改经 `logic(object3D)` 读取）
  let element: Object3D = hitObject;
  let node = hierarchy.getNode(element);
  while (!node && logic(element).parent) {
    element = logic(element).parent as Object3D;
    node = hierarchy.getNode(element);
  }
  const elementScene = logic(element).scene;
  const sceneObject3D = elementScene ? (logic(elementScene).entity as Object3D | null) : null;
  if (element === sceneObject3D) {
    (editorStore as any).clearSelectedObjects();
    return;
  }

  (editorStore as any).selectObject(element);
  selectedObjectsHistory.value.push(element);
}

// 区域选择开始
function onAreaSelectStart() {
  if (!getMouseInView()) return;
  areaSelectStartPosition.value = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
}

// 区域选择
function onAreaSelect() {
  if (!areaSelectStartPosition.value || !view.value) return;
  
  let areaSelectEndPosition = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  const rectangle = getGlobalBounds();
  areaSelectEndPosition = rectangle.clampPoint(areaSelectEndPosition);
  
  if (areaSelectRectRef.value) {
    areaSelectRectRef.value.show(
      { x: areaSelectStartPosition.value.x, y: areaSelectStartPosition.value.y },
      { x: areaSelectEndPosition.x, y: areaSelectEndPosition.y }
    );
  }
  
  // TODO(P1 API 迁移)：旧 `view.getObjectsInGlobalArea(start, end)`（按屏幕矩形筛选对象）在改造后的
  // EditorView 上不存在——视图能力已移交 `ViewLogic`，暂无等价入口。
  // 这里做运行时能力探测 + 提前 return，避免调用不存在的方法崩溃；迁移方向：用相机
  // `logic(camera).project / unproject` 把对象包围盒投影到屏幕，再与选择矩形求交。
  const getObjectsInGlobalArea = (view.value as any).getObjectsInGlobalArea;
  if (typeof getObjectsInGlobalArea !== 'function') return;

  const gs = getObjectsInGlobalArea.call(view.value, areaSelectStartPosition.value, areaSelectEndPosition);
  const gs0 = gs.filter((g) => !!hierarchy.getNode(g)) as any as Object3D[];
  (editorStore as any).selectMultiObject(gs0);
}

// 区域选择结束
function onAreaSelectEnd() {
  areaSelectStartPosition.value = null;
  if (areaSelectRectRef.value) {
    areaSelectRectRef.value.hide();
  }
}

// 鼠标旋转场景开始
function onMouseRotateSceneStart() {
  const cameraObject = editorCameraObject.value;
  if (!getMouseInView() || !cameraObject) return;
  
  rotateSceneMousePoint.value = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  // `transform` 已删除：世界矩阵直接取自 `logic(object3D)`（且不再是 Computed，无 `.value`）
  rotateSceneCameraGlobalMatrix.value = logic(cameraObject).local2world.clone();
  rotateSceneCenter.value = null;
  
  const transformBox = (editorStore as any).transformBox;
  if (transformBox) {
    rotateSceneCenter.value = transformBox.getCenter();
  } else {
    // 旋转中心取相机前方 lookDistance 处：相机 forward 是本地 -Z（见 `Matrix4x4.moveForward` 注释），
    // 而 `getAxisZ()` 返回矩阵的 +Z（相机后方），必须取负，否则绕身后的点旋转、视角会整片飞掉。
    rotateSceneCenter.value = rotateSceneCameraGlobalMatrix.value.getAxisZ();
    rotateSceneCenter.value.scaleNumber(-sceneControlConfig.lookDistance);
    rotateSceneCenter.value = rotateSceneCenter.value.addTo(rotateSceneCameraGlobalMatrix.value.getPosition());
  }
}

// 鼠标旋转场景
function onMouseRotateScene() {
  const cameraObject = editorCameraObject.value;
  if (!rotateSceneMousePoint.value || !rotateSceneCameraGlobalMatrix.value || !rotateSceneCenter.value || !cameraObject || !view.value) return;
  
  // 视图矩形由 `EditorView.viewRect` 提供（画布 client 矩形，与 `updateCanvasSize()` 同源）
  const view3DRect = (view.value as any).viewRect;
  if (!view3DRect || !view3DRect.width || !view3DRect.height) return;

  const globalMatrix = rotateSceneCameraGlobalMatrix.value.clone();
  const mousePoint = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  // 位移占比换算成角度（度），再转弧度——`Matrix4x4.appendRotation` 的 angle 单位是弧度，
  // 直接传度会放大约 57 倍，表现为“一拖就转到看不见场景”。
  const DEG2RAD = Math.PI / 180;
  const rotateX = (mousePoint.y - rotateSceneMousePoint.value.y) / view3DRect.height * 180 * DEG2RAD;
  const rotateY = (mousePoint.x - rotateSceneMousePoint.value.x) / view3DRect.width * 180 * DEG2RAD;
  globalMatrix.appendRotation(Vector3.Y_AXIS, rotateY, rotateSceneCenter.value);
  const rotateAxisX = globalMatrix.getAxisX();
  globalMatrix.appendRotation(rotateAxisX, rotateX, rotateSceneCenter.value);
  // 旧 `logic(camera.transform).setLocal2world(m)`：主仓已无 `Transform`，也无 `setLocal2world`。
  // 改用 `scripts/iconUtils.setWorldMatrix`（分解 TRS 经响应式写回，见 API_MIGRATION §3.8）。
  setWorldMatrix(cameraObject, globalMatrix);
}

// 鼠标旋转场景结束
function onMouseRotateSceneEnd() {
  rotateSceneMousePoint.value = null;
}

// 场景相机前后移动开始
function onSceneCameraForwardBackMouseMoveStart() {
  if (!getMouseInView()) return;
  preMousePoint.value = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
}

// 场景相机前后移动
function onSceneCameraForwardBackMouseMove() {
  const cameraObject = editorCameraObject.value;
  if (!preMousePoint.value || !cameraObject) return;
  
  const currentMousePoint = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  const moveDistance = (currentMousePoint.x + currentMousePoint.y - preMousePoint.value.x - preMousePoint.value.y) * sceneControlConfig.sceneCameraForwardBackwardStep;
  sceneControlConfig.lookDistance -= moveDistance;
  
  const camLogic = logic(cameraObject);
  // 相机 forward 是本地 -Z（见 `Matrix4x4.moveForward`），`getAxisZ()` 给的是 +Z（后方），取负
  const forward = camLogic.local2world.getAxisZ();
  forward.scaleNumber(-1);
  const camerascenePosition = camLogic.worldPosition;
  const newCamerascenePosition = new Vector3(
    forward.x * moveDistance + camerascenePosition.x,
    forward.y * moveDistance + camerascenePosition.y,
    forward.z * moveDistance + camerascenePosition.z);
  // 用 `setWorldMatrix` 写回：它按**父级**的 `world2local` 换算本地坐标。
  // 不能直接拿 `camLogic.world2local`——那是相机自己的世界→本地，会把世界点投影到
  // 相机空间（结果恒在相机前方），相机因而被拽到原点附近。
  setWorldMatrix(cameraObject, camLogic.local2world.clone().setPosition(newCamerascenePosition));
  
  preMousePoint.value = currentMousePoint;
}

// 场景相机前后移动结束
function onSceneCameraForwardBackMouseMoveEnd() {
  preMousePoint.value = null;
}

// 拖拽场景开始
function onDragSceneStart() {
  const cameraObject = editorCameraObject.value;
  if (!getMouseInView() || !cameraObject) return;
  
  dragSceneMousePoint.value = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  dragSceneCameraGlobalMatrix.value = logic(cameraObject).local2world.clone();
}

// 拖拽场景
function onDragScene() {
  const cameraObject = editorCameraObject.value;
  if (!dragSceneMousePoint.value || !dragSceneCameraGlobalMatrix.value || !cameraObject || !editorCamera.value) return;
  
  const mousePoint = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  const addPoint = mousePoint.subTo(dragSceneMousePoint.value);
  // `CameraLogic.getScaleByDepth(depth)` 返回该深度处**视口高度对应的世界尺寸**（NDC 跨度 1），
  // 而鼠标位移是**像素**：必须再除以视口像素高度换算成每像素的世界尺寸，
  // 否则拖 1 像素就平移数米，相机瞬间飞出场景（表现为“无法控制移动”）。
  const view3DRect = (view.value as any).viewRect;
  if (!view3DRect || !view3DRect.width || !view3DRect.height) return;
  const scale = logic(editorCamera.value as PerspectiveCamera).getScaleByDepth(sceneControlConfig.lookDistance) / view3DRect.height;
  const up = dragSceneCameraGlobalMatrix.value.getAxisY();
  const right = dragSceneCameraGlobalMatrix.value.getAxisX();
  up.normalize(addPoint.y * scale);
  right.normalize(-addPoint.x * scale);
  const globalMatrix = dragSceneCameraGlobalMatrix.value.clone();
  globalMatrix.appendTranslation(up.x + right.x, up.y + right.y, up.z + right.z);
  setWorldMatrix(cameraObject, globalMatrix);
}

// 拖拽场景结束
function onDragSceneEnd() {
  dragSceneMousePoint.value = null;
  dragSceneCameraGlobalMatrix.value = null;
}

/**
 * 取编辑器相机的 FPSController 驱动器（能力探测）。
 *
 * TODO(P1 API 迁移)：`FPSControllerLogic` 已把 `onMousedown` / `onMouseup` / `update` 收为私有
 * （`#` 私有方法），旧写法 `camera.getComponent(FPSController).onMousedown()` 无等价公开入口。
 * 这里按「可能不存在」探测，避免运行时崩溃；P1 需主仓暴露公开驱动入口，或编辑器改为自行监听
 * `windowEventProxy` 驱动相机。
 */
function getFpsControllerDriver(): { onMousedown?: () => void; onMouseup?: () => void; update?: () => void } | null {
  const cameraObject = editorCameraObject.value;
  if (!cameraObject) return null;

  const fpsController = logic(cameraObject).getComponent<FPSController>('FPSController');
  if (!fpsController) return null;

  return logic(fpsController) as unknown as { onMousedown?: () => void; onMouseup?: () => void; update?: () => void };
}

// FPS 视图开始
function onFpsViewStart() {
  const fpsDriver = getFpsControllerDriver();
  if (!getMouseInView() || !fpsDriver) return;
  
  fpsDriver.onMousedown?.();
  ticker.onframe(updateFpsView);
}

// FPS 视图停止
function onFpsViewStop() {
  const fpsDriver = getFpsControllerDriver();
  if (!fpsDriver) return;
  
  fpsDriver.onMouseup?.();
  ticker.offframe(updateFpsView);
}

// 更新 FPS 视图
function updateFpsView() {
  const fpsDriver = getFpsControllerDriver();
  if (!fpsDriver) return;
  
  fpsDriver.update?.();
}

// 看向选中的游戏对象
function onLookToSelectedGameObject() {
  const cameraObject = editorCameraObject.value;
  if (!getMouseInView() || !cameraObject) return;
  
  const transformBox = (editorStore as any).transformBox;
  if (transformBox) {
    const scenePosition = transformBox.getCenter();
    let size = transformBox.getSize().length;
    size = Math.max(size, 1);
    const lookDistance = size;
    // TODO(P1 API 迁移)：旧实现按 `camera.lens`（PerspectiveLens）的 fov 自适应观察距离。
    // `lens` 已删除、投影参数内联到 `PerspectiveCamera`，可按
    // `(editorCamera.value as PerspectiveCamera).fov` 恢复：`0.6 * size / Math.tan(fov * Math.PI / 360)`。
    
    sceneControlConfig.lookDistance = lookDistance;
    const camLogic = logic(cameraObject);
    // 目标相机位置 = 物体中心沿相机后方退 lookDistance：`getAxisZ()` 是相机 +Z（后方），
    // 直接加即可（先前取负会把相机放到物体另一侧，朝向未变相当于看反方向）。
    const lookPos = camLogic.local2world.getAxisZ();
    lookPos.scaleNumber(lookDistance);
    lookPos.add(scenePosition);
    let localLookPos = lookPos.clone();
    const parent = camLogic.parent;
    if (parent) {
      localLookPos = logic(parent).world2local.transformPoint3(lookPos);
    }

    // §8.4：`Object3DLogic.position` 的 computed 只追踪 `position` 字段引用，不追踪 x/y/z 子字段，
    // 因此补间必须作用在普通对象上、每帧整体写回响应式 position（旧写法直接补间
    // `reactive(transform.position)` 的子字段，在新范式下不会驱动矩阵重算）。
    const r_cameraObject = reactive(cameraObject);
    const position = camLogic.position;
    const currentPosition = { x: position.x, y: position.y, z: position.z };
    new TWEEN.Tween(currentPosition)
      .to({ x: localLookPos.x, y: localLookPos.y, z: localLookPos.z }, 300)
      .easing(TWEEN.Easing.Sinusoidal.In)
      .onUpdate(() => {
        r_cameraObject.position = { x: currentPosition.x, y: currentPosition.y, z: currentPosition.z };
      })
      .start();
  }
}

// 鼠标滚轮移动场景相机
function onMouseWheelMoveSceneCamera() {
  const cameraObject = editorCameraObject.value;
  if (!getMouseInView() || !cameraObject) return;
  
  const distance = -windowEventProxy.deltaY * sceneControlConfig.mouseWheelMoveStep * sceneControlConfig.lookDistance / 10;
  const camLogic = logic(cameraObject);
  // clone 后移动，避免污染 logic 的 computed 矩阵缓存
  setWorldMatrix(cameraObject, camLogic.local2world.clone().moveForward(distance));
  sceneControlConfig.lookDistance -= distance;
}

// 监听 gameScene 变化的回调函数
function onGameSceneChanged(newScene: any) {
  if (!view.value) return;

  // `Scene` 是组件，没有 `object3D`：宿主对象经 `logic(scene).entity` 取
  const gameSceneObject3D = newScene ? (logic(newScene).entity as Object3D | null) : null;

  // 视图根换入新场景对象（渲染树入口）：移除上一个游戏场景对象，编辑器对象保持不动
  const r_viewRoot = reactive(view.value.root as Object3D);
  const previousScene = view.value.scene;
  const previousSceneObject3D = previousScene ? (logic(previousScene).entity as Object3D | null) : null;
  if (previousSceneObject3D && previousSceneObject3D !== gameSceneObject3D) {
    const index = r_viewRoot.children.indexOf(previousSceneObject3D);
    if (index >= 0) r_viewRoot.children.splice(index, 1);
  }
  if (gameSceneObject3D && r_viewRoot.children.indexOf(gameSceneObject3D) < 0) {
    r_viewRoot.children.push(gameSceneObject3D);
  }

  // 视图场景背景 / 环境光跟随游戏场景（与游戏场景共享同一份数据对象）
  const viewScene = view.value.viewScene;
  if (viewScene && newScene) {
    const r_viewScene = reactive(viewScene);
    r_viewScene.background = newScene.background;
    r_viewScene.ambientColor = newScene.ambientColor;
  }

  if (gameSceneObject3D) {
    hierarchy.rootObject3D = gameSceneObject3D;
    console.log('SceneView: hierarchy.rootObject3D updated from gameScene change');
  }

  // 场景切换同步到 EditorView（渲染树由图结构决定，这里只需维护编辑器侧引用）
  view.value.setScene(newScene);
  view.value.setEditorContext(editorCamera.value, view.value.editorComponent);
}

onMounted(async () => {
  // 等待容器准备好
  await nextTick();

  if (!containerRef.value || !canvasAreaRef.value) {
    console.error('SceneView: containerRef or canvasAreaRef is not available');
    return;
  }

  // 创建 canvas
  canvas.value = document.createElement('canvas');
  canvas.value.id = 'scene-canvas';
  canvas.value.style.position = 'absolute';
  canvas.value.style.inset = '0';
  canvas.value.style.width = '100%';
  canvas.value.style.height = '100%';
  canvas.value.style.pointerEvents = 'auto';
  canvas.value.style.zIndex = '0';
  // 添加到画布区域 DOM
  canvasAreaRef.value.appendChild(canvas.value);
  
  // 等待 DOM 更新
  await nextTick();
  
  // 使用 ResizeObserver 监听画布区域尺寸变化
  const resizeObserver = new ResizeObserver((entries) => {
    if (!entries.length) return;

    const entry = entries[0];
    const { width, height } = entry.contentRect;

    // 如果容器有有效尺寸，尝试初始化场景
    if (width > 0 && height > 0) {
      if (!view.value) {
        // 场景未初始化，尝试初始化
        const success = tryInitScene();
        if (success) {
          console.log('SceneView: scene initialized after resize', { width, height });
        }
      } else {
        // 场景已初始化，更新 canvas 大小
        updateCanvasSize();
      }
    }
  });

  // 开始观察画布区域尺寸
  if (canvasAreaRef.value) {
    resizeObserver.observe(canvasAreaRef.value);
    // 保存 observer 引用以便清理
    (canvasAreaRef.value as any)._resizeObserver = resizeObserver;

    // 立即检查一次尺寸（可能容器已经有尺寸了）
    const rect = canvasAreaRef.value.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      tryInitScene();
    }
  }
  
  // 鼠标事件 - 直接绑定到 canvas 上，因为 canvas 需要接收所有鼠标事件
  if (canvas.value) {
    canvas.value.addEventListener('mouseenter', onMouseOver);
    canvas.value.addEventListener('mouseleave', onMouseOut);
  }
  
  // 快捷键
  shortcut.on('selectObject3D', onSelectGameObject);
  shortcut.on('areaSelectStart', onAreaSelectStart);
  shortcut.on('areaSelect', onAreaSelect);
  shortcut.on('areaSelectEnd', onAreaSelectEnd);
  shortcut.on('mouseRotateSceneStart', onMouseRotateSceneStart);
  shortcut.on('mouseRotateScene', onMouseRotateScene);
  shortcut.on('mouseRotateSceneEnd', onMouseRotateSceneEnd);
  shortcut.on('sceneCameraForwardBackMouseMoveStart', onSceneCameraForwardBackMouseMoveStart);
  shortcut.on('sceneCameraForwardBackMouseMove', onSceneCameraForwardBackMouseMove);
  shortcut.on('sceneCameraForwardBackMouseMoveEnd', onSceneCameraForwardBackMouseMoveEnd);
  shortcut.on('lookToSelectedObject3D', onLookToSelectedGameObject);
  shortcut.on('dragSceneStart', onDragSceneStart);
  shortcut.on('dragScene', onDragScene);
  shortcut.on('dragSceneEnd', onDragSceneEnd);
  shortcut.on('fpsViewStart', onFpsViewStart);
  shortcut.on('fpsViewStop', onFpsViewStop);
  shortcut.on('mouseWheelMoveSceneCamera', onMouseWheelMoveSceneCamera);

  // 监听 gameScene 变化，确保 hierarchy.rootGameObject 被设置
  watcher.watch(EditorData.editorData, 'gameScene', onGameSceneChanged);
  
  // 拖放功能
  if (containerRef.value) {
    dragContainer = containerRef.value;
    
    // 注册拖放功能
    drag.register(dragContainer as any, null, ['file_object3D', 'file_script'], (dragdata) => {
      dragdata.getDragData('file_object3D').forEach((v) => {
        // 旧写法多传了一个挂载父级参数（`addGameoObjectFromAsset(asset, parent)`），
        // 现签名无父级参数：挂载由该方法内部按新范式处理。
        hierarchy.addGameoObjectFromAsset(v);
      });
      dragdata.getDragData('file_script').forEach((v) => {
        // TODO(P1 API 迁移)：`view.mouse3DManager.selectedObject3D` 在改造后的 EditorView 上不存在
        //（拾取入口待重建，见 EditorView 类注释），守卫探测后回退到层级根对象；
        // `Object3D.addScript` 也已移除，脚本挂载应改为写入 `{ __type__: 'Script', ... }` 组件。
        const selectedObject3D = (view.value as any)?.mouse3DManager?.selectedObject3D as Object3D | undefined;
        const object3D = selectedObject3D ?? hierarchy.rootnode?.object3D;
        if (!object3D) return;
        const addScript = (object3D as { addScript?: (scriptName: string) => void }).addScript;
        addScript?.call(object3D, v.scriptName);
      });
    });
  }
  
  // 保存观察器引用
  (containerRef.value as any)._resizeObserver = resizeObserver;
});

onUnmounted(() => {
  // 移除鼠标事件
  if (canvas.value) {
    canvas.value.removeEventListener('mouseenter', onMouseOver);
    canvas.value.removeEventListener('mouseleave', onMouseOut);
  }
  
  // 移除快捷键
  shortcut.off('selectObject3D', onSelectGameObject);
  shortcut.off('areaSelectStart', onAreaSelectStart);
  shortcut.off('areaSelect', onAreaSelect);
  shortcut.off('areaSelectEnd', onAreaSelectEnd);
  shortcut.off('mouseRotateSceneStart', onMouseRotateSceneStart);
  shortcut.off('mouseRotateScene', onMouseRotateScene);
  shortcut.off('mouseRotateSceneEnd', onMouseRotateSceneEnd);
  shortcut.off('sceneCameraForwardBackMouseMoveStart', onSceneCameraForwardBackMouseMoveStart);
  shortcut.off('sceneCameraForwardBackMouseMove', onSceneCameraForwardBackMouseMove);
  shortcut.off('sceneCameraForwardBackMouseMoveEnd', onSceneCameraForwardBackMouseMoveEnd);
  shortcut.off('lookToSelectedObject3D', onLookToSelectedGameObject);
  shortcut.off('dragSceneStart', onDragSceneStart);
  shortcut.off('dragScene', onDragScene);
  shortcut.off('dragSceneEnd', onDragSceneEnd);
  shortcut.off('fpsViewStart', onFpsViewStart);
  shortcut.off('fpsViewStop', onFpsViewStop);
  shortcut.off('mouseWheelMoveSceneCamera', onMouseWheelMoveSceneCamera);

  // 移除 gameScene 监听
  watcher.unwatch(EditorData.editorData, 'gameScene', onGameSceneChanged);
  
  // 移除拖放功能
  if (dragContainer) {
    drag.unregister(dragContainer as any);
    dragContainer = null;
  }
  
  // 清理 ResizeObserver
  if ((canvasAreaRef.value as any)?._resizeObserver) {
    (canvasAreaRef.value as any)._resizeObserver.disconnect();
  }
  
  // 停止渲染循环
  if (view.value && typeof (view.value as any).stop === 'function') {
    (view.value as any).stop();
  }
  
  // 清理 canvas
  if (canvas.value) {
    canvas.value.style.display = 'none';
    canvas.value.remove();
    canvas.value = null;
  }
  
  // 清理 Stats 实例
  if (statsInstance.value) {
    // 从 View 中移除 Stats 引用
    if (view.value) {
      (view.value as any).statsInstance = undefined;
    }
    
    // 移除 DOM 元素
    if (statsInstance.value.dom && statsInstance.value.dom.parentElement) {
      statsInstance.value.dom.parentElement.removeChild(statsInstance.value.dom);
    }
    statsInstance.value = null;
  }
  
  // 清理场景
  view.value = null;
  editorCamera.value = null;
  editorCameraObject.value = null;
});
</script>

<style scoped>
.scene-view {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--editor-background);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scene-canvas-area {
  flex: 1;
  position: relative;
  min-height: 0;
}

.scene-canvas-area canvas {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: auto;
  z-index: 0;
}

.scene-back-rect,
.scene-tool-view-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.scene-stats-container {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 10;
  pointer-events: auto;
}

.scene-rotate-tool-layer {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 80px;
  height: 80px;
  z-index: 20;
  pointer-events: auto;
}
</style>

