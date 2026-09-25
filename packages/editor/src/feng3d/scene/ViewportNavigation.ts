import { Matrix4x4, Vector2, Vector3, logic as getLogic, shortcut, ticker } from 'feng3d';
import type { Object3D, PerspectiveCamera } from 'feng3d';
import { getNavigationScheme } from '../../configs/ViewportNavigationSchemes';
import type { MouseGestureBinding, NavigationKeyMap, ViewportAction, ViewportNavigationScheme } from '../../configs/ViewportNavigationSchemes';
import { sceneControlConfig } from '../../shortcut/Editorshortcut';
import { setWorldMatrix } from '../../scripts/iconUtils';

/** 相机移动基准速度（世界单位/秒），对应 Unity 的 Scene Camera Speed，飞行中可用滚轮调整 */
const DEFAULT_CAMERA_SPEED = 6;

/** 飞行中滚轮调速倍率 */
const SPEED_WHEEL_FACTOR = 1.1;

/** 鼠标转向灵敏度（弧度/像素，沿用 FPSController 的 0.15 度/像素手感） */
const LOOK_RAD_PER_PIXEL = 0.15 * Math.PI / 180;

/** 度 → 弧度 */
const DEG2RAD = Math.PI / 180;

/** 视图矩形 */
export interface ViewRect
{
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/**
 * 视口导航的可注入依赖。
 */
export interface ViewportNavigationOptions
{
    /** 视口画布 */
    readonly canvas: HTMLCanvasElement;

    /** 编辑器相机宿主对象 */
    readonly cameraObject: Object3D;

    /**
     * 环绕中心（通常是选中对象的包围盒中心）；返回 null 时退化为「相机前方 lookDistance 处」。
     */
    readonly getOrbitPivot?: () => Vector3 | null;

    /** 视图矩形；缺省取画布的 `getBoundingClientRect()` */
    readonly getViewRect?: () => ViewRect;
}

/** 正在进行的拖动手势 */
interface ActiveGesture
{
    readonly action: ViewportAction;
    /** 手势涉及的鼠标键（松开任一即结束） */
    readonly buttons: readonly number[];
    /** 手势起始指针位置（orbit/pan/dolly 保持不变；look/fly 逐帧推进） */
    readonly startPointer: Vector2;
    /** 手势起始相机世界矩阵（orbit / pan / dolly 基于它重算，避免累积误差） */
    readonly startMatrix: Matrix4x4;
    /** 环绕中心 */
    readonly pivot: Vector3 | null;
}

/**
 * 视口导航执行器（Unity / Unreal / Blender / PlayCanvas 共用同一实现）。
 *
 * 「操作方式」由 {@link ViewportNavigationScheme} 描述，「如何执行」由本类实现：
 * 切换方案只需 `navigation.scheme = getNavigationScheme('unreal')`（SceneView 已接到
 * `sceneControlConfig.navigationScheme`，设置面板改值即可整体换风格）。
 *
 * 支持的动作：环绕 / 平移 / 推拉 / 环顾 / 飞行 / 方向键行走，见 {@link ViewportAction}。
 * 飞行期间激活 shortcut 的 `fpsViewing` 状态，使选择、框选、工具快捷键等自动失效
 *（与 Unity 飞行中不响应其它视口操作一致）。
 */
export class ViewportNavigation
{
    /** 视口画布 */
    readonly #canvas: HTMLCanvasElement;

    /** 相机宿主对象 */
    readonly #cameraObject: Object3D;

    /** 环绕中心提供者 */
    readonly #getOrbitPivot: (() => Vector3 | null) | null;

    /** 视图矩形提供者 */
    readonly #getViewRect: (() => ViewRect) | null;

    /** 当前方案（可运行时替换） */
    #scheme: ViewportNavigationScheme;

    /** 当前按住的鼠标键 */
    readonly #pressedButtons = new Set<number>();

    /** 当前按住的键盘按键（归一化小写） */
    readonly #keys = new Set<string>();

    /** 进行中的拖动手势 */
    #active: ActiveGesture | null = null;

    /** 是否处于飞行模式 */
    #flying = false;

    /** 相机移动速度（世界单位/秒） */
    #speed = DEFAULT_CAMERA_SPEED;

    /** 上一次推拉拖动的距离（用于把总位移换算回 lookDistance，避免重复累减） */
    #lastDollyDistance = 0;

