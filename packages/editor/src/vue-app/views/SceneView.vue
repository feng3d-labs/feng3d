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
import { Vector2, Vector3, Matrix4x4, Stats, serialization, loader, shortcut, windowEventProxy, raycaster, ticker, watcher, reactive, logic } from 'feng3d';
import type { Camera, PerspectiveCamera, Object3D, FPSController, Scene } from 'feng3d';
import * as TWEEN from '@tweenjs/tween.js';
import { EditorComponent } from '../../feng3d/EditorComponent';
import { EditorView } from '../../feng3d/EditorView';
import { GroundGrid } from '../../feng3d/GroundGrid';
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
    
    // 启动渲染循环（View 类需要手动启动）
    if (view.value && typeof (view.value as any).start === 'function') {
      (view.value as any).start();
      console.log('SceneView: rendering started');
    } else {
      console.warn('SceneView: view.start() is not available');
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

    /** 编辑器根对象：相机与编辑器场景并列（替代旧 `view.root` + 逐个 addChild） */
    const editorRootObject: Object3D = {
      __type__: 'Object3D',
      name: 'editorRoot',
      children: [cameraObject, editorSceneObject],
    };

    // 挂载：构造 Object3DLogic（含 EntityLogic / ContainerLogic 的结构同步 effect）——
    // 组件在此获得宿主并执行 init()，父子关系自动建立。
    // 从根开始 `logic()` 即可递归触达整棵树（ContainerLogic 的 effect 会为每个子对象创建 logic）。
    // TODO(P1 API 迁移)：视图自身的 `root` 目前仍是 `EditorView` 构造器内的占位数据
    //（`root` 为只读字段，无法在此替换）；P1 改为把 `editorRootObject` 交给 `ViewLogic` 驱动渲染。
    logic(editorRootObject);

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
    
    // 加载 Trident 对象
    const editorData = (editorStore as any);
    if (editorData.getEditorAssetPath) {
      loader.loadText(editorData.getEditorAssetPath('gameobjects/Trident.gameobject.json')).then((content) => {
        // P0 修复：反序列化可能返回 undefined（该资源引用了主仓已删除的类型，
        // 控制台伴随 "无法获取名称为 GameObject 的实例!"）。旧代码直接把结果 push 进
        // children，会让 ContainerLogic 的父子同步 effect 对 undefined 调用 logic()
        // 抛 TypeError，进而中断整条响应式批次（表现为场景不渲染）。
        const trident = serialization.deserialize(JSON.parse(content)) as Object3D | undefined;
        if (!trident) {
          console.warn('[SceneView] Trident 反序列化失败，已跳过挂载');
          return;
        }
        // 旧 `editorScene.object3D.addChild(trident)` → 响应式 push（父级关系由 ContainerLogic 的 effect 维护）
        const r_editorSceneObject = reactive(editorSceneObject);
        r_editorSceneObject.children.push(trident);
      });
    }
    
    // 如果 gameScene 已存在，立即设置 hierarchy.rootObject3D
    // 这样层级面板就能正确显示内容
    const gameScene = EditorData.editorData.gameScene;
    // `Scene` 是组件，没有 `object3D`：其宿主对象经 `logic(scene).entity` 取
    const gameSceneObject3D = gameScene ? (logic(gameScene).entity as Object3D | null) : null;
    if (gameSceneObject3D) {
      hierarchy.rootObject3D = gameSceneObject3D;
      console.log('SceneView: hierarchy.rootObject3D set to gameScene object3D');
    }
    
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

// 选择游戏对象
function onSelectGameObject() {
  if (!getMouseInView() || !view.value) return;

  // TODO(P1 API 迁移)：旧实现读 `view.mouseRay3D`（由已摘除的旧 `View.render()` 每帧写入），
  // 改造后的 EditorView 无该数据来源。迁移方向：用相机现算——
  //   `logic(cameraObject).local2world` + `logic(camera as PerspectiveCamera).getRay3D(ndcX, ndcY)`，
  // NDC 按画布矩形换算（见 EditorView 类注释）。迁移完成前不做拾取（空射线会让 raycaster 崩溃）。
  const mouseRay3D = (view.value as any).mouseRay3D;
  if (!mouseRay3D) return;

  // 编辑器场景的拾取集合：旧 `editorScene.mouseCheckObjects` 数据字段已移到 `SceneLogic.mouseCheckObjects`
  const editorSceneComponent = view.value.editorScene as Scene | null;
  if (!editorSceneComponent) return;

  let gameObjects = raycaster.pickAll(mouseRay3D, logic(editorSceneComponent).mouseCheckObjects)
    .sort((a, b) => a.rayEntryDistance - b.rayEntryDistance)
    .map((v) => v.object3D);
  
  if (gameObjects.length > 0) {
    return;
  }
  
  const gameScene = (editorStore as any).gameScene as Scene | null;
  if (!gameScene) return;
  
  gameObjects = raycaster.pickAll(mouseRay3D, logic(gameScene).mouseCheckObjects)
    .sort((a, b) => a.rayEntryDistance - b.rayEntryDistance)
    .map((v) => v.object3D);
  
  if (gameObjects.length === 0) {
    (editorStore as any).clearSelectedObjects();
    return;
  }
  
  // 过滤游戏对象（`parent` / `scene` 字段已删除，改经 `logic(object3D)` 读取）
  gameObjects = gameObjects.reduce((pv: Object3D[], gameObject) => {
    let node = hierarchy.getNode(gameObject);
    let element = gameObject;
    while (!node && logic(element).parent) {
      element = logic(element).parent;
      node = hierarchy.getNode(element);
    }
    const elementScene = logic(element).scene;
    const sceneObject3D = elementScene ? (logic(elementScene).entity as Object3D | null) : null;
    if (element !== sceneObject3D) {
      pv.push(element);
    }
    return pv;
  }, []);
  
  if (gameObjects.length > 0) {
    const history = selectedObjectsHistory.value;
    let gameObject = gameObjects.reduce((pv, cv) => {
      if (pv) return pv;
      if (history.indexOf(cv) === -1) pv = cv;
      return pv;
    }, null as Object3D | null);
    
    if (!gameObject) {
      history.length = 0;
      gameObject = gameObjects[0];
    }
    
    (editorStore as any).selectObject(gameObject);
    history.push(gameObject);
  } else {
    (editorStore as any).clearSelectedObjects();
  }
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
    rotateSceneCenter.value = rotateSceneCameraGlobalMatrix.value.getAxisZ();
    rotateSceneCenter.value.scaleNumber(sceneControlConfig.lookDistance);
    rotateSceneCenter.value = rotateSceneCenter.value.addTo(rotateSceneCameraGlobalMatrix.value.getPosition());
  }
}

