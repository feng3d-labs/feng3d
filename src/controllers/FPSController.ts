import { Behaviour, createBehaviour } from '../component/Behaviour';
import { RunEnvironment } from '../core/RunEnvironment';
import { registerDefaults, registerLogic, logic as getLogic, batchRun, reactive } from '@feng3d/reactivity';
import { IEvent } from '@feng3d/event';
import { Vector2, Vector3 } from '@feng3d/math';
import { windowEventProxy } from '@feng3d/shortcut';
import { BehaviourLogic, behaviourLogic } from '../component/Behaviour';
import { Object3D } from '../core/Object3D';
import { containerLogic } from "../core/Container";

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
    /** 加速度（缺失时由 registerDefaults 自动填充） */
    readonly acceleration?: number;
}

/**
 * FPSController 默认值模板。
 *
 * 注意：必须包含 enabled/runEnvironment（Behaviour 基类的字段）。
 * registerDefaults 仅按当前 __type__ 填充缺失字段，不会自动继承父类的 defaults，
 * 因此声明式字面量 `{ __type__: 'FPSController' }` 需要这里补齐，否则
 * behaviourLogic.isVisibleAndEnabled 为 false，update 不会被 sceneLogic 调用。
 */
const fpsControllerDefaults = {
    __type__: 'FPSController' as const,
    enabled: true,
    runEnvironment: RunEnvironment.all,
    acceleration: 0.001,
};

registerDefaults('FPSController', fpsControllerDefaults);

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
export interface FPSControllerLogic extends BehaviourLogic
{
    auto: boolean;
}

/**
 * 获取 FPSController 的 logic。
 */
export function fpsControllerLogic(fpsController: FPSController): FPSControllerLogic

{
    return getLogic(fpsController);
}

function createFPSControllerLogic(fpsController: FPSController): FPSControllerLogic
{
    const base = behaviourLogic(fpsController);
    let _inited = false;

    let keyDownDic: { [key: string]: boolean } = {};
    let keyDirectionDic: { [key: string]: Vector3 } = {};
    let velocity: Vector3 = new Vector3();
    let preMousePoint: Vector2 | null = null;
    let mousePoint: Vector2 | null = null;
    let ischange = false;
    let _auto = false;

    function onMousedown(): void
    {
        ischange = true;
        preMousePoint = null;
        mousePoint = null;
        velocity = new Vector3();
        keyDownDic = {};

        windowEventProxy.on('keydown', onKeydown, logic);
        windowEventProxy.on('keyup', onKeyup, logic);
        windowEventProxy.on('mousemove', onMouseMove, logic);
    }

    function onMouseup(): void
    {
        ischange = false;
        preMousePoint = null;
        mousePoint = null;

        windowEventProxy.off('keydown', onKeydown, logic);
        windowEventProxy.off('keyup', onKeyup, logic);
        windowEventProxy.off('mousemove', onMouseMove, logic);
    }

    function onMouseMove(event: IEvent<MouseEvent>): void
    {
        mousePoint = new Vector2(event.data.clientX, event.data.clientY);

        if (!preMousePoint)
        {
            preMousePoint = mousePoint;
            mousePoint = null;
        }
    }

    function onKeydown(event: IEvent<KeyboardEvent>): void
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
    }

    function onKeyup(event: IEvent<KeyboardEvent>): void
    {
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
        if (!keyDirectionDic[boardKey])
        {
            return;
        }

        keyDownDic[boardKey] = false;
        stopDirectionVelocity(keyDirectionDic[boardKey]);
    }

    function stopDirectionVelocity(direction: Vector3): void
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

    const logic = {
        // object3D 委托给 base，使 base.isVisibleAndEnabled（依赖 base.object3D）能正确求值。
        // 否则 initComponent 仅设置 logic.object3D，base.object3D 保持 null →
        // isVisibleAndEnabled 恒为 false → sceneLogic 不调用 update，控制器失效。
        get object3D() { return base.object3D; },
        set object3D(v) { (base as any)._object3D = v; },
        get isVisibleAndEnabled() { return base.isVisibleAndEnabled; },
        get auto() { return _auto; },
        set auto(value)
        {
            if (_auto === value)
            {
                return;
            }
            if (_auto)
            {
                windowEventProxy.off('mousedown', onMousedown, logic);
                windowEventProxy.off('mouseup', onMouseup, logic);
                onMouseup();
            }
            _auto = value;
            if (_auto)
            {
                windowEventProxy.on('mousedown', onMousedown, logic);
                windowEventProxy.on('mouseup', onMouseup, logic);
            }
        },
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

            keyDirectionDic = {};
            keyDirectionDic['a'] = new Vector3(-1, 0, 0);
            keyDirectionDic['d'] = new Vector3(1, 0, 0);
            keyDirectionDic['w'] = new Vector3(0, 0, 1);
            keyDirectionDic['s'] = new Vector3(0, 0, -1);
            keyDirectionDic['e'] = new Vector3(0, 1, 0);
            keyDirectionDic['q'] = new Vector3(0, -1, 0);

            keyDownDic = {};

            logic.auto = true;
        },
        beforeRender(ro, scene, camera) { base.beforeRender(ro, scene, camera); },
        update(): void
        {
            base.update(0);
            if (!ischange)
            {
                return;
            }

            if (mousePoint && preMousePoint)
            {
                const offsetPoint = mousePoint.subTo(preMousePoint);
                offsetPoint.x *= 0.15;
                offsetPoint.y *= 0.15;

                const matrix = getLogic(logic.object3D).local2world.value;
                matrix.appendRotation(matrix.getAxisX(), offsetPoint.y, matrix.getPosition());
                const up = Vector3.Y_AXIS.clone();
                if (matrix.getAxisY().dot(up) < 0)
                {
                    up.scaleNumber(-1);
                }
                matrix.appendRotation(up, offsetPoint.x, matrix.getPosition());
                {
                    const t = logic.object3D;
                    let localMatrix = matrix.clone();
                    const r_parent = containerLogic(t).parent;
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
            const right = getLogic(logic.object3D).local2world.value.getAxisX();
            const up = getLogic(logic.object3D).local2world.value.getAxisY();
            const forward = getLogic(logic.object3D).local2world.value.getAxisZ();
            right.scaleNumber(velocity.x);
            up.scaleNumber(velocity.y);
            forward.scaleNumber(velocity.z);
            // 计算位移
            const displacement = right.clone();
            displacement.add(up);
            displacement.add(forward);
            const r_pos = reactive(logic.object3D.position);
            r_pos.x += displacement.x;
            r_pos.y += displacement.y;
            r_pos.z += displacement.z;
        },
        dispose()
        {
            logic.auto = false;
            base.dispose();
                    },
    };

    return logic as any;
}

// 注册到 componentLogic 分发表
registerLogic('FPSController', (component) =>
{
    return createFPSControllerLogic(component as FPSController);
});
