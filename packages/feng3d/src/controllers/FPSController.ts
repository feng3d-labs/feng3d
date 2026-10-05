import { Behaviour, BehaviourLogic, createBehaviourLogicBase } from '../component/Behaviour';
import { registerLogic, logic as getLogic, batchRun, reactive } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { mat4Append, mat4AppendRotation, mat4Copy, mat4GetAxisX, mat4GetAxisY, mat4GetAxisZ, mat4GetPosition, mat4ToTRS, Matrix4x4, VEC3_Y_AXIS, vec2Sub, vec3Add, vec3Copy, vec3Dot, vec3ScaleNumber, WritableVector2Like, WritableVector3Like } from '@feng3d/math';
import { windowEventProxy } from '@feng3d/shortcut';
import { Object3D } from '../core/Object3D';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        FPSController: FPSController;
    }
}

/**
 * FPSController（纯数据接口）。
 */
export interface FPSController extends Behaviour
{
    readonly __type__: 'FPSController';
    /** 加速度（缺失时由 registerLogic 自动填充） */
    readonly acceleration?: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        FPSController: FPSControllerLogic;
    }
}

/**
 * FPSController 逻辑接口。
 *
 * 继承 BehaviourLogic，额外：
 * - auto getter/setter（订阅/取消 windowEventProxy 鼠标键盘事件）
 * - init: 初始化按键方向字典，auto=true
 * - update: 根据鼠标/键盘输入计算旋转与位移
 * - dispose: auto=false 取消订阅
 */
export interface FPSControllerLogic extends BehaviourLogic
{
    /** 是否自动订阅鼠标键盘事件 */
    auto: boolean;
}

