import * as dat from 'dat.gui';
import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, ticker } from 'feng3d';
import type { Object3D, View } from 'feng3d';
import '@feng3d/cannon-plugin';
import type { PhysicsWorld, PhysicsWorldLogic } from '@feng3d/cannon-plugin';
import { createPhysicsDebugLayers, updatePhysicsDebugVisuals, type PhysicsDebugLayers } from './PhysicsDebugVisuals';

/**
 * feng3d 版的 cannon-es 示例脚手架。
 *
 * 对应 cannon-es 仓库的 `examples/js/Demo.js`：右上角四个 dat.GUI 文件夹
 * （Rendering / World / Solver / Scenes）、多场景切换、以及世界参数的实时调整。
 *
 * 与原版的分工差异只有一处：原版 `addScene(title, initfunc)` 的回调直接往 CANNON.World 里加刚体，
 * 这里的回调返回**一棵 feng3d 的 Object3D 子树**——因为 feng3d 的场景是纯数据，
 * 物理组件挂在对象上，由 PhysicsWorld 自己收集。
 */
export interface PhysicsDemoSettings
{
    stepFrequency: number;
    quatNormalizeSkip: number;
    quatNormalizeFast: boolean;
    gx: number;
    gy: number;
    gz: number;
    iterations: number;
    tolerance: number;
    k: number;
    d: number;
    scene: number;
    paused: boolean;
    rendermode: 'solid' | 'wireframe';
    constraints: boolean;
    contacts: boolean;
    cm2contact: boolean;
    normals: boolean;
    axes: boolean;
    shadows: boolean;
    aabbs: boolean;
    profiling: boolean;
    maxSubSteps: number;
}

/**
 * 场景在**运行时**增删对象的入口（对应原版直接 `world.addBody` + `demo.addVisual` 那种动态场景）。
 *
 * 静态场景用不到它，直接返回子树即可；像原版 `pile.html` 那样"每 100ms 扔一个球、超过上限再删掉"
 * 的场景就需要——因为那时场景已经装配好了。
 */
export interface PhysicsSceneContext
{
    /**
     * 往当前场景加一个对象。
     *
     * @param child 要加的对象
     */
    addChild(child: Object3D): void;
    /**
     * 从当前场景移除一个对象。
     *
     * @param child 要移除的对象
     */
    removeChild(child: Object3D): void;
}

/**
 * 一个场景 = 一棵子树工厂（对应原版 addScene 的回调）。
 *
 * @param world 该场景的物理世界数据；场景想改世界级参数（默认摩擦/弹性、求解器等）就在这里改
 * @param context 运行时增删对象的入口（动态场景才需要）
 * @returns 该场景的子树
 */
export type PhysicsSceneFactory = (world: PhysicsWorld, context: PhysicsSceneContext) => Object3D[];

export interface PhysicsDemo
{
    /** dat.GUI 实例（右上角面板） */
    readonly gui: dat.GUI;
    /** 全局设置（默认值与原版 Demo.js 一致） */
    readonly settings: PhysicsDemoSettings;
    /**
     * 注册一个场景（对应原版 `demo.addScene`）。
     *
     * @param title 场景名（显示在 Scenes 文件夹里）
     * @param factory 返回该场景的子树
     * @returns 场景序号
     */
    addScene(title: string, factory: PhysicsSceneFactory): number;
    /**
     * 切到第 n 个场景。
     *
     * @param index 场景序号
     */
    changeScene(index: number): void;
    /** WebGPU 是否初始化失败（无 GPU 环境下为 true，此时画面为空但面板与物理照常） */
    readonly webgpuFailed: boolean;
}

/** 重力滑杆的上限（与原版一致：±20） */
const MAX_GRAVITY = 20;

/**
 * 创建脚手架：在 canvas 上建 WebGPU 视图，并挂出与原版一致的 dat.GUI 面板。
 *
 * @param canvas 渲染画布
 * @returns 脚手架实例
 */
