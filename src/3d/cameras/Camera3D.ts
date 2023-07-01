import { Frustum, Matrix4x4, Ray3, Vector2, Vector3, Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { SerializeProperty } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { createNodeMenu } from '../../core/CreateNodeMenu';
import { RegisterComponent } from '../../ecs/Component';
import { Component3D } from '../core/Component3D';
import { Node3D } from '../core/Node3D';

declare module '../../ecs/Component' { interface ComponentMap { Camera3D: Camera3D; } }

declare module '../core/Node3D'
{
    export interface Node3DEventMap { lensChanged: Camera3D; }

    export interface PrimitiveNode3D { Camera3D: Node3D; }
}

/**
 * 摄像机
 */
@RegisterComponent({ name: 'Camera3D', single: true, menu: 'Rendering/Camera3D' })
export class Camera3D extends Component3D
{
    /**
     * 最近距离
     */
    @SerializeProperty()
    @oav()
    near = 0.3;

    /**
     * 最远距离
     */
    @SerializeProperty()
    @oav()
    far = 1000;

    /**
     * 视窗缩放比例(width/height)，在渲染器中设置
     */
    aspect = 1;

    /**
     * 投影矩阵
     */
    get projectionMatrix(): Matrix4x4
    {
        if (this._projectionMatrixInvalid)
        {
            this._updateProjectionMatrix();
            this._projectionMatrixInvalid = false;
        }

        return this._projectionMatrix;
    }

    set projectionMatrix(v)
    {
        this._projectionMatrix = v;
        this._inversepPojectionMatrixInvalid = true;
    }

    /**
     * 逆矩阵
     */
    get inversepPojectionMatrix(): Matrix4x4
    {
        if (this._inversepPojectionMatrixInvalid)
        {
            this._updateInversepPojectionMatrix();
            this._inversepPojectionMatrixInvalid = false;
        }

        return this._inversepPojectionMatrix;
    }

    /**
     * 视窗投影矩阵，全局空间转投影空间
     */
    get viewProjection(): Matrix4x4
    {
        if (this._viewProjectionInvalid)
        {
            // 全局空间转摄像机空间
            this._viewProjection.copy(this.entity.invertGlobalMatrix);
            // +摄像机空间转投影空间 = 全局空间转投影空间
            this._viewProjection.append(this.projectionMatrix);
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

        watcher.watch(this as Camera3D, 'near', this._invalidateProjectionMatrix, this);
        watcher.watch(this as Camera3D, 'far', this._invalidateProjectionMatrix, this);
        watcher.watch(this as Camera3D, 'aspect', this._invalidateProjectionMatrix, this);

        //
        this.emitter.on('globalMatrixChanged', this._invalidateViewProjection, this);
        this._invalidateViewProjection();
    }

    /**
     * 获取全局空间射线。
     *
     * @param x GPU空间坐标x值
     * @param y GPU空间坐标y值
     * @return
     */
    getGlobalRay3D(x: number, y: number, ray = new Ray3()): Ray3
    {
        const p0 = this.unproject(new Vector3(x, y, 0));
        const p1 = this.unproject(new Vector3(x, y, 1));
        // 初始化射线
        ray.fromPosAndDir(p0, p1.sub(p0));

        return ray;
    }

    /**
     * 全局坐标转换为GPU坐标
     *
     * @param point3d 全局坐标
     *
     * @return GPU坐标
     */
    project(point3d: Vector3, v = new Vector3()): Vector3
    {
        // 全局坐标转换为摄像机空间坐标
        const point3dInCamera = this.entity.invertGlobalMatrix.transformPoint3(point3d);
        // 摄像机空间坐标转换为GPU空间坐标
        const v4 = this.projectionMatrix.transformVector4(new Vector4().fromVector3(point3dInCamera, 1));
        // 透视投影结果中w!=1，需要标准化齐次坐标
        v4.scaleNumber(1 / v4.w);
        v.fromVector4(v4);

        return v;
    }

    /**
     * GPU坐标转换为全局坐标
     *
     * @param point3d  GPU空间坐标 Z: 到屏幕的距离
     *
     * @param v 全局坐标
     * @return 全局坐标
     */
    unproject(point3d: Vector3, v = new Vector3()): Vector3
    {
        // GPU空间坐标
        const gpuP4 = new Vector4().fromVector3(point3d, 1);
        // 转换为摄像机空间坐标
        const cameraP4 = this.inversepPojectionMatrix.transformVector4(gpuP4);
        cameraP4.scaleNumber(1 / cameraP4.w);
        // 转换为 Vector3
        v.fromVector4(cameraP4);
        // 转换为全局空间坐标
        this.entity.globalMatrix.transformPoint3(v, v); // 摄像机空间转换为全局坐标

        return v;
    }

    /**
     * 获取摄像机能够在指定深度处的视野；镜头在指定深度的尺寸。
     *
     * depth为-1，方向为纵向（0, 1）时，返回scale值为近平面一半高度。
     * depth为-1，方向为纵向（1, 0）时，返回scale值为近平面一半宽度。
     * depth为1，方向为纵向（0, 1）时，返回scale值为远平面一半高度。
     * depth为1，方向为纵向（1, 0）时，返回scale值为远平面一半宽度。
     *
     * @param   gpuDepth   GPU空间深度（near处depth值为-1，far处值为1）。
     */
    getScaleByDepth(gpuDepth: number, dir = new Vector2(0, 1))
    {
        const temp = new Vector3();

        const lt = this.unproject(temp.set(-0.5 * dir.x, -0.5 * dir.y, gpuDepth));
        const rb = this.unproject(temp.set(+0.5 * dir.x, +0.5 * dir.y, gpuDepth));
        const scale = lt.subTo(rb).length;

        return scale;
    }

    /**
     * 处理场景变换改变事件
     */
    protected _invalidateViewProjection()
    {
        this._viewProjectionInvalid = true;
        this._frustumInvalid = true;
    }

    //
    private _inversepPojectionMatrix = new Matrix4x4();
    private _inversepPojectionMatrixInvalid = true;
    //
    protected _projectionMatrix = new Matrix4x4();
    private _projectionMatrixInvalid = true;

    /**
     * 投影矩阵失效
     */
    protected _invalidateProjectionMatrix()
    {
        console.assert(!isNaN(this.aspect));

        this._projectionMatrixInvalid = true;
        this._inversepPojectionMatrixInvalid = true;

        this._invalidateViewProjection();
    }

    private _updateInversepPojectionMatrix()
    {
        this._inversepPojectionMatrix.copy(this.projectionMatrix);
        this._inversepPojectionMatrix.invert();
    }

    /**
     * 更新投影矩阵
     */
    protected _updateProjectionMatrix()
    {
        // 默认提供一个 fov 为 60 的投影矩阵。
        this._projectionMatrix.setPerspectiveFromFOV(60, this.aspect, this.near, this.far);
    }

    //
    private _viewProjection: Matrix4x4 = new Matrix4x4();
    private _viewProjectionInvalid = true;
    private _frustum = new Frustum();
    private _frustumInvalid = true;
}

Node3D.registerPrimitive('Camera3D', (g) =>
{
    g.addComponent('Camera3D');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Camera3D',
        priority: -2,
        click: () =>
            Node3D.createPrimitive('Camera3D')
    }
);