/**
 * 工厂函数：FPSControllerLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function fpsControllerLogic(data: FPSController): FPSControllerLogic
{
    const { members } = createBehaviourLogicBase(data);

    // 默认值（缺失字段单独赋值；enabled/runEnvironment 由父类 BehaviourLogic 处理）
    if (data.acceleration === undefined)
    {
        (data as { acceleration: number }).acceleration = 0.001;
    }

    const fpsController = data;
    /** init 去重标志（同一 component 只初始化一次） */
    let subInited = false;
    let keyDownDic: { [key: string]: boolean } = {};
    let keyDirectionDic: { [key: string]: WritableVector3Like } = {};
    let velocity: WritableVector3Like = { x: 0, y: 0, z: 0 };
    let preMousePoint: WritableVector2Like | null = null;
    let mousePoint: WritableVector2Like | null = null;
    let ischange = false;
    let auto = false;

    function stopDirectionVelocity(direction: WritableVector3Like): void
    {
        if (!direction)
        {
            return;
        }
        if (direction.x !== 0)
        {
            velocity.x = 0;
        }
        if (direction.y !== 0)
        {
            velocity.y = 0;
        }
        if (direction.z !== 0)
        {
            velocity.z = 0;
        }
    }

    const onMousedown = (): void =>
    {
        ischange = true;
        preMousePoint = null;
        mousePoint = null;
        velocity = { x: 0, y: 0, z: 0 };
        keyDownDic = {};

        windowEventProxy.on('keydown', onKeydown, null);
        windowEventProxy.on('keyup', onKeyup, null);
        windowEventProxy.on('mousemove', onMouseMove, null);
    };

    const onMouseup = (): void =>
    {
        ischange = false;
        preMousePoint = null;
        mousePoint = null;

        windowEventProxy.off('keydown', onKeydown, null);
        windowEventProxy.off('keyup', onKeyup, null);
        windowEventProxy.off('mousemove', onMouseMove, null);
    };

    const onMouseMove = (event: IEvent<MouseEvent>): void =>
    {
        mousePoint = { x: event.data!.clientX, y: event.data!.clientY };

        if (!preMousePoint)
        {
            preMousePoint = mousePoint;
            mousePoint = null;
        }
    };

    const onKeydown = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data!.keyCode).toLocaleLowerCase();
        if (!keyDirectionDic[boardKey])
        {
            return;
        }

        if (!keyDownDic[boardKey])
        {
            stopDirectionVelocity(keyDirectionDic[boardKey]);
        }
        keyDownDic[boardKey] = true;
    };

    const onKeyup = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data!.keyCode).toLocaleLowerCase();
        if (!keyDirectionDic[boardKey])
        {
            return;
        }

        keyDownDic[boardKey] = false;
        stopDirectionVelocity(keyDirectionDic[boardKey]);
    };

    /** 设置 auto（订阅/取消 windowEventProxy 鼠标键盘事件） */
    function setAuto(value: boolean): void
    {
        if (auto === value)
        {
            return;
        }
        if (auto)
        {
            windowEventProxy.off('mousedown', onMousedown, null);
            windowEventProxy.off('mouseup', onMouseup, null);
            onMouseup();
        }
        auto = value;
        if (auto)
        {
            windowEventProxy.on('mousedown', onMousedown, null);
            windowEventProxy.on('mouseup', onMouseup, null);
        }
    }

    const logic: FPSControllerLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 是否自动订阅鼠标键盘事件 */
        get auto() { return auto; },
        set auto(value) { setAuto(value); },
        init(object3D)
        {
            if (subInited) return;
            subInited = true;
            members.init(object3D);

            keyDirectionDic = {};
            keyDirectionDic['a'] = { x: -1, y: 0, z: 0 };
            keyDirectionDic['d'] = { x: 1, y: 0, z: 0 };
            // 相机 forward 为本地 -Z（投影矩阵 m[11]=-1），W（前进）映射到 velocity.z=-1，
            // 配合 forward=getAxisZ() 得到 -Z 方向位移
            keyDirectionDic['w'] = { x: 0, y: 0, z: -1 };
            keyDirectionDic['s'] = { x: 0, y: 0, z: 1 };
            keyDirectionDic['e'] = { x: 0, y: 1, z: 0 };
            keyDirectionDic['q'] = { x: 0, y: -1, z: 0 };

            keyDownDic = {};

            setAuto(true);
        },
        update(_interval)
        {
            members.update(0);
            if (!ischange)
            {
                return;
            }

            if (mousePoint && preMousePoint)
            {
                // 鼠标位移 → 旋转量（弧度）。原 0.15 是「度/像素」，改弧度后乘 DEG2RAD 保持手感一致。
                const radPerPixel = 0.15 * Math.PI / 180;
                const offsetPoint = vec2Sub(mousePoint, preMousePoint);
                offsetPoint.x *= radPerPixel;
                offsetPoint.y *= radPerPixel;

                // 阶段 C-e：`Matrix4x4` 的 class 已删除，实例方法换成等价纯函数（`out` 传 matrix 即就地）
                const matrix = getLogic(members.entity!).local2world;
                mat4AppendRotation(matrix, mat4GetAxisX(matrix), offsetPoint.y, mat4GetPosition(matrix), matrix);
                const up = vec3Copy(VEC3_Y_AXIS);
                const axisY = { x: 0, y: 0, z: 0 };
                mat4GetAxisY(matrix, axisY);
                if (vec3Dot(axisY, up) < 0)
                {
                    vec3ScaleNumber(up, -1, up);
                }
                mat4AppendRotation(matrix, up, offsetPoint.x, mat4GetPosition(matrix), matrix);
                {
                    const t = members.entity;
                    const localMatrix: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(matrix) };
                    const r_parent = getLogic(t!).parent;
                    if (r_parent)
                    {
                        const parent = r_parent as unknown as Object3D;
                        mat4Append(localMatrix, getLogic(parent).world2local, localMatrix);
                    }
                    const pos = { x: 0, y: 0, z: 0 }; const rot = { x: 0, y: 0, z: 0 }; const scl = { x: 0, y: 0, z: 0 };
                    mat4ToTRS(localMatrix, pos, rot, scl);
                    // 整体写回 raw.position/rotation/scale（缺失字段时整体赋值，避免子字段修改崩溃）
                    batchRun(() =>
                    {
                        reactive(t!).position = { x: pos.x, y: pos.y, z: pos.z };
                        reactive(t!).rotation = { x: rot.x, y: rot.y, z: rot.z };
                        reactive(t!).scale = { x: scl.x, y: scl.y, z: scl.z };
                    });
                }
                //
                preMousePoint = mousePoint;
                mousePoint = null;
            }

            // 计算加速度
            const accelerationVec = { x: 0, y: 0, z: 0 };
            for (const key in keyDirectionDic)
            {
                if (keyDownDic[key] === true)
                {
                    const element = keyDirectionDic[key];
                    vec3Add(accelerationVec, element, accelerationVec);
                }
            }
            vec3ScaleNumber(accelerationVec, fpsController.acceleration!, accelerationVec);
            // 计算速度
            vec3Add(velocity, accelerationVec, velocity);
            const right = { x: 0, y: 0, z: 0 }; const up = { x: 0, y: 0, z: 0 }; const forward = { x: 0, y: 0, z: 0 };
            mat4GetAxisX(getLogic(members.entity!).local2world, right);
            mat4GetAxisY(getLogic(members.entity!).local2world, up);
            mat4GetAxisZ(getLogic(members.entity!).local2world, forward);
            vec3ScaleNumber(right, velocity.x, right);
            vec3ScaleNumber(up, velocity.y, up);
            vec3ScaleNumber(forward, velocity.z, forward);
            // 计算位移
            const displacement = vec3Add(vec3Add(right, up), forward);
            // 通过 logic().position 读取当前值（缺失字段拿到默认 {0,0,0}），整体写回 raw
            const cur = getLogic(members.entity!).position;
            reactive(members.entity!).position = {
                x: cur.x + displacement.x,
                y: cur.y + displacement.y,
                z: cur.z + displacement.z,
            };
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
registerLogic('FPSController', fpsControllerLogic);
