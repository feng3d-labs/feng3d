import { IEvent } from '@feng3d/event';
import { Vector2, Vector3 } from '@feng3d/math';
import { batchRun, reactive } from '@feng3d/reactivity';
import { windowEventProxy } from '@feng3d/shortcut';
import { BehaviourLogic, behaviourLogic } from '../component/behaviourLogic';
import { registerComponentLogic } from '../component/componentLogic';
import { Object3D } from '../core/Object3D';
import { containerLogic } from "../core/containerLogic";
import { transformLogic } from '../core/transformLogic';
import { FPSController } from './FPSController';

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

const fpsControllerLogicMap = new WeakMap<FPSController, FPSControllerLogic>();

/**
 * 获取 FPSController 的 logic。
 */
export function fpsControllerLogic(fpsController: FPSController): FPSControllerLogic
{
    let logic = fpsControllerLogicMap.get(fpsController);
    if (logic) return logic;

    logic = createFPSControllerLogic(fpsController);
    fpsControllerLogicMap.set(fpsController, logic);

    return logic;
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

    const logic: FPSControllerLogic = {
        object3D: null as any,
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

                const matrix = transformLogic(logic.object3D).local2world.value;
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
                        localMatrix.append(transformLogic(parent).world2local.value);
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
            const right = transformLogic(logic.object3D).local2world.value.getAxisX();
            const up = transformLogic(logic.object3D).local2world.value.getAxisY();
            const forward = transformLogic(logic.object3D).local2world.value.getAxisZ();
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
            fpsControllerLogicMap.delete(fpsController);
        },
    };

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('FPSController', (component) =>
{
    return fpsControllerLogic(component as FPSController);
});
