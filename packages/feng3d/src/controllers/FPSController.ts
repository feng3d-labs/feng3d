import { Behaviour, BehaviourLogic } from '../component/Behaviour';
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
 * FPSController 逻辑类。
 *
 * 继承 BehaviourLogic，额外：
 * - auto getter/setter（订阅/取消 windowEventProxy 鼠标键盘事件）
 * - init: 初始化按键方向字典，auto=true
 * - update: 根据鼠标/键盘输入计算旋转与位移
 * - dispose: auto=false 取消订阅
 */
export class FPSControllerLogic extends BehaviourLogic
{
    /** 数据引用 */
    readonly #fpsController: FPSController;

    /** init 去重标志（同一 component 只初始化一次） */
    #subInited = false;

    #keyDownDic: { [key: string]: boolean } = {};
    #keyDirectionDic: { [key: string]: WritableVector3Like } = {};
    #velocity: WritableVector3Like = { x: 0, y: 0, z: 0 };
    #preMousePoint: WritableVector2Like | null = null;
    #mousePoint: WritableVector2Like | null = null;
    #ischange = false;
    #auto = false;

    protected constructor(data: FPSController)
    {
        super(data);
        this.#fpsController = data;
        // 默认值（缺失字段单独赋值；enabled/runEnvironment 由父类 BehaviourLogic 处理）
        if (data.acceleration === undefined)
        {
            (data as { acceleration: number }).acceleration = 0.001;
        }
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: FPSController): FPSControllerLogic
    {
        return new FPSControllerLogic(data);
    }

    /** 是否自动订阅鼠标键盘事件 */
    get auto(): boolean
    {
        return this.#auto;
    }

    set auto(value: boolean)
    {
        this.#setAuto(value);
    }

    #stopDirectionVelocity(direction: WritableVector3Like): void
    {
        if (!direction)
        {
            return;
        }
        if (direction.x !== 0)
        {
            this.#velocity.x = 0;
        }
        if (direction.y !== 0)
        {
            this.#velocity.y = 0;
        }
        if (direction.z !== 0)
        {
            this.#velocity.z = 0;
        }
    }

