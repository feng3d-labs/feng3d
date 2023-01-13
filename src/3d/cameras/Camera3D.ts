import { createNodeMenu } from '../../core/CreateNodeMenu';
import { RegisterComponent } from '../../ecs/Component';
import { Frustum } from '../../math/geom/Frustum';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Ray3 } from '../../math/geom/Ray3';
import { Vector2 } from '../../math/geom/Vector2';
import { Vector3 } from '../../math/geom/Vector3';
import { Vector4 } from '../../math/geom/Vector4';
import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
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
    declare __class__: 'Camera3D';

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
     * 场景投影矩阵，世界空间转投影空间
     */
    get viewProjection(): Matrix4x4
    {
        if (this._viewProjectionInvalid)
        {
            // 场景空间转摄像机空间
            this._viewProjection.copy(this.node3d.globalInvertMatrix);
            // +摄像机空间转投影空间 = 场景空间转投影空间
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

        watcher.watch(this as Camera3D, 'near', this.invalidateProjectionMatrix, this);
        watcher.watch(this as Camera3D, 'far', this.invalidateProjectionMatrix, this);
        watcher.watch(this as Camera3D, 'aspect', this.invalidateProjectionMatrix, this);

        //
        this.emitter.on('globalMatrixChanged', this.invalidateViewProjection, this);
        this.invalidateViewProjection();
    }

    /**
     * 获取全局空间射线。
     *
     * @param x GPU坐标的X
     * @param y GPU坐标的Y
     * @return
     */
    getWorldRay3D(x: number, y: number, ray3D = new Ray3()): Ray3
    {
        this.getLocalRay(x, y, ray3D); // 计算摄像机空间射线
        ray3D.applyMatrix4x4(this.node3d.globalMatrix); // 转换为全局空间射线

        return ray3D;
    }

    /**
     * 获取摄像机空间射线。
     *
     * @param x GPU空间坐标x值
     * @param y GPU空间坐标y值
     */
    getLocalRay(x: number, y: number, ray = new Ray3())
    {
        const p0 = this.unproject(new Vector3(x, y, 0));
        const p1 = this.unproject(new Vector3(x, y, 1));
        // 初始化射线
        ray.fromPosAndDir(p0, p1.sub(p0));
        // 获取z==0的点
        const sp = ray.getPointWithZ(0);
        ray.origin = sp;

        return ray;
    }

    /**
     * 全局空间坐标
     *
     * @param point3d 全局坐标转换为GPU空间坐标
     *
     * @return GPU空间坐标
     */
    project(point3d: Vector3, v = new Vector3()): Vector3
    {
        const point3dInCamera = this.node3d.globalInvertMatrix.transformPoint3(point3d); // 全局坐标转换为摄像机空间坐标
        const v4 = this.projectionMatrix.transformVector4(new Vector4().fromVector3(point3dInCamera, 1)); // 摄像机空间坐标投影到GPU空间坐标
        v.fromVector4(v4); // 转换为 Vector3

        return v;
    }

    /**
     * 屏幕坐标投影到全局坐标
     *
     * @param point3d  GPU空间坐标 Z: 到屏幕的距离
     *
     * @param v 全局坐标
     * @return 全局坐标
     */
    unproject(point3d: Vector3, v = new Vector3()): Vector3
    {
        const v4 = this.inversepPojectionMatrix.transformVector4(new Vector4().fromVector3(point3d, 1)); // GPU空间坐标转换为摄像机空间坐标
        v.fromVector4(v4);

        this.node3d.globalMatrix.transformPoint3(v, v); // 摄像机空间转换为全局坐标

        return v;
    }

    /**
     * 获取摄像机能够在指定深度处的视野；镜头在指定深度的尺寸。
     *
     * @param   depth   深度
     */
    getScaleByDepth(depth: number, dir = new Vector2(0, 1))
    {
        const temp = new Vector3();

        const lt = this.unproject(temp.set(-0.5 * dir.x, -0.5 * dir.y, depth));
        const rb = this.unproject(temp.set(+0.5 * dir.x, +0.5 * dir.y, depth));
        const scale = lt.subTo(rb).length;

        return scale;
    }

    /**
     * 获取本地坐标点。
     *
     * 获取投影在指定GPU坐标且摄像机前方（深度）sZ处的点的3D坐标
     *
     * @param nX GPU空间坐标X
     * @param nY GPU空间坐标Y
     * @param sZ 到摄像机的距离
     * @param v 摄像机空间坐标（输出）
     * @return 摄像机空间坐标
     */
    getLocalPoint(nX: number, nY: number, sZ: number, v = new Vector3())
    {
        const localRay = this.getLocalRay(nX, nY); // 计算摄像机空间射线
        localRay.getPointWithZ(sZ, v); // 获取指定深度坐标

        return v;
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
    private _inversepPojectionMatrix = new Matrix4x4();
    private _inversepPojectionMatrixInvalid = true;
    //
    protected _projectionMatrix = new Matrix4x4();
    private _projectionMatrixInvalid = true;

    /**
     * 投影矩阵失效
     */
    protected invalidateProjectionMatrix()
    {
        console.assert(!isNaN(this.aspect));

        this._projectionMatrixInvalid = true;
        this._inversepPojectionMatrixInvalid = true;

        this.invalidateViewProjection();
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
        console.warn(`需要在 Camera3D 子类中实现！`);
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

