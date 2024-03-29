import { Material, MaterialMap } from '../../core/Material';
import { RegisterComponent } from '../../ecs/Component';
import { IEvent } from '../../event/IEvent';
import { Box3 } from '../../math/geom/Box3';
import { Ray3 } from '../../math/geom/Ray3';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { TransformUtils } from '../../utils/TransformUtils';
import { Camera3D } from '../cameras/Camera3D';
import { Geometry, GeometryMap } from '../geometrys/Geometry';
import { LightPicker } from '../light/pickers/LightPicker';
import { PickingCollisionVO } from '../raycast/rayCast3D';
import { Renderable3D } from './Renderable3D';
import { Scene3D } from './Scene3D';

declare module '../../ecs/Component'
{
    interface ComponentMap { Mesh3D: Mesh3D }
}

/**
 * 3D网格
 */
@RegisterComponent({ name: 'Mesh3D' })
export class Mesh3D extends Renderable3D
{
    declare __class__: 'Mesh3D';

    /**
     * 几何体
     */
    @oav({ component: 'OAVPick', tooltip: '几何体，提供模型以形状', componentParam: { accepttype: 'geometry', datatype: 'geometry' } })
    @SerializeProperty()
    get geometry()
    {
        return this._geometry;
    }
    set geometry(v)
    {
        if (this._geometry)
        {
            this._geometry.emitter.off('boundsInvalid', this._onBoundsInvalid, this);
        }
        this._geometry = v;
        if (this._geometry)
        {
            this._geometry.emitter.on('boundsInvalid', this._onBoundsInvalid, this);
        }
        this._onBoundsInvalid();
    }
    private _geometry: GeometryMap[keyof GeometryMap];

    /**
     * 材质
     */
    @oav({ component: 'OAVPick', tooltip: '材质，提供模型以皮肤', componentParam: { accepttype: 'material', datatype: 'material' } })
    @SerializeProperty()
    material: MaterialMap[keyof MaterialMap];

    /**
     * 是否投射阴影
     */
    @oav({ tooltip: '是否投射阴影' })
    @SerializeProperty()
    castShadows = true;

    /**
     * 是否接受阴影
     */
    @oav({ tooltip: '是否接受阴影' })
    @SerializeProperty()
    receiveShadows = true;

    /**
     * 当前渲染使用的几何体。
     */
    get useGeometry()
    {
        const geometry = this.geometry || Geometry.getDefault('Cube');

        return geometry;
    }

    /**
     * 当前渲染使用的材质。
     */
    get useMaterial()
    {
        const material = this.material || Material.getDefault('Default-Material');

        return material;
    }

    init()
    {
        super.init();

        this.emitter.on('globalMatrixChanged', this._onScenetransformChanged, this);

        this.emitter.on('getSelfBounds', this._onGetSelfBounds, this);
    }

    /**
     * 渲染前执行函数
     *
     * 可用于渲染前收集渲染数据，或者更新显示效果等
     *
     * @param renderAtomic
     * @param scene
     * @param camera
     */
    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
    {
        const geometry = this.useGeometry;
        const material = this.useMaterial;

        //
        geometry.beforeRender(renderAtomic);
        material.beforeRender(renderAtomic);

        //
        this.node3d.beforeRender(renderAtomic, scene, camera);
        this.node3d.components.forEach((element) =>
        {
            if (element !== this)
            {
                element.beforeRender(renderAtomic, scene, camera);
            }
        });
    }

    /**
     * 与全局空间射线相交
     *
     * @param globalRay 全局空间射线
     *
     * @return 相交信息
     */
    globalRayIntersection(globalRay: Ray3)
    {
        const localRay = TransformUtils.rayGlobalToLocal(this.node3d, globalRay);
        const pickingCollisionVO = this.localRayIntersection(localRay);

        return pickingCollisionVO;
    }

    /**
     * 与局部空间射线相交
     *
     * @param localRay 局部空间射线
     *
     * @return 相交信息
     */
    localRayIntersection(localRay: Ray3)
    {
        const localNormal = new Vector3();
        const geometry = this.useGeometry;
        const material = this.useMaterial;

        // 检测射线与边界的碰撞
        const rayEntryDistance = this.localBounds.rayIntersection(localRay.origin, localRay.direction, localNormal);
        if (rayEntryDistance === Number.MAX_VALUE)
        {
            return null;
        }

        // 保存碰撞数据
        const pickingCollisionVO: PickingCollisionVO = {
            meshRenderer: this,
            localNormal,
            localRay,
            rayEntryDistance,
            rayOriginIsInsideBounds: rayEntryDistance === 0,
            geometry,
            cullFace: material.renderParams.cullFace,
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
        this.geometry = <any>null;
        this.material = <any>null;
        super.dispose();
    }

    protected _onScenetransformChanged()
    {
        this._globalBounds = null;
    }

    protected _updateBounds()
    {
        this._localBounds = this.geometry.bounding;
    }

    protected _onGetSelfBounds(event: IEvent<{ bounds: Box3[]; }>)
    {
        event.data.bounds.push(this.geometry.bounding);
    }
}
