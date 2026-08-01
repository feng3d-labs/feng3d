import { Behaviour, behaviourLogic, BehaviourLogic } from '../component/Behaviour';
import { registerLogic, logic as getLogic, batchRun, reactive } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { Vector2, Vector3 } from '@feng3d/math';
import { windowEventProxy } from '@feng3d/shortcut';
import { Object3D } from '../core/Object3D';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        OrbitControls: OrbitControls;
    }
}

/**
 * OrbitControls（纯数据接口）。
 *
 * 鼠标拖拽旋转（左键）、滚轮缩放、右键平移的轨道相机控制器。挂在相机 Object3D 的 components 里，
 * 与 PerspectiveCamera 并列（用法同 FPSController）。每帧由 Scene.update 驱动。
 *
 * 对应 three.js OrbitControls，用球坐标（pan/tilt/distance）围绕 target 旋转。
 */
export interface OrbitControls extends Behaviour
{
    readonly __type__: 'OrbitControls';
    /** 轨道中心（目标点），缺失时 {0,0,0} */
    readonly target?: { x: number; y: number; z: number };
    /** 相机到 target 的距离，缺失时由当前 position 推断 */
    readonly distance?: number;
    /** 水平旋转角（弧度），缺失时由当前 position 推断 */
    readonly panAngle?: number;
    /** 垂直旋转角（弧度），缺失时由当前 position 推断 */
    readonly tiltAngle?: number;
    /** 最小距离 */
    readonly minDistance?: number;
    /** 最大距离 */
    readonly maxDistance?: number;
    /** 最小垂直角（弧度），默认 0.1 */
    readonly minTiltAngle?: number;
    /** 最大垂直角（弧度），默认 π-0.1 */
    readonly maxTiltAngle?: number;
    /** 旋转灵敏度（弧度/像素），默认 0.005 */
    readonly rotateSpeed?: number;
    /** 缩放灵敏度，默认 0.1 */
    readonly zoomSpeed?: number;
    /** 平移灵敏度，默认 1.0 */
    readonly panSpeed?: number;
    /** 阻尼系数（0=无阻尼，1=完全阻尼），默认 0（直接跟随） */
    readonly damping?: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        OrbitControls: OrbitControlsLogic;
    }
}

/**
 * OrbitControls 逻辑处理接口。
 */
export interface OrbitControlsLogic extends BehaviourLogic
{
    /** 是否自动订阅鼠标事件 */
    readonly auto: boolean;
}

/**
 * 创建 OrbitControlsLogic 实例（工厂函数，组合 behaviourLogic 基础行为）。
 */
