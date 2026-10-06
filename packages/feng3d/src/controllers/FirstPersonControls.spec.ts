import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';
import { mat4GetAxisZ } from '@feng3d/math';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';
import type { FirstPersonControls } from './FirstPersonControls';
import './FirstPersonControls';

/**
 * FirstPersonControls 与 three.js `examples/jsm/controls/FirstPersonControls` 的行为对齐。
 *
 * 关键语义（原示例 `webgl_shadowmap` 用的就是这三条）：
 * 1. `lookAt(target)` 把相机朝向目标（原示例 `controls.lookAt(scene.position)`）；
 * 2. 鼠标在窗口中的位置即转向（**不需要按住**），`lookSpeed` 是弧度/像素 × delta；
 * 3. W/A/S/D（与方向键）沿**相机本地轴**平移，速度 = `movementSpeed` × delta。
 */
describe('FirstPersonControls', () =>
{
    /** 造一个带 FirstPersonControls 的相机；事件走 windowEventProxy（测试环境挂在 globalThis 的事件目标上） */
    function build(position = { x: 0, y: 0, z: 0 })
    {
        const controls: FirstPersonControls = {
            __type__: 'FirstPersonControls',
            movementSpeed: 100,
            lookSpeed: 0.0125,
            lookVertical: true,
        };
        const camera: Object3D = {
            __type__: 'Object3D',
            name: 'camera',
            position,
            components: [controls],
        };
        logic(camera);

        return { camera, controlsLogic: logic(controls) };
    }

    /** 取相机前向（本地 -Z 的世界方向，three 的相机 forward） */
    function forwardOf(camera: Object3D)
    {
        const axisZ = { x: 0, y: 0, z: 0 };
        mat4GetAxisZ(logic(camera).local2world, axisZ);
        const forward = { x: -axisZ.x, y: -axisZ.y, z: -axisZ.z };
        const length = Math.hypot(forward.x, forward.y, forward.z);

        return { x: forward.x / length, y: forward.y / length, z: forward.z / length };
    }

    it('lookAt 让相机前向指向目标（等价 controls.lookAt(scene.position)）', () =>
    {
        const { camera, controlsLogic } = build({ x: 0, y: 5, z: -10 });
        controlsLogic.lookAt({ x: 0, y: 0, z: 0 });

        const forward = forwardOf(camera);
        expect(forward.x).toBeCloseTo(0, 5);
        expect(forward.y).toBeCloseTo(-5 / Math.hypot(5, 10), 5);
        expect(forward.z).toBeCloseTo(10 / Math.hypot(5, 10), 5);
    });

    it('按住 W 时沿相机前向移动 movementSpeed × delta', () =>
    {
        const { camera, controlsLogic } = build();
        controlsLogic.lookAt({ x: 0, y: 0, z: -1 });

        globalThis.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
        controlsLogic.update(1000);
        globalThis.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));

        const position = logic(camera).position;
        expect(position.z).toBeCloseTo(-100, 4);
        expect(position.x).toBeCloseTo(0, 6);
    });

    it('鼠标位置即转向（不需要按住），lookSpeed 为弧度/像素 × delta', () =>
    {
        const { camera, controlsLogic } = build();
        controlsLogic.lookAt({ x: 0, y: 0, z: -1 });

        // 视口中心 + 400px（Node 下没有 innerWidth，这里显式给出）
        (globalThis as unknown as { innerWidth: number }).innerWidth = 800;
        (globalThis as unknown as { innerHeight: number }).innerHeight = 600;
        globalThis.dispatchEvent(new MouseEvent('pointermove', { pageX: 800, pageY: 300 } as MouseEventInit));

        controlsLogic.update(1000);

        // three: lon -= pointerX * lookSpeed * delta = -400 * 0.0125 = -5°；
        // 而 lon 的零点由 Spherical.setFromVector3 决定（theta = atan2(x, z)），
        // 相机看向 (0,0,-1) 时初值 lon = atan2(0, -1) = 180°
        const forward = forwardOf(camera);
        const theta = Math.PI - 5 * Math.PI / 180;
        expect(forward.x).toBeCloseTo(Math.sin(theta), 4);
        expect(forward.z).toBeCloseTo(Math.cos(theta), 4);
    });

    it('lookVertical=false 时忽略垂直鼠标位移', () =>
    {
        const controls: FirstPersonControls = {
            __type__: 'FirstPersonControls',
            lookSpeed: 0.0125,
            lookVertical: false,
        };
        const camera: Object3D = { __type__: 'Object3D', name: 'camera', components: [controls] };
        logic(camera);
        const cameraLogic = logic(controls);
        cameraLogic.lookAt({ x: 0, y: 0, z: -1 });

        (globalThis as unknown as { innerWidth: number }).innerWidth = 800;
        (globalThis as unknown as { innerHeight: number }).innerHeight = 600;
        globalThis.dispatchEvent(new MouseEvent('pointermove', { pageX: 400, pageY: 600 } as MouseEventInit));
        cameraLogic.update(1000);

        const forward = forwardOf(camera);
        expect(forward.y).toBeCloseTo(0, 5);
    });
});
