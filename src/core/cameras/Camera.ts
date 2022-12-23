import { Frustum } from '../../math/geom/Frustum';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Ray3 } from '../../math/geom/Ray3';
import { Vector2 } from '../../math/geom/Vector2';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { serialization } from '../../serialization/Serialization';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Component, RegisterComponent } from '../component/Component';
import { Object3D } from '../core/Object3D';
import { AddComponentMenu } from '../Menu';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { LensBase } from './lenses/LensBase';
import { OrthographicLens } from './lenses/OrthographicLens';
import { PerspectiveLens } from './lenses/PerspectiveLens';
import { Projection } from './Projection';

declare global
{
    export interface MixinsObject3DEventMap
    {
        lensChanged;
    }

    export interface MixinsComponentMap
    {
        Camera: Camera;
    }

    export interface MixinsPrimitiveObject3D
    {
        Camera: Object3D;
    }
}

/**
 * 摄像机
 */
@AddComponentMenu('Rendering/Camera')
@RegisterComponent()
@Serializable()
export class Camera extends Component
{
    __class__: 'Camera';

    // /**
    //  * How the camera clears the background.
    //  *
    //  * @todo
    //  */
    // @oav({ component: "OAVEnum", componentParam: { enumClass: CameraClearFlags }, tooltip: `What to display in empty areas of this Camera's view.\n\nChoose Skybox to display a skybox in empty areas, defaulting to a background color if no skybox is found.\n\nChoose Solid Color to display a background color in empty areas.\n\nChoose Depth Only to display nothing in empty areas.\n\nChoose Don't Clear to display whatever was displayed in the previous frame in empty areas.` })
    // @SerializeProperty()
    // clearFlags = CameraClearFlags.Skybox;

    get single() { return true; }

    @oav({ component: 'OAVEnum', componentParam: { enumClass: Projection } })
    get projection()
    {
        return this.lens && this.lens.projectionType;
    }
    set projection(v)
    {
        const projectionType = this.projection;
        if (projectionType === v) return;
        //
        let aspect = 1;
        let near = 0.3;
        let far = 1000;
        if (this.lens)
        {
            aspect = this.lens.aspect;
            near = this.lens.near;
            far = this.lens.far;
            serialization.setValue(this._backups, this.lens as any);
        }
        const fov = this._backups ? this._backups.fov : 60;
        const size = this._backups ? this._backups.size : 1;
        if (v === Projection.Perspective)
        {
            this.lens = new PerspectiveLens(fov, aspect, near, far);
        }
        else
        {
            this.lens = new OrthographicLens(size, aspect, near, far);
        }
    }

    /**
     * 镜头
     */
    @SerializeProperty()
    @oav({ component: 'OAVObjectView' })
    get lens()
    {
        return this._lens;
    }
    set lens(v)
    {
        if (this._lens === v) return;

        if (this._lens)
        {
            this._lens.off('lensChanged', this.invalidateViewProjection, this);
        }
        this._lens = v;
        if (this._lens)
        {
            this._lens.on('lensChanged', this.invalidateViewProjection, this);
        }

        this.invalidateViewProjection();

        this.emit('refreshView');
        this.emit('lensChanged');
    }
    private _lens: LensBase;

    /**
     * 场景投影矩阵，世界空间转投影空间
     */
    get viewProjection(): Matrix4x4
    {
        if (this._viewProjectionInvalid)
        {
            // 场景空间转摄像机空间
            this._viewProjection.copy(this.object3D.globalInvertMatrix);
            // +摄像机空间转投影空间 = 场景空间转投影空间
            this._viewProjection.append(this.lens.matrix);
            this._viewProjectionInvalid = false;
        }

        return this._viewProjection;
    }

    /**
     * 获取摄像机的截头锥体
     */
    get frustum()
    {
        if (this._frustumInvalid)
        {
            this._frustum.fromMatrix(this.viewProjection);
            this._frustumInvalid = false;
        }

        return this._frustum;
    }

    /**
     * 创建一个摄像机
     */
    init()
    {
        super.init();
        this.lens = this.lens || new PerspectiveLens();
        //
        this.on('globalMatrixChanged', this.invalidateViewProjection, this);
        this.invalidateViewProjection();
    }

    /**
     * 获取与坐标重叠的射线
     * @param x view3D上的X坐标
     * @param y view3D上的X坐标
     * @return
     */
    getRay3D(x: number, y: number, ray3D = new Ray3()): Ray3
    {
        return this.lens.unprojectRay(x, y, ray3D).applyMatrix4x4(this.object3D.globalMatrix);
    }

    /**
     * 投影坐标（世界坐标转换为3D视图坐标）
     * @param point3d 世界坐标
     * @return 屏幕的绝对坐标
     */
    project(point3d: Vector3): Vector3
    {
        const v: Vector3 = this.lens.project(this.object3D.globalInvertMatrix.transformPoint3(point3d));

        return v;
    }

    /**
     * 屏幕坐标投影到场景坐标
     * @param nX 屏幕坐标X ([0-width])
     * @param nY 屏幕坐标Y ([0-height])
     * @param sZ 到屏幕的距离
     * @param v 场景坐标（输出）
     * @return 场景坐标
     */
    unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
    {
        return this.object3D.globalMatrix.transformPoint3(this.lens.unprojectWithDepth(sX, sY, sZ, v), v);
    }

    /**
     * 获取摄像机能够在指定深度处的视野；镜头在指定深度的尺寸。
     *
     * @param   depth   深度
     */
    getScaleByDepth(depth: number, dir = new Vector2(0, 1))
    {
        const lt = this.unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
        const rb = this.unproject(+0.5 * dir.x, +0.5 * dir.y, depth);
        const scale = lt.subTo(rb).length;

        return scale;
    }

    /**
     * 处理场景变换改变事件
     */
    protected invalidateViewProjection()
    {
        this._viewProjectionInvalid = true;
        this._frustumInvalid = true;
    }

    //
    private _viewProjection: Matrix4x4 = new Matrix4x4();
    private _viewProjectionInvalid = true;
    private _backups = { fov: 60, size: 1 };
    private _frustum = new Frustum();
    private _frustumInvalid = true;
}

Object3D.registerPrimitive('Camera', (g) =>
{
    g.addComponent(Camera);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Camera',
        priority: -2,
        click: () =>
            Object3D.createPrimitive('Camera')
    }
);

