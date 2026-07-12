import { Behaviour, createBehaviour } from '../component/Behaviour';
import { RunEnvironment } from '../core/RunEnvironment';
import { registerLogic, logic as getLogic, batchRun, reactive } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { Vector2, Vector3 } from '@feng3d/math';
import { windowEventProxy } from '@feng3d/shortcut';
import { BehaviourLogic } from '../component/Behaviour';
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

/**
 * FPSController 默认值模板。
 *
 * 注意：必须包含 enabled/runEnvironment（Behaviour 基类的字段）。
 * registerLogic 仅按当前 __type__ 填充缺失字段，不会自动继承父类的 defaults，
 * 因此声明式字面量 `{ __type__: 'FPSController' }` 需要这里补齐，否则
 * behaviourLogic.isVisibleAndEnabled 为 false，update 不会被 sceneLogic 调用。
 */
const fpsControllerDefaults = {
    __type__: 'FPSController' as const,
    enabled: true,
    runEnvironment: RunEnvironment.all,
    acceleration: 0.001,
};

/**
 * 创建 FPSController 实例。
 */
export function createFPSController(): FPSController
{
    return {
        ...createBehaviour(), ...fpsControllerDefaults,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        FPSController: FPSControllerLogic;
    }
}

/**
 * FPSController 逻辑处理输出。
 *
 * 组合 behaviourLogic，额外：
 * - auto getter/setter（订阅/取消 windowEventProxy 鼠标键盘事件）
 * - init: 初始化按键方向字典，auto=true
 * - update: 根据鼠标/键盘输入计算旋转与位移
 * - dispose: auto=false 取消订阅
 */
export class FPSControllerLogic extends BehaviourLogic
{
    /** init 去重标志（同一 component 只初始化一次） */
    private _subInited = false;

    private keyDownDic: { [key: string]: boolean } = {};
    private keyDirectionDic: { [key: string]: Vector3 } = {};
    private velocity: Vector3 = new Vector3();
    private preMousePoint: Vector2 | null = null;
    private mousePoint: Vector2 | null = null;
    private ischange = false;
    private _auto = false;

    constructor(fpsController: FPSController)
    {
        super(fpsController);
    }

    get auto(): boolean { return this._auto; }

    set auto(value: boolean)
    {
        if (this._auto === value)
        {
            return;
        }
        if (this._auto)
        {
            windowEventProxy.off('mousedown', this.onMousedown, this);
            windowEventProxy.off('mouseup', this.onMouseup, this);
            this.onMouseup();
        }
        this._auto = value;
        if (this._auto)
        {
            windowEventProxy.on('mousedown', this.onMousedown, this);
            windowEventProxy.on('mouseup', this.onMouseup, this);
        }
    }

    private onMousedown = (): void =>
    {
        this.ischange = true;
        this.preMousePoint = null;
        this.mousePoint = null;
        this.velocity = new Vector3();
        this.keyDownDic = {};

        windowEventProxy.on('keydown', this.onKeydown, this);
        windowEventProxy.on('keyup', this.onKeyup, this);
        windowEventProxy.on('mousemove', this.onMouseMove, this);
    };

    private onMouseup = (): void =>
    {
        this.ischange = false;
        this.preMousePoint = null;
        this.mousePoint = null;

        windowEventProxy.off('keydown', this.onKeydown, this);
        windowEventProxy.off('keyup', this.onKeyup, this);
        windowEventProxy.off('mousemove', this.onMouseMove, this);
    };

    private onMouseMove = (event: IEvent<MouseEvent>): void =>
    {
        this.mousePoint = new Vector2(event.data.clientX, event.data.clientY);

        if (!this.preMousePoint)
        {
            this.preMousePoint = this.mousePoint;
            this.mousePoint = null;
        }
    };

    private onKeydown = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
        if (!this.keyDirectionDic[boardKey])
        {
            return;
        }

        if (!this.keyDownDic[boardKey])
        {
            this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
        }
        this.keyDownDic[boardKey] = true;
    };

    private onKeyup = (event: IEvent<KeyboardEvent>): void =>
    {
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
        if (!this.keyDirectionDic[boardKey])
        {
            return;
        }

        this.keyDownDic[boardKey] = false;
        this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
    };

    private stopDirectionVelocity(direction: Vector3): void
    {
        if (!direction)
        {
            return;
        }
        if (direction.x !== 0)
        {
            this.velocity.x = 0;
        }
        if (direction.y !== 0)
        {
            this.velocity.y = 0;
        }
        if (direction.z !== 0)
        {
            this.velocity.z = 0;
        }
    }

    init(object3D?: Object3D): void
    {
        if (this._subInited) return;
        this._subInited = true;
        super.init(object3D);

        this.keyDirectionDic = {};
        this.keyDirectionDic['a'] = new Vector3(-1, 0, 0);
        this.keyDirectionDic['d'] = new Vector3(1, 0, 0);
        this.keyDirectionDic['w'] = new Vector3(0, 0, 1);
        this.keyDirectionDic['s'] = new Vector3(0, 0, -1);
        this.keyDirectionDic['e'] = new Vector3(0, 1, 0);
        this.keyDirectionDic['q'] = new Vector3(0, -1, 0);

        this.keyDownDic = {};

        this.auto = true;
    }

    update(_interval: number): void
    {
        super.update(0);
        if (!this.ischange)
        {
            return;
        }

        if (this.mousePoint && this.preMousePoint)
        {
            const offsetPoint = this.mousePoint.subTo(this.preMousePoint);
            offsetPoint.x *= 0.15;
            offsetPoint.y *= 0.15;

            const matrix = getLogic(this.entity).local2world.value;
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
                    localMatrix.append(getLogic(parent).world2local.value);
                }
                const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
                localMatrix.toTRS(pos, rot, scl);
                const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
                batchRun(() =>
                {
                    r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z;
                    r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z;
                    r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z;
                });
            }
            //
            this.preMousePoint = this.mousePoint;
            this.mousePoint = null;
        }

        // 计算加速度
        const fpsController = this.component as FPSController;
        const accelerationVec = new Vector3();
        for (const key in this.keyDirectionDic)
        {
            if (this.keyDownDic[key] === true)
            {
                const element = this.keyDirectionDic[key];
                accelerationVec.add(element);
            }
        }
        accelerationVec.scaleNumber(fpsController.acceleration);
        // 计算速度
        this.velocity.add(accelerationVec);
        const right = getLogic(this.entity).local2world.value.getAxisX();
        const up = getLogic(this.entity).local2world.value.getAxisY();
        const forward = getLogic(this.entity).local2world.value.getAxisZ();
        right.scaleNumber(this.velocity.x);
        up.scaleNumber(this.velocity.y);
        forward.scaleNumber(this.velocity.z);
        // 计算位移
        const displacement = right.clone();
        displacement.add(up);
        displacement.add(forward);
        const r_pos = reactive((this.entity).position);
        r_pos.x += displacement.x;
        r_pos.y += displacement.y;
        r_pos.z += displacement.z;
    }

    dispose(): void
    {
        this.auto = false;
        super.dispose();
    }
}
// 注册到 componentLogic 分发表
registerLogic('FPSController', FPSControllerLogic, fpsControllerDefaults);
