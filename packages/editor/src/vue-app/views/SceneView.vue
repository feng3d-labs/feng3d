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
      <!-- 场景浮层：由插件贡献（粒子播放控制器等），场景视图不认识具体是哪个 -->
      <component
        v-for="overlay in sceneOverlays"
        :is="overlay.component"
        :key="overlay.id"
      />
      <!-- 相机预览组件（显示在场景界面右下角） -->
      <CameraPreview :parent-container="containerRef as any" />
      <!-- 区域选择矩形 -->
      <AreaSelectRect ref="areaSelectRectRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, markRaw, defineAsyncComponent } from 'vue';
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
import { ViewportNavigation } from '../../feng3d/scene/ViewportNavigation';
import { getNavigationScheme } from '../../configs/ViewportNavigationSchemes';
import { EditorData } from '../../global/EditorData';
import { useEditorStore } from '../stores/editorStore';
import { sceneControlConfig } from '../../shortcut/Editorshortcut';
import { setWorldMatrix } from '../../scripts/iconUtils';
import { drag } from '../../ui/drag/Drag';
import { editorui } from '../../global/editorui';
import CameraPreview from '../components/CameraPreview.vue';
import AreaSelectRect from '../components/AreaSelectRect.vue';
import TopToolBar from '../components/TopToolBar.vue';
import { getSceneOverlays, toViewComponent } from '../../plugins';

const editorStore = useEditorStore();

/**
 * 场景浮层（插件贡献）。
 *
 * 改造前这里是硬编码的一行 `<ParticleEffectController />`——场景视图不该知道粒子系统的存在。
 * 现在它按贡献点渲染，加一个浮层只需要一份插件清单。
 *
 * `markRaw`：浮层数组来自 `computed`，但组件定义一旦进入响应式链路就会被代理，
 * 这里明确排除；`defineAsyncComponent`：清单里存的是 loader。
 */
const sceneOverlays = computed(() =>
  getSceneOverlays().map((overlay) => ({
    id: overlay.id,
    component: markRaw(defineAsyncComponent(toViewComponent(overlay.view))),
  })),
);

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

/** 框选是否为追加模式（Shift/Ctrl + 拖动） */
const areaSelectAdditive = ref(false);

/** 追加框选时的基准选择（拖动开始时快照） */
const areaSelectBase = ref<Array<Object3D | unknown>>([]);

// 拖放容器
let dragContainer: HTMLElement | null = null;

// 状态
const selectedObjectsHistory = ref<Object3D[]>([]);

/**
 * 视口导航执行器（Unity / Unreal / Blender / PlayCanvas 由 `sceneControlConfig.navigationScheme` 选择）。
 *
 * 环绕、平移、推拉、飞行、方向键行走都在其中实现；SceneView 只提供画布、相机与环绕中心。
 */
const viewportNavigation = ref<ViewportNavigation | null>(null);

/** 锁定跟随的目标对象（Shift+F 切换） */
const lockedObject = ref<Object3D | null>(null);

/** 锁定时相机相对目标中心的偏移（保持视角不变，只跟随平移） */
const lockOffset = ref<Vector3 | null>(null);

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

    // 视口导航：按当前操作方案（Unity / Unreal / Blender / PlayCanvas）处理鼠标与键盘
    viewportNavigation.value = markRaw(new ViewportNavigation(
      {
        canvas: canvas.value,
        cameraObject,
        getOrbitPivot: () => (editorStore as any).transformBox?.getCenter() ?? null,
      },
      getNavigationScheme(sceneControlConfig.navigationScheme),
    ));
    console.log('SceneView: viewport navigation started', sceneControlConfig.navigationScheme);

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

    // 用世界包围盒与射线求交（不依赖 raycaster 的三角形求交，见上方说明）
    const bounds = logic(model).selfWorldBounds.value.clone();
    // 零厚度包围盒（Plane 等）与射线接近共面时浮点判定会漏掉，膨胀一点点
    bounds.min.addNumber(-1e-3);
    bounds.max.addNumber(1e-3);
    const normal = new Vector3();
    const distance = bounds.rayIntersection(mouseRay3D.origin, mouseRay3D.direction, normal);
    if (!Number.isFinite(distance) || distance === Number.MAX_VALUE) continue;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = object3D;
    }
  }

  return nearest;
}

