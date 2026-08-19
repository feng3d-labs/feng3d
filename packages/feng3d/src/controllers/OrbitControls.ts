import { Behaviour, BehaviourLogic } from '../component/Behaviour';
import { registerLogic, logic as getLogic, batchRun, reactive } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { Vector3 } from '@feng3d/math';
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
 * OrbitControls 逻辑类。
 *
 * 交互模式（对应 three.js OrbitControls）：
 * - 旋转：鼠标左键拖拽 / 单指触摸
 * - 平移：鼠标右键拖拽 / Ctrl+左键 / 方向键 / 双指触摸中点
 * - 缩放：滚轮 / 鼠标中键拖拽 / 双指捏合
 */
export class OrbitControlsLogic extends BehaviourLogic
{
    /** 数据引用 */
    readonly #oc: OrbitControls;

    // ---- 默认值 accessor ----
    readonly #target = () => reactive(this.#oc).target ?? { x: 0, y: 0, z: 0 };
    readonly #minDistance = () => reactive(this.#oc).minDistance ?? 0.1;
    readonly #maxDistance = () => reactive(this.#oc).maxDistance ?? 10000;
    readonly #minTiltAngle = () => reactive(this.#oc).minTiltAngle ?? 0.1;
    readonly #maxTiltAngle = () => reactive(this.#oc).maxTiltAngle ?? Math.PI - 0.1;
    readonly #minPanAngle = () => reactive(this.#oc).minPanAngle ?? -Infinity;
    readonly #maxPanAngle = () => reactive(this.#oc).maxPanAngle ?? Infinity;
    readonly #rotateSpeed = () => reactive(this.#oc).rotateSpeed ?? 0.005;
    readonly #zoomSpeed = () => reactive(this.#oc).zoomSpeed ?? 1.0;
    readonly #panSpeed = () => reactive(this.#oc).panSpeed ?? 1.0;
    readonly #keyPanSpeed = () => reactive(this.#oc).keyPanSpeed ?? 7.0;
    readonly #enableDamping = () => reactive(this.#oc).enableDamping ?? false;
    readonly #dampingFactor = () => reactive(this.#oc).dampingFactor ?? 0.05;
    readonly #enableRotate = () => reactive(this.#oc).enableRotate ?? true;
    readonly #enableZoom = () => reactive(this.#oc).enableZoom ?? true;
    readonly #enablePan = () => reactive(this.#oc).enablePan ?? true;
    readonly #enableKeys = () => reactive(this.#oc).enableKeys ?? true;
    readonly #autoRotate = () => reactive(this.#oc).autoRotate ?? false;
    readonly #autoRotateSpeed = () => reactive(this.#oc).autoRotateSpeed ?? 2.0;
    readonly #screenSpacePanning = () => reactive(this.#oc).screenSpacePanning ?? true;

    // ---- 订阅状态 ----
    #subInited = false;
    #auto = false;

    // ---- 球坐标状态（内部变量，非响应式） ----
    #_targetX: number;
    #_targetY: number;
    #_targetZ: number;
    #_panAngle: number;
    #_tiltAngle: number;
    #_distance: number;

    // ---- 阻尼速度（球坐标增量，每帧衰减应用） ----
    readonly #_sphericalDelta: SphericalDelta = { theta: 0, phi: 0, radius: 0 };
    // 平移偏移（每帧衰减应用）
    readonly #_panOffset = new Vector3();

    // ---- 指针跟踪（统一鼠标+触摸） ----
    // 当前活跃指针列表（pointerId → 位置）
    readonly #_pointers = new Map<number, TrackedPointer>();
    // 当前交互状态：'none' | 'rotate' | 'pan' | 'dolly'
    #_state: 'none' | 'rotate' | 'pan' | 'dolly' = 'none';
    // 上一次指针位置（单指操作用）
    #_lastX = 0;
    #_lastY = 0;
    // 双指初始距离（dolly 基准）
    #_dollyStartDist = 0;

    // ---- saveState 存储 ----
    #_savedTargetX: number;
    #_savedTargetY: number;
    #_savedTargetZ: number;
    #_savedPanAngle: number;
    #_savedTiltAngle: number;
    #_savedDistance: number;

