import { behaviourLogicProto, setupBehaviourLogicState, Behaviour, BehaviourLogic, type BehaviourLogicState } from '../component/Behaviour';
import { registerLogic, logic as getLogic, batchRun, reactive, createLogicProto } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { mat4Append, mat4Copy, mat4GetAxisX, mat4GetAxisY, mat4LookAt, mat4ToTRS, Matrix4x4, VEC3_Y_AXIS, vec3Cross, WritableVector3Like } from '@feng3d/math';
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

/** 球坐标增量（用于阻尼衰减） */
interface SphericalDelta { theta: number; phi: number; radius: number; }

/** 已跟踪的指针信息 */
interface TrackedPointer { id: number; x: number; y: number; }

/**
 * OrbitControls 逻辑接口。
 *
 * 交互模式（对应 three.js OrbitControls）：
 * - 旋转：鼠标左键拖拽 / 单指触摸
 * - 平移：鼠标右键拖拽 / Ctrl+左键 / 方向键 / 双指触摸中点
 * - 缩放：滚轮 / 鼠标中键拖拽 / 双指捏合
 */
export interface OrbitControlsLogic extends BehaviourLogic
{
    /** 是否自动订阅鼠标/触摸/键盘事件 */
    auto: boolean;

    /** 保存当前状态（target/position/球坐标），供 reset 恢复 */
    saveState(): void;

    /** 恢复到上次 saveState 的状态（或初始状态） */
    reset(): void;
}

/** OrbitControlsLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface OrbitControlsLogicState extends BehaviourLogicState
{
    /** 数据引用 */
    _oc: OrbitControls;

    // ---- 默认值 accessor ----
    _target: () => { x: number; y: number; z: number };
    _minDistance: () => number;
    _maxDistance: () => number;
    _minTiltAngle: () => number;
    _maxTiltAngle: () => number;
    _minPanAngle: () => number;
    _maxPanAngle: () => number;
    _rotateSpeed: () => number;
    _zoomSpeed: () => number;
    _panSpeed: () => number;
    _keyPanSpeed: () => number;
    _enableDamping: () => boolean;
    _dampingFactor: () => number;
    _enableRotate: () => boolean;
    _enableZoom: () => boolean;
    _enablePan: () => boolean;
    _enableKeys: () => boolean;
    _autoRotate: () => boolean;
    _autoRotateSpeed: () => number;
    _screenSpacePanning: () => boolean;

    // ---- 订阅状态 ----
    _subInited: boolean;
    _auto: boolean;

    // ---- 球坐标状态（内部变量，非响应式） ----
    _targetX: number;
    _targetY: number;
    _targetZ: number;
    _panAngle: number;
    _tiltAngle: number;
    _distance: number;

    // ---- 阻尼速度（球坐标增量，每帧衰减应用） ----
    _sphericalDelta: SphericalDelta;
    _panOffset: { x: number; y: number; z: number };

    // ---- 指针跟踪（统一鼠标+触摸） ----
    _pointers: Map<number, TrackedPointer>;
    _state: 'none' | 'rotate' | 'pan' | 'dolly';
    _lastX: number;
    _lastY: number;
    _dollyStartDist: number;

    // ---- saveState 存储 ----
    _savedTargetX: number;
    _savedTargetY: number;
    _savedTargetZ: number;
    _savedPanAngle: number;
    _savedTiltAngle: number;
    _savedDistance: number;

    // ---- 供 proto 公开方法调用的内部方法（工厂内定义后挂到实例） ----
    _initFromPosition: () => void;
    _applyDamping: (interval: number) => void;
    _applyMovement: () => void;
    _applyTransform: () => void;
    _rotateLeft: (angle: number) => void;
    _applyMovementImmediate: () => void;
    _setAuto: (value: boolean) => void;
}