    /** 每帧积分回调 */
    #frame: ((interval: number) => void) | null = null;

    /** 事件是否已注册 */
    #attached = false;

    /**
     * @param options 依赖（画布 / 相机宿主 / 环绕中心与视图矩形提供者）
     * @param scheme 初始操作方案（缺省 Unity）
     */
    constructor(options: ViewportNavigationOptions, scheme: ViewportNavigationScheme = getNavigationScheme())
    {
        this.#canvas = options.canvas;
        this.#cameraObject = options.cameraObject;
        this.#getOrbitPivot = options.getOrbitPivot ?? null;
        this.#getViewRect = options.getViewRect ?? null;
        this.#scheme = scheme;

        this.#attach();

        const frame = (interval: number) => { this.#update(interval); };
        this.#frame = frame;
        ticker.onframe(frame);
    }

    /** 当前操作方案 */
    get scheme(): ViewportNavigationScheme
    {
        return this.#scheme;
    }

    /** 运行时切换操作方案（Unity / Unreal / Blender / PlayCanvas…） */
    set scheme(value: ViewportNavigationScheme)
    {
        this.#scheme = value;
    }

    /** 当前相机速度（世界单位/秒） */
    get cameraSpeed(): number
    {
        return this.#speed;
    }

    /** 是否处于飞行模式 */
    get flying(): boolean
    {
        return this.#flying;
    }

    /** 释放事件监听与帧回调 */
    dispose(): void
    {
        this.#detach();
        if (this.#frame) ticker.offframe(this.#frame);
        this.#frame = null;
        if (this.#flying) shortcut.deactivityState('fpsViewing');
        this.#flying = false;
        this.#active = null;
    }

    // ---------------------------------------------------------------------
    // 事件
    // ---------------------------------------------------------------------

    #attach(): void
    {
        if (this.#attached) return;
        this.#attached = true;
        window.addEventListener('pointerdown', this.#onPointerDown, true);
        window.addEventListener('pointerup', this.#onPointerUp, true);
        window.addEventListener('pointermove', this.#onPointerMove, true);
        window.addEventListener('wheel', this.#onWheel, { capture: true, passive: true });
        window.addEventListener('keydown', this.#onKeyDown, true);
        window.addEventListener('keyup', this.#onKeyUp, true);
        window.addEventListener('blur', this.#onBlur);
    }

    #detach(): void
    {
        if (!this.#attached) return;
        this.#attached = false;
        window.removeEventListener('pointerdown', this.#onPointerDown, true);
        window.removeEventListener('pointerup', this.#onPointerUp, true);
        window.removeEventListener('pointermove', this.#onPointerMove, true);
        window.removeEventListener('wheel', this.#onWheel, true);
        window.removeEventListener('keydown', this.#onKeyDown, true);
        window.removeEventListener('keyup', this.#onKeyUp, true);
        window.removeEventListener('blur', this.#onBlur);
        this.#pressedButtons.clear();
        this.#keys.clear();
    }

    /** 视图矩形 */
    #viewRect(): ViewRect
    {
        if (this.#getViewRect) return this.#getViewRect();
        const rect = this.#canvas.getBoundingClientRect();

        return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    }

    /** 指针是否在视口内 */
    #isPointerInView(clientX: number, clientY: number): boolean
    {
        const rect = this.#viewRect();

        return clientX >= rect.x && clientX <= rect.x + rect.width
            && clientY >= rect.y && clientY <= rect.y + rect.height;
    }

    /**
     * 按当前方案匹配鼠标手势。
     *
     * @param event 指针事件
     */
    #matchGesture(event: PointerEvent): MouseGestureBinding | null
    {
        // 视图工具（Unity 的 Q）优先：激活时左键拖动为平移
        const viewToolGesture = this.#scheme.viewToolGesture;
        if (viewToolGesture && shortcut.getState('viewTool') && this.#matches(viewToolGesture, event)) return viewToolGesture;

        // 更具体的手势优先：Unreal 的「左键+右键拖动 = 平移」必须先于「右键 = 飞行」匹配，
        // 否则同时按下左右键会被判成飞行。
        let best: MouseGestureBinding | null = null;
        for (const gesture of this.#scheme.gestures)
        {
            if (!this.#matches(gesture, event)) continue;
            if (!best || gesture.buttons.length > best.buttons.length) best = gesture;
        }

        return best;
    }

    /**
     * 手势是否与当前指针事件匹配。
     *
     * Alt/Ctrl：未声明即要求「未按下」，保证 fly 与 dolly 这类同键手势互斥；
     * Shift：未声明表示「不关心」（Unity 用 Shift 给移动/缩放加速）；
     * 多项鼠标键（Unreal 的「左键+右键拖动」）需要全部处于按下状态。
     *
     * @param gesture 手势绑定
     * @param event 指针事件
     */
    #matches(gesture: MouseGestureBinding, event: PointerEvent): boolean
    {
        if (!gesture.buttons.includes(event.button as 0 | 1 | 2)) return false;
        if (!!gesture.alt !== event.altKey) return false;
        if (!!gesture.ctrl !== event.ctrlKey) return false;
        if (gesture.shift !== undefined && !!gesture.shift !== event.shiftKey) return false;

        return gesture.buttons.every((button) => button === event.button || this.#pressedButtons.has(button));
    }

    #onPointerDown = (event: PointerEvent): void =>
    {
        this.#pressedButtons.add(event.button);

        // 已在拖动手势中：不打断（Unreal 的「左键+右键」需要后按的键不改变手势）
        if (this.#active) return;
        if (!this.#isPointerInView(event.clientX, event.clientY)) return;

        const gesture = this.#matchGesture(event);
        if (!gesture) return;

        const camLogic = getLogic(this.#cameraObject);
        this.#active = {
            action: gesture.action,
            buttons: gesture.buttons,
            startPointer: new Vector2(event.clientX, event.clientY),
            startMatrix: camLogic.local2world.clone(),
            pivot: gesture.action === 'orbit' ? this.#resolveOrbitPivot() : null,
        };
        // 拖动导航期间激活状态：让「单击选择 / 框选」规则失效（Unity 同理）
        shortcut.activityState('cameraNavigating');

        if (gesture.action === 'fly')
        {
            this.#flying = true;
            this.#keys.clear();
            shortcut.activityState('fpsViewing');
        }

        // 屏蔽浏览器右键菜单（右键是飞行 / 环顾的起始手势）
        if (event.button === 2) event.preventDefault();
    };

    #onPointerUp = (event: PointerEvent): void =>
    {
        this.#pressedButtons.delete(event.button);

        const active = this.#active;
        if (active)
        {
            // 手势涉及的鼠标键松开即结束；fly/look 由右键驱动
            const ends = (active.action === 'fly' || active.action === 'look')
                ? event.button === 2
                : active.buttons.includes(event.button);
            if (ends)
            {
                this.#active = null;
                this.#lastDollyDistance = 0;
                shortcut.deactivityState('cameraNavigating');
            }
        }

        // 右键松开退出飞行
        if (this.#flying && !this.#pressedButtons.has(2))
        {
            this.#flying = false;
            this.#keys.clear();
            shortcut.deactivityState('fpsViewing');
        }
    };

    #onPointerMove = (event: PointerEvent): void =>
    {
        const active = this.#active;
        if (!active) return;

        const pointer = new Vector2(event.clientX, event.clientY);
        switch (active.action)
        {
            case 'orbit':
                // 基于手势起始矩阵 + 总位移重算，避免逐帧累积误差
                this.#applyOrbit(pointer, active);
                break;
            case 'pan':
                this.#applyPan(pointer, active);
                break;
            case 'dolly':
                this.#applyDollyByDrag(pointer, active);
                break;
            case 'look':
            case 'fly':
                // 转向用「当前矩阵 + 增量」，因此逐帧推进起始指针
                this.#applyLook(pointer, active);
                break;
        }
    };

    #onWheel = (event: WheelEvent): void =>
    {
        // 飞行中滚轮调速（Unity / Unreal），不缩放视图
        if (this.#flying && this.#scheme.wheelAdjustsFlySpeed)
        {
            const factor = event.deltaY < 0 ? SPEED_WHEEL_FACTOR : 1 / SPEED_WHEEL_FACTOR;
            this.#speed = Math.min(1000, Math.max(0.1, this.#speed * factor));

            return;
        }

        if (!this.#isPointerInView(event.clientX, event.clientY)) return;

        const boost = event.shiftKey ? this.#scheme.speedBoost : 1;
        const distance = -event.deltaY * this.#scheme.wheelDollyStep * sceneControlConfig.lookDistance / 10 * boost;
        this.#dolly(distance);
        sceneControlConfig.lookDistance -= distance;
    };

    #onKeyDown = (event: KeyboardEvent): void =>
    {
        const key = normalizeKey(event);
        if (!key) return;
        this.#keys.add(key);
        if (this.#flying && isFlyKey(this.#scheme.flyKeys, key)) event.preventDefault();
    };

    #onKeyUp = (event: KeyboardEvent): void =>
    {
        const key = normalizeKey(event);
        if (key) this.#keys.delete(key);
    };

    /** 失焦时清空输入，避免松开事件丢失导致相机持续漂移 */
    #onBlur = (): void =>
    {
        this.#keys.clear();
        this.#pressedButtons.clear();
        this.#active = null;
        shortcut.deactivityState('cameraNavigating');
        if (this.#flying)
        {
            this.#flying = false;
            shortcut.deactivityState('fpsViewing');
        }
    };

    // ---------------------------------------------------------------------
    // 动作实现
    // ---------------------------------------------------------------------

    /** 环绕中心：选中对象包围盒中心，缺省为相机前方 lookDistance 处 */
    #resolveOrbitPivot(): Vector3 | null
    {
        const picked = this.#getOrbitPivot?.() ?? null;
        if (picked) return picked;

        const camLogic = getLogic(this.#cameraObject);
        const forward = camLogic.local2world.getAxisZ();
        forward.scaleNumber(-sceneControlConfig.lookDistance);

        return camLogic.worldPosition.addTo(forward);
    }

    /** 环绕：绕 pivot 旋转（位移占比 → 角度 → 弧度） */
    #applyOrbit(pointer: Vector2, active: ActiveGesture): void
    {
        const rect = this.#viewRect();
        if (!rect.width || !rect.height) return;
        const pivot = active.pivot;
        if (!pivot) return;

        const dx = pointer.x - active.startPointer.x;
        const dy = pointer.y - active.startPointer.y;
        const boost = this.#shiftBoost();
        const rotateX = dy / rect.height * 180 * DEG2RAD * boost;
        const rotateY = dx / rect.width * 180 * DEG2RAD * boost;

        const matrix = active.startMatrix.clone();
        matrix.appendRotation(Vector3.Y_AXIS, rotateY, pivot);
        const axisX = matrix.getAxisX();
        matrix.appendRotation(axisX, rotateX, pivot);
        setWorldMatrix(this.#cameraObject, matrix);
    }

    /** 平移：像素位移 → 世界尺寸（`getScaleByDepth` 给的是视口高度对应尺寸，需除以像素高度） */
    #applyPan(pointer: Vector2, active: ActiveGesture): void
    {
        const rect = this.#viewRect();
        if (!rect.width || !rect.height) return;

        const camera = getLogic(this.#cameraObject).getComponent<PerspectiveCamera>('PerspectiveCamera');
        const scaleByDepth = camera
            ? getLogic(camera).getScaleByDepth(sceneControlConfig.lookDistance)
            : rect.height;
        const boost = this.#shiftBoost();
        const worldPerPixel = scaleByDepth / rect.height * boost;

        const dx = pointer.x - active.startPointer.x;
        const dy = pointer.y - active.startPointer.y;

        const up = active.startMatrix.getAxisY();
        const right = active.startMatrix.getAxisX();
        up.normalize(dy * worldPerPixel);
        right.normalize(-dx * worldPerPixel);

        const matrix = active.startMatrix.clone();
        matrix.appendTranslation(up.x + right.x, up.y + right.y, up.z + right.z);
        setWorldMatrix(this.#cameraObject, matrix);
    }

    /** 推拉（Alt+右键拖动）：像素位移 → 沿视线前后移动（基于起始矩阵重算） */
    #applyDollyByDrag(pointer: Vector2, active: ActiveGesture): void
    {
        const rect = this.#viewRect();
        if (!rect.width || !rect.height) return;

        const dx = pointer.x - active.startPointer.x;
        const dy = pointer.y - active.startPointer.y;
        const boost = this.#shiftBoost();
        // 采用与 Unity 一致的「鼠标向右下拖动 = 拉远」手感（像素和 × 步长）
        const distance = -(dx + dy) * sceneControlConfig.sceneCameraForwardBackwardStep * boost;

        if (this.#lastDollyDistance !== 0)
        {
            sceneControlConfig.lookDistance += this.#lastDollyDistance;
        }
        this.#lastDollyDistance = distance;
        sceneControlConfig.lookDistance -= distance;
        setWorldMatrix(this.#cameraObject, active.startMatrix.clone().moveForward(distance));
    }

    /** 沿当前视线前后移动（正数前进） */
    #dolly(distance: number): void
    {
        const camLogic = getLogic(this.#cameraObject);
        setWorldMatrix(this.#cameraObject, camLogic.local2world.clone().moveForward(distance));
    }

    /** 环顾/飞行转向：拖动增量 → 相机旋转（当前矩阵 + 增量，逐帧推进起始指针） */
    #applyLook(pointer: Vector2, active: ActiveGesture): void
    {
        const dx = pointer.x - active.startPointer.x;
        const dy = pointer.y - active.startPointer.y;
        active.startPointer.x = pointer.x;
        active.startPointer.y = pointer.y;
        if (dx === 0 && dy === 0) return;

        const camLogic = getLogic(this.#cameraObject);
        const matrix = camLogic.local2world.clone();
        const position = camLogic.worldPosition;
        matrix.appendRotation(matrix.getAxisX(), dy * LOOK_RAD_PER_PIXEL, position);
        const up = Vector3.Y_AXIS.clone();
        if (matrix.getAxisY().dot(up) < 0) up.scaleNumber(-1);
        matrix.appendRotation(up, dx * LOOK_RAD_PER_PIXEL, position);
        setWorldMatrix(this.#cameraObject, matrix);
    }

    /** Shift 加速倍率（Unity：按住 Shift 加快移动与缩放） */
    #shiftBoost(): number
    {
        return this.#keys.has('shift') ? this.#scheme.speedBoost : 1;
    }

    // ---------------------------------------------------------------------
    // 每帧积分（飞行 / 方向键行走）
    // ---------------------------------------------------------------------

    #update(interval: number): void
    {
        const dt = (interval > 0 ? interval : 1000 / 60) / 1000;

        const camLogic = getLogic(this.#cameraObject);
        const right = camLogic.local2world.getAxisX();
        const forward = camLogic.local2world.getAxisZ();
        forward.scaleNumber(-1);

        const move = new Vector3();
        const moving = this.#flying
            ? accumulate(move, right, forward, this.#keys, this.#scheme.flyKeys)
            : accumulate(move, right, forward, this.#keys, this.#scheme.walkKeys);
        if (!moving) return;

        const speed = this.#speed * (this.#keys.has('shift') ? this.#scheme.speedBoost : 1);
        const distance = speed * dt;
        const position = camLogic.worldPosition;
        const target = new Vector3(
            position.x + move.x * distance,
            position.y + move.y * distance,
            position.z + move.z * distance,
        );
        setWorldMatrix(this.#cameraObject, camLogic.local2world.clone().setPosition(target));
    }
}

/**
 * 按按键映射累积移动方向（相机空间前后左右 + 全局升降）。
 *
 * @param move 输出方向（累加）
 * @param right 相机右方向
 * @param forward 相机前方向
 * @param keys 当前按下的按键
 * @param keyMap 按键映射
 */
function accumulate(move: Vector3, right: Vector3, forward: Vector3, keys: Set<string>, keyMap: NavigationKeyMap): boolean
{
    if (keys.has(keyMap.forward)) move.add(forward);
    if (keys.has(keyMap.back)) move.sub(forward);
    if (keys.has(keyMap.right)) move.add(right);
    if (keys.has(keyMap.left)) move.sub(right);
    if (keyMap.up && keys.has(keyMap.up)) move.y += 1;
    if (keyMap.down && keys.has(keyMap.down)) move.y -= 1;

    return move.lengthSquared > 0;
}

/** 是否为飞行按键（用于阻止浏览器默认行为） */
function isFlyKey(keyMap: NavigationKeyMap, key: string): boolean
{
    return key === keyMap.forward || key === keyMap.back || key === keyMap.left || key === keyMap.right
        || key === keyMap.up || key === keyMap.down;
}

/**
 * 归一化按键名（字母键取小写，方向键/修饰键保留原名，与 ShortcutConfig 的写法一致）。
 *
 * @param event 键盘事件
 */
function normalizeKey(event: KeyboardEvent): string | null
{
    const key = event.key?.toLowerCase();
    if (!key) return null;
    if (key.startsWith('arrow') || key === 'shift' || key === 'control' || key === 'alt' || key === 'meta') return key;
    if (key.length === 1 && key >= 'a' && key <= 'z') return key;

    return null;
}
