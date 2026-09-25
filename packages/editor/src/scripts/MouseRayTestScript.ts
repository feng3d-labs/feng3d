import {
    Camera, ColorMaterial, MeshRenderer, Object3D, PerspectiveCamera, Ray3, SphereGeometry, Vector3,
    logic as getLogic, reactive, windowEventProxy,
} from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import { EditorScript, EditorScriptLogic } from './EditorScript';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        MouseRayTestScript: MouseRayTestScript;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MouseRayTestScript: MouseRayTestScriptLogic;
    }
}

/**
 * 鼠标射线测试脚本（纯数据接口）。
 *
 * 迁移自旧写法 `class MouseRayTestScript extends EditorScript`：点击后沿鼠标射线
 * 方向抛出一个球体，用于验证拾取射线。
 */
export interface MouseRayTestScript extends EditorScript
{
    /** 组件类型名 */
    readonly __type__: 'MouseRayTestScript';
}

/**
 * MouseRayTestScript 逻辑类。
 *
 * 迁移要点：
 * - `serialization.setValue(new Object3D(), {...})` → 纯数据字面量
 * - `object3D.addComponent(Renderable)` / `addChild()` → `components` / `children` 数据声明
 * - `object3D.scene.mouseRay3D`（主仓已移除）→ 由场景相机 `getRay3D(x, y)` 现算
 * - `logic(transform).inverseTransformDirection` → `Matrix4x4.transformVector3`
 * - `logic(transform).translate(dir, 15)` → 响应式写入 `position`
 */
export class MouseRayTestScriptLogic extends EditorScriptLogic
{
    protected constructor(data: MouseRayTestScript)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: MouseRayTestScript): MouseRayTestScriptLogic
    {
        return new MouseRayTestScriptLogic(data);
    }

    override init(object3D?: Object3D): void
    {
        super.init(object3D);

        windowEventProxy.on('click', this.onClick, this);
    }

    override dispose(): void
    {
        windowEventProxy.off('click', this.onClick, this);

        super.dispose();
    }

    private onClick(): void
    {
        const host = this.entity;
        if (!host) return;

        const mouseRay3D = this.#getMouseRay();
        if (!mouseRay3D) return;

        const object3D: Object3D = {
            __type__: 'Object3D',
            name: 'test',
            mouseEnabled: false,
            components: [
                {
                    __type__: 'MeshRenderer',
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } } },
                    geometry: { __type__: 'SphereGeometry', radius: 10 },
                },
            ],
        };
        const r_children = reactive(host).children as unknown as Object3D[];
        r_children.push(object3D);

        // 射线起点/方向 → 球体本地空间
        const world2local = getLogic(object3D).world2local;
        const position = world2local.transformPoint3(mouseRay3D.origin.clone());
        const direction = world2local.transformVector3(mouseRay3D.direction.clone());
        reactive(object3D).position = { x: position.x, y: position.y, z: position.z };

        let num = 1000;
        const translate = () =>
        {
            // 沿本地方向平移 15（替代旧 logic(transform).translate(direction, 15)）
            const current = object3D.position ?? new Vector3();
            reactive(object3D).position = {
                x: current.x + direction.x * 15,
                y: current.y + direction.y * 15,
                z: current.z + direction.z * 15,
            };
            if (num > 0)
            {
                setTimeout(function ()
                {
                    translate();
                }, 1000 / 60);
            }
            else
            {
                getLogic(object3D).dispose();
            }
            num--;
        };
        translate();
    }

    /**
     * 计算当前的鼠标射线。
     *
     * 主仓已移除 `Scene.mouseRay3D`（鼠标射线改由调用方按需用相机 `getRay3D` 计算），
     * 这里从场景中取相机组件并按窗口坐标换算 NDC 后求射线。
     */
    #getMouseRay(): Ray3
    {
        const host = this.entity;
        if (!host) return null;

        const scene = getLogic(host).scene;
        const sceneEntity = scene ? getLogic(scene).entity : null;
        if (!sceneEntity) return null;

        const camera = getLogic(sceneEntity as Object3D).getComponentInChildren<Camera>('Camera');
        if (!camera) return null;

        // 窗口坐标 → NDC（编辑器视口占满窗口）
        const x = (windowEventProxy.clientX / window.innerWidth) * 2 - 1;
        const y = 1 - (windowEventProxy.clientY / window.innerHeight) * 2;

        return getLogic(camera as PerspectiveCamera).getRay3D(x, y);
    }
}

// 注册到分发表
registerLogic('MouseRayTestScript', MouseRayTestScriptLogic as unknown as new (data: MouseRayTestScript) => MouseRayTestScriptLogic);
