import { behaviourLogicProto, setupBehaviourLogicState, Behaviour, BehaviourLogic, type BehaviourLogicState } from '../component/Behaviour';
import { registerLogic, logic as getLogic, batchRun, reactive, createLogicProto } from '@feng3d/reactivity';
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

/** FPSControllerLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface FPSControllerLogicState extends BehaviourLogicState
{
    /** 数据引用 */
    _fpsController: FPSController;

    /** init 去重标志（同一 component 只初始化一次） */
    _subInited: boolean;

    _keyDownDic: { [key: string]: boolean };
    _keyDirectionDic: { [key: string]: WritableVector3Like };
    _velocity: WritableVector3Like;
    _preMousePoint: WritableVector2Like | null;
    _mousePoint: WritableVector2Like | null;
    _ischange: boolean;
    _auto: boolean;

    _setAuto: (value: boolean) => void;
}

/** FPSControllerLogic 的共享原型：继承 Behaviour 基类实现，实现 auto 并覆写 init / update / dispose */
const fpsControllerLogicProto = createLogicProto<FPSControllerLogic>(behaviourLogicProto, {
    /** 是否自动订阅鼠标键盘事件 */
    auto: {
        get: function (this: FPSControllerLogic & FPSControllerLogicState): boolean
        {
            return this._auto;
        },
        set: function (this: FPSControllerLogic & FPSControllerLogicState, value: boolean): void
        {
            this._setAuto(value);
        },
    },
    init: {
        value: function (this: FPSControllerLogic & FPSControllerLogicState, object3D?: Object3D): void
        {
            if (this._subInited) return;
            this._subInited = true;
            behaviourLogicProto.init.call(this, object3D);

            this._keyDirectionDic = {};
            this._keyDirectionDic['a'] = { x: -1, y: 0, z: 0 };
            this._keyDirectionDic['d'] = { x: 1, y: 0, z: 0 };
            // 相机 forward 为本地 -Z（投影矩阵 m[11]=-1），W（前进）映射到 velocity.z=-1，
            // 配合 forward=getAxisZ() 得到 -Z 方向位移
            this._keyDirectionDic['w'] = { x: 0, y: 0, z: -1 };
            this._keyDirectionDic['s'] = { x: 0, y: 0, z: 1 };
            this._keyDirectionDic['e'] = { x: 0, y: 1, z: 0 };
            this._keyDirectionDic['q'] = { x: 0, y: -1, z: 0 };

            this._keyDownDic = {};

            this._setAuto(true);
        },
    },
    update: {
        value: function (this: FPSControllerLogic & FPSControllerLogicState, _interval: number): void
        {
            behaviourLogicProto.update.call(this, 0);
            if (!this._ischange)
            {
                return;
            }

            if (this._mousePoint && this._preMousePoint)
            {
                // 鼠标位移 → 旋转量（弧度）。原 0.15 是「度/像素」，改弧度后乘 DEG2RAD 保持手感一致。
                const radPerPixel = 0.15 * Math.PI / 180;
                const offsetPoint = vec2Sub(this._mousePoint, this._preMousePoint);
                offsetPoint.x *= radPerPixel;
                offsetPoint.y *= radPerPixel;

                // 阶段 C-e：`Matrix4x4` 的 class 已删除，实例方法换成等价纯函数（`out` 传 matrix 即就地）
                const matrix = getLogic(this.entity!).local2world;
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
                    const t = this.entity;
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
                this._preMousePoint = this._mousePoint;
                this._mousePoint = null;
            }

            // 计算加速度
            const accelerationVec = { x: 0, y: 0, z: 0 };
            for (const key in this._keyDirectionDic)
            {
                if (this._keyDownDic[key] === true)
                {
                    const element = this._keyDirectionDic[key];
                    vec3Add(accelerationVec, element, accelerationVec);
                }
            }
            vec3ScaleNumber(accelerationVec, this._fpsController.acceleration!, accelerationVec);
            // 计算速度
            vec3Add(this._velocity, accelerationVec, this._velocity);
            const right = { x: 0, y: 0, z: 0 }; const up = { x: 0, y: 0, z: 0 }; const forward = { x: 0, y: 0, z: 0 };
            mat4GetAxisX(getLogic(this.entity!).local2world, right);
            mat4GetAxisY(getLogic(this.entity!).local2world, up);
            mat4GetAxisZ(getLogic(this.entity!).local2world, forward);
            vec3ScaleNumber(right, this._velocity.x, right);
            vec3ScaleNumber(up, this._velocity.y, up);
            vec3ScaleNumber(forward, this._velocity.z, forward);
            // 计算位移
            const displacement = vec3Add(vec3Add(right, up), forward);
            // 通过 logic().position 读取当前值（缺失字段拿到默认 {0,0,0}），整体写回 raw
            const cur = getLogic(this.entity!).position;
            reactive(this.entity!).position = {
                x: cur.x + displacement.x,
                y: cur.y + displacement.y,
                z: cur.z + displacement.z,
            };
        },
    },
    dispose: {
        value: function (this: FPSControllerLogic & FPSControllerLogicState): void
        {
            this._setAuto(false);
            behaviourLogicProto.dispose.call(this);
        },
    },
});