/** OrbitControlsLogic 的共享原型：继承 Behaviour 基类实现，实现 auto / saveState / reset 并覆写 init / update / dispose */
const orbitControlsLogicProto = createLogicProto<OrbitControlsLogic>(behaviourLogicProto, {
    /** 是否自动订阅鼠标/触摸/键盘事件 */
    auto: {
        get: function (this: OrbitControlsLogic & OrbitControlsLogicState): boolean
        {
            return this._auto;
        },
        set: function (this: OrbitControlsLogic & OrbitControlsLogicState, value: boolean): void
        {
            this._setAuto(value);
        },
    },
    init: {
        value: function (this: OrbitControlsLogic & OrbitControlsLogicState, object3D?: Object3D): void
        {
            if (this._subInited) return;
            this._subInited = true;
            behaviourLogicProto.init.call(this, object3D);

            // 从数据字段或当前 position 推断球坐标
            if (this._oc.panAngle !== undefined && this._oc.tiltAngle !== undefined && this._oc.distance !== undefined)
            {
                this._panAngle = this._oc.panAngle;
                this._tiltAngle = this._oc.tiltAngle;
                this._distance = this._oc.distance;
            }
            else
            {
                this._initFromPosition();
            }
            // 保存初始状态作为 reset 基准
            this._savedTargetX = this._targetX; this._savedTargetY = this._targetY; this._savedTargetZ = this._targetZ;
            this._savedPanAngle = this._panAngle; this._savedTiltAngle = this._tiltAngle; this._savedDistance = this._distance;
            this._applyTransform();

            this._setAuto(true);
        },
    },
    update: {
        value: function (this: OrbitControlsLogic & OrbitControlsLogicState, interval: number): void
        {
            behaviourLogicProto.update.call(this, 0);
            // 自动旋转（无活跃交互时）
            if (this._autoRotate() && this._state === 'none' && this._enableRotate())
            {
                // 2π/60/60 × autoRotateSpeed（对应 60fps 下 30秒/圈 @speed=2）
                const angle = 2 * Math.PI / 60 / 60 * this._autoRotateSpeed() * (interval / (1000 / 60));
                this._rotateLeft(angle);
            }
            // 应用球坐标增量 + 平移偏移到当前状态
            if (this._enableDamping())
            {
                // 阻尼模式：按 dampingFactor 应用一部分增量，剩余部分衰减
                this._applyMovement();
                this._applyDamping(interval);
            }
            else
            {
                // 非阻尼模式：增量可能来自 update 里的 autoRotate（输入事件的增量已在事件里立即应用），
                // 这里把残余增量一次性应用并清零
                this._applyMovementImmediate();
            }
            this._applyTransform();
        },
    },
    dispose: {
        value: function (this: OrbitControlsLogic & OrbitControlsLogicState): void
        {
            this._setAuto(false);
            behaviourLogicProto.dispose.call(this);
        },
    },
    /** 保存当前状态（target/position/球坐标），供 reset 恢复 */
    saveState: {
        value: function (this: OrbitControlsLogic & OrbitControlsLogicState): void
        {
            this._savedTargetX = this._targetX; this._savedTargetY = this._targetY; this._savedTargetZ = this._targetZ;
            this._savedPanAngle = this._panAngle; this._savedTiltAngle = this._tiltAngle; this._savedDistance = this._distance;
        },
    },
    /** 恢复到上次 saveState 的状态（或初始状态） */
    reset: {
        value: function (this: OrbitControlsLogic & OrbitControlsLogicState): void
        {
            this._targetX = this._savedTargetX; this._targetY = this._savedTargetY; this._targetZ = this._savedTargetZ;
            this._panAngle = this._savedPanAngle; this._tiltAngle = this._savedTiltAngle; this._distance = this._savedDistance;
            this._sphericalDelta.theta = 0; this._sphericalDelta.phi = 0; this._sphericalDelta.radius = 0;
            this._panOffset.x = 0; this._panOffset.y = 0; this._panOffset.z = 0;
            this._state = 'none';
            this._applyTransform();
        },
    },
});