/**
 * 命中相机 / 光源图标时，选中它们所代表的场景对象。
 *
 * 背景：旧写法靠图标在 `init()` 里监听自身的 `mousedown` 事件来响应点击；
 * 主仓已移除纯数据 `Object3D` 的字符串事件，各图标因此保留了
 * `selectCamera()` / `selectLight()` 作为点击选择入口，但**一直没有调用方**
 * （见 issue #156）。
 *
 * 这里不经过引擎的 `Mouse3DManager`：实测该类是半成品——它提供了 `pick()` 与
 * `pickClick`，却没有任何地方调用 `pick()`、也没有人设置 `selectedObject3D`，
 * 所以 `pickClick` 永不触发。编辑器的点击拾取本来就是自己实现的
 * （{@link onSelectGameObject}），在这里集中分派更直接。
 *
 * 命中的往往是图标的子网格，因此要沿父链找承载图标的那个对象。
 *
 * @param hit 射线命中的对象（可能只是图标的子网格）
 */
function selectIconTarget(hit: Object3D) {
  // 命中对象有可能是图标的子网格，向上找承载图标的对象
  const candidates: Object3D[] = [];
  let current: Object3D | null = hit;
  for (let depth = 0; current && depth < 8; depth++) {
    candidates.push(current);
    current = logic(current).parent as Object3D | null;
  }

  for (const candidate of candidates) {
    const type = (candidate as { __type__?: string }).__type__;
    if (!type) continue;
    // 非图标类编辑器对象（工具、地面网格等）不做额外处理，保持原有「命中即不参与游戏对象选择」
    if (!type.endsWith('Icon')) continue;

    const iconLogic = logic(candidate) as unknown as {
      selectCamera?: () => void;
      selectLight?: () => void;
    };
    // 相机图标与光源图标分属两套 Logic；缺失的能力自然是 undefined
    if (typeof iconLogic.selectCamera === 'function') {
      iconLogic.selectCamera();
      return;
    }
    if (typeof iconLogic.selectLight === 'function') {
      iconLogic.selectLight();
      return;
    }
  }
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
  const editorHit = pickNearestObject(mouseRay3D, logic(editorSceneComponent).mouseCheckObjects);
  if (editorHit) {
    // 命中相机 / 光源图标时，选中它们所代表的场景对象。
    // 旧写法靠 `object3D.emit('mousedown')` 由图标自己响应，而主仓已移除纯数据对象的
    // 字符串事件（`Mouse3DManager` 里 per-object `emit` 也被注释、改为 `pickClick` 回调），
    // 于是 `CameraIcon.selectCamera()` / `*LightIcon.selectLight()` 一直没有调用方。
    // 这里在集中的点击拾取点上分派——不再依赖引擎的 `Mouse3DManager`：
    // 该类实测是半成品（类内 0 处调用自身 `pick()`、无人设置 `selectedObject3D`，
    // 因此 `pickClick` 永不触发，见 issue #156）。
    selectIconTarget(editorHit);
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

  // Unity：Ctrl 或 Shift + 左键 = 加选（Ctrl 由 editorStore.selectObject 内建处理，
  // Shift 在这里显式追加，保持两种修饰键行为一致）
  const additive = windowEventProxy.shiftKey;
  if (additive) {
    (editorStore as any).selectMultiObject([element], true);
  } else {
    (editorStore as any).selectObject(element);
  }
  selectedObjectsHistory.value.push(element);
}

/**
 * 取屏幕矩形内的游戏对象（框选）。
 *
 * 旧实现依赖 `view.getObjectsInGlobalArea`（视图能力已移交 `ViewLogic`，无等价入口），
 * 这里用相机把每个可拾取对象的包围盒中心投影到屏幕，落在矩形内即命中
 *（Unity 的框选判定同样是「包围盒与矩形相交」，此处用中心点做简化）。
 *
 * @param start 矩形起点（client 坐标）
 * @param end 矩形终点（client 坐标）
 */
function getObjectsInScreenArea(start: Vector2, end: Vector2): Object3D[] {
  const camera = editorCamera.value as PerspectiveCamera | null;
  const gameScene = (editorStore as any).gameScene as Scene | null;
  const viewRect = (view.value as any)?.viewRect;
  if (!camera || !gameScene || !viewRect) return [];

  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const results: Object3D[] = [];

  for (const object3D of logic(gameScene).mouseCheckObjects) {
    const bounds = logic(object3D).boundingBox.worldBounds;
    const center = bounds.getCenter();
    const ndc = logic(camera).project(center);
    const clientX = viewRect.x + (ndc.x + 1) / 2 * viewRect.width;
    const clientY = viewRect.y + (1 - ndc.y) / 2 * viewRect.height;
    if (clientX >= minX && clientX <= maxX && clientY >= minY && clientY <= maxY) {
      results.push(object3D);
    }
  }

  return results;
}

// 区域选择开始
function onAreaSelectStart() {
  if (!getMouseInView()) return;
  areaSelectStartPosition.value = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  // Unity：Shift/Ctrl + 框选 = 追加选择；拖动期间以起点时的选择为基准做并集
  areaSelectAdditive.value = windowEventProxy.shiftKey || windowEventProxy.ctrlKey;
  areaSelectBase.value = areaSelectAdditive.value ? [...((editorStore as any).selectedObjects ?? [])] : [];
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

  const hits = getObjectsInScreenArea(areaSelectStartPosition.value, areaSelectEndPosition);
  if (areaSelectAdditive.value) {
    // 并集（不用 selectMultiObject 的 toggle 语义，否则拖动过程中选择会反复抖动）
    (editorStore as any).setSelectedObjects([...areaSelectBase.value, ...hits]);
  } else {
    (editorStore as any).selectMultiObject(hits);
  }
}

// 区域选择结束
function onAreaSelectEnd() {
  areaSelectStartPosition.value = null;
  areaSelectBase.value = [];
  if (areaSelectRectRef.value) {
    areaSelectRectRef.value.hide();
  }
}

// 看向选中的游戏对象（Unity: Frame Selected）
function onLookToSelectedGameObject() {
  const cameraObject = editorCameraObject.value;
  if (!getMouseInView() || !cameraObject) return;

  const transformBox = (editorStore as any).transformBox;
  if (transformBox) {
    const scenePosition = transformBox.getCenter();
    let size = transformBox.getSize().length;
    size = Math.max(size, 1);
    // 观察距离按相机 fov 自适应（Unity 的 Frame Selected 会把对象铺满视口）
    const fov = (editorCamera.value as PerspectiveCamera)?.fov ?? 60;
    const lookDistance = 0.6 * size / Math.tan(fov * Math.PI / 360);

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

/**
 * 锁定视角跟随选中对象（Unity: Shift+F = Lock View to Selected）。
 *
 * 再次按下取消锁定；锁定时每帧把相机保持在目标对象的固定相对位置（朝向不变）。
 */
function onLockViewToSelectedObject() {
  const cameraObject = editorCameraObject.value;
  if (!cameraObject) return;

  const target = lockedObject.value;
  if (target) {
    lockedObject.value = null;
    lockOffset.value = null;
    console.log('SceneView: 取消视角锁定');

    return;
  }

  const object3Ds = (editorStore as any).selectedObject3Ds as Object3D[] | undefined;
  const selected = object3Ds?.[0];
  if (!selected) return;

  const center = logic(selected).boundingBox.worldBounds.getCenter();
  lockOffset.value = logic(cameraObject).worldPosition.subTo(center);
  lockedObject.value = markRaw(selected);
  console.log('SceneView: 锁定视角跟随', selected.name);
}

/** 每帧保持锁定对象的相对视角（视角锁定期间相机跟随对象移动） */
function updateLockedView() {
  const target = lockedObject.value;
  const offset = lockOffset.value;
  const cameraObject = editorCameraObject.value;
  if (!target || !offset || !cameraObject) return;

  const center = logic(target).boundingBox.worldBounds.getCenter();
  const position = new Vector3(center.x + offset.x, center.y + offset.y, center.z + offset.z);
  setWorldMatrix(cameraObject, logic(cameraObject).local2world.clone().setPosition(position));
}

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
  shortcut.on('lookToSelectedObject3D', onLookToSelectedGameObject);
  shortcut.on('lockViewToSelectedObject3D', onLockViewToSelectedObject);

  // 视角锁定跟随（Shift+F）
  ticker.onframe(updateLockedView);

  // 操作方案切换（设置面板改 navigationScheme 即整体更换鼠标操作方式）
  watcher.watch(sceneControlConfig, 'navigationScheme', (value: string) => {
    if (viewportNavigation.value) {
      viewportNavigation.value.scheme = getNavigationScheme(value);
      console.log('SceneView: 切换视口操作方案 ->', value);
    }
  });

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
  shortcut.off('lookToSelectedObject3D', onLookToSelectedGameObject);
  shortcut.off('lockViewToSelectedObject3D', onLockViewToSelectedObject);

  // 释放视口导航（事件监听 + 每帧回调）
  viewportNavigation.value?.dispose();
  viewportNavigation.value = null;
  ticker.offframe(updateLockedView);

  // 移除 gameScene 监听
  watcher.unwatch(EditorData.editorData, 'gameScene', onGameSceneChanged);
  watcher.unwatch(sceneControlConfig, 'navigationScheme');
  
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