    protected constructor(data: OrbitControls)
    {
        super(data);
        this.#oc = data;

        const tgt = this.#target();
        this.#_targetX = tgt.x;
        this.#_targetY = tgt.y;
        this.#_targetZ = tgt.z;
        this.#_panAngle = data.panAngle ?? 0;
        this.#_tiltAngle = data.tiltAngle ?? Math.PI / 2;
        this.#_distance = data.distance ?? 5;

        this.#_savedTargetX = this.#_targetX;
        this.#_savedTargetY = this.#_targetY;
        this.#_savedTargetZ = this.#_targetZ;
        this.#_savedPanAngle = this.#_panAngle;
        this.#_savedTiltAngle = this.#_tiltAngle;
        this.#_savedDistance = this.#_distance;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: OrbitControls): OrbitControlsLogic
    {
        return new OrbitControlsLogic(data);
    }

    /** 是否自动订阅鼠标/触摸/键盘事件 */
    get auto(): boolean
    {
        return this.#auto;
    }

    set auto(value: boolean)
    {
        this.#setAuto(value);
    }

    /** 从当前 position 推断球坐标（init 时调用一次） */
    #initFromPosition(): void
    {
        if (!this.entity) return;
        const pos = getLogic(this.entity).position;
        if (!pos) return;
        const dx = pos.x - this.#_targetX;
        const dy = pos.y - this.#_targetY;
        const dz = pos.z - this.#_targetZ;
        this.#_distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (this.#_distance < this.#minDistance()) this.#_distance = this.#minDistance();
        this.#_tiltAngle = Math.acos(Math.max(-1, Math.min(1, dy / this.#_distance)));
        this.#_panAngle = Math.atan2(dx, dz);
    }

    /** 应用阻尼到球坐标增量与平移偏移，返回是否仍需继续 */
    #applyDamping(interval: number): void
    {
        // 帧率无关衰减系数：(1 - dampingFactor)^(interval / 标称帧时长)
        // 标称帧时长取 1000/60 ≈ 16.67ms，使 dampingFactor 在 60fps 下与 three.js 一致
        const k = this.#dampingFactor();
        const decay = Math.pow(1 - k, interval / (1000 / 60));
        this.#_sphericalDelta.theta *= 1 - decay;
        this.#_sphericalDelta.phi *= 1 - decay;
        this.#_panOffset.x *= 1 - decay;
        this.#_panOffset.y *= 1 - decay;
        this.#_panOffset.z *= 1 - decay;
    }

    /** 把球坐标增量与平移偏移累加到当前状态，并应用角度/距离限制 */
    #applyMovement(): void
    {
        this.#_panAngle += this.#_sphericalDelta.theta;
        this.#_tiltAngle += this.#_sphericalDelta.phi;
        this.#_tiltAngle = Math.max(this.#minTiltAngle(), Math.min(this.#maxTiltAngle(), this.#_tiltAngle));
        // 水平角限制
        const minPan = this.#minPanAngle();
        const maxPan = this.#maxPanAngle();
        if (isFinite(minPan) && isFinite(maxPan))
        {
            this.#_panAngle = Math.max(minPan, Math.min(maxPan, this.#_panAngle));
        }

        // 距离缩放（_sphericalDelta.radius 作为乘数因子，0 表示无缩放）
        if (this.#_sphericalDelta.radius !== 0)
        {
            this.#_distance *= this.#_sphericalDelta.radius;
            this.#_distance = Math.max(this.#minDistance(), Math.min(this.#maxDistance(), this.#_distance));
        }

        // 平移偏移作用到 target
        this.#_targetX += this.#_panOffset.x;
        this.#_targetY += this.#_panOffset.y;
        this.#_targetZ += this.#_panOffset.z;
    }

    /** 应用球坐标 → 写回 camera position + rotation */
    #applyTransform(): void
    {
        if (!this.entity) return;
        const objLogic = getLogic(this.entity);
        if (!objLogic || !objLogic.local2world) return;
        const sinTilt = Math.sin(this.#_tiltAngle);
        const x = this.#_targetX + this.#_distance * sinTilt * Math.sin(this.#_panAngle);
        const y = this.#_targetY + this.#_distance * Math.cos(this.#_tiltAngle);
        const z = this.#_targetZ + this.#_distance * sinTilt * Math.cos(this.#_panAngle);

        batchRun(() =>
        {
            reactive(this.entity).position = { x, y, z };
        });
        // lookAt：用矩阵 lookAt + toTRS 写回 rotation（与 Object3DLogic.lookAt 等价）
        const m = objLogic.local2world.clone();
        m.lookAt(new Vector3(this.#_targetX, this.#_targetY, this.#_targetZ), Vector3.Y_AXIS);
        // 转回本地坐标（处理父节点）
        const parent = getLogic(this.entity).parent;
        if (parent)
        {
            m.append(getLogic(parent as Object3D).world2local);
        }
        const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
        m.toTRS(pos, rot, scl);
        batchRun(() =>
        {
            reactive(this.entity).rotation = { x: rot.x, y: rot.y, z: rot.z };
        });
    }

    /** 计算两指间距离 */
    #pointersDistance(): number
    {
        const pts = Array.from(this.#_pointers.values());
        if (pts.length < 2) return 0;
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;

        return Math.sqrt(dx * dx + dy * dy);
    }

    /** 计算两指中点 */
    #pointersMidpoint(out: { x: number; y: number }): void
    {
        const pts = Array.from(this.#_pointers.values());
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
    #pan(deltaX: number, deltaY: number): void
    {
        if (!this.entity) return;
        if (!this.#enablePan()) return;
        const objLogic = getLogic(this.entity);
        if (!objLogic || !objLogic.local2world) return;

        // 透视相机：按 distance × tan(fov/2) 归一化（让平移速度与视口/距离无关）
        // 此处用近似：targetDistance = _distance
        const targetDistance = this.#_distance;
        // 每像素对应的世界单位（half-fov 投影）
        const fovHalf = 0.5; // 简化：没有直接拿到 fov，用相对系数
        const distPerPixel = targetDistance * fovHalf * 0.001 * this.#panSpeed();

        const l2w = objLogic.local2world;
        // X 方向：相机本地 X 轴
        const right = l2w.getAxisX();
        // Y 方向：screenSpacePanning 时用相机本地 Y 轴，否则用水平面（Y 轴与 right 叉积）
        let up: Vector3;
        if (this.#screenSpacePanning())
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
        this.#_panOffset.x += (-right.x * deltaX - up.x * deltaY) * distPerPixel;
        this.#_panOffset.y += (-right.y * deltaX - up.y * deltaY) * distPerPixel;
        this.#_panOffset.z += (-right.z * deltaX - up.z * deltaY) * distPerPixel;

        // 若不开阻尼，立即应用到 target
        if (!this.#enableDamping())
        {
            this.#_targetX += this.#_panOffset.x; this.#_targetY += this.#_panOffset.y; this.#_targetZ += this.#_panOffset.z;
            this.#_panOffset.x = 0; this.#_panOffset.y = 0; this.#_panOffset.z = 0;
        }
    }

    /** 旋转（球坐标增量，对应 three.js _rotateLeft/_rotateUp） */
    #rotateLeft(angle: number): void
    {
        this.#_sphericalDelta.theta -= angle;
    }

    #rotateUp(angle: number): void
    {
        this.#_sphericalDelta.phi -= angle;
    }

    /** 缩放（radius 乘数因子，对应 three.js _dollyIn/_dollyOut） */
    #dolly(scale: number): void
    {
        // scale<1 拉近，scale>1 拉远；转为乘数因子累加
        if (this.#_sphericalDelta.radius === 0) this.#_sphericalDelta.radius = 1;
        this.#_sphericalDelta.radius *= scale;
        // 若不开阻尼，立即应用
        if (!this.#enableDamping())
        {
            this.#_distance = Math.max(this.#minDistance(),
                Math.min(this.#maxDistance(), this.#_distance * this.#_sphericalDelta.radius));
            this.#_sphericalDelta.radius = 0;
        }
    }

    /** 指数缩放比例（对应 three.js _getZoomScale） */
    #getZoomScale(deltaY: number): number
    {
        const normalizedDelta = Math.abs(deltaY * 0.01);

        return Math.pow(0.95, this.#zoomSpeed() * normalizedDelta);
    }

    // ==================== 指针事件处理（统一鼠标+触摸） ====================

    readonly #onPointerDown = (event: IEvent<PointerEvent>): void =>
    {
        const e = event.data;
        this.#_pointers.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

        if (this.#_pointers.size === 1)
        {
            // 单指/单键：决定 rotate 还是 pan
            this.#_lastX = e.clientX;
            this.#_lastY = e.clientY;
            if (e.pointerType === 'touch')
            {
                this.#_state = 'rotate';
            }
            else
            {
                // 鼠标：左键(0)旋转，右键(2)平移，中键(1)dolly；Ctrl+左键平移
                if (e.button === 0 && (e.ctrlKey || e.metaKey || e.shiftKey))
                {
                    this.#_state = this.#enablePan() ? 'pan' : 'none';
                }
                else if (e.button === 0)
                {
                    this.#_state = this.#enableRotate() ? 'rotate' : 'none';
                }
                else if (e.button === 2)
                {
                    this.#_state = this.#enablePan() ? 'pan' : 'none';
                }
                else if (e.button === 1)
                {
                    this.#_state = this.#enableZoom() ? 'dolly' : 'none';
                }
                else
                {
                    this.#_state = 'none';
                }
            }
        }
        else if (this.#_pointers.size === 2)
        {
            // 双指：dolly + pan（触摸）/ 双键鼠标不常见，按触摸处理
            this.#_dollyStartDist = this.#pointersDistance();
            const mid = { x: 0, y: 0 };
            this.#pointersMidpoint(mid);
            this.#_lastX = mid.x;
            this.#_lastY = mid.y;
            this.#_state = 'dolly';
        }
    };

    readonly #onPointerMove = (event: IEvent<PointerEvent>): void =>
    {
        if (this.#_state === 'none') return;
        const e = event.data;
        // 更新指针位置
        const ptr = this.#_pointers.get(e.pointerId);
        if (ptr) { ptr.x = e.clientX; ptr.y = e.clientY; }

        if (this.#_pointers.size >= 2 && this.#_state === 'dolly')
        {
            // 双指：缩放 + 平移
            this.#handleTwoPointerDollyPan();
        }
        else
        {
            // 单指
            const dx = e.clientX - this.#_lastX;
            const dy = e.clientY - this.#_lastY;
            this.#_lastX = e.clientX;
            this.#_lastY = e.clientY;

            if (this.#_state === 'rotate' && this.#enableRotate())
            {
                // 旋转角度按像素 × rotateSpeed（横向也用高度归一化，与 three.js 一致）
                this.#rotateLeft(dx * this.#rotateSpeed());
                this.#rotateUp(dy * this.#rotateSpeed());
            }
            else if (this.#_state === 'pan' && this.#enablePan())
            {
                this.#pan(dx, dy);
            }
            else if (this.#_state === 'dolly' && this.#enableZoom())
            {
                // 中键拖拽：垂直方向缩放
                const scale = this.#getZoomScale(dy * 10);
                if (dy > 0) this.#dolly(scale); else this.#dolly(1 / scale);
            }
        }

        // 若不开阻尼，立即应用旋转增量
        if (!this.#enableDamping() && (this.#_state === 'rotate' || this.#_state === 'pan' || this.#_state === 'dolly'))
        {
            this.#applyMovementImmediate();
        }
    };

    /** 双指操作：距离变化→缩放，中点变化→平移 */
    #handleTwoPointerDollyPan(): void
    {
        if (!this.#enableZoom() && !this.#enablePan()) return;
        const curDist = this.#pointersDistance();
        if (this.#_dollyStartDist > 0 && this.#enableZoom())
        {
            const ratio = curDist / this.#_dollyStartDist;
            // ratio>1 拉近（手指分开），ratio<1 拉远
            this.#dolly(1 / Math.pow(ratio, this.#zoomSpeed()));
            this.#_dollyStartDist = curDist;
        }
        // 中点平移
        const mid = { x: 0, y: 0 };
        this.#pointersMidpoint(mid);
        const dx = mid.x - this.#_lastX;
        const dy = mid.y - this.#_lastY;
        this.#_lastX = mid.x;
        this.#_lastY = mid.y;
        if (this.#enablePan()) this.#pan(dx, dy);

        if (!this.#enableDamping()) this.#applyMovementImmediate();
    }

    /** 非阻尼模式：立即应用球坐标增量（一次性），然后清零 */
    #applyMovementImmediate(): void
    {
        this.#_panAngle += this.#_sphericalDelta.theta;
        this.#_tiltAngle += this.#_sphericalDelta.phi;
        this.#_tiltAngle = Math.max(this.#minTiltAngle(), Math.min(this.#maxTiltAngle(), this.#_tiltAngle));
        const minPan = this.#minPanAngle();
        const maxPan = this.#maxPanAngle();
        if (isFinite(minPan) && isFinite(maxPan))
        {
            this.#_panAngle = Math.max(minPan, Math.min(maxPan, this.#_panAngle));
        }
        if (this.#_sphericalDelta.radius !== 0)
        {
            this.#_distance = Math.max(this.#minDistance(),
                Math.min(this.#maxDistance(), this.#_distance * this.#_sphericalDelta.radius));
        }
        this.#_sphericalDelta.theta = 0;
        this.#_sphericalDelta.phi = 0;
        this.#_sphericalDelta.radius = 0;
    }

    readonly #onPointerUp = (event: IEvent<PointerEvent>): void =>
    {
        const e = event.data;
        this.#_pointers.delete(e.pointerId);
        if (this.#_pointers.size === 0)
        {
            this.#_state = 'none';
        }
        else if (this.#_pointers.size === 1)
        {
            // 从双指降为单指：切回单指旋转/平移
            const remaining = Array.from(this.#_pointers.values())[0];
            this.#_lastX = remaining.x;
            this.#_lastY = remaining.y;
            this.#_state = 'rotate';
        }
    };

    readonly #onWheel = (event: IEvent<WheelEvent>): void =>
    {
        if (!this.#enableZoom()) return;
        const e = event.data;
        e.preventDefault();
        let deltaY = e.deltaY;
        // Firefox lineMode 归一化
        if (e.deltaMode === 1) deltaY *= 16;
        else if (e.deltaMode === 2) deltaY *= 100;
        // 触控板捏合（合成 ctrlKey 但无真实按键）放大灵敏度
        if (e.ctrlKey) deltaY *= 10;

        const scale = this.#getZoomScale(deltaY);
        if (deltaY > 0) this.#dolly(scale); else this.#dolly(1 / scale);
        if (!this.#enableDamping()) this.#applyMovementImmediate();
    };

    readonly #onKeyDown = (event: IEvent<KeyboardEvent>): void =>
    {
        if (!this.#enableKeys()) return;
        const e = event.data;
        const withModifier = e.ctrlKey || e.metaKey || e.shiftKey;
        const keyPan = this.#keyPanSpeed();
        let handled = false;

        switch (e.code)
        {
            case 'ArrowUp':
                if (withModifier && this.#enableRotate())
                {
                    this.#rotateUp(2 * Math.PI * this.#rotateSpeed() * 10);
                }
                else if (this.#enablePan())
                {
                    this.#pan(0, keyPan);
                }
                handled = true;
                break;
            case 'ArrowDown':
                if (withModifier && this.#enableRotate())
                {
                    this.#rotateUp(-2 * Math.PI * this.#rotateSpeed() * 10);
                }
                else if (this.#enablePan())
                {
                    this.#pan(0, -keyPan);
                }
                handled = true;
                break;
            case 'ArrowLeft':
                if (withModifier && this.#enableRotate())
                {
                    this.#rotateLeft(2 * Math.PI * this.#rotateSpeed() * 10);
                }
                else if (this.#enablePan())
                {
                    this.#pan(keyPan, 0);
                }
                handled = true;
                break;
            case 'ArrowRight':
                if (withModifier && this.#enableRotate())
                {
                    this.#rotateLeft(-2 * Math.PI * this.#rotateSpeed() * 10);
                }
                else if (this.#enablePan())
                {
                    this.#pan(-keyPan, 0);
                }
                handled = true;
                break;
        }
        if (handled)
        {
            e.preventDefault();
            if (!this.#enableDamping()) this.#applyMovementImmediate();
        }
    };

    readonly #onContext = (e: IEvent<Event>): void =>
    {
        // 阻止右键菜单
        if (e.data && typeof (e.data as Event).preventDefault === 'function')
        {
            (e.data as Event).preventDefault();
        }
    };

    #setAuto(value: boolean): void
    {
        if (this.#auto === value) return;
        if (this.#auto)
        {
            windowEventProxy.off('pointerdown', this.#onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointermove', this.#onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointerup', this.#onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointercancel', this.#onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('wheel', this.#onWheel as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('keydown', this.#onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('contextmenu', this.#onContext as (event: IEvent<unknown>) => void, null);
            this.#_pointers.clear();
            this.#_state = 'none';
        }
        this.#auto = value;
        if (this.#auto)
        {
            windowEventProxy.on('pointerdown', this.#onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointermove', this.#onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointerup', this.#onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('pointercancel', this.#onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('wheel', this.#onWheel as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('keydown', this.#onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.on('contextmenu', this.#onContext as (event: IEvent<unknown>) => void, null);
        }
    }

    override init(object3D?: Object3D): void
    {
        if (this.#subInited) return;
        this.#subInited = true;
        super.init(object3D);

        // 从数据字段或当前 position 推断球坐标
        if (this.#oc.panAngle !== undefined && this.#oc.tiltAngle !== undefined && this.#oc.distance !== undefined)
        {
            this.#_panAngle = this.#oc.panAngle;
            this.#_tiltAngle = this.#oc.tiltAngle;
            this.#_distance = this.#oc.distance;
        }
        else
        {
            this.#initFromPosition();
        }
        // 保存初始状态作为 reset 基准
        this.#_savedTargetX = this.#_targetX; this.#_savedTargetY = this.#_targetY; this.#_savedTargetZ = this.#_targetZ;
        this.#_savedPanAngle = this.#_panAngle; this.#_savedTiltAngle = this.#_tiltAngle; this.#_savedDistance = this.#_distance;
        this.#applyTransform();

        this.#setAuto(true);
    }

    override update(interval: number): void
    {
        super.update(0);
        // 自动旋转（无活跃交互时）
        if (this.#autoRotate() && this.#_state === 'none' && this.#enableRotate())
        {
            // 2π/60/60 × autoRotateSpeed（对应 60fps 下 30秒/圈 @speed=2）
            const angle = 2 * Math.PI / 60 / 60 * this.#autoRotateSpeed() * (interval / (1000 / 60));
            this.#rotateLeft(angle);
        }
        // 应用球坐标增量 + 平移偏移到当前状态
        if (this.#enableDamping())
        {
            // 阻尼模式：按 dampingFactor 应用一部分增量，剩余部分衰减
            this.#applyMovement();
            this.#applyDamping(interval);
        }
        else
        {
            // 非阻尼模式：增量可能来自 update 里的 autoRotate（输入事件的增量已在事件里立即应用），
            // 这里把残余增量一次性应用并清零
            this.#applyMovementImmediate();
        }
        this.#applyTransform();
    }

    override dispose(): void
    {
        this.#setAuto(false);
        super.dispose();
    }

    /** 保存当前状态（target/position/球坐标），供 reset 恢复 */
    saveState(): void
    {
        this.#_savedTargetX = this.#_targetX; this.#_savedTargetY = this.#_targetY; this.#_savedTargetZ = this.#_targetZ;
        this.#_savedPanAngle = this.#_panAngle; this.#_savedTiltAngle = this.#_tiltAngle; this.#_savedDistance = this.#_distance;
    }

    /** 恢复到上次 saveState 的状态（或初始状态） */
    reset(): void
    {
        this.#_targetX = this.#_savedTargetX; this.#_targetY = this.#_savedTargetY; this.#_targetZ = this.#_savedTargetZ;
        this.#_panAngle = this.#_savedPanAngle; this.#_tiltAngle = this.#_savedTiltAngle; this.#_distance = this.#_savedDistance;
        this.#_sphericalDelta.theta = 0; this.#_sphericalDelta.phi = 0; this.#_sphericalDelta.radius = 0;
        this.#_panOffset.x = 0; this.#_panOffset.y = 0; this.#_panOffset.z = 0;
        this.#_state = 'none';
        this.#applyTransform();
    }
}

// 注册到 logic 分发表
registerLogic('OrbitControls', OrbitControlsLogic as unknown as new (data: OrbitControls) => OrbitControlsLogic);