export function createPhysicsDemo(canvas: HTMLCanvasElement): PhysicsDemo
{
    const settings: PhysicsDemoSettings = {
        stepFrequency: 60,
        quatNormalizeSkip: 2,
        quatNormalizeFast: true,
        gx: 0,
        gy: 0,
        gz: 0,
        iterations: 3,
        tolerance: 0.0001,
        k: 1e6,
        d: 3,
        scene: 0,
        paused: false,
        rendermode: 'solid',
        constraints: false,
        contacts: false,
        cm2contact: false,
        normals: false,
        axes: false,
        shadows: false,
        aabbs: false,
        profiling: false,
        maxSubSteps: 20,
    };

    const gui = new dat.GUI();

    const scenes: PhysicsSceneFactory[] = [];
    /** 当前场景的物理世界数据（GUI 直接改它，经 reactive 生效） */
    let physicsWorld: PhysicsWorld | null = null;
    /** 当前场景的调试可视化层（axes / aabbs / contacts / …） */
    let debugLayers: PhysicsDebugLayers | null = null;
    /** 当前场景的根（运行时增删对象要用它） */
    let currentRoot: Object3D | null = null;

    /** 运行时增删对象：走 children 的写入路径（Container 的 push/splice 就是为此设计的） */
    const sceneContext: PhysicsSceneContext = {
        addChild(child: Object3D)
        {
            if (currentRoot === null) return;
            (reactive(currentRoot) as unknown as { children: Object3D[] }).children.push(child);
        },
        removeChild(child: Object3D)
        {
            if (currentRoot === null) return;
            const children = (reactive(currentRoot) as unknown as { children: Object3D[] }).children;
            const index = children.indexOf(child);
            if (index >= 0) children.splice(index, 1);
        },
    };
    let view: View | null = null;
    let viewLogic: ReturnType<typeof logic> | null = null;

    /** 把设置里的重力写进物理世界 */
    const applyGravity = () =>
    {
        if (physicsWorld === null) return;
        reactive(physicsWorld).gravity = { x: settings.gx, y: settings.gy, z: settings.gz };
    };

    /** 把设置里的求解器 / 接触方程参数写进物理世界 */
    const applySolver = () =>
    {
        if (physicsWorld === null) return;
        const writable = reactive(physicsWorld) as unknown as Record<string, unknown>;
        writable.solverIterations = settings.iterations;
        writable.contactEquationStiffness = settings.k;
        writable.contactEquationRelaxation = settings.d;
    };

    /** 把设置里的四元数归一化参数写进物理世界 */
    const applyQuat = () =>
    {
        if (physicsWorld === null) return;
        const writable = reactive(physicsWorld) as unknown as Record<string, unknown>;
        writable.quatNormalizeSkip = settings.quatNormalizeSkip;
        writable.quatNormalizeFast = settings.quatNormalizeFast;
    };

    // ---- Rendering ----
    const renderFolder = gui.addFolder('Rendering');
    renderFolder.add(settings, 'rendermode', { Solid: 'solid', Wireframe: 'wireframe' });
    renderFolder.add(settings, 'contacts');
    renderFolder.add(settings, 'cm2contact');
    renderFolder.add(settings, 'normals');
    renderFolder.add(settings, 'constraints');
    renderFolder.add(settings, 'axes');
    renderFolder.add(settings, 'shadows');
    renderFolder.add(settings, 'aabbs');
    renderFolder.add(settings, 'profiling');

    // ---- World ----
    const worldFolder = gui.addFolder('World');
    worldFolder.add(settings, 'paused');
    worldFolder.add(settings, 'stepFrequency', 10, 60 * 10, 10);
    worldFolder.add(settings, 'maxSubSteps', 1, 50, 1);
    worldFolder.add(settings, 'gx', -MAX_GRAVITY, MAX_GRAVITY).onChange(applyGravity);
    worldFolder.add(settings, 'gy', -MAX_GRAVITY, MAX_GRAVITY).onChange(applyGravity);
    worldFolder.add(settings, 'gz', -MAX_GRAVITY, MAX_GRAVITY).onChange(applyGravity);
    worldFolder.add(settings, 'quatNormalizeSkip', 0, 50, 1).onChange(applyQuat);
    worldFolder.add(settings, 'quatNormalizeFast').onChange(applyQuat);

    // ---- Solver ----
    const solverFolder = gui.addFolder('Solver');
    solverFolder.add(settings, 'iterations', 1, 50, 1).onChange(applySolver);
    solverFolder.add(settings, 'k', 10, 10000000).onChange(applySolver);
    solverFolder.add(settings, 'd', 0, 20, 0.1).onChange(applySolver);
    solverFolder.add(settings, 'tolerance', 0.0, 10.0, 0.01);

    // ---- Scenes（先建文件夹，addScene 往里加按钮）----
    const sceneFolder = gui.addFolder('Scenes');

    const changeScene = (index: number) =>
    {
        const factory = scenes[index];
        if (factory === undefined) return;

        settings.scene = index;

        // 场景内容：一棵带 Scene + PhysicsWorld 的根 + 该场景的子树
        const worldData: PhysicsWorld = {
            __type__: 'PhysicsWorld',
            gravity: { x: settings.gx, y: settings.gy, z: settings.gz },
        } as PhysicsWorld;

        physicsWorld = worldData;
        // 先把世界数据交给场景，让它能改世界级参数（默认摩擦/弹性等），再交给 PhysicsWorld
        const children = factory(worldData, sceneContext);

        // 调试可视化层（六个）：挂进场景根，由 ticker 每帧按开关刷新
        const debug = createPhysicsDebugLayers();
        debugLayers = debug.layers;

        const root: Object3D = {
            __type__: 'Object3D',
            name: 'PhysicsDemoRoot',
                components: [{
                    __type__: 'Scene',
                    // 环境光 0.1，对应原版 Demo.js 的 AmbientLight(0xffffff, 0.1)
                    ambientColor: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
                }, worldData],
                children: [
                    // 相机与光照与原版 Demo.js 一致：PerspectiveCamera(24°, 5, 2000) @ (0,20,30) 看向原点；
                    // 环境光 0.1 + 方向光 0.15
                    {
                        __type__: 'Object3D',
                        name: 'DemoCamera',
                        // (0,20,30) 看向原点 → 绕 X 转 -atan2(20,30) ≈ -0.588
                        position: { x: 0, y: 20, z: 30 },
                        rotation: { x: -0.588, y: 0, z: 0 },
                        components: [{
                            __type__: 'PerspectiveCamera',
                            fov: 24,
                            aspect: canvas.clientWidth / (canvas.clientHeight || 1) || 16 / 9,
                            near: 5,
                            far: 2000,
                        }],
                    },
                    {
                        __type__: 'Object3D',
                        name: 'DemoDirectionalLight',
                        rotation: { x: -0.6, y: 0.4, z: 0 },
                        components: [{
                            __type__: 'DirectionalLight',
                            color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                            intensity: 0.15,
                        }],
                    },
                    ...children,
                    debug.holder,
                ],
        };
        currentRoot = root;
        view = { __type__: 'View', canvas, root };
        viewLogic = logic(view);

        // 场景切换后把 GUI 里的参数同步过去
        applySolver();
        applyQuat();
    };

    const addScene = (title: string, factory: PhysicsSceneFactory) =>
    {
        scenes.push(factory);
        const index = scenes.length - 1;
        sceneFolder.add({ [title]: () => changeScene(index) }, title);

        // 第一个场景自动生效
        if (index === 0) changeScene(0);

        return index;
    };

    // ---- WebGPU 放在最后异步初始化 ----
    // 关键：init() 在没有 GPU 适配器的环境下会抛错。GUI 与场景注册必须在那之前完成，
    // 否则一个渲染层的失败会把整个示例（含右上角面板）一起带走。
    let webgpu: WebGPU | null = null;
    let webgpuFailed = false;
    const ready = (async () =>
    {
        try
        {
            const instance = new WebGPU();
            await instance.init();
            webgpu = instance;
        }
        catch (error)
        {
            webgpuFailed = true;
            console.warn('[PhysicsDemo] WebGPU 初始化失败，画面不可用（面板与物理仍在）：', error);
        }
    })();

    // 渲染循环：读最新的 viewLogic（切场景后自动指向新场景）
    ticker.onframe(async () =>
    {
        await ready;
        if (viewLogic === null || settings.paused) return;

        // submit 会驱动 Scene.update → PhysicsWorld.update（物理步进）
        if (webgpu !== null) webgpu.submit((viewLogic as { submit: unknown }).submit as never);

        // 物理已经步进，再按开关刷新调试可视化（与原版 Demo 的每帧刷新一致）
        if (physicsWorld === null || debugLayers === null) return;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic | null;
        if (physicsWorldLogic === null) return;
        updatePhysicsDebugVisuals(physicsWorldLogic.world, settings, debugLayers);
    });

    return { gui, settings, addScene, changeScene, get webgpuFailed() { return webgpuFailed; } };
}
