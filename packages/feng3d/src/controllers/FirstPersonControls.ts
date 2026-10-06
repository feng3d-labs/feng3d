import { Behaviour, BehaviourLogic, createBehaviourLogicBase } from '../component/Behaviour';
import { registerLogic, logic as getLogic, reactive } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { mat4GetAxisX, mat4GetAxisY, mat4GetAxisZ, Matrix4x4Like, Vector3Like } from '@feng3d/math';
import { windowEventProxy } from '@feng3d/shortcut';
import { Object3D } from '../core/Object3D';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        FirstPersonControls: FirstPersonControls;
    }
}

/**
 * FirstPersonControls（纯数据接口）。
 *
 * 对齐 three.js 的 `examples/jsm/controls/FirstPersonControls`：鼠标在窗口中移动即转向
 * （不需要按住），W/↑ 前进、S/↓ 后退、A/← 左移、D/→ 右移、R 上升、F 下降；
 * 鼠标左键按下等于前进、右键等于后退（`activeLook` 时）。
 *
 * 与 {@link FPSController} 的区别：FPSController 是"按住鼠标拖拽转向"的自由飞行控制器，
 * 本组件是 three 原示例用的"指针位置即转向"语义，用于逐项对齐 three.js 移植示例。
 */
export interface FirstPersonControls extends Behaviour
{
    readonly __type__: 'FirstPersonControls';
    /** 移动速度（单位/秒），three 默认 1 */
    readonly movementSpeed?: number;
    /** 转向速度（弧度/像素），three 默认 0.005 */
    readonly lookSpeed?: number;
    /** 是否允许垂直转向，three 默认 true */
    readonly lookVertical?: boolean;
    /** 是否自动前进，three 默认 false */
    readonly autoForward?: boolean;
    /** 是否响应鼠标转向/按键前后，three 默认 true */
    readonly activeLook?: boolean;
    /** 移动速度是否随高度变化，three 默认 false */
    readonly heightSpeed?: boolean;
    /** 高度速度系数，three 默认 1 */
    readonly heightCoef?: number;
    /** 高度下限，three 默认 0 */
    readonly heightMin?: number;
    /** 高度上限，three 默认 1 */
    readonly heightMax?: number;
    /** 是否约束垂直角度范围，three 默认 false */
    readonly constrainVertical?: boolean;
    /** 垂直角度下限（弧度），three 默认 0 */
    readonly verticalMin?: number;
    /** 垂直角度上限（弧度），three 默认 π */
    readonly verticalMax?: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        FirstPersonControls: FirstPersonControlsLogic;
    }
}

/**
 * FirstPersonControls 逻辑接口。
 *
 * 继承 BehaviourLogic，额外：
 * - auto getter/setter（订阅/取消 window 鼠标键盘事件）
 * - lookAt：把朝向设为目标点（等价 three 的 `controls.lookAt(target)`）
 * - init：订阅事件；update：按输入推进位移与朝向；dispose：取消订阅
 */
export interface FirstPersonControlsLogic extends BehaviourLogic
{
    /** 是否自动订阅鼠标键盘事件 */
    auto: boolean;
    /** 把朝向设为目标点（等价 three 的 `controls.lookAt(target)`） */
    lookAt(target: Vector3Like): void;
}

/** 角度 → 弧度 */
const DEG2RAD = Math.PI / 180;
/** 弧度 → 角度 */
const RAD2DEG = 180 / Math.PI;

