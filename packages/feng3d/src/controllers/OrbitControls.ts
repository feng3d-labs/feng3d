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
 * 鼠标/触摸拖拽旋转、滚轮缩放、右键/双指平移的轨道相机控制器，挂在相机 Object3D
 * 的 components 里，与 PerspectiveCamera 并列（用法同 FPSController）。每帧由
 * Scene.update 驱动。
 *
 * 对照 three.js OrbitControls，用球坐标（pan/tilt/distance）围绕 target 旋转。
 *
 * 支持：左键/单指旋转、右键/Ctrl+左键平移、中键拖拽/滚轮/双指捏合缩放、方向键平移、
 * 阻尼惯性、自动旋转、水平/垂直角限制、enable 开关、saveState/reset。
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
    /** 最小距离，默认 0.1 */
    readonly minDistance?: number;
    /** 最大距离，默认 10000 */
    readonly maxDistance?: number;
    /** 最小垂直角（弧度），默认 0.1 */
    readonly minTiltAngle?: number;
    /** 最大垂直角（弧度），默认 π-0.1 */
    readonly maxTiltAngle?: number;
    /** 最小水平角（弧度），默认 -Infinity */
    readonly minPanAngle?: number;
    /** 最大水平角（弧度），默认 Infinity */
    readonly maxPanAngle?: number;
    /** 旋转灵敏度（弧度/像素），默认 0.005 */
    readonly rotateSpeed?: number;
    /** 缩放灵敏度，默认 1.0 */
    readonly zoomSpeed?: number;
    /** 平移灵敏度，默认 1.0 */
    readonly panSpeed?: number;
    /** 键盘平移速度（像素/按键），默认 7.0 */
    readonly keyPanSpeed?: number;
    /** 是否开启阻尼（惯性），默认 false */
    readonly enableDamping?: boolean;
    /** 阻尼系数（0~1），默认 0.05 */
    readonly dampingFactor?: number;
    /** 是否开启旋转，默认 true */
    readonly enableRotate?: boolean;
    /** 是否开启缩放，默认 true */
    readonly enableZoom?: boolean;
    /** 是否开启平移，默认 true */
    readonly enablePan?: boolean;
    /** 是否开启键盘，默认 true */
    readonly enableKeys?: boolean;
    /** 是否自动旋转，默认 false */
    readonly autoRotate?: boolean;
    /** 自动旋转速度（30 秒/圈 @60fps 对应 2.0），默认 2.0 */
    readonly autoRotateSpeed?: number;
    /** 平移模式：true 屏幕空间（相机 XY 平面），false 水平面（相机 XZ 平面），默认 true */
    readonly screenSpacePanning?: boolean;
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
    /** 是否自动订阅鼠标/触摸/键盘事件 */
    get auto(): boolean;
    /** 保存当前状态（target/position/球坐标），供 reset 恢复 */
    saveState(): void;
    /** 恢复到上次 saveState 的状态（或初始状态） */
    reset(): void;
}

/** 球坐标增量（用于阻尼衰减） */
interface SphericalDelta { theta: number; phi: number; radius: number; }

/** 已跟踪的指针信息 */
interface TrackedPointer { id: number; x: number; y: number; }

/**
 * 创建 OrbitControlsLogic 实例（工厂函数，组合 behaviourLogic 基础行为）。
 *
 * 交互模式（对应 three.js OrbitControls）：
 * - 旋转：鼠标左键拖拽 / 单指触摸
 * - 平移：鼠标右键拖拽 / Ctrl+左键 / 方向键 / 双指触摸中点
 * - 缩放：滚轮 / 鼠标中键拖拽 / 双指捏合
 */