/**
 * 工厂函数：FPSControllerLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function fpsControllerLogic(data: FPSController): FPSControllerLogic
{
    const logic = setupBehaviourLogicState(Object.create(fpsControllerLogicProto) as FPSControllerLogic & FPSControllerLogicState, data);

    // 默认值（缺失字段单独赋值；enabled/runEnvironment 由父类 BehaviourLogic 处理）
    if (data.acceleration === undefined)
    {
        (data as { acceleration: number }).acceleration = 0.001;
    }

    logic._fpsController = data;
    logic._subInited = false;
    logic._keyDownDic = {};
    logic._keyDirectionDic = {};
    logic._velocity = { x: 0, y: 0, z: 0 };
    logic._preMousePoint = null;
    logic._mousePoint = null;
    logic._ischange = false;
    logic._auto = false;

    function stopDirectionVelocity(direction: WritableVector3Like): void
    {
        if (!direction)
        {
            return;
        }
        if (direction.x !== 0)
        {
            logic._velocity.x = 0;
        }
        if (direction.y !== 0)
        {
            logic._velocity.y = 0;
        }
        if (direction.z !== 0)
        {
            logic._velocity.z = 0;
        }
    }

    const onMousedown = (): void =>
    {
        logic._ischange = true;
        logic._preMousePoint = null;
        logic._mousePoint = null;
        logic._velocity = { x: 0, y: 0, z: 0 };
        logic._keyDownDic = {};

        windowEventProxy.on('keydown', onKeydown, null);
        windowEventProxy.on('keyup', onKeyup, null);
        windowEventProxy.on('mousemove', onMouseMove, null);
    };

    const onMouseup = (): void =>
    {
        logic._ischange = false;
        logic._preMousePoint = null;
        logic._mousePoint = null;

        windowEventProxy.off('keydown', onKeydown, null);
        windowEventProxy.off('keyup', onKeyup, null);
        windowEventProxy.off('mousemove', onMouseMove, null);
    };

    const onMouseMove = (event: IEvent<MouseEvent>): void =>
    {
        logic._mousePoint = { x: event.data!.clientX, y: event.data!.clientY };

        if (!logic._preMousePoint)
        {
            logic._preMousePoint = logic._mousePoint;
            logic._mousePoint = null;
        }
    };

    const onKeydown = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data!.keyCode).toLocaleLowerCase();
        if (!logic._keyDirectionDic[boardKey])
        {
            return;
        }

        if (!logic._keyDownDic[boardKey])
        {
            stopDirectionVelocity(logic._keyDirectionDic[boardKey]);
        }
        logic._keyDownDic[boardKey] = true;
    };

    const onKeyup = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data!.keyCode).toLocaleLowerCase();
        if (!logic._keyDirectionDic[boardKey])
        {
            return;
        }

        logic._keyDownDic[boardKey] = false;
        stopDirectionVelocity(logic._keyDirectionDic[boardKey]);
    };

    /** 设置 auto（订阅/取消 windowEventProxy 鼠标键盘事件） */
    function setAuto(value: boolean): void
    {
        if (logic._auto === value)
        {
            return;
        }
        if (logic._auto)
        {
            windowEventProxy.off('mousedown', onMousedown, null);
            windowEventProxy.off('mouseup', onMouseup, null);
            onMouseup();
        }
        logic._auto = value;
        if (logic._auto)
        {
            windowEventProxy.on('mousedown', onMousedown, null);
            windowEventProxy.on('mouseup', onMouseup, null);
        }
    }

    logic._setAuto = setAuto;

    return logic;
}
// 注册到 logic 分发表
registerLogic('FPSController', fpsControllerLogic);
