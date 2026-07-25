import { Behaviour, behaviourLogic, BehaviourLogic } from '../component/Behaviour';
import { registerLogic, logic as getLogic, batchRun, reactive } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { Vector2, Vector3 } from '@feng3d/math';
import { windowEventProxy } from '@feng3d/shortcut';
import { Object3D } from '../core/Object3D';
import './FPSController';

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
 * FPSController 逻辑处理接口。
 *
 * 组合 behaviourLogic，额外：
 * - auto getter/setter（订阅/取消 windowEventProxy 鼠标键盘事件）
 * - init: 初始化按键方向字典，auto=true
 * - update: 根据鼠标/键盘输入计算旋转与位移
 * - dispose: auto=false 取消订阅
 */
export interface FPSControllerLogic extends BehaviourLogic
{
    /** 是否自动订阅鼠标键盘事件 */
    readonly auto: boolean;
}

/**
 * 创建 FPSControllerLogic 实例（工厂函数，组合 behaviourLogic 基础行为）。
 */
export function fpsControllerLogic(fpsController: FPSController): FPSControllerLogic
{
    // 默认值（缺失字段单独赋值；enabled/runEnvironment 由父类 BehaviourLogic 处理）
    if (fpsController.acceleration === undefined)
    {
        (fpsController as { acceleration: number }).acceleration = 0.001;
    }

    const base = behaviourLogic(fpsController);

    /** init 去重标志（同一 component 只初始化一次） */
    let _subInited = false;

    let keyDownDic: { [key: string]: boolean } = {};
    let keyDirectionDic: { [key: string]: Vector3 } = {};
    let velocity: Vector3 = new Vector3();
    let preMousePoint: Vector2 | null = null;
    let mousePoint: Vector2 | null = null;
    let ischange = false;
    let _auto = false;

    const stopDirectionVelocity = (direction: Vector3): void =>
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
    };

    const onMousedown = (): void =>
    {
        ischange = true;
        preMousePoint = null;
        mousePoint = null;
        velocity = new Vector3();
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
        mousePoint = new Vector2(event.data.clientX, event.data.clientY);

        if (!preMousePoint)
        {
            preMousePoint = mousePoint;
            mousePoint = null;
        }
    };

    const onKeydown = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
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
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
        if (!keyDirectionDic[boardKey])
        {
            return;
        }

        keyDownDic[boardKey] = false;
        stopDirectionVelocity(keyDirectionDic[boardKey]);
    };

    /** 设置 auto（订阅/取消 windowEventProxy 鼠标键盘事件） */
    const setAuto = (value: boolean): void =>
    {
        if (_auto === value)
        {
            return;
        }
        if (_auto)
        {
            windowEventProxy.off('mousedown', onMousedown, null);
            windowEventProxy.off('mouseup', onMouseup, null);
            onMouseup();
        }
        _auto = value;
        if (_auto)
        {
            windowEventProxy.on('mousedown', onMousedown, null);
            windowEventProxy.on('mouseup', onMouseup, null);
        }
    };

    // 捕获基类方法，避免覆盖后再调用 base.init/update/dispose 导致递归
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

            keyDirectionDic = {};
            keyDirectionDic['a'] = new Vector3(-1, 0, 0);
            keyDirectionDic['d'] = new Vector3(1, 0, 0);
            // 相机 forward 为本地 -Z（投影矩阵 m[11]=-1），W（前进）映射到 velocity.z=-1，
            // 配合 forward=getAxisZ() 得到 -Z 方向位移
            keyDirectionDic['w'] = new Vector3(0, 0, -1);
            keyDirectionDic['s'] = new Vector3(0, 0, 1);
            keyDirectionDic['e'] = new Vector3(0, 1, 0);
            keyDirectionDic['q'] = new Vector3(0, -1, 0);

            keyDownDic = {};

            setAuto(true);
        },
        update(_interval: number): void
        {
            baseUpdate(0);
            if (!ischange)
            {
                return;
            }

            if (mousePoint && preMousePoint)
            {
                const offsetPoint = mousePoint.subTo(preMousePoint);
                offsetPoint.x *= 0.15;
                offsetPoint.y *= 0.15;

                const matrix = getLogic(base.entity).local2world;
                matrix.appendRotation(matrix.getAxisX(), offsetPoint.y, matrix.getPosition());
                const up = Vector3.Y_AXIS.clone();
                if (matrix.getAxisY().dot(up) < 0)
                {
                    up.scaleNumber(-1);
                }
                matrix.appendRotation(up, offsetPoint.x, matrix.getPosition());
                {
                    const t = base.entity;
                    let localMatrix = matrix.clone();
                    const r_parent = getLogic(t).parent;
                    if (r_parent)
                    {
                        const parent = r_parent as unknown as Object3D;
                        localMatrix.append(getLogic(parent).world2local);
                    }
                    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
                    localMatrix.toTRS(pos, rot, scl);
                    // 整体写回 raw.position/rotation/scale（缺失字段时整体赋值，避免子字段修改崩溃）
                    batchRun(() =>
                    {
                        reactive(t).position = { x: pos.x, y: pos.y, z: pos.z };
                        reactive(t).rotation = { x: rot.x, y: rot.y, z: rot.z };
                        reactive(t).scale = { x: scl.x, y: scl.y, z: scl.z };
                    });
                }
                //
                preMousePoint = mousePoint;
                mousePoint = null;
            }

            // 计算加速度
            const accelerationVec = new Vector3();
            for (const key in keyDirectionDic)
            {
                if (keyDownDic[key] === true)
                {
                    const element = keyDirectionDic[key];
                    accelerationVec.add(element);
                }
            }
            accelerationVec.scaleNumber(fpsController.acceleration);
            // 计算速度
            velocity.add(accelerationVec);
            const right = getLogic(base.entity).local2world.getAxisX();
            const up = getLogic(base.entity).local2world.getAxisY();
            const forward = getLogic(base.entity).local2world.getAxisZ();
            right.scaleNumber(velocity.x);
            up.scaleNumber(velocity.y);
            forward.scaleNumber(velocity.z);
            // 计算位移
            const displacement = right.clone();
            displacement.add(up);
            displacement.add(forward);
            // 通过 logic().position 读取当前值（缺失字段拿到默认 {0,0,0}），整体写回 raw
            const cur = getLogic(base.entity).position;
            reactive(base.entity).position = {
                x: cur.x + displacement.x,
                y: cur.y + displacement.y,
                z: cur.z + displacement.z,
            };
        },
        dispose(): void
        {
            setAuto(false);
            baseDispose();
        },
    }) as unknown as FPSControllerLogic;
}
// 注册到 componentLogic 分发表
registerLogic('FPSController', fpsControllerLogic);
