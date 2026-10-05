import { Behaviour, BehaviourLogic, createBehaviourLogicBase } from '../component/Behaviour';
import { registerLogic, logic as getLogic, batchRun, reactive } from '@feng3d/reactivity';
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

/**
 * 工厂函数：OrbitControlsLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function orbitControlsLogic(data: OrbitControls): OrbitControlsLogic
{
    const { members } = createBehaviourLogicBase(data);

    const orbitControls = data;

    // ---- 默认值 accessor ----
    const target = () => reactive(orbitControls).target ?? { x: 0, y: 0, z: 0 };
    const minDistance = () => reactive(orbitControls).minDistance ?? 0.1;
    const maxDistance = () => reactive(orbitControls).maxDistance ?? 10000;
    const minTiltAngle = () => reactive(orbitControls).minTiltAngle ?? 0.1;
    const maxTiltAngle = () => reactive(orbitControls).maxTiltAngle ?? Math.PI - 0.1;
    const minPanAngle = () => reactive(orbitControls).minPanAngle ?? -Infinity;
    const maxPanAngle = () => reactive(orbitControls).maxPanAngle ?? Infinity;
    const rotateSpeed = () => reactive(orbitControls).rotateSpeed ?? 0.005;
    const zoomSpeed = () => reactive(orbitControls).zoomSpeed ?? 1.0;
    const panSpeed = () => reactive(orbitControls).panSpeed ?? 1.0;
    const keyPanSpeed = () => reactive(orbitControls).keyPanSpeed ?? 7.0;
    const enableDamping = () => reactive(orbitControls).enableDamping ?? false;
    const dampingFactor = () => reactive(orbitControls).dampingFactor ?? 0.05;
    const enableRotate = () => reactive(orbitControls).enableRotate ?? true;
    const enableZoom = () => reactive(orbitControls).enableZoom ?? true;
    const enablePan = () => reactive(orbitControls).enablePan ?? true;
    const enableKeys = () => reactive(orbitControls).enableKeys ?? true;
    const autoRotate = () => reactive(orbitControls).autoRotate ?? false;
    const autoRotateSpeed = () => reactive(orbitControls).autoRotateSpeed ?? 2.0;
    const screenSpacePanning = () => reactive(orbitControls).screenSpacePanning ?? true;

    // ---- 订阅状态 ----
    /** init 去重标志（同一 component 只初始化一次） */
    let subInited = false;
    let auto = false;

    // ---- 阻尼速度（球坐标增量，每帧衰减应用） ----
    const sphericalDelta: SphericalDelta = { theta: 0, phi: 0, radius: 0 };
    // 平移偏移（每帧衰减应用）
    const panOffset = { x: 0, y: 0, z: 0 };

    // ---- 指针跟踪（统一鼠标+触摸） ----
    // 当前活跃指针列表（pointerId → 位置）
    const pointers = new Map<number, TrackedPointer>();
    // 当前交互状态：'none' | 'rotate' | 'pan' | 'dolly'
    let pointerState: 'none' | 'rotate' | 'pan' | 'dolly' = 'none';
    // 上一次指针位置（单指操作用）
    let lastX = 0;
    let lastY = 0;
    // 双指初始距离（dolly 基准）
    let dollyStartDist = 0;

    // ---- 原构造体：球坐标初始化 ----
    const tgt = target();
    let targetX = tgt.x;
    let targetY = tgt.y;
    let targetZ = tgt.z;
    let panAngle = data.panAngle ?? 0;
    let tiltAngle = data.tiltAngle ?? Math.PI / 2;
    let distance = data.distance ?? 5;

    // ---- saveState 存储 ----
    let savedTargetX = targetX;
    let savedTargetY = targetY;
    let savedTargetZ = targetZ;
    let savedPanAngle = panAngle;
    let savedTiltAngle = tiltAngle;
    let savedDistance = distance;

    /** 从当前 position 推断球坐标（init 时调用一次） */
    function initFromPosition(): void
    {
        if (!members.entity) return;
        const pos = getLogic(members.entity!).position;
        if (!pos) return;
        const dx = pos.x - targetX;
        const dy = pos.y - targetY;
        const dz = pos.z - targetZ;
        distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance < minDistance()) distance = minDistance();
        tiltAngle = Math.acos(Math.max(-1, Math.min(1, dy / distance)));
        panAngle = Math.atan2(dx, dz);
    }

    /** 应用阻尼到球坐标增量与平移偏移，返回是否仍需继续 */
    function applyDamping(interval: number): void
    {
        // 帧率无关衰减系数：(1 - dampingFactor)^(interval / 标称帧时长)
        // 标称帧时长取 1000/60 ≈ 16.67ms，使 dampingFactor 在 60fps 下与 three.js 一致
        const k = dampingFactor();
        const decay = Math.pow(1 - k, interval / (1000 / 60));
        sphericalDelta.theta *= 1 - decay;
        sphericalDelta.phi *= 1 - decay;
        panOffset.x *= 1 - decay;
        panOffset.y *= 1 - decay;
        panOffset.z *= 1 - decay;
    }

    /** 把球坐标增量与平移偏移累加到当前状态，并应用角度/距离限制 */
    function applyMovement(): void
    {
        panAngle += sphericalDelta.theta;
        tiltAngle += sphericalDelta.phi;
        tiltAngle = Math.max(minTiltAngle(), Math.min(maxTiltAngle(), tiltAngle));
        // 水平角限制
        const minPan = minPanAngle();
        const maxPan = maxPanAngle();
        if (isFinite(minPan) && isFinite(maxPan))
        {
            panAngle = Math.max(minPan, Math.min(maxPan, panAngle));
        }

        // 距离缩放（sphericalDelta.radius 作为乘数因子，0 表示无缩放）
        if (sphericalDelta.radius !== 0)
        {
            distance *= sphericalDelta.radius;
            distance = Math.max(minDistance(), Math.min(maxDistance(), distance));
        }

        // 平移偏移作用到 target
        targetX += panOffset.x;
        targetY += panOffset.y;
        targetZ += panOffset.z;
    }

    /** 应用球坐标 → 写回 camera position + rotation */
    function applyTransform(): void
    {
        if (!members.entity) return;
        const objLogic = getLogic(members.entity!);
        if (!objLogic || !objLogic.local2world) return;
        const sinTilt = Math.sin(tiltAngle);
        const x = targetX + distance * sinTilt * Math.sin(panAngle);
        const y = targetY + distance * Math.cos(tiltAngle);
        const z = targetZ + distance * sinTilt * Math.cos(panAngle);

        batchRun(() =>
        {
            reactive(members.entity!).position = { x, y, z };
        });
        // lookAt：用矩阵 lookAt + toTRS 写回 rotation（与 Object3DLogic.lookAt 等价）
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(objLogic.local2world) };
        mat4LookAt(m, { x: targetX, y: targetY, z: targetZ }, VEC3_Y_AXIS, m);
        // 转回本地坐标（处理父节点）
        const parent = getLogic(members.entity!).parent;
        if (parent)
        {
            mat4Append(m, getLogic(parent as Object3D).world2local, m);
        }
        const pos = { x: 0, y: 0, z: 0 }; const rot = { x: 0, y: 0, z: 0 }; const scl = { x: 0, y: 0, z: 0 };
        mat4ToTRS(m, pos, rot, scl);
        batchRun(() =>
        {
            reactive(members.entity!).rotation = { x: rot.x, y: rot.y, z: rot.z };
        });
    }

    /** 计算两指间距离 */
    function pointersDistance(): number
    {
        const pts = Array.from(pointers.values());
        if (pts.length < 2) return 0;
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;

        return Math.sqrt(dx * dx + dy * dy);
    }

    /** 计算两指中点 */
    function pointersMidpoint(out: { x: number; y: number }): void
    {
        const pts = Array.from(pointers.values());
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
        if (!members.entity) return;
        if (!enablePan()) return;
        const objLogic = getLogic(members.entity!);
        if (!objLogic || !objLogic.local2world) return;

        // 透视相机：按 distance × tan(fov/2) 归一化（让平移速度与视口/距离无关）
        // 此处用近似：targetDistance = distance
        const targetDistance = distance;
        // 每像素对应的世界单位（half-fov 投影）
        const fovHalf = 0.5; // 简化：没有直接拿到 fov，用相对系数
        const distPerPixel = targetDistance * fovHalf * 0.001 * panSpeed();

        const l2w = objLogic.local2world;
        // X 方向：相机本地 X 轴
        // （阶段 C-e：`Matrix4x4` 的 class 已删除，getAxisX/Y 的缺省 out 是纯字面量、
        //   没有 Vector3 的方法，而下面要用 `right.clone()` / `up.cross(...)`，所以显式传 Vector3 实例）
        const right = { x: 0, y: 0, z: 0 };
        mat4GetAxisX(l2w, right);
        // Y 方向：screenSpacePanning 时用相机本地 Y 轴，否则用水平面（Y 轴与 right 叉积）
        let up: WritableVector3Like;
        if (screenSpacePanning())
        {
            up = { x: 0, y: 0, z: 0 };
            mat4GetAxisY(l2w, up);
        }
        else
        {
            // 水平面平移：right × worldUp 得到水平方向
            up = vec3Cross(right, VEC3_Y_AXIS);
        }

        // 累加到 panOffset（支持阻尼）
        panOffset.x += (-right.x * deltaX - up.x * deltaY) * distPerPixel;
        panOffset.y += (-right.y * deltaX - up.y * deltaY) * distPerPixel;
        panOffset.z += (-right.z * deltaX - up.z * deltaY) * distPerPixel;

        // 若不开阻尼，立即应用到 target
        if (!enableDamping())
        {
            targetX += panOffset.x; targetY += panOffset.y; targetZ += panOffset.z;
            panOffset.x = 0; panOffset.y = 0; panOffset.z = 0;
        }
    }

    /** 旋转（球坐标增量，对应 three.js _rotateLeft/_rotateUp） */
    function rotateLeft(angle: number): void
    {
        sphericalDelta.theta -= angle;
    }

    function rotateUp(angle: number): void
    {
        sphericalDelta.phi -= angle;
    }

    /** 缩放（radius 乘数因子，对应 three.js _dollyIn/_dollyOut） */
    function dolly(scale: number): void
    {
        // scale<1 拉近，scale>1 拉远；转为乘数因子累加
        if (sphericalDelta.radius === 0) sphericalDelta.radius = 1;
        sphericalDelta.radius *= scale;
        // 若不开阻尼，立即应用
        if (!enableDamping())
        {
            distance = Math.max(minDistance(),
                Math.min(maxDistance(), distance * sphericalDelta.radius));
            sphericalDelta.radius = 0;
        }
    }

    /** 指数缩放比例（对应 three.js _getZoomScale） */
    function getZoomScale(deltaY: number): number
    {
        const normalizedDelta = Math.abs(deltaY * 0.01);

        return Math.pow(0.95, zoomSpeed() * normalizedDelta);
    }

    // ==================== 指针事件处理（统一鼠标+触摸） ====================

    const onPointerDown = (event: IEvent<PointerEvent>): void =>
    {
        const e = event.data!;
        pointers.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

        if (pointers.size === 1)
        {
            // 单指/单键：决定 rotate 还是 pan
            lastX = e.clientX;
            lastY = e.clientY;
            if (e.pointerType === 'touch')
            {
                pointerState = 'rotate';
            }
            else
            {
                // 鼠标：左键(0)旋转，右键(2)平移，中键(1)dolly；Ctrl+左键平移
                if (e.button === 0 && (e.ctrlKey || e.metaKey || e.shiftKey))
                {
                    pointerState = enablePan() ? 'pan' : 'none';
                }
                else if (e.button === 0)
                {
                    pointerState = enableRotate() ? 'rotate' : 'none';
                }
                else if (e.button === 2)
                {
                    pointerState = enablePan() ? 'pan' : 'none';
                }
                else if (e.button === 1)
                {
                    pointerState = enableZoom() ? 'dolly' : 'none';
                }
                else
                {
                    pointerState = 'none';
                }
            }
        }
        else if (pointers.size === 2)
        {
            // 双指：dolly + pan（触摸）/ 双键鼠标不常见，按触摸处理
            dollyStartDist = pointersDistance();
            const mid = { x: 0, y: 0 };
            pointersMidpoint(mid);
            lastX = mid.x;
            lastY = mid.y;
            pointerState = 'dolly';
        }
    };

    const onPointerMove = (event: IEvent<PointerEvent>): void =>
    {
        if (pointerState === 'none') return;
        const e = event.data!;
        // 更新指针位置
        const ptr = pointers.get(e.pointerId);
        if (ptr) { ptr.x = e.clientX; ptr.y = e.clientY; }

        if (pointers.size >= 2 && pointerState === 'dolly')
        {
            // 双指：缩放 + 平移
            handleTwoPointerDollyPan();
        }
        else
        {
            // 单指
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;

            if (pointerState === 'rotate' && enableRotate())
            {
                // 旋转角度按像素 × rotateSpeed（横向也用高度归一化，与 three.js 一致）
                rotateLeft(dx * rotateSpeed());
                rotateUp(dy * rotateSpeed());
            }
            else if (pointerState === 'pan' && enablePan())
            {
                pan(dx, dy);
            }
            else if (pointerState === 'dolly' && enableZoom())
            {
                // 中键拖拽：垂直方向缩放
                const scale = getZoomScale(dy * 10);
                if (dy > 0) dolly(scale); else dolly(1 / scale);
            }
        }

        // 若不开阻尼，立即应用旋转增量
        if (!enableDamping() && (pointerState === 'rotate' || pointerState === 'pan' || pointerState === 'dolly'))
        {
            applyMovementImmediate();
        }
    };

    /** 双指操作：距离变化→缩放，中点变化→平移 */
    function handleTwoPointerDollyPan(): void
    {
        if (!enableZoom() && !enablePan()) return;
        const curDist = pointersDistance();
        if (dollyStartDist > 0 && enableZoom())
        {
            const ratio = curDist / dollyStartDist;
            // ratio>1 拉近（手指分开），ratio<1 拉远
            dolly(1 / Math.pow(ratio, zoomSpeed()));
            dollyStartDist = curDist;
        }
        // 中点平移
        const mid = { x: 0, y: 0 };
        pointersMidpoint(mid);
        const dx = mid.x - lastX;
        const dy = mid.y - lastY;
        lastX = mid.x;
        lastY = mid.y;
        if (enablePan()) pan(dx, dy);

        if (!enableDamping()) applyMovementImmediate();
    }

    /** 非阻尼模式：立即应用球坐标增量（一次性），然后清零 */
    function applyMovementImmediate(): void
    {
        panAngle += sphericalDelta.theta;
        tiltAngle += sphericalDelta.phi;
        tiltAngle = Math.max(minTiltAngle(), Math.min(maxTiltAngle(), tiltAngle));
        const minPan = minPanAngle();
        const maxPan = maxPanAngle();
        if (isFinite(minPan) && isFinite(maxPan))
        {
            panAngle = Math.max(minPan, Math.min(maxPan, panAngle));
        }
        if (sphericalDelta.radius !== 0)
        {
            distance = Math.max(minDistance(),
                Math.min(maxDistance(), distance * sphericalDelta.radius));
        }
        sphericalDelta.theta = 0;
        sphericalDelta.phi = 0;
        sphericalDelta.radius = 0;
    }

    const onPointerUp = (event: IEvent<PointerEvent>): void =>
    {
        const e = event.data!;
        pointers.delete(e.pointerId);
        if (pointers.size === 0)
        {
            pointerState = 'none';
        }
        else if (pointers.size === 1)
        {
            // 从双指降为单指：切回单指旋转/平移
            const remaining = Array.from(pointers.values())[0];
            lastX = remaining.x;
            lastY = remaining.y;
            pointerState = 'rotate';
        }
    };

    const onWheel = (event: IEvent<WheelEvent>): void =>
    {
        if (!enableZoom()) return;
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
        if (!enableDamping()) applyMovementImmediate();
    };

    const onKeyDown = (event: IEvent<KeyboardEvent>): void =>
    {
        if (!enableKeys()) return;
        const e = event.data!;
        const withModifier = e.ctrlKey || e.metaKey || e.shiftKey;
        const keyPan = keyPanSpeed();
        let handled = false;

        switch (e.code)
        {
            case 'ArrowUp':
                if (withModifier && enableRotate())
                {
                    rotateUp(2 * Math.PI * rotateSpeed() * 10);
                }
                else if (enablePan())
                {
                    pan(0, keyPan);
                }
                handled = true;
                break;
            case 'ArrowDown':
                if (withModifier && enableRotate())
                {
                    rotateUp(-2 * Math.PI * rotateSpeed() * 10);
                }
                else if (enablePan())
                {
                    pan(0, -keyPan);
                }
                handled = true;
                break;
            case 'ArrowLeft':
                if (withModifier && enableRotate())
                {
                    rotateLeft(2 * Math.PI * rotateSpeed() * 10);
                }
                else if (enablePan())
                {
                    pan(keyPan, 0);
                }
                handled = true;
                break;
            case 'ArrowRight':
                if (withModifier && enableRotate())
                {
                    rotateLeft(-2 * Math.PI * rotateSpeed() * 10);
                }
                else if (enablePan())
                {
                    pan(-keyPan, 0);
                }
                handled = true;
                break;
        }
        if (handled)
        {
            e.preventDefault();
            if (!enableDamping()) applyMovementImmediate();
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
        if (auto === value) return;
        if (auto)
        {
            windowEventProxy.off('pointerdown', onPointerDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointermove', onPointerMove as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointerup', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('pointercancel', onPointerUp as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('wheel', onWheel as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('keydown', onKeyDown as (event: IEvent<unknown>) => void, null);
            windowEventProxy.off('contextmenu', onContext as (event: IEvent<unknown>) => void, null);
            pointers.clear();
            pointerState = 'none';
        }
        auto = value;
        if (auto)
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

    const logic: OrbitControlsLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 是否自动订阅鼠标/触摸/键盘事件 */
        get auto() { return auto; },
        set auto(value) { setAuto(value); },
        init(object3D)
        {
            if (subInited) return;
            subInited = true;
            members.init(object3D);

            // 从数据字段或当前 position 推断球坐标
            if (orbitControls.panAngle !== undefined && orbitControls.tiltAngle !== undefined && orbitControls.distance !== undefined)
            {
                panAngle = orbitControls.panAngle;
                tiltAngle = orbitControls.tiltAngle;
                distance = orbitControls.distance;
            }
            else
            {
                initFromPosition();
            }
            // 保存初始状态作为 reset 基准
            savedTargetX = targetX; savedTargetY = targetY; savedTargetZ = targetZ;
            savedPanAngle = panAngle; savedTiltAngle = tiltAngle; savedDistance = distance;
            applyTransform();

            setAuto(true);
        },
        update(interval)
        {
            members.update(0);
            // 自动旋转（无活跃交互时）
            if (autoRotate() && pointerState === 'none' && enableRotate())
            {
                // 2π/60/60 × autoRotateSpeed（对应 60fps 下 30秒/圈 @speed=2）
                const angle = 2 * Math.PI / 60 / 60 * autoRotateSpeed() * (interval / (1000 / 60));
                rotateLeft(angle);
            }
            // 应用球坐标增量 + 平移偏移到当前状态
            if (enableDamping())
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
        dispose()
        {
            setAuto(false);
            members.dispose();
        },
        /** 保存当前状态（target/position/球坐标），供 reset 恢复 */
        saveState()
        {
            savedTargetX = targetX; savedTargetY = targetY; savedTargetZ = targetZ;
            savedPanAngle = panAngle; savedTiltAngle = tiltAngle; savedDistance = distance;
        },
        /** 恢复到上次 saveState 的状态（或初始状态） */
        reset()
        {
            targetX = savedTargetX; targetY = savedTargetY; targetZ = savedTargetZ;
            panAngle = savedPanAngle; tiltAngle = savedTiltAngle; distance = savedDistance;
            sphericalDelta.theta = 0; sphericalDelta.phi = 0; sphericalDelta.radius = 0;
            panOffset.x = 0; panOffset.y = 0; panOffset.z = 0;
            pointerState = 'none';
            applyTransform();
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('OrbitControls', orbitControlsLogic);
