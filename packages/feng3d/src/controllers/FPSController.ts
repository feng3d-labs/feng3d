import { Behaviour, BehaviourLogic } from '../component/Behaviour';
import { registerLogic, logic as getLogic, batchRun, reactive } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { Vector2, Vector3 } from '@feng3d/math';
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
    #keyDirectionDic: { [key: string]: Vector3 } = {};
    #velocity: Vector3 = new Vector3();
    #preMousePoint: Vector2 | null = null;
    #mousePoint: Vector2 | null = null;
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

    #stopDirectionVelocity(direction: Vector3): void
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
        this.#velocity = new Vector3();
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
        this.#mousePoint = new Vector2(event.data.clientX, event.data.clientY);

        if (!this.#preMousePoint)
        {
            this.#preMousePoint = this.#mousePoint;
            this.#mousePoint = null;
        }
    };

    #onKeydown = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
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
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
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
        this.#keyDirectionDic['a'] = new Vector3(-1, 0, 0);
        this.#keyDirectionDic['d'] = new Vector3(1, 0, 0);
        // 相机 forward 为本地 -Z（投影矩阵 m[11]=-1），W（前进）映射到 velocity.z=-1，
        // 配合 forward=getAxisZ() 得到 -Z 方向位移
        this.#keyDirectionDic['w'] = new Vector3(0, 0, -1);
        this.#keyDirectionDic['s'] = new Vector3(0, 0, 1);
        this.#keyDirectionDic['e'] = new Vector3(0, 1, 0);
        this.#keyDirectionDic['q'] = new Vector3(0, -1, 0);

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
            const offsetPoint = this.#mousePoint.subTo(this.#preMousePoint);
            offsetPoint.x *= radPerPixel;
            offsetPoint.y *= radPerPixel;

            const matrix = getLogic(this.entity).local2world;
            matrix.appendRotation(matrix.getAxisX(), offsetPoint.y, matrix.getPosition());
            const up = Vector3.Y_AXIS.clone();
            if (matrix.getAxisY().dot(up) < 0)
            {
                up.scaleNumber(-1);
            }
            matrix.appendRotation(up, offsetPoint.x, matrix.getPosition());
            {
                const t = this.entity;
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
            this.#preMousePoint = this.#mousePoint;
            this.#mousePoint = null;
        }

        // 计算加速度
        const accelerationVec = new Vector3();
        for (const key in this.#keyDirectionDic)
        {
            if (this.#keyDownDic[key] === true)
            {
                const element = this.#keyDirectionDic[key];
                accelerationVec.add(element);
            }
        }
        accelerationVec.scaleNumber(this.#fpsController.acceleration);
        // 计算速度
        this.#velocity.add(accelerationVec);
        const right = getLogic(this.entity).local2world.getAxisX();
        const up = getLogic(this.entity).local2world.getAxisY();
        const forward = getLogic(this.entity).local2world.getAxisZ();
        right.scaleNumber(this.#velocity.x);
        up.scaleNumber(this.#velocity.y);
        forward.scaleNumber(this.#velocity.z);
        // 计算位移
        const displacement = right.clone();
        displacement.add(up);
        displacement.add(forward);
        // 通过 logic().position 读取当前值（缺失字段拿到默认 {0,0,0}），整体写回 raw
        const cur = getLogic(this.entity).position;
        reactive(this.entity).position = {
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
registerLogic('FPSController', FPSControllerLogic as unknown as new (data: FPSController) => FPSControllerLogic);