// 鼠标旋转场景
function onMouseRotateScene() {
  const cameraObject = editorCameraObject.value;
  if (!rotateSceneMousePoint.value || !rotateSceneCameraGlobalMatrix.value || !rotateSceneCenter.value || !cameraObject || !view.value) return;
  
  // TODO(P1 API 迁移)：`view.viewRect` 在改造后的 EditorView 上不存在（视图矩形由 ViewLogic 承载）。
  // 运行时能力探测 + 提前 return，避免除零/异常崩溃；迁移方向：改读画布容器 rect
  //（与 `updateCanvasSize()` 的 `canvasAreaRef.getBoundingClientRect()` 同源）。
  const view3DRect = (view.value as any).viewRect;
  if (!view3DRect || !view3DRect.width || !view3DRect.height) return;

  const globalMatrix = rotateSceneCameraGlobalMatrix.value.clone();
  const mousePoint = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  const rotateX = (mousePoint.y - rotateSceneMousePoint.value.y) / view3DRect.height * 180;
  const rotateY = (mousePoint.x - rotateSceneMousePoint.value.x) / view3DRect.width * 180;
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
  const forward = camLogic.local2world.getAxisZ();
  const camerascenePosition = camLogic.worldPosition;
  const newCamerascenePosition = new Vector3(
    forward.x * moveDistance + camerascenePosition.x,
    forward.y * moveDistance + camerascenePosition.y,
    forward.z * moveDistance + camerascenePosition.z);
  const newCameraPosition = camLogic.world2local.transformPoint3(newCamerascenePosition);
  // §8.4：从 raw 读当前值、向响应式代理**整体**写入 position
  //（`Object3DLogic.position` 的 computed 只追踪 `position` 字段引用，不追踪 x/y/z 子字段）
  const r_cameraObject = reactive(cameraObject);
  r_cameraObject.position = { x: newCameraPosition.x, y: newCameraPosition.y, z: newCameraPosition.z };
  
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
  // 旧 `view.getScaleByDepth(...)`：视图能力已移交相机 logic（EditorView 不再承载）
  const scale = logic(editorCamera.value as PerspectiveCamera).getScaleByDepth(sceneControlConfig.lookDistance);
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
    const lookPos = camLogic.local2world.getAxisZ();
    lookPos.scaleNumber(-lookDistance);
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
  // `Scene` 是组件，没有 `object3D`：宿主对象经 `logic(scene).entity` 取
  const gameSceneObject3D = newScene ? (logic(newScene).entity as Object3D | null) : null;
  if (gameSceneObject3D && view.value) {
    hierarchy.rootObject3D = gameSceneObject3D;
    console.log('SceneView: hierarchy.rootObject3D updated from gameScene change');
    // 场景切换同步到 EditorView（旧实现由已摘除的 `view.render()` 内部完成）
    view.value.setScene(newScene);
    view.value.setEditorContext(editorCamera.value, view.value.editorComponent);
  }
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

