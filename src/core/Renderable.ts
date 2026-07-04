import { Ray3, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { computed, reactive } from '@feng3d/reactivity';
import { CullFace } from '../render/data/enums';
import { serialize } from '@feng3d/serialization';
import { RenderObject } from '@feng3d/webgpu';
import { Camera } from '../cameras/Camera';
import { RegisterComponent } from '../component/Component';
import { Geometry, GeometryLike } from '../geometry/Geometry';
import { LightPicker } from '../light/pickers/LightPicker';
import { Material } from '../materials/Material';
import { PickingCollisionVO } from '../pick/Raycaster';
import { Scene } from '../scene/Scene';
import { RayCastable } from './RayCastable';
import { transformLogic } from './transformLogic';

declare global
{
    export interface MixinsComponentMap { Renderable: Renderable; }
}

/**
 * 可渲染组件
 *
 * General functionality for all renderers.
 *
 * A renderer is what makes an object appear on the screen. Use this class to access the renderer of any object, mesh or Particle System. Renderers can be disabled to make objects invisible (see enabled), and the materials can be accessed and modified through them (see material).
 *
 * See Also: Renderer components for meshes, particles, lines and trails.
 */
@RegisterComponent()
export class Renderable extends RayCastable
{
    get single() { return true; }

    /**
     * 几何体
     */
    @oav({ component: 'OAVPick', tooltip: '几何体，提供模型以形状', componentParam: { accepttype: 'geometry', datatype: 'geometry' } })
    @serialize
    geometry: GeometryLike = Geometry.getDefault('Cube');

    /**
     * 材质
     */
    @oav({ component: 'OAVPick', tooltip: '材质，提供模型以皮肤', componentParam: { accepttype: 'material', datatype: 'material' } })
    @serialize
    material = Material.getDefault('Default-Material');

    @oav({ tooltip: '是否投射阴影' })
    @serialize
    castShadows = true;

    @oav({ tooltip: '是否接受阴影' })
    @serialize
    receiveShadows = true;

    constructor()
    {
        super();

        const r_this = reactive(this as Renderable);

        r_this.selfLocalBounds = computed(() =>
        {
            r_this.geometry;

            //
            const geometry = this.geometry || Geometry.getDefault('Cube');

            return geometry.bounding;
        });

        this._lightPicker = new LightPicker(this);
    }

    readonly renderObject = computed<RenderObject>(() =>
    {
        const ro = this._renderObject ||= new RenderObject();

        // 初始化 WebGL 兼容字段（RenderObject 接口声明为可选 readonly，
        // 但 core 的 Geometry/Material/Transform/ParticleSystem 等 beforeRender 假设它们已存在）。
        const roAny = ro as any;
        if (!roAny.bindingResources) roAny.bindingResources = {};

        // Transform 不再是 Component，显式调用其 beforeRender 写入 transform uniform
        transformLogic(this.object3D).beforeRender(ro, null, null);

        this.object3D.components.forEach((element) =>
        {
            element.beforeRender(ro, null, null);
        });

        return this._renderObject;
    });
    private _renderObject = new RenderObject();

    /**
     * 渲染前执行函数
     *
     * 可用于渲染前收集渲染数据，或者更新显示效果等
     *
     * @param renderObject
     * @param scene
     * @param camera
     */
    beforeRender(renderObject: RenderObject, scene: Scene, camera: Camera)
    {
        //
        this.geometry.beforeRender(renderObject);
        this.material.beforeRender(renderObject);
        this._lightPicker.beforeRender(renderObject);

        // Transform 不再是 Component，显式调用其 beforeRender 写入 transform uniform
        transformLogic(this.object3D).beforeRender(renderObject, scene, camera);

        this.object3D.components.forEach((element) =>
        {
            if (element !== this)
            { element.beforeRender(renderObject, scene, camera); }
        });
    }

    /**
     * 与世界空间射线相交
     *
     * @param worldRay 世界空间射线
     *
     * @return 相交信息
     */
    worldRayIntersection(worldRay: Ray3)
    {
        const localRay = new Ray3();
        transformLogic(this._object3D).world2local.value.transformRay(worldRay, localRay);
        const pickingCollisionVO = this.localRayIntersection(localRay);

        return pickingCollisionVO;
    }

    /**
     * 与局部空间射线相交
     *
     * @param ray3D 局部空间射线
     *
     * @return 相交信息
     */
    localRayIntersection(localRay: Ray3)
    {
        const localNormal = new Vector3();

        // 检测射线与边界的碰撞
        const rayEntryDistance = this.selfLocalBounds.value.rayIntersection(localRay.origin, localRay.direction, localNormal);
        if (rayEntryDistance === Number.MAX_VALUE)
        { return null; }

        // webgpu cullFace（小写）→ core CullFace 枚举（大写），供射线检测使用
        const pipelineCullFace = this.material.renderPipeline.primitive?.cullFace;
        const cullFace = pipelineCullFace === 'front' ? CullFace.FRONT
            : pipelineCullFace === 'back' ? CullFace.BACK
                : CullFace.NONE;

        // 保存碰撞数据
        const pickingCollisionVO: PickingCollisionVO = {
            object3D: this.object3D,
            localNormal,
            localRay,
            rayEntryDistance,
            rayOriginIsInsideBounds: rayEntryDistance === 0,
            geometry: this.geometry,
            cullFace,
        };

        return pickingCollisionVO;
    }

    /**
     * 是否加载完成
     */
    get isLoaded()
    {
        return this.material.isLoaded;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onLoadCompleted(callback: () => void)
    {
        if (this.isLoaded) callback();
        this.material.onLoadCompleted(callback);
    }

    /**
     * 销毁
     */
    dispose()
    {
        const r_this = reactive(this as Renderable);

        r_this.geometry = <any>null;
        r_this.material = <any>null;
        super.dispose();
    }

    //
    private _lightPicker: LightPicker;
}