export function orbitControlsLogic(oc: OrbitControls): OrbitControlsLogic
{
    // ---- 默认值填充 ----
    const writable = oc as {
        target?: { x: number; y: number; z: number };
        minDistance?: number; maxDistance?: number;
        minTiltAngle?: number; maxTiltAngle?: number;
        minPanAngle?: number; maxPanAngle?: number;
        rotateSpeed?: number; zoomSpeed?: number; panSpeed?: number; keyPanSpeed?: number;
        enableDamping?: boolean; dampingFactor?: number;
        enableRotate?: boolean; enableZoom?: boolean; enablePan?: boolean; enableKeys?: boolean;
        autoRotate?: boolean; autoRotateSpeed?: number; screenSpacePanning?: boolean;
    };
    if (oc.target === undefined) writable.target = { x: 0, y: 0, z: 0 };
    if (oc.minDistance === undefined) writable.minDistance = 0.1;
    if (oc.maxDistance === undefined) writable.maxDistance = 10000;
    if (oc.minTiltAngle === undefined) writable.minTiltAngle = 0.1;
    if (oc.maxTiltAngle === undefined) writable.maxTiltAngle = Math.PI - 0.1;
    if (oc.minPanAngle === undefined) writable.minPanAngle = -Infinity;
    if (oc.maxPanAngle === undefined) writable.maxPanAngle = Infinity;
    if (oc.rotateSpeed === undefined) writable.rotateSpeed = 0.005;
    if (oc.zoomSpeed === undefined) writable.zoomSpeed = 1.0;
    if (oc.panSpeed === undefined) writable.panSpeed = 1.0;
    if (oc.keyPanSpeed === undefined) writable.keyPanSpeed = 7.0;
    if (oc.enableDamping === undefined) writable.enableDamping = false;
    if (oc.dampingFactor === undefined) writable.dampingFactor = 0.05;
    if (oc.enableRotate === undefined) writable.enableRotate = true;
    if (oc.enableZoom === undefined) writable.enableZoom = true;
    if (oc.enablePan === undefined) writable.enablePan = true;
    if (oc.enableKeys === undefined) writable.enableKeys = true;
    if (oc.autoRotate === undefined) writable.autoRotate = false;
    if (oc.autoRotateSpeed === undefined) writable.autoRotateSpeed = 2.0;
    if (oc.screenSpacePanning === undefined) writable.screenSpacePanning = true;

    const base = behaviourLogic(oc);

    // ---- 订阅状态 ----
    let _subInited = false;
    let _auto = false;

    // ---- 球坐标状态（内部变量，非响应式） ----
    const tgt = oc.target ?? { x: 0, y: 0, z: 0 };
    let _targetX = tgt.x;
    let _targetY = tgt.y;
    let _targetZ = tgt.z;
    let _panAngle = oc.panAngle ?? 0;
    let _tiltAngle = oc.tiltAngle ?? Math.PI / 2;
    let _distance = oc.distance ?? 5;

    // ---- 阻尼速度（球坐标增量，每帧衰减应用） ----
    const _sphericalDelta: SphericalDelta = { theta: 0, phi: 0, radius: 0 };
    // 平移偏移（每帧衰减应用）
    const _panOffset = new Vector3();

    // ---- 指针跟踪（统一鼠标+触摸） ----
    // 当前活跃指针列表（pointerId → 位置）
    const _pointers = new Map<number, TrackedPointer>();
    // 当前交互状态：'none' | 'rotate' | 'pan' | 'dolly'
    let _state: 'none' | 'rotate' | 'pan' | 'dolly' = 'none';
    // 上一次指针位置（单指操作用）
    let _lastX = 0;
    let _lastY = 0;
    // 双指初始距离（dolly 基准）
    let _dollyStartDist = 0;

    // ---- saveState 存储 ----
    let _savedTargetX = _targetX;
    let _savedTargetY = _targetY;
    let _savedTargetZ = _targetZ;
    let _savedPanAngle = _panAngle;
    let _savedTiltAngle = _tiltAngle;
    let _savedDistance = _distance;

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
    }

    /** 应用阻尼到球坐标增量与平移偏移，返回是否仍需继续 */
    function applyDamping(interval: number): void
    {
        // 帧率无关衰减系数：(1 - dampingFactor)^(interval / 标称帧时长)
        // 标称帧时长取 1000/60 ≈ 16.67ms，使 dampingFactor 在 60fps 下与 three.js 一致
        const k = oc.dampingFactor ?? 0.05;
        const decay = Math.pow(1 - k, interval / (1000 / 60));
        _sphericalDelta.theta *= 1 - decay;
        _sphericalDelta.phi *= 1 - decay;
        _panOffset.x *= 1 - decay;
        _panOffset.y *= 1 - decay;
        _panOffset.z *= 1 - decay;
    }

    /** 把球坐标增量与平移偏移累加到当前状态，并应用角度/距离限制 */
    function applyMovement(): void
    {
        _panAngle += _sphericalDelta.theta;
        _tiltAngle += _sphericalDelta.phi;
        _tiltAngle = Math.max(oc.minTiltAngle ?? 0.1, Math.min(oc.maxTiltAngle ?? Math.PI - 0.1, _tiltAngle));
        // 水平角限制
        const minPan = oc.minPanAngle ?? -Infinity;
        const maxPan = oc.maxPanAngle ?? Infinity;
        if (isFinite(minPan) && isFinite(maxPan))
        {
            _panAngle = Math.max(minPan, Math.min(maxPan, _panAngle));
        }

        // 距离缩放（_sphericalDelta.radius 作为乘数因子，0 表示无缩放）
        if (_sphericalDelta.radius !== 0)
        {
            _distance *= _sphericalDelta.radius;
            _distance = Math.max(oc.minDistance ?? 0.1, Math.min(oc.maxDistance ?? 10000, _distance));
        }

        // 平移偏移作用到 target
        _targetX += _panOffset.x;
        _targetY += _panOffset.y;
        _targetZ += _panOffset.z;
    }

    /** 应用球坐标 → 写回 camera position + rotation */
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

    /** 计算两指间距离 */
    function pointersDistance(): number
    {
        const pts = Array.from(_pointers.values());
        if (pts.length < 2) return 0;
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;

        return Math.sqrt(dx * dx + dy * dy);
    }

    /** 计算两指中点 */
    function pointersMidpoint(out: { x: number; y: number }): void
    {
        const pts = Array.from(_pointers.values());
        if (pts.length < 2)
        {
            out.x = pts[0]?.x ?? 0;
            out.y = pts[0]?.y ?? 0;

            return;
        }
        out.x = (pts[0].x + pts[1].x) * 0.5;
        out.y = (pts[0].y + pts[1].y) * 0.5;
    }

    /**
     * 平移 target（对应 three.js _pan）。
     * deltaX/deltaY 是屏幕像素位移，按 fov 和 distance 归一化为世界空间位移。
     */
    function pan(deltaX: number, deltaY: number): void
    {
        if (!base.entity) return;
        if (!(oc.enablePan ?? true)) return;
        const objLogic = getLogic(base.entity);
        if (!objLogic || !objLogic.local2world) return;

        // 透视相机：按 distance × tan(fov/2) 归一化（让平移速度与视口/距离无关）
        // 此处用近似：targetDistance = _distance
        const targetDistance = _distance;
        // 每像素对应的世界单位（half-fov 投影）
        const fovHalf = 0.5; // 简化：没有直接拿到 fov，用相对系数
        const distPerPixel = targetDistance * fovHalf * 0.001 * (oc.panSpeed ?? 1.0);

        const l2w = objLogic.local2world;
        // X 方向：相机本地 X 轴
        const right = l2w.getAxisX();
        // Y 方向：screenSpacePanning 时用相机本地 Y 轴，否则用水平面（Y 轴与 right 叉积）
        let up: Vector3;
        if (oc.screenSpacePanning ?? true)
        {
            up = l2w.getAxisY();
        }
        else
        {
            // 水平面平移：right × worldUp 得到水平方向
            up = right.clone();
            up.cross(Vector3.Y_AXIS);
        }

        // 累加到 _panOffset（支持阻尼）
        _panOffset.x += (-right.x * deltaX - up.x * deltaY) * distPerPixel;
        _panOffset.y += (-right.y * deltaX - up.y * deltaY) * distPerPixel;
        _panOffset.z += (-right.z * deltaX - up.z * deltaY) * distPerPixel;

        // 若不开阻尼，立即应用到 target
        if (!(oc.enableDamping ?? false))
        {
            _targetX += _panOffset.x; _targetY += _panOffset.y; _targetZ += _panOffset.z;
            _panOffset.x = 0; _panOffset.y = 0; _panOffset.z = 0;
        }
    }

    /** 旋转（球坐标增量，对应 three.js _rotateLeft/_rotateUp） */
    function rotateLeft(angle: number): void
    {
        _sphericalDelta.theta -= angle;
    }

    function rotateUp(angle: number): void
    {
        _sphericalDelta.phi -= angle;
    }

    /** 缩放（radius 乘数因子，对应 three.js _dollyIn/_dollyOut） */
    function dolly(scale: number): void
    {
        // scale<1 拉近，scale>1 拉远；转为乘数因子累加
        if (_sphericalDelta.radius === 0) _sphericalDelta.radius = 1;
        _sphericalDelta.radius *= scale;
        // 若不开阻尼，立即应用
        if (!(oc.enableDamping ?? false))
        {
            _distance = Math.max(oc.minDistance ?? 0.1,
                Math.min(oc.maxDistance ?? 10000, _distance * _sphericalDelta.radius));
            _sphericalDelta.radius = 0;
        }
    }

    /** 指数缩放比例（对应 three.js _getZoomScale） */
    function getZoomScale(deltaY: number): number
    {
        const normalizedDelta = Math.abs(deltaY * 0.01);

        return Math.pow(0.95, (oc.zoomSpeed ?? 1.0) * normalizedDelta);
    }

    // ==================== 指针事件处理（统一鼠标+触摸） ====================

    const onPointerDown = (event: IEvent<PointerEvent>): void =>
    {
        const e = event.data;
        _pointers.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

        if (_pointers.size === 1)
        {
            // 单指/单键：决定 rotate 还是 pan
            _lastX = e.clientX;
            _lastY = e.clientY;
            if (e.pointerType === 'touch')
            {
                _state = 'rotate';
            }
            else
            {
                // 鼠标：左键(0)旋转，右键(2)平移，中键(1)dolly；Ctrl+左键平移
                if (e.button === 0 && (e.ctrlKey || e.metaKey || e.shiftKey))
                {
                    _state = (oc.enablePan ?? true) ? 'pan' : 'none';
                }
                else if (e.button === 0)
                {
                    _state = (oc.enableRotate ?? true) ? 'rotate' : 'none';
                }
                else if (e.button === 2)
                {
                    _state = (oc.enablePan ?? true) ? 'pan' : 'none';
                }
                else if (e.button === 1)
                {
                    _state = (oc.enableZoom ?? true) ? 'dolly' : 'none';
                }
                else
                {
                    _state = 'none';
                }
            }
        }
        else if (_pointers.size === 2)
        {
            // 双指：dolly + pan（触摸）/ 双键鼠标不常见，按触摸处理
            _dollyStartDist = pointersDistance();
            const mid = { x: 0, y: 0 };
            pointersMidpoint(mid);
            _lastX = mid.x;
            _lastY = mid.y;
            _state = 'dolly';
        }
    };

    const onPointerMove = (event: IEvent<PointerEvent>): void =>
    {
        if (_state === 'none') return;
        const e = event.data;
        // 更新指针位置
        const ptr = _pointers.get(e.pointerId);
        if (ptr) { ptr.x = e.clientX; ptr.y = e.clientY; }

        if (_pointers.size >= 2 && _state === 'dolly')
        {
            // 双指：缩放 + 平移
            handleTwoPointerDollyPan();
        }
        else
        {
            // 单指
            const dx = e.clientX - _lastX;
            const dy = e.clientY - _lastY;
            _lastX = e.clientX;
            _lastY = e.clientY;

            if (_state === 'rotate' && (oc.enableRotate ?? true))
            {
                // 旋转角度按像素 × rotateSpeed（横向也用高度归一化，与 three.js 一致）
                const rotateSpeed = oc.rotateSpeed ?? 0.005;
                rotateLeft(dx * rotateSpeed);
                rotateUp(dy * rotateSpeed);
            }
            else if (_state === 'pan' && (oc.enablePan ?? true))
            {
                pan(dx, dy);
            }
            else if (_state === 'dolly' && (oc.enableZoom ?? true))
            {
                // 中键拖拽：垂直方向缩放
                const scale = getZoomScale(dy * 10);
                if (dy > 0) dolly(scale); else dolly(1 / scale);
            }
        }

        // 若不开阻尼，立即应用旋转增量
        if (!(oc.enableDamping ?? false) && (_state === 'rotate' || _state === 'pan' || _state === 'dolly'))
        {
            applyMovementImmediate();
        }
    };

    /** 双指操作：距离变化→缩放，中点变化→平移 */
    function handleTwoPointerDollyPan(): void
    {
        if (!(oc.enableZoom ?? true) && !(oc.enablePan ?? true)) return;
        const curDist = pointersDistance();
        if (_dollyStartDist > 0 && (oc.enableZoom ?? true))
        {
            const ratio = curDist / _dollyStartDist;
            // ratio>1 拉近（手指分开），ratio<1 拉远
            dolly(1 / Math.pow(ratio, oc.zoomSpeed ?? 1.0));
            _dollyStartDist = curDist;
        }
        // 中点平移
        const mid = { x: 0, y: 0 };
        pointersMidpoint(mid);
        const dx = mid.x - _lastX;
        const dy = mid.y - _lastY;
        _lastX = mid.x;
        _lastY = mid.y;
        if (oc.enablePan ?? true) pan(dx, dy);

        if (!(oc.enableDamping ?? false)) applyMovementImmediate();
    }

    /** 非阻尼模式：立即应用球坐标增量（一次性），然后清零 */
    function applyMovementImmediate(): void
    {
        _panAngle += _sphericalDelta.theta;
        _tiltAngle += _sphericalDelta.phi;
        _tiltAngle = Math.max(oc.minTiltAngle ?? 0.1, Math.min(oc.maxTiltAngle ?? Math.PI - 0.1, _tiltAngle));
        const minPan = oc.minPanAngle ?? -Infinity;
        const maxPan = oc.maxPanAngle ?? Infinity;
        if (isFinite(minPan) && isFinite(maxPan))
        {
            _panAngle = Math.max(minPan, Math.min(maxPan, _panAngle));
        }
        if (_sphericalDelta.radius !== 0)
        {
            _distance = Math.max(oc.minDistance ?? 0.1,
                Math.min(oc.maxDistance ?? 10000, _distance * _sphericalDelta.radius));
        }
        _sphericalDelta.theta = 0;
        _sphericalDelta.phi = 0;
        _sphericalDelta.radius = 0;
    }

    const onPointerUp = (event: IEvent<PointerEvent>): void =>
    {
        const e = event.data;
        _pointers.delete(e.pointerId);
        if (_pointers.size === 0)
        {
            _state = 'none';
        }
        else if (_pointers.size === 1)
        {
            // 从双指降为单指：切回单指旋转/平移
            const remaining = Array.from(_pointers.values())[0];
            _lastX = remaining.x;
            _lastY = remaining.y;
            _state = 'rotate';
        }
    };

    const onWheel = (event: IEvent<WheelEvent>): void =>
    {
        if (!(oc.enableZoom ?? true)) return;
        const e = event.data;
        e.preventDefault();
        let deltaY = e.deltaY;
        // Firefox lineMode 归一化
        if (e.deltaMode === 1) deltaY *= 16;
        else if (e.deltaMode === 2) deltaY *= 100;
        // 触控板捏合（合成 ctrlKey 但无真实按键）放大灵敏度
        if (e.ctrlKey) deltaY *= 10;

        const scale = getZoomScale(deltaY);
        if (deltaY > 0) dolly(scale); else dolly(1 / scale);
        if (!(oc.enableDamping ?? false)) applyMovementImmediate();
    };

    const onKeyDown = (event: IEvent<KeyboardEvent>): void =>
    {
        if (!(oc.enableKeys ?? true)) return;
        const e = event.data;
        const withModifier = e.ctrlKey || e.metaKey || e.shiftKey;
        const keyPan = oc.keyPanSpeed ?? 7.0;
        let handled = false;

        switch (e.code)
        {
            case 'ArrowUp':
                if (withModifier && (oc.enableRotate ?? true))
                {
                    rotateUp(2 * Math.PI * (oc.rotateSpeed ?? 0.005) * 10);
                }
                else if (oc.enablePan ?? true)
                {
                    pan(0, keyPan);
                }
                handled = true;
                break;
            case 'ArrowDown':
                if (withModifier && (oc.enableRotate ?? true))
                {
                    rotateUp(-2 * Math.PI * (oc.rotateSpeed ?? 0.005) * 10);
                }
                else if (oc.enablePan ?? true)
                {
                    pan(0, -keyPan);
                }
                handled = true;
                break;
            case 'ArrowLeft':
                if (withModifier && (oc.enableRotate ?? true))
                {
                    rotateLeft(2 * Math.PI * (oc.rotateSpeed ?? 0.005) * 10);
                }
                else if (oc.enablePan ?? true)
                {
                    pan(keyPan, 0);
                }
                handled = true;
                break;
            case 'ArrowRight':
                if (withModifier && (oc.enableRotate ?? true))
                {
                    rotateLeft(-2 * Math.PI * (oc.rotateSpeed ?? 0.005) * 10);
                }
                else if (oc.enablePan ?? true)
                {
                    pan(-keyPan, 0);
                }
                handled = true;
                break;
        }
        if (handled)
        {
            e.preventDefault();
            if (!(oc.enableDamping ?? false)) applyMovementImmediate();
        }
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
            windowEventProxy.off('pointerdown', onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointermove', onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointerup', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointercancel', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('wheel', onWheel as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('keydown', onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('contextmenu', onContext as (event: IEvent<unknown>) => void, null);
            _pointers.clear();
            _state = 'none';
        }
        _auto = value;
        if (_auto)
        {
            windowEventProxy.on('pointerdown', onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointermove', onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointerup', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointercancel', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('wheel', onWheel as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('keydown', onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('contextmenu', onContext as (event: IEvent<unknown>) => void, null);
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
            // 保存初始状态作为 reset 基准
            _savedTargetX = _targetX; _savedTargetY = _targetY; _savedTargetZ = _targetZ;
            _savedPanAngle = _panAngle; _savedTiltAngle = _tiltAngle; _savedDistance = _distance;
            applyTransform();

            setAuto(true);
        },
        update(interval: number): void
        {
            baseUpdate(0);
            // 自动旋转（无活跃交互时）
            if ((oc.autoRotate ?? false) && _state === 'none' && (oc.enableRotate ?? true))
            {
                // 2π/60/60 × autoRotateSpeed（对应 60fps 下 30秒/圈 @speed=2）
                const angle = 2 * Math.PI / 60 / 60 * (oc.autoRotateSpeed ?? 2.0) * (interval / (1000 / 60));
                rotateLeft(angle);
            }
            // 应用球坐标增量 + 平移偏移到当前状态
            if (oc.enableDamping ?? false)
            {
                // 阻尼模式：按 dampingFactor 应用一部分增量，剩余部分衰减
                applyMovement();
                applyDamping(interval);
            }
            else
            {
                // 非阻尼模式：增量可能来自 update 里的 autoRotate（输入事件的增量已在事件里立即应用），
                // 这里把残余增量一次性应用并清零
                applyMovementImmediate();
            }
            applyTransform();
        },
        dispose(): void
        {
            setAuto(false);
            baseDispose();
        },
        saveState(): void
        {
            _savedTargetX = _targetX; _savedTargetY = _targetY; _savedTargetZ = _targetZ;
            _savedPanAngle = _panAngle; _savedTiltAngle = _tiltAngle; _savedDistance = _distance;
        },
        reset(): void
        {
            _targetX = _savedTargetX; _targetY = _savedTargetY; _targetZ = _savedTargetZ;
            _panAngle = _savedPanAngle; _tiltAngle = _savedTiltAngle; _distance = _savedDistance;
            _sphericalDelta.theta = 0; _sphericalDelta.phi = 0; _sphericalDelta.radius = 0;
            _panOffset.x = 0; _panOffset.y = 0; _panOffset.z = 0;
            _state = 'none';
            applyTransform();
        },
    }) as unknown as OrbitControlsLogic;
}

// 注册到 componentLogic 分发表
registerLogic('OrbitControls', orbitControlsLogic);