export function orbitControlsLogic(oc: OrbitControls): OrbitControlsLogic
{
    // 默认值
    const writable = oc as { target?: { x: number; y: number; z: number }; distance?: number; panAngle?: number; tiltAngle?: number; minDistance?: number; maxDistance?: number; minTiltAngle?: number; maxTiltAngle?: number; rotateSpeed?: number; zoomSpeed?: number; panSpeed?: number; damping?: number };
    if (oc.target === undefined) writable.target = { x: 0, y: 0, z: 0 };
    if (oc.minDistance === undefined) writable.minDistance = 0.1;
    if (oc.maxDistance === undefined) writable.maxDistance = 10000;
    if (oc.minTiltAngle === undefined) writable.minTiltAngle = 0.1;
    if (oc.maxTiltAngle === undefined) writable.maxTiltAngle = Math.PI - 0.1;
    if (oc.rotateSpeed === undefined) writable.rotateSpeed = 0.005;
    if (oc.zoomSpeed === undefined) writable.zoomSpeed = 0.1;
    if (oc.panSpeed === undefined) writable.panSpeed = 1.0;
    if (oc.damping === undefined) writable.damping = 0;

    const base = behaviourLogic(oc);

    let _subInited = false;
    let _auto = false;

    // 球坐标状态（从 position 推断或从数据字段读取）
    let _panAngle = oc.panAngle ?? 0;
    let _tiltAngle = oc.tiltAngle ?? Math.PI / 2;
    let _distance = oc.distance ?? 5;
    // 平移偏移（target 的动态偏移，右键拖拽时更新）
    const tgt = oc.target ?? { x: 0, y: 0, z: 0 };
    let _targetX = tgt.x;
    let _targetY = tgt.y;
    let _targetZ = tgt.z;

    let preMouse: Vector2 | null = null;
    let mouseButton = 0; // 0=left(rotate), 2=right(pan)

    /** 从当前 position 推断球坐标（init 时调用一次） */
    function initFromPosition(): void
    {
        if (!base.entity) return;
        const pos = getLogic(base.entity).position;
        if (!pos) return;
        const dx = pos.x - _targetX;
        const dy = pos.y - _targetY;
        const dz = pos.z - _targetZ;
        _distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (_distance < (oc.minDistance ?? 0.1)) _distance = oc.minDistance ?? 0.1;
        _tiltAngle = Math.acos(Math.max(-1, Math.min(1, dy / _distance)));
        _panAngle = Math.atan2(dx, dz);
        if (oc.panAngle === undefined) { /* keep inferred */ }
    }

    /** 应用球坐标 → 写回 camera position + lookAt */
    function applyTransform(): void
    {
        if (!base.entity) return;
        const objLogic = getLogic(base.entity);
        if (!objLogic || !objLogic.local2world) return;
        const sinTilt = Math.sin(_tiltAngle);
        const x = _targetX + _distance * sinTilt * Math.sin(_panAngle);
        const y = _targetY + _distance * Math.cos(_tiltAngle);
        const z = _targetZ + _distance * sinTilt * Math.cos(_panAngle);

        batchRun(() =>
        {
            reactive(base.entity).position = { x, y, z };
        });
        // lookAt：用矩阵 lookAt + toTRS 写回 rotation（与 Object3DLogic.lookAt 等价）
        const m = objLogic.local2world.clone();
        m.lookAt(new Vector3(_targetX, _targetY, _targetZ), Vector3.Y_AXIS);
        // 转回本地坐标（处理父节点）
        const parent = getLogic(base.entity).parent;
        if (parent)
        {
            m.append(getLogic(parent as Object3D).world2local);
        }
        const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
        m.toTRS(pos, rot, scl);
        batchRun(() =>
        {
            reactive(base.entity).rotation = { x: rot.x, y: rot.y, z: rot.z };
        });
    }

    const onMousedown = (event: IEvent<MouseEvent>): void =>
    {
        preMouse = new Vector2(event.data.clientX, event.data.clientY);
        mouseButton = event.data.button;
        windowEventProxy.on('mousemove', onMouseMove, null);
    };

    const onMouseup = (): void =>
    {
        preMouse = null;
        windowEventProxy.off('mousemove', onMouseMove, null);
    };

    const onMouseMove = (event: IEvent<MouseEvent>): void =>
    {
        if (!preMouse) return;
        const cur = new Vector2(event.data.clientX, event.data.clientY);
        const dx = cur.x - preMouse.x;
        const dy = cur.y - preMouse.y;
        preMouse = cur;

        if (mouseButton === 0)
        {
            // 左键：旋转
            _panAngle -= dx * (oc.rotateSpeed ?? 0.005);
            _tiltAngle -= dy * (oc.rotateSpeed ?? 0.005);
            _tiltAngle = Math.max(oc.minTiltAngle ?? 0.1, Math.min(oc.maxTiltAngle ?? Math.PI - 0.1, _tiltAngle));
        }
        else if (mouseButton === 2)
        {
            // 右键：平移（在相机的本地 XY 平面内移动 target）
            const speed = (oc.panSpeed ?? 1.0) * _distance * 0.001;
            const right = getLogic(base.entity).local2world.getAxisX();
            const up = getLogic(base.entity).local2world.getAxisY();
            _targetX -= right.x * dx * speed + up.x * dy * speed;
            _targetY -= right.y * dx * speed + up.y * dy * speed;
            _targetZ -= right.z * dx * speed + up.z * dy * speed;
        }
    };

    const onWheel = (event: IEvent<WheelEvent>): void =>
    {
        const delta = event.data.deltaY * 0.001 * (oc.zoomSpeed ?? 0.1);
        _distance *= (1 + delta);
        _distance = Math.max(oc.minDistance ?? 0.1, Math.min(oc.maxDistance ?? 10000, _distance));
    };

    const onContext = (e: IEvent<Event>): void =>
    {
        // 阻止右键菜单
        if (e.data && typeof (e.data as Event).preventDefault === 'function')
        {
            (e.data as Event).preventDefault();
        }
    };

    const setAuto = (value: boolean): void =>
    {
        if (_auto === value) return;
        if (_auto)
        {
            windowEventProxy.off('mousedown', onMousedown, null);
            windowEventProxy.off('mouseup', onMouseup, null);
            windowEventProxy.off('wheel', onWheel, null);
            windowEventProxy.off('contextmenu', onContext, null);
            onMouseup();
        }
        _auto = value;
        if (_auto)
        {
            windowEventProxy.on('mousedown', onMousedown, null);
            windowEventProxy.on('mouseup', onMouseup, null);
            windowEventProxy.on('wheel', onWheel, null);
            windowEventProxy.on('contextmenu', onContext, null);
        }
    };

    const baseInit = base.init;
    const baseUpdate = base.update;
    const baseDispose = base.dispose;

    return Object.assign(base, {
        get auto(): boolean { return _auto; },
        set auto(value: boolean) { setAuto(value); },
        init(object3D?: Object3D): void
        {
            if (_subInited) return;
            _subInited = true;
            baseInit(object3D);

            // 从数据字段或当前 position 推断球坐标
            if (oc.panAngle !== undefined && oc.tiltAngle !== undefined && oc.distance !== undefined)
            {
                _panAngle = oc.panAngle;
                _tiltAngle = oc.tiltAngle;
                _distance = oc.distance;
            }
            else
            {
                initFromPosition();
            }
            applyTransform();

            setAuto(true);
        },
        update(_interval: number): void
        {
            baseUpdate(0);
            applyTransform();
        },
        dispose(): void
        {
            setAuto(false);
            baseDispose();
        },
    }) as unknown as OrbitControlsLogic;
}

// 注册到 componentLogic 分发表
registerLogic('OrbitControls', orbitControlsLogic);