    #onMousedown = (): void =>
    {
        this.#ischange = true;
        this.#preMousePoint = null;
        this.#mousePoint = null;
        this.#velocity = { x: 0, y: 0, z: 0 };
        this.#keyDownDic = {};

        windowEventProxy.on('keydown', this.#onKeydown, null);
        windowEventProxy.on('keyup', this.#onKeyup, null);
        windowEventProxy.on('mousemove', this.#onMouseMove, null);
    };

    #onMouseup = (): void =>
    {
        this.#ischange = false;
        this.#preMousePoint = null;
        this.#mousePoint = null;

        windowEventProxy.off('keydown', this.#onKeydown, null);
        windowEventProxy.off('keyup', this.#onKeyup, null);
        windowEventProxy.off('mousemove', this.#onMouseMove, null);
    };

    #onMouseMove = (event: IEvent<MouseEvent>): void =>
    {
        this.#mousePoint = { x: event.data!.clientX, y: event.data!.clientY };

        if (!this.#preMousePoint)
        {
            this.#preMousePoint = this.#mousePoint;
            this.#mousePoint = null;
        }
    };

    #onKeydown = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data!.keyCode).toLocaleLowerCase();
        if (!this.#keyDirectionDic[boardKey])
        {
            return;
        }

        if (!this.#keyDownDic[boardKey])
        {
            this.#stopDirectionVelocity(this.#keyDirectionDic[boardKey]);
        }
        this.#keyDownDic[boardKey] = true;
    };

    #onKeyup = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data!.keyCode).toLocaleLowerCase();
        if (!this.#keyDirectionDic[boardKey])
        {
            return;
        }

        this.#keyDownDic[boardKey] = false;
        this.#stopDirectionVelocity(this.#keyDirectionDic[boardKey]);
    };

    /** 设置 auto（订阅/取消 windowEventProxy 鼠标键盘事件） */
    #setAuto(value: boolean): void
    {
        if (this.#auto === value)
        {
            return;
        }
        if (this.#auto)
        {
            windowEventProxy.off('mousedown', this.#onMousedown, null);
            windowEventProxy.off('mouseup', this.#onMouseup, null);
            this.#onMouseup();
        }
        this.#auto = value;
        if (this.#auto)
        {
            windowEventProxy.on('mousedown', this.#onMousedown, null);
            windowEventProxy.on('mouseup', this.#onMouseup, null);
        }
    }

    override init(object3D?: Object3D): void
    {
        if (this.#subInited) return;
        this.#subInited = true;
        super.init(object3D);

        this.#keyDirectionDic = {};
        this.#keyDirectionDic['a'] = { x: -1, y: 0, z: 0 };
        this.#keyDirectionDic['d'] = { x: 1, y: 0, z: 0 };
        // 相机 forward 为本地 -Z（投影矩阵 m[11]=-1），W（前进）映射到 velocity.z=-1，
        // 配合 forward=getAxisZ() 得到 -Z 方向位移
        this.#keyDirectionDic['w'] = { x: 0, y: 0, z: -1 };
        this.#keyDirectionDic['s'] = { x: 0, y: 0, z: 1 };
        this.#keyDirectionDic['e'] = { x: 0, y: 1, z: 0 };
        this.#keyDirectionDic['q'] = { x: 0, y: -1, z: 0 };

        this.#keyDownDic = {};

        this.#setAuto(true);
    }

    override update(_interval: number): void
    {
        super.update(0);
        if (!this.#ischange)
        {
            return;
        }

        if (this.#mousePoint && this.#preMousePoint)
        {
            // 鼠标位移 → 旋转量（弧度）。原 0.15 是「度/像素」，改弧度后乘 DEG2RAD 保持手感一致。
            const radPerPixel = 0.15 * Math.PI / 180;
            const offsetPoint = vec2Sub(this.#mousePoint, this.#preMousePoint);
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
            this.#preMousePoint = this.#mousePoint;
            this.#mousePoint = null;
        }

        // 计算加速度
        const accelerationVec = { x: 0, y: 0, z: 0 };
        for (const key in this.#keyDirectionDic)
        {
            if (this.#keyDownDic[key] === true)
            {
                const element = this.#keyDirectionDic[key];
                vec3Add(accelerationVec, element, accelerationVec);
            }
        }
        vec3ScaleNumber(accelerationVec, this.#fpsController.acceleration!, accelerationVec);
        // 计算速度
        vec3Add(this.#velocity, accelerationVec, this.#velocity);
        const right = { x: 0, y: 0, z: 0 }; const up = { x: 0, y: 0, z: 0 }; const forward = { x: 0, y: 0, z: 0 };
        mat4GetAxisX(getLogic(this.entity!).local2world, right);
        mat4GetAxisY(getLogic(this.entity!).local2world, up);
        mat4GetAxisZ(getLogic(this.entity!).local2world, forward);
        vec3ScaleNumber(right, this.#velocity.x, right);
        vec3ScaleNumber(up, this.#velocity.y, up);
        vec3ScaleNumber(forward, this.#velocity.z, forward);
        // 计算位移
        const displacement = vec3Add(vec3Add(right, up), forward);
        // 通过 logic().position 读取当前值（缺失字段拿到默认 {0,0,0}），整体写回 raw
        const cur = getLogic(this.entity!).position;
        reactive(this.entity!).position = {
            x: cur.x + displacement.x,
            y: cur.y + displacement.y,
            z: cur.z + displacement.z,
        };
    }

    override dispose(): void
    {
        this.#setAuto(false);
        super.dispose();
    }
}
// 注册到 logic 分发表
registerLogic('FPSController', FPSControllerLogic.create);