/**
 * 工厂函数：OrbitControlsLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function orbitControlsLogic(data: OrbitControls): OrbitControlsLogic
{
    const logic = setupBehaviourLogicState(Object.create(orbitControlsLogicProto) as OrbitControlsLogic & OrbitControlsLogicState, data);

    logic._oc = data;

    // ---- 默认值 accessor ----
    logic._target = () => reactive(logic._oc).target ?? { x: 0, y: 0, z: 0 };
    logic._minDistance = () => reactive(logic._oc).minDistance ?? 0.1;
    logic._maxDistance = () => reactive(logic._oc).maxDistance ?? 10000;
    logic._minTiltAngle = () => reactive(logic._oc).minTiltAngle ?? 0.1;
    logic._maxTiltAngle = () => reactive(logic._oc).maxTiltAngle ?? Math.PI - 0.1;
    logic._minPanAngle = () => reactive(logic._oc).minPanAngle ?? -Infinity;
    logic._maxPanAngle = () => reactive(logic._oc).maxPanAngle ?? Infinity;
    logic._rotateSpeed = () => reactive(logic._oc).rotateSpeed ?? 0.005;
    logic._zoomSpeed = () => reactive(logic._oc).zoomSpeed ?? 1.0;
    logic._panSpeed = () => reactive(logic._oc).panSpeed ?? 1.0;
    logic._keyPanSpeed = () => reactive(logic._oc).keyPanSpeed ?? 7.0;
    logic._enableDamping = () => reactive(logic._oc).enableDamping ?? false;
    logic._dampingFactor = () => reactive(logic._oc).dampingFactor ?? 0.05;
    logic._enableRotate = () => reactive(logic._oc).enableRotate ?? true;
    logic._enableZoom = () => reactive(logic._oc).enableZoom ?? true;
    logic._enablePan = () => reactive(logic._oc).enablePan ?? true;
    logic._enableKeys = () => reactive(logic._oc).enableKeys ?? true;
    logic._autoRotate = () => reactive(logic._oc).autoRotate ?? false;
    logic._autoRotateSpeed = () => reactive(logic._oc).autoRotateSpeed ?? 2.0;
    logic._screenSpacePanning = () => reactive(logic._oc).screenSpacePanning ?? true;

    // ---- 订阅状态 ----
    logic._subInited = false;
    logic._auto = false;

    // ---- 阻尼速度（球坐标增量，每帧衰减应用） ----
    logic._sphericalDelta = { theta: 0, phi: 0, radius: 0 };
    // 平移偏移（每帧衰减应用）
    logic._panOffset = { x: 0, y: 0, z: 0 };

    // ---- 指针跟踪（统一鼠标+触摸） ----
    // 当前活跃指针列表（pointerId → 位置）
    logic._pointers = new Map<number, TrackedPointer>();
    // 当前交互状态：'none' | 'rotate' | 'pan' | 'dolly'
    logic._state = 'none';
    // 上一次指针位置（单指操作用）
    logic._lastX = 0;
    logic._lastY = 0;
    // 双指初始距离（dolly 基准）
    logic._dollyStartDist = 0;

    // ---- 原构造体：球坐标初始化 ----
    const tgt = logic._target();
    logic._targetX = tgt.x;
    logic._targetY = tgt.y;
    logic._targetZ = tgt.z;
    logic._panAngle = data.panAngle ?? 0;
    logic._tiltAngle = data.tiltAngle ?? Math.PI / 2;
    logic._distance = data.distance ?? 5;

    // ---- saveState 存储 ----
    logic._savedTargetX = logic._targetX;
    logic._savedTargetY = logic._targetY;
    logic._savedTargetZ = logic._targetZ;
    logic._savedPanAngle = logic._panAngle;
    logic._savedTiltAngle = logic._tiltAngle;
    logic._savedDistance = logic._distance;

    /** 从当前 position 推断球坐标（init 时调用一次） */
    function initFromPosition(): void
    {
        if (!logic.entity) return;
        const pos = getLogic(logic.entity!).position;
        if (!pos) return;
        const dx = pos.x - logic._targetX;
        const dy = pos.y - logic._targetY;
        const dz = pos.z - logic._targetZ;
        logic._distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (logic._distance < logic._minDistance()) logic._distance = logic._minDistance();
        logic._tiltAngle = Math.acos(Math.max(-1, Math.min(1, dy / logic._distance)));
        logic._panAngle = Math.atan2(dx, dz);
    }

    /** 应用阻尼到球坐标增量与平移偏移，返回是否仍需继续 */
    function applyDamping(interval: number): void
    {
        // 帧率无关衰减系数：(1 - dampingFactor)^(interval / 标称帧时长)
        // 标称帧时长取 1000/60 ≈ 16.67ms，使 dampingFactor 在 60fps 下与 three.js 一致
        const k = logic._dampingFactor();
        const decay = Math.pow(1 - k, interval / (1000 / 60));
        logic._sphericalDelta.theta *= 1 - decay;
        logic._sphericalDelta.phi *= 1 - decay;
        logic._panOffset.x *= 1 - decay;
        logic._panOffset.y *= 1 - decay;
        logic._panOffset.z *= 1 - decay;
    }

    /** 把球坐标增量与平移偏移累加到当前状态，并应用角度/距离限制 */
    function applyMovement(): void
    {
        logic._panAngle += logic._sphericalDelta.theta;
        logic._tiltAngle += logic._sphericalDelta.phi;
        logic._tiltAngle = Math.max(logic._minTiltAngle(), Math.min(logic._maxTiltAngle(), logic._tiltAngle));
        // 水平角限制
        const minPan = logic._minPanAngle();
        const maxPan = logic._maxPanAngle();
        if (isFinite(minPan) && isFinite(maxPan))
        {
            logic._panAngle = Math.max(minPan, Math.min(maxPan, logic._panAngle));
        }

        // 距离缩放（_sphericalDelta.radius 作为乘数因子，0 表示无缩放）
        if (logic._sphericalDelta.radius !== 0)
        {
            logic._distance *= logic._sphericalDelta.radius;
            logic._distance = Math.max(logic._minDistance(), Math.min(logic._maxDistance(), logic._distance));
        }

        // 平移偏移作用到 target
        logic._targetX += logic._panOffset.x;
        logic._targetY += logic._panOffset.y;
        logic._targetZ += logic._panOffset.z;
    }

    /** 应用球坐标 → 写回 camera position + rotation */
    function applyTransform(): void
    {
        if (!logic.entity) return;
        const objLogic = getLogic(logic.entity!);
        if (!objLogic || !objLogic.local2world) return;
        const sinTilt = Math.sin(logic._tiltAngle);
        const x = logic._targetX + logic._distance * sinTilt * Math.sin(logic._panAngle);
        const y = logic._targetY + logic._distance * Math.cos(logic._tiltAngle);
        const z = logic._targetZ + logic._distance * sinTilt * Math.cos(logic._panAngle);

        batchRun(() =>
        {
            reactive(logic.entity!).position = { x, y, z };
        });
        // lookAt：用矩阵 lookAt + toTRS 写回 rotation（与 Object3DLogic.lookAt 等价）
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(objLogic.local2world) };
        mat4LookAt(m, { x: logic._targetX, y: logic._targetY, z: logic._targetZ }, VEC3_Y_AXIS, m);
        // 转回本地坐标（处理父节点）
        const parent = getLogic(logic.entity!).parent;
        if (parent)
        {
            mat4Append(m, getLogic(parent as Object3D).world2local, m);
        }
        const pos = { x: 0, y: 0, z: 0 }; const rot = { x: 0, y: 0, z: 0 }; const scl = { x: 0, y: 0, z: 0 };
        mat4ToTRS(m, pos, rot, scl);
        batchRun(() =>
        {
            reactive(logic.entity!).rotation = { x: rot.x, y: rot.y, z: rot.z };
        });
    }

    /** 计算两指间距离 */
    function pointersDistance(): number
    {
        const pts = Array.from(logic._pointers.values());
        if (pts.length < 2) return 0;
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;

        return Math.sqrt(dx * dx + dy * dy);
    }

    /** 计算两指中点 */
    function pointersMidpoint(out: { x: number; y: number }): void
    {
        const pts = Array.from(logic._pointers.values());
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
        if (!logic.entity) return;
        if (!logic._enablePan()) return;
        const objLogic = getLogic(logic.entity!);
        if (!objLogic || !objLogic.local2world) return;

        // 透视相机：按 distance × tan(fov/2) 归一化（让平移速度与视口/距离无关）
        // 此处用近似：targetDistance = _distance
        const targetDistance = logic._distance;
        // 每像素对应的世界单位（half-fov 投影）
        const fovHalf = 0.5; // 简化：没有直接拿到 fov，用相对系数
        const distPerPixel = targetDistance * fovHalf * 0.001 * logic._panSpeed();

        const l2w = objLogic.local2world;
        // X 方向：相机本地 X 轴
        // （阶段 C-e：`Matrix4x4` 的 class 已删除，getAxisX/Y 的缺省 out 是纯字面量、
        //   没有 Vector3 的方法，而下面要用 `right.clone()` / `up.cross(...)`，所以显式传 Vector3 实例）
        const right = { x: 0, y: 0, z: 0 };
        mat4GetAxisX(l2w, right);
        // Y 方向：screenSpacePanning 时用相机本地 Y 轴，否则用水平面（Y 轴与 right 叉积）
        let up: WritableVector3Like;
        if (logic._screenSpacePanning())
        {
            up = { x: 0, y: 0, z: 0 };
            mat4GetAxisY(l2w, up);
        }
        else
        {
            // 水平面平移：right × worldUp 得到水平方向
            up = vec3Cross(right, VEC3_Y_AXIS);
        }

        // 累加到 _panOffset（支持阻尼）
        logic._panOffset.x += (-right.x * deltaX - up.x * deltaY) * distPerPixel;
        logic._panOffset.y += (-right.y * deltaX - up.y * deltaY) * distPerPixel;
        logic._panOffset.z += (-right.z * deltaX - up.z * deltaY) * distPerPixel;

        // 若不开阻尼，立即应用到 target
        if (!logic._enableDamping())
        {
            logic._targetX += logic._panOffset.x; logic._targetY += logic._panOffset.y; logic._targetZ += logic._panOffset.z;
            logic._panOffset.x = 0; logic._panOffset.y = 0; logic._panOffset.z = 0;
        }
    }

    /** 旋转（球坐标增量，对应 three.js _rotateLeft/_rotateUp） */
    function rotateLeft(angle: number): void
    {
        logic._sphericalDelta.theta -= angle;
    }

    function rotateUp(angle: number): void
    {
        logic._sphericalDelta.phi -= angle;
    }

    /** 缩放（radius 乘数因子，对应 three.js _dollyIn/_dollyOut） */
    function dolly(scale: number): void
    {
        // scale<1 拉近，scale>1 拉远；转为乘数因子累加
        if (logic._sphericalDelta.radius === 0) logic._sphericalDelta.radius = 1;
        logic._sphericalDelta.radius *= scale;
        // 若不开阻尼，立即应用
        if (!logic._enableDamping())
        {
            logic._distance = Math.max(logic._minDistance(),
                Math.min(logic._maxDistance(), logic._distance * logic._sphericalDelta.radius));
            logic._sphericalDelta.radius = 0;
        }
    }

    /** 指数缩放比例（对应 three.js _getZoomScale） */
    function getZoomScale(deltaY: number): number
    {
        const normalizedDelta = Math.abs(deltaY * 0.01);

        return Math.pow(0.95, logic._zoomSpeed() * normalizedDelta);
    }

    // ==================== 指针事件处理（统一鼠标+触摸） ====================

    const onPointerDown = (event: IEvent<PointerEvent>): void =>
    {
        const e = event.data!;
        logic._pointers.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

        if (logic._pointers.size === 1)
        {
            // 单指/单键：决定 rotate 还是 pan
            logic._lastX = e.clientX;
            logic._lastY = e.clientY;
            if (e.pointerType === 'touch')
            {
                logic._state = 'rotate';
            }
            else
            {
                // 鼠标：左键(0)旋转，右键(2)平移，中键(1)dolly；Ctrl+左键平移
                if (e.button === 0 && (e.ctrlKey || e.metaKey || e.shiftKey))
                {
                    logic._state = logic._enablePan() ? 'pan' : 'none';
                }
                else if (e.button === 0)
                {
                    logic._state = logic._enableRotate() ? 'rotate' : 'none';
                }
                else if (e.button === 2)
                {
                    logic._state = logic._enablePan() ? 'pan' : 'none';
                }
                else if (e.button === 1)
                {
                    logic._state = logic._enableZoom() ? 'dolly' : 'none';
                }
                else
                {
                    logic._state = 'none';
                }
            }
        }
        else if (logic._pointers.size === 2)
        {
            // 双指：dolly + pan（触摸）/ 双键鼠标不常见，按触摸处理
            logic._dollyStartDist = pointersDistance();
            const mid = { x: 0, y: 0 };
            pointersMidpoint(mid);
            logic._lastX = mid.x;
            logic._lastY = mid.y;
            logic._state = 'dolly';
        }
    };

    const onPointerMove = (event: IEvent<PointerEvent>): void =>
    {
        if (logic._state === 'none') return;
        const e = event.data!;
        // 更新指针位置
        const ptr = logic._pointers.get(e.pointerId);
        if (ptr) { ptr.x = e.clientX; ptr.y = e.clientY; }

        if (logic._pointers.size >= 2 && logic._state === 'dolly')
        {
            // 双指：缩放 + 平移
            handleTwoPointerDollyPan();
        }
        else
        {
            // 单指
            const dx = e.clientX - logic._lastX;
            const dy = e.clientY - logic._lastY;
            logic._lastX = e.clientX;
            logic._lastY = e.clientY;

            if (logic._state === 'rotate' && logic._enableRotate())
            {
                // 旋转角度按像素 × rotateSpeed（横向也用高度归一化，与 three.js 一致）
                rotateLeft(dx * logic._rotateSpeed());
                rotateUp(dy * logic._rotateSpeed());
            }
            else if (logic._state === 'pan' && logic._enablePan())
            {
                pan(dx, dy);
            }
            else if (logic._state === 'dolly' && logic._enableZoom())
            {
                // 中键拖拽：垂直方向缩放
                const scale = getZoomScale(dy * 10);
                if (dy > 0) dolly(scale); else dolly(1 / scale);
            }
        }

        // 若不开阻尼，立即应用旋转增量
        if (!logic._enableDamping() && (logic._state === 'rotate' || logic._state === 'pan' || logic._state === 'dolly'))
        {
            applyMovementImmediate();
        }
    };

    /** 双指操作：距离变化→缩放，中点变化→平移 */
    function handleTwoPointerDollyPan(): void
    {
        if (!logic._enableZoom() && !logic._enablePan()) return;
        const curDist = pointersDistance();
        if (logic._dollyStartDist > 0 && logic._enableZoom())
        {
            const ratio = curDist / logic._dollyStartDist;
            // ratio>1 拉近（手指分开），ratio<1 拉远
            dolly(1 / Math.pow(ratio, logic._zoomSpeed()));
            logic._dollyStartDist = curDist;
        }
        // 中点平移
        const mid = { x: 0, y: 0 };
        pointersMidpoint(mid);
        const dx = mid.x - logic._lastX;
        const dy = mid.y - logic._lastY;
        logic._lastX = mid.x;
        logic._lastY = mid.y;
        if (logic._enablePan()) pan(dx, dy);

        if (!logic._enableDamping()) applyMovementImmediate();
    }

    /** 非阻尼模式：立即应用球坐标增量（一次性），然后清零 */
    function applyMovementImmediate(): void
    {
        logic._panAngle += logic._sphericalDelta.theta;
        logic._tiltAngle += logic._sphericalDelta.phi;
        logic._tiltAngle = Math.max(logic._minTiltAngle(), Math.min(logic._maxTiltAngle(), logic._tiltAngle));
        const minPan = logic._minPanAngle();
        const maxPan = logic._maxPanAngle();
        if (isFinite(minPan) && isFinite(maxPan))
        {
            logic._panAngle = Math.max(minPan, Math.min(maxPan, logic._panAngle));
        }
        if (logic._sphericalDelta.radius !== 0)
        {
            logic._distance = Math.max(logic._minDistance(),
                Math.min(logic._maxDistance(), logic._distance * logic._sphericalDelta.radius));
        }
        logic._sphericalDelta.theta = 0;
        logic._sphericalDelta.phi = 0;
        logic._sphericalDelta.radius = 0;
    }

    const onPointerUp = (event: IEvent<PointerEvent>): void =>
    {
        const e = event.data!;
        logic._pointers.delete(e.pointerId);
        if (logic._pointers.size === 0)
        {
            logic._state = 'none';
        }
        else if (logic._pointers.size === 1)
        {
            // 从双指降为单指：切回单指旋转/平移
            const remaining = Array.from(logic._pointers.values())[0];
            logic._lastX = remaining.x;
            logic._lastY = remaining.y;
            logic._state = 'rotate';
        }
    };

    const onWheel = (event: IEvent<WheelEvent>): void =>
    {
        if (!logic._enableZoom()) return;
        const e = event.data!;
        e.preventDefault();
        let deltaY = e.deltaY;
        // Firefox lineMode 归一化
        if (e.deltaMode === 1) deltaY *= 16;
        else if (e.deltaMode === 2) deltaY *= 100;
        // 触控板捏合（合成 ctrlKey 但无真实按键）放大灵敏度
        if (e.ctrlKey) deltaY *= 10;

        const scale = getZoomScale(deltaY);
        if (deltaY > 0) dolly(scale); else dolly(1 / scale);
        if (!logic._enableDamping()) applyMovementImmediate();
    };

    const onKeyDown = (event: IEvent<KeyboardEvent>): void =>
    {
        if (!logic._enableKeys()) return;
        const e = event.data!;
        const withModifier = e.ctrlKey || e.metaKey || e.shiftKey;
        const keyPan = logic._keyPanSpeed();
        let handled = false;

        switch (e.code)
        {
            case 'ArrowUp':
                if (withModifier && logic._enableRotate())
                {
                    rotateUp(2 * Math.PI * logic._rotateSpeed() * 10);
                }
                else if (logic._enablePan())
                {
                    pan(0, keyPan);
                }
                handled = true;
                break;
            case 'ArrowDown':
                if (withModifier && logic._enableRotate())
                {
                    rotateUp(-2 * Math.PI * logic._rotateSpeed() * 10);
                }
                else if (logic._enablePan())
                {
                    pan(0, -keyPan);
                }
                handled = true;
                break;
            case 'ArrowLeft':
                if (withModifier && logic._enableRotate())
                {
                    rotateLeft(2 * Math.PI * logic._rotateSpeed() * 10);
                }
                else if (logic._enablePan())
                {
                    pan(keyPan, 0);
                }
                handled = true;
                break;
            case 'ArrowRight':
                if (withModifier && logic._enableRotate())
                {
                    rotateLeft(-2 * Math.PI * logic._rotateSpeed() * 10);
                }
                else if (logic._enablePan())
                {
                    pan(-keyPan, 0);
                }
                handled = true;
                break;
        }
        if (handled)
        {
            e.preventDefault();
            if (!logic._enableDamping()) applyMovementImmediate();
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

    function setAuto(value: boolean): void
    {
        if (logic._auto === value) return;
        if (logic._auto)
        {
            windowEventProxy.off('pointerdown', onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointermove', onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointerup', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointercancel', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('wheel', onWheel as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('keydown', onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('contextmenu', onContext as (event: IEvent<unknown>) => void, null);
            logic._pointers.clear();
            logic._state = 'none';
        }
        logic._auto = value;
        if (logic._auto)
        {
            windowEventProxy.on('pointerdown', onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointermove', onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointerup', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointercancel', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('wheel', onWheel as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('keydown', onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('contextmenu', onContext as (event: IEvent<unknown>) => void, null);
        }
    }

    logic._initFromPosition = initFromPosition;
    logic._applyDamping = applyDamping;
    logic._applyMovement = applyMovement;
    logic._applyTransform = applyTransform;
    logic._rotateLeft = rotateLeft;
    logic._applyMovementImmediate = applyMovementImmediate;
    logic._setAuto = setAuto;

    return logic;
}

// 注册到 logic 分发表
registerLogic('OrbitControls', orbitControlsLogic);