/**
 * 工厂函数：FirstPersonControlsLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function firstPersonControlsLogic(data: FirstPersonControls): FirstPersonControlsLogic
{
    const { members } = createBehaviourLogicBase(data);

    /** init 去重标志 */
    let subInited = false;
    /** 是否自动订阅事件 */
    let auto = false;

    // ---- 内部状态（three 的 _lat / _lon / _pointerX / _pointerY 等）----
    /** 纬度（度） */
    let lat = 0;
    /** 经度（度） */
    let lon = 0;
    /** 指针相对窗口中心的 X 偏移（像素） */
    let pointerX = 0;
    /** 指针相对窗口中心的 Y 偏移（像素） */
    let pointerY = 0;
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let moveUp = false;
    let moveDown = false;
    /** three 的 _autoSpeedFactor */
    let autoSpeedFactor = 0;

    /** 响应式数据代理（reactive 有 WeakMap 缓存；直接读字段 + `??` 兜底默认值，不额外包一层函数） */
    const r_d = reactive(data);

    /** three 的 MathUtils.mapLinear */
    function mapLinear(x: number, a1: number, a2: number, b1: number, b2: number): number
    {
        return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
    }

    /** 当前物体（未 init 时为 null） */
    const entity = (): Object3D | null => members.entity as Object3D | null;

    /** 朝向是否已按当前姿态初始化（three 在构造函数末尾做，这里推迟到 Object3D 就绪） */
    let orientationInited = false;

    /**
     * 首次取到可用的 local2world 时按当前姿态初始化 lat/lon。
     *
     * 组件的 init 阶段所属 Object3D 的 logic 可能还是占位对象（其 `local2world` 取不到），
     * 所以不在 init 里读矩阵，改到第一次 update 时。
     */
    function ensureOrientation(): void
    {
        if (orientationInited) return;
        const e = entity();
        if (!e) return;
        const eLogic = getLogic(e) as unknown as { local2world?: { elements?: readonly number[] } } | undefined;
        if (!eLogic?.local2world?.elements) return;
        orientationInited = true;
        setOrientation();
    }

    /**
     * 由当前朝向反算 lat/lon（three 的 _setOrientation）。
     */
    function setOrientation(): void
    {
        const e = entity();
        if (!e) return;
        const eLogic = getLogic(e) as unknown as { local2world?: { elements?: readonly number[] } } | undefined;
        if (!eLogic?.local2world?.elements) return;
        const matrix = eLogic.local2world as unknown as Matrix4x4Like;
        // 相机 forward = 本地 -Z 的世界方向
        const dir = { x: 0, y: 0, z: 0 };
        mat4GetAxisZ(matrix, dir);
        dir.x = -dir.x; dir.y = -dir.y; dir.z = -dir.z;
        const radius = Math.hypot(dir.x, dir.y, dir.z) || 1;
        const phi = Math.acos(Math.max(-1, Math.min(1, dir.y / radius)));
        const theta = Math.atan2(dir.x, dir.z);
        lat = 90 - phi * RAD2DEG;
        lon = theta * RAD2DEG;
    }

    /**
     * 沿本地轴平移（three 的 object.translateX/Y/Z：(position) += matrixColumn * distance）。
     *
     * @param x 本地 X 方向位移
     * @param y 本地 Y 方向位移
     * @param z 本地 Z 方向位移
     */
    function translateLocal(x: number, y: number, z: number): void
    {
        const e = entity();
        if (!e) return;
        const eLogic = getLogic(e);
        const matrix = eLogic.local2world;
        const axisX = { x: 0, y: 0, z: 0 };
        const axisY = { x: 0, y: 0, z: 0 };
        const axisZ = { x: 0, y: 0, z: 0 };
        mat4GetAxisX(matrix, axisX);
        mat4GetAxisY(matrix, axisY);
        mat4GetAxisZ(matrix, axisZ);
        const cur = eLogic.position;
        reactive(e).position = {
            x: cur.x + axisX.x * x + axisY.x * y + axisZ.x * z,
            y: cur.y + axisX.y * x + axisY.y * y + axisZ.y * z,
            z: cur.z + axisX.z * x + axisY.z * y + axisZ.z * z,
        };
    }

    const onKeyDown = (event: IEvent<KeyboardEvent>): void =>
    {
        switch (event.data!.code)
        {
            case 'ArrowUp':
            case 'KeyW': moveForward = true; break;
            case 'ArrowLeft':
            case 'KeyA': moveLeft = true; break;
            case 'ArrowDown':
            case 'KeyS': moveBackward = true; break;
            case 'ArrowRight':
            case 'KeyD': moveRight = true; break;
            case 'KeyR': moveUp = true; break;
            case 'KeyF': moveDown = true; break;
            default: break;
        }
    };

    const onKeyUp = (event: IEvent<KeyboardEvent>): void =>
    {
        switch (event.data!.code)
        {
            case 'ArrowUp':
            case 'KeyW': moveForward = false; break;
            case 'ArrowLeft':
            case 'KeyA': moveLeft = false; break;
            case 'ArrowDown':
            case 'KeyS': moveBackward = false; break;
            case 'ArrowRight':
            case 'KeyD': moveRight = false; break;
            case 'KeyR': moveUp = false; break;
            case 'KeyF': moveDown = false; break;
            default: break;
        }
    };

    const onPointerMove = (event: IEvent<PointerEvent>): void =>
    {
        const data = event.data!;
        // 视口尺寸用 `self`（浏览器里就是 window；Node 测试环境退化为 0）。
        // three 用 domElement.offsetWidth/offsetHeight，这里事件挂在 window 上，口径一致。
        const view = self as Partial<Window>;
        pointerX = data.pageX - (view.innerWidth ?? 0) / 2;
        pointerY = data.pageY - (view.innerHeight ?? 0) / 2;
    };

    const onPointerDown = (event: IEvent<PointerEvent>): void =>
    {
        if (!(r_d.activeLook ?? true)) return;
        switch (event.data!.button)
        {
            case 0: moveForward = true; break;
            case 2: moveBackward = true; break;
            default: break;
        }
    };

    const onPointerUp = (event: IEvent<PointerEvent>): void =>
    {
        if (!(r_d.activeLook ?? true)) return;
        switch (event.data!.button)
        {
            case 0: moveForward = false; break;
            case 2: moveBackward = false; break;
            default: break;
        }
    };

    const onContextMenu = (event: IEvent<MouseEvent>): void =>
    {
        if (!members.isVisibleAndEnabled) return;
        event.data!.preventDefault();
    };

    /** 设置 auto（订阅/取消 window 鼠标键盘事件） */
    function setAuto(value: boolean): void
    {
        if (auto === value) return;
        if (auto)
        {
            windowEventProxy.off('keydown', onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('keyup', onKeyUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointermove', onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointerdown', onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointerup', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('contextmenu', onContextMenu as (event: IEvent<unknown>) => void, null);
        }
        auto = value;
        if (auto)
        {
            windowEventProxy.on('keydown', onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('keyup', onKeyUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointermove', onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointerdown', onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointerup', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('contextmenu', onContextMenu as (event: IEvent<unknown>) => void, null);
        }
    }

    const logic: FirstPersonControlsLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 是否自动订阅鼠标键盘事件 */
        get auto() { return auto; },
        set auto(value) { setAuto(value); },
        /** 把朝向设为目标点（等价 three 的 controls.lookAt(target)） */
        lookAt(target: Vector3Like): void
        {
            const e = entity();
            if (!e) return;
            getLogic(e).lookAt(target);
            setOrientation();
        },
        init(object3D)
        {
            if (subInited) return;
            subInited = true;
            members.init(object3D);
            setAuto(true);
        },
        update(interval)
        {
            members.update(0);
            const e = entity();
            if (!e) return;
            // three 在构造时用当前 quaternion 初始化 lat/lon；这里在第一次 update（Object3D 已就绪）补上
            ensureOrientation();
            // fengd3 的 update 间隔是毫秒，three 的 update(delta) 是秒
            const delta = (interval ?? 1000 / 60) / 1000;
            const eLogic = getLogic(e);

            const heightMin = r_d.heightMin ?? 0;

            // 高度相关速度（three 的 heightSpeed 分支）
            if (r_d.heightSpeed)
            {
                const y = Math.max(heightMin, Math.min(r_d.heightMax ?? 1, eLogic.position.y));
                autoSpeedFactor = delta * ((y - heightMin) * (r_d.heightCoef ?? 1));
            }
            else
            {
                autoSpeedFactor = 0;
            }

            const actualMoveSpeed = delta * (r_d.movementSpeed ?? 1);
            if (moveForward || (r_d.autoForward && !moveBackward)) translateLocal(0, 0, -(actualMoveSpeed + autoSpeedFactor));
            if (moveBackward) translateLocal(0, 0, actualMoveSpeed);
            if (moveLeft) translateLocal(-actualMoveSpeed, 0, 0);
            if (moveRight) translateLocal(actualMoveSpeed, 0, 0);
            if (moveUp) translateLocal(0, actualMoveSpeed, 0);
            if (moveDown) translateLocal(0, -actualMoveSpeed, 0);

            let actualLookSpeed = delta * (r_d.lookSpeed ?? 0.005);
            if (!(r_d.activeLook ?? true)) actualLookSpeed = 0;
            let verticalLookRatio = 1;
            const verticalMin = r_d.verticalMin ?? 0;
            const verticalMax = r_d.verticalMax ?? Math.PI;
            if (r_d.constrainVertical)
            {
                verticalLookRatio = Math.PI / (verticalMax - verticalMin);
            }

            lon -= pointerX * actualLookSpeed;
            if (r_d.lookVertical ?? true) lat -= pointerY * actualLookSpeed * verticalLookRatio;
            lat = Math.max(-85, Math.min(85, lat));

            let phi = (90 - lat) * DEG2RAD;
            const theta = lon * DEG2RAD;
            if (r_d.constrainVertical)
            {
                phi = mapLinear(phi, 0, Math.PI, verticalMin, verticalMax);
            }

            const p = eLogic.position;
            // three 的 Spherical.setFromSphericalCoords(1, phi, theta)
            const sinPhiRadius = Math.sin(phi);
            getLogic(e).lookAt({
                x: sinPhiRadius * Math.sin(theta) + p.x,
                y: Math.cos(phi) + p.y,
                z: sinPhiRadius * Math.cos(theta) + p.z,
            });
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose()
        {
            setAuto(false);
            members.dispose();
        },
    };

    return logic;
}
// 注册到 logic 分发表
registerLogic('FirstPersonControls', firstPersonControlsLogic);
